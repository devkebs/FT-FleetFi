<?php

namespace App\Http\Controllers;

use App\Models\Ride;
use App\Models\Revenue;
use Illuminate\Http\Request;

class OperationsController extends Controller
{
    // List recent rides with revenue breakdown
    public function rides(Request $request)
    {
        $limit = (int)$request->query('limit', 25);
        $rides = Ride::with('vehicle')
            ->orderByDesc('ended_at')
            ->limit($limit)
            ->get()
            ->map(function ($ride) {
                $rev = $ride->revenue; // may be lazy loaded
                return [
                    'id' => $ride->id,
                    'vehicle_id' => $ride->vehicle_id,
                    'distance_km' => (float)$ride->distance_km,
                    'battery_start' => $ride->battery_start,
                    'battery_end' => $ride->battery_end,
                    'swaps_before' => $ride->swaps_before,
                    'swaps_after' => $ride->swaps_after,
                    'revenue' => $rev ? [
                        'gross' => (float)$rev->amount,
                        'investor_roi' => (float)$rev->investor_roi_amount,
                        'rider_wages' => (float)$rev->rider_wage_amount,
                        'management_reserve' => (float)$rev->management_reserve_amount,
                        'maintenance_reserve' => (float)$rev->maintenance_reserve_amount,
                    ] : null,
                    'started_at' => $ride->started_at,
                    'ended_at' => $ride->ended_at,
                ];
            });

        return response()->json(['rides' => $rides]);
    }

    // Aggregate revenue breakdown
    public function revenueSummary()
    {
        $agg = Revenue::selectRaw('COALESCE(SUM(amount),0) as gross')
            ->selectRaw('COALESCE(SUM(investor_roi_amount),0) as investor_roi')
            ->selectRaw('COALESCE(SUM(rider_wage_amount),0) as rider_wages')
            ->selectRaw('COALESCE(SUM(management_reserve_amount),0) as management_reserve')
            ->selectRaw('COALESCE(SUM(maintenance_reserve_amount),0) as maintenance_reserve')
            ->first();

        $total = (float)$agg->gross;
        $percent = function ($v) use ($total) {
            return $total > 0 ? round(($v / $total) * 100, 2) : 0.0;
        };

        return response()->json([
            'gross_total' => $total,
            'breakdown' => [
                'investor_roi' => [
                    'amount' => (float)$agg->investor_roi,
                    'pct' => $percent((float)$agg->investor_roi),
                ],
                'rider_wages' => [
                    'amount' => (float)$agg->rider_wages,
                    'pct' => $percent((float)$agg->rider_wages),
                ],
                'management_reserve' => [
                    'amount' => (float)$agg->management_reserve,
                    'pct' => $percent((float)$agg->management_reserve),
                ],
                'maintenance_reserve' => [
                    'amount' => (float)$agg->maintenance_reserve,
                    'pct' => $percent((float)$agg->maintenance_reserve),
                ],
            ],
        ]);
    }
}
