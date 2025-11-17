<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Token as AssetToken;
use App\Models\Wallet;
use App\Models\Payout;
use App\Models\WebhookLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * TrovoTech Webhook Handler
 *
 * Receives and processes blockchain events from TrovoTech API:
 * - Token mint confirmations
 * - Payout completion events
 * - Transfer notifications
 * - Custody updates
 */
class TrovotechWebhookController extends Controller
{
    /**
     * Handle incoming TrovoTech webhook
     * POST /api/webhooks/trovotech
     */
    public function handle(Request $request)
    {
        // Log raw webhook for debugging
        Log::info('TrovoTech webhook received', [
            'headers' => $request->headers->all(),
            'payload' => $request->all(),
        ]);

        // Verify webhook signature
        if (!$this->verifySignature($request)) {
            Log::warning('TrovoTech webhook signature verification failed', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $eventType = $request->input('event_type');
        $payload = $request->input('data');

        // Log webhook event
        $webhookLog = WebhookLog::create([
            'source' => 'trovotech',
            'event_type' => $eventType,
            'payload' => json_encode($request->all()),
            'status' => 'processing',
        ]);

        try {
            // Route to appropriate handler
            $result = match($eventType) {
                'token.minted' => $this->handleTokenMinted($payload),
                'payout.completed' => $this->handlePayoutCompleted($payload),
                'payout.failed' => $this->handlePayoutFailed($payload),
                'transfer.completed' => $this->handleTransferCompleted($payload),
                'wallet.created' => $this->handleWalletCreated($payload),
                'custody.updated' => $this->handleCustodyUpdated($payload),
                default => $this->handleUnknownEvent($eventType, $payload),
            };

            // Update webhook log
            $webhookLog->update([
                'status' => 'processed',
                'processed_at' => now(),
                'response' => json_encode($result),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Webhook processed successfully',
                'event_type' => $eventType,
            ], 200);

        } catch (\Exception $e) {
            Log::error('TrovoTech webhook processing failed', [
                'event_type' => $eventType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $webhookLog->update([
                'status' => 'failed',
                'processed_at' => now(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Webhook processing failed',
            ], 500);
        }
    }

    /**
     * Verify webhook signature using HMAC
     */
    protected function verifySignature(Request $request): bool
    {
        $webhookSecret = config('services.trovotech.webhook_secret');

        // Skip verification in sandbox mode for testing
        if (config('services.trovotech.sandbox_mode', true)) {
            return true;
        }

        if (empty($webhookSecret)) {
            Log::warning('TrovoTech webhook secret not configured');
            return false;
        }

        $signature = $request->header('X-TrovoTech-Signature');
        if (!$signature) {
            return false;
        }

        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Handle token minted event
     */
    protected function handleTokenMinted(array $data): array
    {
        Log::info('Processing token.minted event', $data);

        $tokenId = $data['token_id'] ?? null;
        $txHash = $data['tx_hash'] ?? null;
        $assetId = $data['asset_id'] ?? null;
        $investorWallet = $data['investor_wallet'] ?? null;

        if (!$tokenId || !$txHash) {
            throw new \Exception('Missing required token data');
        }

        // Find and update token record
        $token = AssetToken::where('token_id', $tokenId)->first();

        if (!$token) {
            // Create new token if webhook arrives before local creation
            $wallet = Wallet::where('wallet_address', $investorWallet)->first();
            if (!$wallet) {
                throw new \Exception('Investor wallet not found');
            }

            $token = AssetToken::create([
                'user_id' => $wallet->user_id,
                'asset_id' => $assetId,
                'token_id' => $tokenId,
                'tx_hash' => $txHash,
                'fraction_owned' => $data['fraction_owned'] ?? 0,
                'investment_amount' => $data['investment_amount'] ?? 0,
                'current_value' => $data['current_value'] ?? 0,
                'total_returns' => 0,
                'chain' => $data['chain'] ?? 'bantu',
                'metadata_hash' => $data['metadata_hash'] ?? null,
                'trustee_ref' => $data['trustee_ref'] ?? null,
                'minted_at' => $data['minted_at'] ?? now(),
                'status' => 'active',
            ]);
        } else {
            // Update existing token with blockchain confirmation
            $token->update([
                'tx_hash' => $txHash,
                'status' => 'active',
                'minted_at' => $data['minted_at'] ?? $token->minted_at,
                'metadata_hash' => $data['metadata_hash'] ?? $token->metadata_hash,
            ]);
        }

        // Update asset with token reference
        if ($assetId) {
            $asset = Asset::find($assetId);
            if ($asset && !$asset->token_id) {
                $asset->update([
                    'token_id' => $tokenId,
                    'metadata_hash' => $data['metadata_hash'] ?? null,
                ]);
            }
        }

        // Notify user (implement notification system)
        // event(new TokenMintedEvent($token));

        return [
            'token_id' => $token->token_id,
            'status' => 'confirmed',
            'tx_hash' => $txHash,
        ];
    }

    /**
     * Handle payout completed event
     */
    protected function handlePayoutCompleted(array $data): array
    {
        Log::info('Processing payout.completed event', $data);

        $payoutId = $data['payout_id'] ?? null;
        $txHash = $data['tx_hash'] ?? null;
        $distributions = $data['distributions'] ?? [];

        if (!$payoutId || !$txHash) {
            throw new \Exception('Missing required payout data');
        }

        DB::beginTransaction();
        try {
            foreach ($distributions as $dist) {
                $tokenId = $dist['token_id'] ?? null;
                $amount = $dist['amount'] ?? 0;
                $investorWallet = $dist['investor_wallet'] ?? null;

                if (!$tokenId || !$amount) {
                    continue;
                }

                // Find token
                $token = AssetToken::where('token_id', $tokenId)->first();
                if (!$token) {
                    Log::warning('Token not found for payout', ['token_id' => $tokenId]);
                    continue;
                }

                // Create or update payout record
                $payout = Payout::updateOrCreate(
                    [
                        'token_id' => $token->id,
                        'tx_hash' => $txHash,
                    ],
                    [
                        'user_id' => $token->user_id,
                        'amount' => $amount,
                        'period' => $data['period'] ?? now()->format('Y-m'),
                        'description' => $data['description'] ?? 'Revenue distribution',
                        'status' => 'completed',
                        'completed_at' => $data['completed_at'] ?? now(),
                    ]
                );

                // Update token total returns
                $token->increment('total_returns', $amount);
                $token->update(['current_value' => $token->investment_amount + $token->total_returns]);

                // Update wallet balance
                $wallet = Wallet::where('user_id', $token->user_id)->first();
                if ($wallet) {
                    $wallet->increment('balance', $amount);
                }
            }

            DB::commit();

            return [
                'payout_id' => $payoutId,
                'distributions_processed' => count($distributions),
                'status' => 'completed',
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Handle payout failed event
     */
    protected function handlePayoutFailed(array $data): array
    {
        Log::warning('Processing payout.failed event', $data);

        $payoutId = $data['payout_id'] ?? null;
        $reason = $data['reason'] ?? 'Unknown error';

        // Update any pending payouts
        Payout::where('status', 'pending')
            ->where('tx_hash', 'like', "%{$payoutId}%")
            ->update([
                'status' => 'failed',
                'error' => $reason,
            ]);

        return [
            'payout_id' => $payoutId,
            'status' => 'failed',
            'reason' => $reason,
        ];
    }

    /**
     * Handle transfer completed event
     */
    protected function handleTransferCompleted(array $data): array
    {
        Log::info('Processing transfer.completed event', $data);

        $tokenId = $data['token_id'] ?? null;
        $fromWallet = $data['from_wallet'] ?? null;
        $toWallet = $data['to_wallet'] ?? null;
        $txHash = $data['tx_hash'] ?? null;

        if (!$tokenId || !$toWallet) {
            throw new \Exception('Missing required transfer data');
        }

        // Find token
        $token = AssetToken::where('token_id', $tokenId)->first();
        if (!$token) {
            throw new \Exception('Token not found');
        }

        // Find new owner wallet
        $newOwnerWallet = Wallet::where('wallet_address', $toWallet)->first();
        if (!$newOwnerWallet) {
            throw new \Exception('Destination wallet not found');
        }

        // Update token ownership
        $token->update([
            'user_id' => $newOwnerWallet->user_id,
            'tx_hash' => $txHash, // Latest transaction
        ]);

        return [
            'token_id' => $tokenId,
            'new_owner' => $newOwnerWallet->user_id,
            'status' => 'transferred',
        ];
    }

    /**
     * Handle wallet created event
     */
    protected function handleWalletCreated(array $data): array
    {
        Log::info('Processing wallet.created event', $data);

        $walletAddress = $data['wallet_address'] ?? null;
        $trusteeRef = $data['trustee_ref'] ?? null;
        $userEmail = $data['user_email'] ?? null;

        if (!$walletAddress) {
            throw new \Exception('Missing wallet address');
        }

        // Find or create wallet
        $wallet = Wallet::where('wallet_address', $walletAddress)->first();
        if ($wallet) {
            $wallet->update([
                'trustee_ref' => $trusteeRef,
                'status' => 'active',
            ]);
        }

        return [
            'wallet_address' => $walletAddress,
            'status' => 'confirmed',
        ];
    }

    /**
     * Handle custody updated event
     */
    protected function handleCustodyUpdated(array $data): array
    {
        Log::info('Processing custody.updated event', $data);

        $assetId = $data['asset_id'] ?? null;
        $trusteeRef = $data['trustee_ref'] ?? null;
        $status = $data['status'] ?? null;

        if ($assetId) {
            Asset::where('id', $assetId)->update([
                'trustee_ref' => $trusteeRef,
                'custody_status' => $status,
            ]);
        }

        return [
            'asset_id' => $assetId,
            'status' => $status,
        ];
    }

    /**
     * Handle unknown event type
     */
    protected function handleUnknownEvent(string $eventType, array $data): array
    {
        Log::warning('Unknown TrovoTech webhook event type', [
            'event_type' => $eventType,
            'data' => $data,
        ]);

        return [
            'event_type' => $eventType,
            'status' => 'logged',
            'message' => 'Unknown event type - logged for review',
        ];
    }
}
