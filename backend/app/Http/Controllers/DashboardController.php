<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Revenue;
use App\Models\Activity;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $totalVehicles = Vehicle::count();
        $activeVehicles = Vehicle::where('status', 'active')->count();
        $totalRevenue = Revenue::sum('amount');

        $recentActivity = Activity::with(['vehicle:id,name', 'user:id,name'])
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'date' => $activity->created_at,
                    'vehicle' => $activity->vehicle ? $activity->vehicle->name : 'N/A',
                    'action' => $activity->action,
                    'status' => $activity->status,
                    'description' => $activity->description,
                    'user' => $activity->user->name
                ];
            });

        return response()->json([
            'totalVehicles' => $totalVehicles,
            'activeVehicles' => $activeVehicles,
            'totalRevenue' => $totalRevenue,
            'recentActivity' => $recentActivity,
        ]);
    }
}
