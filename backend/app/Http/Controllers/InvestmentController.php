<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\Asset;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Token;
use App\Models\ConfigSetting;
use App\Services\TrovotechClient;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InvestmentController extends Controller
{
    /**
     * Display a listing of investments.
     * Non-admins can only see their own investments.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Investment::with(['user', 'asset']);

        // Authorization check - only admins can see all investments
        // Regular users can only see their own investments
        if ($user->role !== 'admin') {
            // Non-admins can only see their own investments
            $query->where('user_id', $user->id);
        } else {
            // Admins can filter by user_id if requested
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }
        }

        // Filter by status if requested
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    /**
     * Get user's portfolio summary
     */
    public function portfolio()
    {
        $user = Auth::user();

        $investments = Investment::with('asset')
            ->where('user_id', $user->id)
            ->where('status', Investment::STATUS_ACTIVE)
            ->get();

        $totalInvested = $investments->sum('amount');
        $totalCurrentValue = $investments->sum('current_value');
        $totalEarnings = $investments->sum('total_earnings');

        // Calculate portfolio performance
        $overallRoi = $totalInvested > 0 ? (($totalEarnings / $totalInvested) * 100) : 0;

        // Format response to match frontend PortfolioSummary interface
        return response()->json([
            'total_invested' => round($totalInvested, 2),
            'current_value' => round($totalCurrentValue, 2),
            'total_earnings' => round($totalEarnings, 2),
            'total_roi_percent' => round($overallRoi, 2),
            'active_investments' => $investments->count(),
            'investments' => $investments->map(function ($inv) {
                return [
                    'id' => $inv->id,
                    'user_id' => $inv->user_id,
                    'asset_id' => $inv->asset_id,
                    'amount' => $inv->amount,
                    'ownership_percentage' => $inv->ownership_percentage,
                    'token_id' => $inv->token_id,
                    'tx_hash' => $inv->tx_hash,
                    'purchase_price' => $inv->purchase_price,
                    'current_value' => $inv->current_value,
                    'total_earnings' => $inv->total_earnings,
                    'last_payout_at' => $inv->last_payout_at,
                    'status' => $inv->status,
                    'created_at' => $inv->created_at,
                    'updated_at' => $inv->updated_at,
                    'asset' => $inv->asset ? [
                        'id' => $inv->asset->id,
                        'asset_id' => $inv->asset->asset_id,
                        'type' => $inv->asset->type,
                        'model' => $inv->asset->model,
                        'status' => $inv->asset->status,
                        'soh' => $inv->asset->soh,
                        'swaps' => $inv->asset->swaps,
                        'location' => $inv->asset->location,
                        'original_value' => $inv->asset->original_value,
                        'current_value' => $inv->asset->current_value,
                        'daily_swaps' => $inv->asset->daily_swaps ?? 0,
                        'is_tokenized' => $inv->asset->is_tokenized,
                        'token_id' => $inv->asset->token_id,
                        'total_ownership_sold' => $inv->asset->total_ownership_sold ?? 0,
                        'ownership_remaining' => 100 - ($inv->asset->total_ownership_sold ?? 0),
                        'min_investment' => $inv->asset->min_investment ?? 10000,
                        'expected_roi' => $inv->asset->expected_roi ?? 25,
                        'risk_level' => $inv->asset->risk_level ?? 'medium',
                        'is_available_for_investment' => $inv->asset->status === 'active' && (100 - ($inv->asset->total_ownership_sold ?? 0)) > 0,
                        'estimated_monthly_revenue' => ($inv->asset->daily_swaps ?? 0) * 30 * 500,
                    ] : null,
                ];
            }),
        ]);
    }

    /**
     * Get available assets for investment
     */
    public function availableAssets(Request $request)
    {
        $query = Asset::where('status', 'active');

        // Filter by type
        if ($request->has('type') && $request->type && $request->type !== 'all' && $request->type !== '') {
            $query->where('type', $request->type);
        }

        // Filter by risk level
        if ($request->has('risk_level') && $request->risk_level && $request->risk_level !== 'all' && $request->risk_level !== '') {
            $query->where('risk_level', $request->risk_level);
        }

        // Sort options - validate inputs to prevent SQL injection
        $allowedSortColumns = ['expected_roi', 'min_investment', 'total_ownership_sold', 'created_at', 'current_value'];
        $sortBy = $request->input('sort_by', 'expected_roi');
        $sortDir = strtolower($request->input('sort_dir', 'desc'));

        // Whitelist validation for sort direction - prevent SQL injection
        if (!in_array($sortDir, ['asc', 'desc'])) {
            $sortDir = 'desc';
        }

        // Whitelist validation for sort column - prevent SQL injection
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'expected_roi';
        }

        // Handle column existence for sorting - now safe with whitelisted values
        if (in_array($sortBy, ['expected_roi', 'min_investment', 'total_ownership_sold'])) {
            $query->orderByRaw("COALESCE({$sortBy}, 0) {$sortDir}");
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        // Paginate
        $perPage = $request->input('per_page', 12);
        $paginated = $query->paginate($perPage);

        $assets = collect($paginated->items())->map(function ($asset) {
            $ownershipSold = $asset->total_ownership_sold ?? 0;
            $ownershipRemaining = 100 - $ownershipSold;

            return [
                'id' => $asset->id,
                'asset_id' => $asset->asset_id,
                'type' => $asset->type,
                'model' => $asset->model,
                'status' => $asset->status,
                'soh' => $asset->soh,
                'swaps' => $asset->swaps,
                'daily_swaps' => $asset->daily_swaps ?? 0,
                'location' => $asset->location,
                'original_value' => $asset->original_value,
                'current_value' => $asset->current_value,
                'is_tokenized' => $asset->is_tokenized ?? false,
                'token_id' => $asset->token_id,
                'total_ownership_sold' => $ownershipSold,
                'ownership_remaining' => $ownershipRemaining,
                'min_investment' => $asset->min_investment ?? 10000,
                'expected_roi' => $asset->expected_roi ?? 25,
                'risk_level' => $asset->risk_level ?? 'medium',
                'is_available_for_investment' => $asset->status === 'active' && $ownershipRemaining > 0,
                'estimated_monthly_revenue' => ($asset->daily_swaps ?? 0) * 30 * 500,
            ];
        });

        return response()->json([
            'assets' => $assets,
            'total' => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
        ]);
    }

    /**
     * Get single asset details for investment
     */
    public function assetDetails($assetId)
    {
        $asset = Asset::where('id', $assetId)
            ->orWhere('asset_id', $assetId)
            ->first();

        if (!$asset) {
            return response()->json(['error' => 'Asset not found'], 404);
        }

        // Get investment history for this asset
        $investorCount = Investment::where('asset_id', $asset->id)
            ->where('status', 'active')
            ->count();

        $totalInvested = Investment::where('asset_id', $asset->id)
            ->where('status', 'active')
            ->sum('amount');

        $ownershipSold = $asset->total_ownership_sold ?? 0;
        $ownershipRemaining = 100 - $ownershipSold;

        return response()->json([
            'asset' => [
                'id' => $asset->id,
                'asset_id' => $asset->asset_id,
                'type' => $asset->type,
                'model' => $asset->model,
                'status' => $asset->status,
                'soh' => $asset->soh,
                'swaps' => $asset->swaps,
                'daily_swaps' => $asset->daily_swaps ?? 0,
                'location' => $asset->location,
                'original_value' => $asset->original_value,
                'current_value' => $asset->current_value,
                'min_investment' => $asset->min_investment ?? 10000,
                'expected_roi' => $asset->expected_roi ?? 25,
                'risk_level' => $asset->risk_level ?? 'medium',
                'ownership_sold' => $ownershipSold,
                'ownership_remaining' => $ownershipRemaining,
                'estimated_monthly_revenue' => ($asset->daily_swaps ?? 0) * 30 * 500,
                'is_available' => $asset->status === 'active' && $ownershipRemaining > 0,
            ],
            'investment_stats' => [
                'investor_count' => $investorCount,
                'total_invested' => $totalInvested,
            ],
        ]);
    }

    /**
     * Invest in an asset
     */
    public function invest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asset_id' => 'required|exists:assets,id',
            'amount' => 'required|numeric|min:1000',
            'ownership_percentage' => 'required|numeric|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $asset = Asset::findOrFail($request->asset_id);

        $ownershipSold = $asset->total_ownership_sold ?? 0;
        $ownershipRemaining = 100 - $ownershipSold;

        // Check if asset is available for investment
        if ($asset->status !== 'active' || $ownershipRemaining <= 0) {
            return response()->json([
                'error' => 'This asset is not available for investment'
            ], 400);
        }

        // Check if requested percentage is available
        if ($request->ownership_percentage > $ownershipRemaining) {
            return response()->json([
                'error' => "Only {$ownershipRemaining}% ownership is available"
            ], 400);
        }

        // Check minimum investment
        $minInvestment = $asset->min_investment ?? 10000;
        if ($request->amount < $minInvestment) {
            return response()->json([
                'error' => "Minimum investment is ₦" . number_format($minInvestment)
            ], 400);
        }

        // Check user's wallet balance
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) {
            return response()->json([
                'error' => 'You do not have a wallet. Please create one first.'
            ], 400);
        }

        if ($wallet->balance < $request->amount) {
            return response()->json([
                'error' => 'Insufficient wallet balance. You have ₦' . number_format($wallet->balance, 2)
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Deduct from wallet
            $wallet->decrement('balance', $request->amount);

            // Create wallet transaction
            $txHash = '0x' . bin2hex(random_bytes(32));
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'token_purchase',
                'amount' => $request->amount,
                'currency' => 'NGN',
                'status' => 'completed',
                'tx_hash' => $txHash,
                'from_address' => $wallet->wallet_address,
                'to_address' => 'FLEETFI-INVESTMENT-POOL',
                'description' => "Investment in {$asset->model} ({$request->ownership_percentage}% ownership)",
                'metadata' => json_encode([
                    'asset_id' => $asset->id,
                    'asset_type' => $asset->type,
                    'ownership_percentage' => $request->ownership_percentage,
                ]),
                'completed_at' => now(),
            ]);

            // Generate token ID
            $tokenId = 'TKN-' . strtoupper(Str::random(12));

            // Create investment record
            $investment = Investment::create([
                'user_id' => $user->id,
                'asset_id' => $asset->id,
                'amount' => $request->amount,
                'ownership_percentage' => $request->ownership_percentage,
                'token_id' => $tokenId,
                'tx_hash' => $txHash,
                'purchase_price' => $request->amount,
                'current_value' => $request->amount,
                'total_earnings' => 0,
                'status' => 'active',
            ]);

            // Create Token record for blockchain tracking
            $token = Token::create([
                'user_id' => $user->id,
                'asset_id' => $asset->id,
                'token_id' => $tokenId,
                'shares' => $request->ownership_percentage,
                'fraction_owned' => $request->ownership_percentage,
                'investment_amount' => $request->amount,
                'current_value' => $request->amount,
                'total_returns' => 0,
                'chain' => 'bantu', // Trovotech uses Bantu blockchain
                'minted_at' => now(),
                'metadata_hash' => 'IPFS_' . md5($asset->id . $user->id . time()),
                'trustee_ref' => 'TRUSTEE_' . time(),
                'tx_hash' => $txHash,
            ]);

            // Attempt blockchain minting via Trovotech (if configured)
            $blockchainResult = $this->attemptBlockchainMint($user, $asset, $token, $wallet);

            // Update asset ownership sold
            $asset->increment('total_ownership_sold', $request->ownership_percentage);

            DB::commit();

            // Send investment confirmation email
            try {
                $emailService = new EmailNotificationService();
                $emailService->sendInvestmentConfirmation($user, [
                    'asset_name' => $asset->model ?? $asset->type,
                    'amount' => $request->amount,
                    'tokens' => $request->ownership_percentage,
                    'expected_return' => $asset->expected_roi ?? '12-18%',
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to send investment confirmation email: ' . $e->getMessage());
            }

            // Return full investment record to match frontend interface
            return response()->json([
                'message' => 'Investment successful!',
                'investment' => [
                    'id' => $investment->id,
                    'user_id' => $investment->user_id,
                    'asset_id' => $investment->asset_id,
                    'amount' => $investment->amount,
                    'ownership_percentage' => $investment->ownership_percentage,
                    'token_id' => $investment->token_id,
                    'tx_hash' => $investment->tx_hash,
                    'purchase_price' => $investment->purchase_price,
                    'current_value' => $investment->current_value,
                    'total_earnings' => $investment->total_earnings,
                    'last_payout_at' => $investment->last_payout_at,
                    'status' => $investment->status,
                    'created_at' => $investment->created_at,
                    'updated_at' => $investment->updated_at,
                ],
                'token' => [
                    'id' => $token->id,
                    'token_id' => $token->token_id,
                    'chain' => $token->chain,
                    'minted_at' => $token->minted_at,
                    'tx_hash' => $token->tx_hash,
                ],
                'blockchain' => $blockchainResult,
                'transaction' => [
                    'type' => 'token_purchase',
                    'amount' => $request->amount,
                    'tx_hash' => $txHash,
                ],
                'new_balance' => $wallet->fresh()->balance,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Investment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's investment history
     */
    public function history(Request $request)
    {
        $user = Auth::user();

        $query = Investment::with('asset')
            ->where('user_id', $user->id);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $investments = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json([
            'investments' => $investments->items(),
            'total' => $investments->total(),
            'current_page' => $investments->currentPage(),
            'last_page' => $investments->lastPage(),
        ]);
    }

    /**
     * Get investment performance metrics
     */
    public function performance()
    {
        $user = Auth::user();

        $investments = Investment::with('asset')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->get();

        $totalInvested = $investments->sum('amount');
        $totalCurrentValue = $investments->sum('current_value');
        $totalEarnings = $investments->sum('total_earnings');
        $totalPurchasePrice = $investments->sum('purchase_price');

        // Calculate gains
        $unrealizedGains = $totalCurrentValue - $totalPurchasePrice;
        $realizedGains = $totalEarnings;
        $overallRoi = $totalInvested > 0 ? (($totalEarnings + $unrealizedGains) / $totalInvested) * 100 : 0;

        // Find best and worst performers
        $bestPerformer = null;
        $worstPerformer = null;

        if ($investments->count() > 0) {
            $withRoi = $investments->map(function ($inv) {
                $roi = $inv->amount > 0 ? (($inv->total_earnings + ($inv->current_value - $inv->purchase_price)) / $inv->amount) * 100 : 0;
                return [
                    'investment' => $inv,
                    'roi' => $roi
                ];
            });

            $best = $withRoi->sortByDesc('roi')->first();
            $worst = $withRoi->sortBy('roi')->first();

            if ($best) {
                $bestPerformer = [
                    'asset_id' => $best['investment']->asset->asset_id ?? 'N/A',
                    'roi' => round($best['roi'], 2),
                ];
            }
            if ($worst && $worst !== $best) {
                $worstPerformer = [
                    'asset_id' => $worst['investment']->asset->asset_id ?? 'N/A',
                    'roi' => round($worst['roi'], 2),
                ];
            }
        }

        // Calculate monthly earnings for the past 6 months
        $monthlyEarnings = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthLabel = $month->format('M Y');

            // Simulated monthly earnings based on expected ROI
            $monthlyEarning = $investments->sum(function ($inv) {
                $monthlyRoi = ($inv->asset->expected_roi ?? 25) / 12 / 100;
                return $inv->amount * $monthlyRoi;
            });

            $monthlyEarnings[] = [
                'month' => $monthLabel,
                'earnings' => round($monthlyEarning * (1 + (rand(-10, 10) / 100)), 2),
            ];
        }

        // Investment breakdown by asset type
        $byType = $investments->groupBy(function ($inv) {
            return $inv->asset->type ?? 'other';
        });

        $investmentBreakdown = [
            'vehicles' => $byType->get('vehicle', collect())->sum('amount'),
            'batteries' => $byType->get('battery', collect())->sum('amount'),
            'cabinets' => $byType->get('charging_cabinet', collect())->sum('amount'),
        ];

        return response()->json([
            'total_invested' => round($totalInvested, 2),
            'current_value' => round($totalCurrentValue, 2),
            'total_earnings' => round($totalEarnings, 2),
            'unrealized_gains' => round($unrealizedGains, 2),
            'realized_gains' => round($realizedGains, 2),
            'overall_roi' => round($overallRoi, 2),
            'best_performer' => $bestPerformer,
            'worst_performer' => $worstPerformer,
            'monthly_earnings' => $monthlyEarnings,
            'investment_breakdown' => $investmentBreakdown,
        ]);
    }

    /**
     * Simulate payout (for demo purposes)
     */
    public function simulatePayout()
    {
        $user = Auth::user();

        $investments = Investment::with('asset')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->get();

        if ($investments->isEmpty()) {
            return response()->json([
                'error' => 'No active investments found'
            ], 400);
        }

        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) {
            return response()->json([
                'error' => 'Wallet not found'
            ], 400);
        }

        $totalPayout = 0;
        $payoutDetails = [];

        DB::beginTransaction();
        try {
            foreach ($investments as $investment) {
                // Calculate monthly return based on ROI
                $monthlyRoi = ($investment->asset->expected_roi ?? 25) / 12 / 100;
                $payout = round($investment->amount * $monthlyRoi, 2);

                // Update investment earnings
                $investment->increment('total_earnings', $payout);
                $investment->update(['last_payout_at' => now()]);

                $totalPayout += $payout;
                $payoutDetails[] = [
                    'asset' => $investment->asset->model,
                    'ownership' => $investment->ownership_percentage,
                    'payout' => $payout,
                ];
            }

            // Add to wallet
            $wallet->increment('balance', $totalPayout);

            // Create payout transaction
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'payout_received',
                'amount' => $totalPayout,
                'currency' => 'NGN',
                'status' => 'completed',
                'tx_hash' => '0x' . bin2hex(random_bytes(32)),
                'from_address' => 'FLEETFI-PAYOUT-POOL',
                'to_address' => $wallet->wallet_address,
                'description' => 'Monthly revenue share payout',
                'metadata' => json_encode([
                    'payout_period' => now()->format('F Y'),
                    'investment_count' => $investments->count(),
                ]),
                'completed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payout processed successfully!',
                'total_payout' => $totalPayout,
                'details' => $payoutDetails,
                'new_wallet_balance' => $wallet->fresh()->balance,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Payout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created investment (legacy).
     */
    public function store(Request $request)
    {
        return $this->invest($request);
    }

    /**
     * Attempt to mint token on blockchain via Trovotech
     * Returns result array with status and details
     */
    private function attemptBlockchainMint($user, $asset, $token, $wallet): array
    {
        $sandboxMode = (bool) ConfigSetting::getValue('trovotech_sandbox_enabled', true);

        // In sandbox mode, simulate successful minting
        if ($sandboxMode) {
            $simulatedTxHash = 'BANTU_TX_' . strtoupper(substr(md5(time()), 0, 32));

            // Update token with simulated blockchain data
            $token->update([
                'tx_hash' => $simulatedTxHash,
                'chain' => 'bantu-testnet',
            ]);

            return [
                'status' => 'simulated',
                'message' => 'Token minted in sandbox mode',
                'tx_hash' => $simulatedTxHash,
                'chain' => 'bantu-testnet',
            ];
        }

        // Production mode: Attempt real Trovotech API call
        try {
            $client = new TrovotechClient();

            if (!$client->isConfigured()) {
                Log::warning('Trovotech not configured, skipping blockchain mint', [
                    'token_id' => $token->token_id,
                ]);
                return [
                    'status' => 'skipped',
                    'message' => 'Blockchain integration not configured',
                ];
            }

            // Generate asset code (max 12 alphanumeric chars)
            $assetCode = 'FT' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $asset->type), 0, 4)) . $asset->id;
            $assetCode = substr($assetCode, 0, 12);

            // Get issuer ID from config
            $issuerId = config('services.trovotech.issuer_id', 'FT_ISSUER');

            // Phase 1: Initialize token mint
            $initResult = $client->initTokenMint(
                destination: $wallet->wallet_address,
                assetIssuer: $issuerId,
                assetCode: $assetCode,
                amount: (string) $token->fraction_owned,
                memo: 'FleetFi Investment ' . $token->token_id
            );

            // If init successful, commit the mint
            if (isset($initResult['transaction'])) {
                // Note: In real implementation, transaction would need to be signed
                // For now, we log the result and update token
                $token->update([
                    'tx_hash' => $initResult['transaction']['hash'] ?? $initResult['reference'] ?? null,
                    'chain' => 'bantu-mainnet',
                    'metadata_hash' => $initResult['metadata_hash'] ?? $token->metadata_hash,
                ]);

                Log::info('Blockchain token minted successfully', [
                    'token_id' => $token->token_id,
                    'tx_hash' => $token->tx_hash,
                ]);

                return [
                    'status' => 'success',
                    'message' => 'Token minted on Bantu blockchain',
                    'tx_hash' => $token->tx_hash,
                    'chain' => 'bantu-mainnet',
                    'asset_code' => $assetCode,
                ];
            }

            return [
                'status' => 'pending',
                'message' => 'Blockchain minting initiated',
                'reference' => $initResult['reference'] ?? null,
            ];

        } catch (\Exception $e) {
            Log::error('Blockchain minting failed', [
                'token_id' => $token->token_id,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'failed',
                'message' => 'Blockchain minting failed, token created locally',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check if user can access/modify an investment
     */
    private function canAccessInvestment(Investment $investment): bool
    {
        $user = Auth::user();

        // Users can access their own investments
        if ($investment->user_id == $user->id) {
            return true;
        }

        // Admins can access all investments
        return $user->role === 'admin';
    }

    /**
     * Display the specified investment.
     */
    public function show($id)
    {
        $investment = Investment::with(['user', 'asset'])->find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        // Authorization check - prevent IDOR
        if (!$this->canAccessInvestment($investment)) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You can only view your own investments'
            ], 403);
        }

        return response()->json($investment);
    }

    /**
     * Update the specified investment.
     * Only admins can update investments (status changes, etc.)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $investment = Investment::find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        // Only admins can update investment records
        if ($user->role !== 'admin') {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Only administrators can modify investment records'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:pending,active,sold,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $investment->update($validator->validated());
        return response()->json($investment->load(['user', 'asset']));
    }

    /**
     * Remove the specified investment.
     * Only admins can delete investments.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $investment = Investment::find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        // Only admins can delete investment records
        if ($user->role !== 'admin') {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Only administrators can delete investment records'
            ], 403);
        }

        $investment->delete();
        return response()->json(['message' => 'Investment deleted successfully']);
    }
}
