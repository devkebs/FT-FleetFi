<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Wallet;
use App\Models\Token as AssetToken;
use App\Models\Payout;
use App\Models\Telemetry;
use App\Services\TrovotechClient;
use App\Models\ConfigSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * TrovoTech Integration Controller
 * Proxies requests to TrovoTech's Bantu Token Service (BTS) API
 * Handles wallet creation, token minting, payout distribution
 *
 * NOTE: This controller currently uses legacy HTTP calls.
 * TODO: Refactor all methods to use TrovotechClient::request() for centralized config.
 */
class TrovotechController extends Controller
{
    private TrovotechClient $client;
    private string $baseUrl;
    private string $apiKey;
    private string $issuerId;
    private bool $sandboxMode;

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->client = new TrovotechClient();
        // Fetch from ConfigSetting for dynamic updates
        $this->baseUrl = rtrim((string) ConfigSetting::getValue('trovotech_base_url', ''), '/');
        $this->apiKey = (string) ConfigSetting::getValue('trovotech_api_key', '');
        $this->issuerId = (string) config('services.trovotech.issuer_id', 'DEFAULT_ISSUER'); // Keep issuer_id in services config for now
        $this->sandboxMode = (bool) ConfigSetting::getValue('trovotech_sandbox_enabled', true);
    }

    /**
     * Create a custodial wallet for the authenticated investor
     * POST /api/trovotech/wallet/create
     */
    public function createWallet(Request $request)
    {
        $user = $request->user();

        // Check if user already has a wallet
        $existingWallet = Wallet::where('user_id', $user->id)->first();
        if ($existingWallet) {
            return response()->json([
                'message' => 'Wallet already exists',
                'walletAddress' => $existingWallet->wallet_address,
                'balance' => $existingWallet->balance,
                'trusteeRef' => $existingWallet->trustee_ref,
                'createdAt' => $existingWallet->created_at->toISOString(),
            ], 200);
        }

        // In sandbox mode, create mock wallet
        if ($this->sandboxMode) {
            $wallet = Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => 'GBANTU' . strtoupper(substr(md5($user->email), 0, 48)),
                'balance' => 0,
                'trustee_ref' => 'MOCK_TRUSTEE_' . time(),
            ]);

            return response()->json([
                'walletAddress' => $wallet->wallet_address,
                'balance' => $wallet->balance,
                'trusteeRef' => $wallet->trustee_ref,
                'createdAt' => $wallet->created_at->toISOString(),
            ], 201);
        }

        // Production: Call TrovoTech API
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/wallet/create', [
                'issuer_id' => $this->issuerId,
                'investor_email' => $user->email,
                'investor_name' => $user->name,
                'kyc_verified' => true, // TODO: Implement KYC flow
            ]);

            if (!$response->successful()) {
                Log::error('TrovoTech wallet creation failed', ['response' => $response->body()]);
                return response()->json(['message' => 'Wallet creation failed'], 500);
            }

            $data = $response->json();

            // Store wallet in database
            $wallet = Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => $data['wallet_address'],
                'balance' => $data['balance'] ?? 0,
                'trustee_ref' => $data['trustee_ref'] ?? null,
            ]);

            return response()->json([
                'walletAddress' => $wallet->wallet_address,
                'balance' => $wallet->balance,
                'trusteeRef' => $wallet->trustee_ref,
                'createdAt' => $wallet->created_at->toISOString(),
            ], 201);

        } catch (\Exception $e) {
            Log::error('TrovoTech API error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create wallet'], 500);
        }
    }

    /**
     * Get wallet for authenticated user
     * GET /api/trovotech/wallet
     */
    public function getWallet(Request $request)
    {
        $user = $request->user();
        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json(['message' => 'No wallet found'], 404);
        }

        return response()->json([
            'walletAddress' => $wallet->wallet_address,
            'balance' => $wallet->balance,
            'trusteeRef' => $wallet->trustee_ref,
            'createdAt' => $wallet->created_at->toISOString(),
        ]);
    }

    /**
     * Mint an asset token (fractional ownership)
     * POST /api/trovotech/token/mint
     */
    public function mintToken(Request $request)
    {
        $validated = $request->validate([
            'assetId' => 'required|string',
            'assetType' => 'required|in:EV,Battery,SwapCabinet,BiogasSite',
            'fractionOwned' => 'required|numeric|min:0|max:100',
            'investAmount' => 'required|numeric|min:0',
            'investorWallet' => 'required|string',
        ]);

        $user = $request->user();
        
        // Try to find asset by ID, or create a mock one if it doesn't exist
        $asset = Asset::firstOrCreate(
            ['asset_id' => $validated['assetId']], // Search by asset_id
            [
                'type' => $validated['assetType'],
                'model' => $validated['assetType'] . ' ' . $validated['assetId'],
                'status' => 'Available',
                'soh' => 95,
                'location' => 'Lagos',
                'original_value' => $validated['investAmount'] * 10, // Estimate
            ]
        );

        // Calculate already allocated ownership for this asset
        $allocated = AssetToken::where('asset_id', $asset->id)->sum('fraction_owned');
        $remaining = 100 - $allocated;
        if ($validated['fractionOwned'] > $remaining) {
            return response()->json([
                'message' => 'Insufficient remaining ownership',
                'remaining' => max(0, round($remaining, 2)),
                'allocated' => $allocated,
                'requested' => $validated['fractionOwned']
            ], 422);
        }

        // In sandbox mode, create mock token
        if ($this->sandboxMode) {
            $token = AssetToken::create([
                'user_id' => $user->id,
                'asset_id' => $asset->id,
                'token_id' => 'TOKEN_' . strtoupper(substr(md5($asset->id . time()), 0, 16)),
                // Normalize authoritative ownership
                'shares' => $validated['fractionOwned'],
                'fraction_owned' => $validated['fractionOwned'],
                'investment_amount' => $validated['investAmount'],
                'current_value' => $validated['investAmount'],
                'total_returns' => 0,
                'chain' => 'polygon',
                'minted_at' => now(),
                'metadata_hash' => 'IPFS_' . md5($asset->model ?? ('asset_'.$asset->id)),
                'trustee_ref' => 'TRUSTEE_' . time(),
                'tx_hash' => 'BANTU_TX_' . strtoupper(substr(md5(time()), 0, 32)),
            ]);

            // Update asset with token reference if first token
            if (!$asset->token_id) {
                $asset->update([
                    'token_id' => $token->token_id,
                    'metadata_hash' => $token->metadata_hash,
                ]);
            }

            return response()->json([
                'tokenId' => $token->token_id,
                'assetId' => $asset->id,
                'assetModel' => $asset->model,
                'fractionOwned' => $token->fraction_owned,
                'investmentAmount' => $token->investment_amount,
                'currentValue' => $token->current_value,
                'totalReturns' => $token->total_returns,
                'chain' => $token->chain,
                'mintedAt' => $token->minted_at?->toISOString() ?? $token->created_at->toISOString(),
                'metadataHash' => $token->metadata_hash,
                'trusteeRef' => $token->trustee_ref,
                'telemetryURI' => $asset->telemetry_uri,
                'txHash' => $token->tx_hash,
                'remainingOwnership' => round(100 - AssetToken::where('asset_id',$asset->id)->sum('fraction_owned'),2),
            ], 201);
        }

        // Production: Call TrovoTech API
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/token/mint', [
                'issuer_id' => $this->issuerId,
                'asset_type' => $validated['assetType'],
                'asset_metadata' => [
                    'name' => $asset->name,
                    'type' => $asset->type,
                    'purchase_date' => $asset->purchase_date,
                    'purchase_price' => $asset->purchase_price,
                    'lifespan_years' => 5, // TODO: Make configurable
                ],
                'investor_wallet' => $validated['investorWallet'],
                'fraction_owned' => $validated['fractionOwned'],
                'invest_amount' => $validated['investAmount'],
            ]);

            if (!$response->successful()) {
                Log::error('TrovoTech token minting failed', ['response' => $response->body()]);
                return response()->json(['message' => 'Token minting failed'], 500);
            }

            $data = $response->json();

            $token = AssetToken::create([
                'user_id' => $user->id,
                'asset_id' => $asset->id,
                'token_id' => $data['token_id'],
                'shares' => $validated['fractionOwned'],
                'fraction_owned' => $validated['fractionOwned'],
                'investment_amount' => $validated['investAmount'],
                'current_value' => $validated['investAmount'],
                'total_returns' => 0,
                'chain' => $data['chain'] ?? 'polygon',
                'minted_at' => now(),
                'metadata_hash' => $data['metadata_hash'],
                'trustee_ref' => $data['trustee_ref'] ?? null,
                'tx_hash' => $data['tx_hash'],
            ]);

            return response()->json([
                'tokenId' => $token->token_id,
                'assetId' => $asset->id,
                'assetModel' => $asset->model,
                'fractionOwned' => $token->fraction_owned,
                'investmentAmount' => $token->investment_amount,
                'currentValue' => $token->current_value,
                'totalReturns' => $token->total_returns,
                'chain' => $token->chain,
                'mintedAt' => $token->minted_at?->toISOString() ?? $token->created_at->toISOString(),
                'metadataHash' => $token->metadata_hash,
                'trusteeRef' => $token->trustee_ref,
                'telemetryURI' => $asset->telemetry_uri,
                'txHash' => $token->tx_hash,
                'remainingOwnership' => round(100 - AssetToken::where('asset_id',$asset->id)->sum('fraction_owned'),2),
            ], 201);

        } catch (\Exception $e) {
            Log::error('TrovoTech API error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to mint token'], 500);
        }
    }

    /**
     * Get all tokens owned by authenticated user
     * GET /api/trovotech/tokens/my
     */
    public function getMyTokens(Request $request)
    {
        $user = $request->user();
        $tokens = AssetToken::where('user_id', $user->id)
            ->with('asset')
            ->get()
            ->map(function($token) {
                return [
                    'tokenId' => $token->token_id,
                    'assetId' => $token->asset_id,
                    'assetModel' => $token->asset->model ?? 'Unknown',
                    'fractionOwned' => $token->fraction_owned,
                    'investmentAmount' => $token->investment_amount,
                    'currentValue' => $token->current_value,
                    'totalReturns' => $token->total_returns,
                    'chain' => $token->chain,
                    'metadataHash' => $token->metadata_hash,
                    'trusteeRef' => $token->trustee_ref,
                    'txHash' => $token->tx_hash,
                    'mintedAt' => $token->minted_at?->toISOString() ?? $token->created_at->toISOString(),
                ];
            });

        return response()->json($tokens);
    }

    /**
     * Initiate payout distribution to token holders
     * POST /api/trovotech/payout/initiate
     */
    public function initiatePayout(Request $request)
    {
        $validated = $request->validate([
            'tokenIds' => 'required|array',
            'tokenIds.*' => 'required|string',
            'totalRevenue' => 'required|numeric|min:0',
            'period' => 'required|string',
            'description' => 'required|string|max:255',
        ]);

        $user = $request->user();

        // Only operators can initiate payouts
        if ($user->role !== 'operator') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all tokens to distribute to
        $tokens = AssetToken::whereIn('token_id', $validated['tokenIds'])->get();

        if ($tokens->isEmpty()) {
            return response()->json(['message' => 'No tokens found'], 404);
        }

        // Calculate total ownership
        $totalOwnership = $tokens->sum('fraction_owned');

        // In sandbox mode, create mock distributions
        if ($this->sandboxMode) {
            $distributions = [];
            $txHash = 'PAYOUT_TX_' . strtoupper(substr(md5(time()), 0, 32));

            foreach ($tokens as $token) {
                $share = ($token->fraction_owned / $totalOwnership) * $validated['totalRevenue'];

                $payout = Payout::create([
                    'token_id' => $token->id,
                    'user_id' => $token->user_id,
                    'amount' => $share,
                    'period' => $validated['period'],
                    'description' => $validated['description'],
                    'tx_hash' => $txHash,
                    'status' => 'completed',
                ]);

                $distributions[] = [
                    'tokenId' => $token->token_id,
                    'investorWallet' => Wallet::where('user_id', $token->user_id)->first()?->wallet_address ?? 'N/A',
                    'amount' => $share,
                ];
            }

            return response()->json([
                'payoutId' => 'PAYOUT_' . time(),
                'distributions' => $distributions,
                'txHash' => $txHash,
                'completedAt' => now()->toISOString(),
            ], 201);
        }

        // Production: Call TrovoTech API
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payout/distribute', [
                'issuer_id' => $this->issuerId,
                'token_ids' => $validated['tokenIds'],
                'total_amount' => $validated['totalRevenue'],
                'period' => $validated['period'],
                'description' => $validated['description'],
            ]);

            if (!$response->successful()) {
                Log::error('TrovoTech payout failed', ['response' => $response->body()]);
                return response()->json(['message' => 'Payout distribution failed'], 500);
            }

            $data = $response->json();

            // Record payouts in database
            foreach ($data['distributions'] as $dist) {
                $token = AssetToken::where('token_id', $dist['token_id'])->first();
                if ($token) {
                    Payout::create([
                        'token_id' => $token->id,
                        'user_id' => $token->user_id,
                        'amount' => $dist['amount'],
                        'period' => $validated['period'],
                        'description' => $validated['description'],
                        'tx_hash' => $data['tx_hash'],
                        'status' => 'completed',
                    ]);
                }
            }

            return response()->json([
                'payoutId' => $data['payout_id'],
                'distributions' => $data['distributions'],
                'txHash' => $data['tx_hash'],
                'completedAt' => $data['completed_at'],
            ], 201);

        } catch (\Exception $e) {
            Log::error('TrovoTech API error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to initiate payout'], 500);
        }
    }

    /**
     * Sync telemetry data to blockchain metadata
     * POST /api/trovotech/telemetry/sync
     */
    public function syncTelemetry(Request $request)
    {
        $validated = $request->validate([
            'assetId' => 'required|exists:assets,id',
            'batteryLevel' => 'nullable|numeric|min:0|max:100',
            'kilometers' => 'nullable|numeric|min:0',
            'status' => 'required|string',
            'location' => 'nullable|array',
            'location.lat' => 'nullable|numeric',
            'location.lng' => 'nullable|numeric',
            'timestamp' => 'required|date',
        ]);

        $asset = Asset::findOrFail($validated['assetId']);

        // Store telemetry in database
        $telemetry = Telemetry::create([
            'asset_id' => $asset->id,
            'battery_level' => $validated['batteryLevel'] ?? null,
            'km' => $validated['kilometers'] ?? null,
            'status' => $validated['status'],
            'location' => isset($validated['location']) ? json_encode($validated['location']) : null,
            'timestamp' => $validated['timestamp'],
        ]);

        // In sandbox mode, just return success
        if ($this->sandboxMode) {
            $uri = 'ipfs://QmMOCK' . md5($asset->id . time());
            $asset->update(['telemetry_uri' => $uri]);

            return response()->json([
                'success' => true,
                'uri' => $uri,
            ]);
        }

        // Production: Sync to TrovoTech/IPFS
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/telemetry/sync', [
                'asset_id' => $asset->id,
                'telemetry_data' => $validated,
            ]);

            if (!$response->successful()) {
                Log::error('TrovoTech telemetry sync failed', ['response' => $response->body()]);
                return response()->json(['message' => 'Telemetry sync failed'], 500);
            }

            $data = $response->json();
            $asset->update(['telemetry_uri' => $data['uri']]);

            return response()->json([
                'success' => true,
                'uri' => $data['uri'],
            ]);

        } catch (\Exception $e) {
            Log::error('TrovoTech API error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to sync telemetry'], 500);
        }
    }

    /**
     * Get asset metadata from blockchain/IPFS
     * GET /api/trovotech/asset/{assetId}/metadata
     */
    public function getAssetMetadata($assetId)
    {
        $asset = Asset::findOrFail($assetId);

        // Return local metadata (in production, would fetch from IPFS/TrovoTech)
        return response()->json([
            'assetId' => $asset->id,
            'assetType' => $asset->type,
            'name' => $asset->name,
            'purchaseDate' => $asset->purchase_date,
            'purchasePrice' => $asset->purchase_price,
            'metadataHash' => $asset->metadata_hash,
            'telemetryURI' => $asset->telemetry_uri,
            'trusteeRef' => $asset->trustee_ref,
            'tokenId' => $asset->token_id,
        ]);
    }
}
