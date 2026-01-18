<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Investment;
use App\Models\Payout;
use App\Models\PayoutDistribution;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayoutController extends Controller
{
    /**
     * Get assets ready for payout distribution
     */
    public function getAssetsForPayout()
    {
        $assets = Asset::select([
            'assets.id',
            'assets.name',
            'assets.registration_number',
            DB::raw('COALESCE(SUM(rides.fare_amount), 0) as total_revenue'),
            DB::raw('COALESCE(SUM(rides.fare_amount), 0) - COALESCE(SUM(payouts.amount), 0) as available_for_distribution'),
            DB::raw('COUNT(DISTINCT investments.investor_id) as investor_count')
        ])
        ->leftJoin('rides', 'assets.id', '=', 'rides.asset_id')
        ->leftJoin('investments', 'assets.id', '=', 'investments.asset_id')
        ->leftJoin('payouts', 'assets.id', '=', 'payouts.asset_id')
        ->groupBy('assets.id', 'assets.name', 'assets.registration_number')
        ->having('available_for_distribution', '>', 0)
        ->get();

        return response()->json($assets);
    }

    /**
     * Distribute payout to investors
     */
    public function distributePayout(Request $request)
    {
        $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'amount' => 'required|numeric|min:0',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
        ]);

        try {
            DB::beginTransaction();

            $asset = Asset::findOrFail($request->asset_id);

            // Get all active investments for this asset
            $investments = Investment::where('asset_id', $request->asset_id)
                ->where('status', 'active')
                ->get();

            if ($investments->isEmpty()) {
                return response()->json(['message' => 'No active investors for this asset'], 400);
            }

            // Calculate total ownership percentage
            $totalOwnership = $investments->sum('ownership_percentage');

            // Create payout distribution record
            $distribution = PayoutDistribution::create([
                'asset_id' => $request->asset_id,
                'total_amount' => $request->amount,
                'period_start' => $request->period_start,
                'period_end' => $request->period_end,
                'distributed_by' => auth()->id(),
                'status' => 'processing',
            ]);

            // Distribute to each investor based on ownership percentage
            foreach ($investments as $investment) {
                $payoutAmount = ($investment->ownership_percentage / $totalOwnership) * $request->amount;

                $payout = Payout::create([
                    'investment_id' => $investment->id,
                    'asset_id' => $request->asset_id,
                    'investor_id' => $investment->investor_id,
                    'amount' => $payoutAmount,
                    'period_start' => $request->period_start,
                    'period_end' => $request->period_end,
                    'distribution_id' => $distribution->id,
                    'status' => 'pending',
                ]);

                // Attempt to process payout via TrovoTech wallet
                try {
                    $this->processTrovoTechPayout($investment->investor, $payoutAmount, $payout);
                    $payout->update(['status' => 'completed']);
                } catch (\Exception $e) {
                    Log::error('Payout processing failed: ' . $e->getMessage());
                    $payout->update(['status' => 'failed', 'failure_reason' => $e->getMessage()]);
                }
            }

            // Update distribution status
            $distribution->update(['status' => 'completed']);

            DB::commit();

            return response()->json([
                'message' => 'Payout distributed successfully',
                'distribution' => $distribution,
                'investors_paid' => $investments->count(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payout distribution error: ' . $e->getMessage());
            return response()->json(['message' => 'Error distributing payout: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get payout distribution history
     */
    public function getPayoutHistory()
    {
        $history = PayoutDistribution::with('asset')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($distribution) {
                return [
                    'id' => $distribution->id,
                    'asset_id' => $distribution->asset_id,
                    'asset_name' => $distribution->asset->name,
                    'amount' => $distribution->total_amount,
                    'investor_count' => $distribution->payouts()->count(),
                    'period_start' => $distribution->period_start,
                    'period_end' => $distribution->period_end,
                    'distributed_at' => $distribution->created_at,
                    'status' => $distribution->status,
                ];
            });

        return response()->json($history);
    }

    /**
     * Process payout via TrovoTech wallet
     */
    private function processTrovoTechPayout($investor, $amount, $payout)
    {
        // Get investor's wallet
        $wallet = Wallet::where('user_id', $investor->id)->first();

        if (!$wallet) {
            throw new \Exception('Investor does not have a wallet');
        }

        $sandboxMode = (bool) \App\Models\ConfigSetting::getValue('trovotech_sandbox_enabled', true);

        if ($sandboxMode) {
            // Sandbox mode - just credit wallet directly
            $wallet->increment('balance', $amount);

            // Create wallet transaction record
            WalletTransaction::create([
                'user_id' => $investor->id,
                'wallet_id' => $wallet->id,
                'type' => 'payout',
                'amount' => $amount,
                'currency' => 'NGN',
                'status' => 'completed',
                'description' => "Payout for period {$payout->period_start} to {$payout->period_end}",
                'tx_hash' => 'SIM_' . strtoupper(uniqid()),
            ]);

            // Update payout record
            $payout->update([
                'blockchain_hash' => 'SANDBOX_' . strtoupper(uniqid()),
                'processed_at' => now(),
            ]);

            return ['status' => 'simulated', 'amount' => $amount];
        }

        // Production mode - call TrovoTech API
        try {
            $trovotechClient = new \App\Services\TrovotechClient();

            if (!$trovotechClient->isConfigured()) {
                throw new \Exception('TrovoTech not configured');
            }

            // For now, credit wallet directly even in production
            // Real blockchain transfer would go here
            $wallet->increment('balance', $amount);

            WalletTransaction::create([
                'user_id' => $investor->id,
                'wallet_id' => $wallet->id,
                'type' => 'payout',
                'amount' => $amount,
                'currency' => 'NGN',
                'status' => 'completed',
                'description' => "Payout for period {$payout->period_start} to {$payout->period_end}",
                'tx_hash' => 'TRV_' . strtoupper(uniqid()),
            ]);

            $payout->update([
                'blockchain_hash' => 'TRV_' . strtoupper(uniqid()),
                'processed_at' => now(),
            ]);

            // Send email notification
            try {
                $emailService = new EmailNotificationService();
                $emailService->sendPayoutNotification($investor, [
                    'amount' => $amount,
                    'period_start' => $payout->period_start,
                    'period_end' => $payout->period_end,
                    'asset_name' => $payout->asset->name ?? 'Unknown Asset',
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to send payout notification email: ' . $e->getMessage());
            }

            return ['status' => 'completed', 'amount' => $amount];

        } catch (\Exception $e) {
            Log::error('TrovoTech payout failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Show single payout details
     */
    public function show($id)
    {
        $payout = Payout::with(['asset', 'investment', 'investor'])
            ->findOrFail($id);

        // Ensure user can only see their own payouts (unless admin)
        $user = auth()->user();
        if ($user->role !== 'admin' && $payout->investor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'id' => $payout->id,
            'asset' => [
                'id' => $payout->asset->id,
                'name' => $payout->asset->name,
                'type' => $payout->asset->type,
            ],
            'amount' => $payout->amount,
            'ownership_percentage' => $payout->investment->ownership_percentage ?? 0,
            'period_start' => $payout->period_start,
            'period_end' => $payout->period_end,
            'status' => $payout->status,
            'blockchain_hash' => $payout->blockchain_hash,
            'processed_at' => $payout->processed_at,
            'created_at' => $payout->created_at,
            'failure_reason' => $payout->failure_reason,
        ]);
    }

    /**
     * Get investor's payout history
     */
    public function getInvestorPayouts(Request $request)
    {
        $investorId = auth()->id();

        $payouts = Payout::where('investor_id', $investorId)
            ->with(['asset', 'investment'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payout) {
                return [
                    'id' => $payout->id,
                    'asset_name' => $payout->asset->name,
                    'amount' => $payout->amount,
                    'ownership_percentage' => $payout->investment->ownership_percentage,
                    'period_start' => $payout->period_start,
                    'period_end' => $payout->period_end,
                    'status' => $payout->status,
                    'blockchain_hash' => $payout->blockchain_hash,
                    'received_at' => $payout->processed_at,
                ];
            });

        $totalEarnings = Payout::where('investor_id', $investorId)
            ->where('status', 'completed')
            ->sum('amount');

        return response()->json([
            'payouts' => $payouts,
            'total_earnings' => $totalEarnings,
        ]);
    }
}
