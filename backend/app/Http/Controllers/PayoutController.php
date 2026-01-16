<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Investment;
use App\Models\Payout;
use App\Models\PayoutDistribution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        // Get investor's TrovoTech wallet
        $wallet = $investor->trovoWallet;

        if (!$wallet) {
            throw new \Exception('Investor does not have a TrovoTech wallet');
        }

        // Call TrovoTech API to transfer funds
        $response = Http::post(config('services.trovo.api_url') . '/transfer', [
            'from_wallet' => config('services.trovo.operator_wallet'),
            'to_wallet' => $wallet->wallet_address,
            'amount' => $amount,
            'currency' => 'NGN',
            'reference' => 'PAYOUT-' . $payout->id,
            'description' => "FleetFi payout for period {$payout->period_start} to {$payout->period_end}",
        ]);

        if (!$response->successful()) {
            throw new \Exception('TrovoTech transfer failed: ' . $response->body());
        }

        $data = $response->json();

        // Update payout with blockchain hash
        $payout->update([
            'blockchain_hash' => $data['transaction_hash'] ?? null,
            'processed_at' => now(),
        ]);

        return $data;
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
