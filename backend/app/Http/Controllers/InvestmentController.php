<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\Asset;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InvestmentController extends Controller
{
    /**
     * Display a listing of investments.
     */
    public function index(Request $request)
    {
        $query = Investment::with(['user', 'asset']);

        // Filter by user if requested
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
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

        // Sort options
        $sortBy = $request->input('sort_by', 'expected_roi');
        $sortDir = $request->input('sort_dir', 'desc');

        // Handle column existence for sorting
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

            // Create investment record
            $investment = Investment::create([
                'user_id' => $user->id,
                'asset_id' => $asset->id,
                'amount' => $request->amount,
                'ownership_percentage' => $request->ownership_percentage,
                'token_id' => 'TKN-' . strtoupper(Str::random(12)),
                'tx_hash' => $txHash,
                'purchase_price' => $request->amount,
                'current_value' => $request->amount,
                'total_earnings' => 0,
                'status' => 'active',
            ]);

            // Update asset ownership sold
            $asset->increment('total_ownership_sold', $request->ownership_percentage);

            DB::commit();

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
     * Display the specified investment.
     */
    public function show($id)
    {
        $investment = Investment::with(['user', 'asset'])->find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        return response()->json($investment);
    }

    /**
     * Update the specified investment.
     */
    public function update(Request $request, $id)
    {
        $investment = Investment::find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
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
     */
    public function destroy($id)
    {
        $investment = Investment::find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        $investment->delete();
        return response()->json(['message' => 'Investment deleted successfully']);
    }
}
