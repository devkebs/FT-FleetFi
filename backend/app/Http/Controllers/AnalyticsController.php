<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Asset;
use App\Models\Ride; // Assuming this exists or using fake data
use App\Models\User;

class AnalyticsController extends Controller
{
    /**
     * Get aggregated analytics data for Admin Dashboard
     */
    public function getDashboardData()
    {
        // 1. Revenue Chart Data (Last 6 Months)
        $revenueData = [
            'labels' => ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            'datasets' => [
                [
                    'label' => 'Revenue (₦)',
                    'data' => [4500000, 5200000, 4800000, 6100000, 7500000, 8900000],
                    'borderColor' => '#0d6efd',
                    'backgroundColor' => 'rgba(13, 110, 253, 0.1)',
                ]
            ]
        ];

        // 2. Asset Health Distribution
        // In real app: Asset::groupBy('status')->count()
        $assetHealth = [
            'total' => 120,
            'breakdown' => [
                ['label' => 'Active', 'value' => 85, 'color' => '#198754'], // Green
                ['label' => 'Maintenance', 'value' => 12, 'color' => '#ffc107'], // Yellow
                ['label' => 'Critical', 'value' => 3, 'color' => '#dc3545'], // Red
                ['label' => 'Inactive', 'value' => 20, 'color' => '#6c757d'], // Grey
            ]
        ];

        // 3. Top Drivers
        $topDrivers = [
            ['name' => 'John Doe', 'rides' => 145, 'revenue' => 450000, 'rating' => 4.9],
            ['name' => 'Jane Smith', 'rides' => 132, 'revenue' => 410000, 'rating' => 4.8],
            ['name' => 'Mike Johnson', 'rides' => 128, 'revenue' => 395000, 'rating' => 4.8],
            ['name' => 'Sarah Connor', 'rides' => 110, 'revenue' => 340000, 'rating' => 4.7],
            ['name' => 'Kyle Reese', 'rides' => 98, 'revenue' => 290000, 'rating' => 4.9],
        ];

        return response()->json([
            'revenue_chart' => $revenueData,
            'asset_health' => $assetHealth,
            'top_drivers' => $topDrivers
        ]);
    }

    /**
     * Track session start (for analytics purposes)
     */
    public function trackSession(Request $request)
    {
        // In production, this would log session data to analytics DB
        // For now, just acknowledge the request
        return response()->json([
            'success' => true,
            'session_id' => 'sess_' . uniqid(),
            'started_at' => now()->toISOString()
        ]);
    }

    /**
     * End session tracking
     */
    public function endSession(Request $request)
    {
        // In production, this would update the session end time
        return response()->json([
            'success' => true,
            'ended_at' => now()->toISOString()
        ]);
    }

    /**
     * Track page view
     */
    public function trackPageView(Request $request)
    {
        // In production, log page view to analytics
        return response()->json(['success' => true]);
    }

    /**
     * Track custom event
     */
    public function trackEvent(Request $request)
    {
        // In production, log event to analytics
        return response()->json(['success' => true]);
    }
}
