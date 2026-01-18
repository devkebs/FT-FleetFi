<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Asset;
use App\Models\Vehicle;
use App\Models\Token;
use App\Models\Revenue;
use App\Models\Payout;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Telemetry;
use App\Models\Ride;
use App\Models\AuditLog;
use App\Models\PaymentMethod;
use App\Models\PaymentRecord;
use App\Services\EmailNotificationService;

class AdminDashboardController extends Controller
{
    /**
     * Get comprehensive admin dashboard overview
     */
    public function overview(Request $request)
    {
        $period = $request->query('period', '30'); // days

        return response()->json([
            'success' => true,
            'overview' => [
                'users' => $this->getUserStats($period),
                'revenue' => $this->getRevenueStats($period),
                'assets' => $this->getAssetStats($period),
                'investments' => $this->getInvestmentStats($period),
                'operations' => $this->getOperationsStats($period),
                'platform' => $this->getPlatformStats($period),
            ],
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get user statistics
     */
    private function getUserStats($period)
    {
        $totalUsers = User::count();
        $newUsers = User::where('created_at', '>=', now()->subDays($period))->count();

        // Active users approximation
        $activeUsers = WalletTransaction::where('created_at', '>=', now()->subDays($period))
            ->distinct('user_id')
            ->count('user_id');

        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->pluck('count', 'role');

        // KYC stats - using user kyc_status field if available, or placeholder
        $kycStats = [
            'pending' => User::where('kyc_status', 'pending')->count(),
            'approved' => User::where('kyc_status', 'approved')->count(),
            'rejected' => User::where('kyc_status', 'rejected')->count(),
        ];

        return [
            'total' => $totalUsers,
            'new' => $newUsers,
            'active' => $activeUsers,
            'by_role' => $usersByRole,
            'kyc' => $kycStats,
            'growth_rate' => $this->calculateGrowthRate(User::class, $period),
        ];
    }

    /**
     * Get revenue statistics
     */
    private function getRevenueStats($period)
    {
        $totalRevenue = Revenue::sum('amount');
        $periodRevenue = Revenue::where('created_at', '>=', now()->subDays($period))
            ->sum('amount');

        $totalPayouts = Payout::where('status', 'completed')->sum('amount');
        $pendingPayouts = Payout::where('status', 'pending')->sum('amount');

        $revenueBySource = Revenue::select('source', DB::raw('sum(amount) as total'))
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('source')
            ->get()
            ->pluck('total', 'source');

        $dailyRevenue = Revenue::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('sum(amount) as total')
            )
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return [
            'total' => $totalRevenue,
            'period' => $periodRevenue,
            'payouts_completed' => $totalPayouts,
            'payouts_pending' => $pendingPayouts,
            'by_source' => $revenueBySource,
            'daily' => $dailyRevenue,
            'average_daily' => $period > 0 ? $periodRevenue / $period : 0,
        ];
    }

    /**
     * Get asset statistics
     */
    private function getAssetStats($period)
    {
        $totalAssets = Asset::count();
        $newAssets = Asset::where('created_at', '>=', now()->subDays($period))->count();
        $totalValue = Asset::sum('value');

        $assetsByType = Asset::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type');

        $assetsByStatus = Vehicle::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $utilizationRate = $this->calculateUtilizationRate($period);

        return [
            'total' => $totalAssets,
            'new' => $newAssets,
            'total_value' => $totalValue,
            'by_type' => $assetsByType,
            'by_status' => $assetsByStatus,
            'utilization_rate' => $utilizationRate,
            'tokenized' => Token::distinct('asset_id')->count('asset_id'),
        ];
    }

    /**
     * Get investment statistics
     */
    private function getInvestmentStats($period)
    {
        $totalInvestments = Token::sum('investment_amount');
        $periodInvestments = Token::where('created_at', '>=', now()->subDays($period))
            ->sum('investment_amount');

        $activeInvestors = Token::distinct('user_id')->count('user_id');
        $totalTokens = Token::sum('shares'); // Changed from token_count to shares

        $investmentsByAsset = Token::select('asset_id', DB::raw('sum(investment_amount) as total'))
            ->groupBy('asset_id')
            ->with('asset:id,name')
            ->get()
            ->map(function ($item) {
                return [
                    'asset_name' => $item->asset->name ?? 'Unknown',
                    'amount' => $item->total,
                ];
            });

        return [
            'total_invested' => $totalInvestments,
            'period_invested' => $periodInvestments,
            'active_investors' => $activeInvestors,
            'total_tokens' => $totalTokens,
            'by_asset' => $investmentsByAsset,
            'average_investment' => $activeInvestors > 0 ? $totalInvestments / $activeInvestors : 0,
        ];
    }

    /**
     * Get operations statistics
     */
    private function getOperationsStats($period)
    {
        $totalRides = Ride::count();
        $periodRides = Ride::where('created_at', '>=', now()->subDays($period))->count();

        $activeVehicles = Telemetry::where('recorded_at', '>=', now()->subMinutes(30))
            ->distinct('asset_id')
            ->count('asset_id');

        $totalDistance = Ride::sum('distance');
        $periodDistance = Ride::where('created_at', '>=', now()->subDays($period))
            ->sum('distance');

        $averageBatteryLevel = Telemetry::where('recorded_at', '>=', now()->subHours(1))
            ->avg('battery_level');

        $swapEvents = DB::table('swap_events')
            ->where('created_at', '>=', now()->subDays($period))
            ->count();

        return [
            'total_rides' => $totalRides,
            'period_rides' => $periodRides,
            'active_vehicles' => $activeVehicles,
            'total_distance' => $totalDistance,
            'period_distance' => $periodDistance,
            'average_battery' => round($averageBatteryLevel ?? 0, 2),
            'swap_events' => $swapEvents,
            'rides_per_day' => $period > 0 ? $periodRides / $period : 0,
        ];
    }

    /**
     * Get platform statistics
     */
    private function getPlatformStats($period)
    {
        $totalWalletBalance = Wallet::sum('balance');

        $transactions = WalletTransaction::where('created_at', '>=', now()->subDays($period))
            ->count();

        $systemHealth = [
            'api_uptime' => 99.9, // Mock - integrate with monitoring tool
            'database_size' => $this->getDatabaseSize(),
            'active_sessions' => $this->getActiveSessions(),
            'error_rate' => 0.1, // Mock - integrate with error tracking
        ];

        $recentActivity = AuditLog::where('created_at', '>=', now()->subDays($period))
            ->select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->get()
            ->pluck('count', 'action');

        return [
            'wallet_balance' => $totalWalletBalance,
            'transactions' => $transactions,
            'health' => $systemHealth,
            'activity' => $recentActivity,
        ];
    }

    /**
     * Get real-time metrics
     */
    public function realtime(Request $request)
    {
        return response()->json([
            'success' => true,
            'realtime' => [
                'active_users' => $this->getActiveUsersNow(),
                'active_vehicles' => $this->getActiveVehiclesNow(),
                'current_rides' => $this->getCurrentRides(),
                'revenue_today' => $this->getRevenueTodayLive(),
                'alerts' => $this->getActiveAlerts(),
            ],
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get user analytics
     */
    public function userAnalytics(Request $request)
    {
        $period = $request->query('period', '30');

        $userGrowth = User::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $userEngagement = WalletTransaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(DISTINCT user_id) as active_users'),
                DB::raw('count(*) as transactions')
            )
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $userRetention = $this->calculateRetentionRate($period);

        $topInvestors = Token::select('user_id', DB::raw('sum(amount) as total_invested'))
            ->groupBy('user_id')
            ->orderBy('total_invested', 'desc')
            ->limit(10)
            ->with('user:id,name,email')
            ->get()
            ->map(function ($item) {
                return [
                    'user_id' => $item->user_id,
                    'name' => $item->user->name ?? 'Unknown',
                    'email' => $item->user->email ?? 'Unknown',
                    'total_invested' => $item->total_invested,
                ];
            });

        return response()->json([
            'success' => true,
            'analytics' => [
                'growth' => $userGrowth,
                'engagement' => $userEngagement,
                'retention_rate' => $userRetention,
                'top_investors' => $topInvestors,
            ],
        ]);
    }

    /**
     * Get revenue analytics
     */
    public function revenueAnalytics(Request $request)
    {
        $period = $request->query('period', '30');

        $revenueGrowth = Revenue::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('sum(amount) as total'),
                DB::raw('count(*) as transactions')
            )
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $revenueByAsset = Revenue::select('asset_id', DB::raw('sum(amount) as total'))
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('asset_id')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->with('asset:id,name,type')
            ->get()
            ->map(function ($item) {
                return [
                    'asset_name' => $item->asset->name ?? 'Unknown',
                    'asset_type' => $item->asset->type ?? 'Unknown',
                    'revenue' => $item->total,
                ];
            });

        $payoutAnalytics = [
            'total_paid' => Payout::where('status', 'completed')->sum('amount'),
            'pending' => Payout::where('status', 'pending')->sum('amount'),
            'failed' => Payout::where('status', 'failed')->sum('amount'),
            'count' => Payout::where('created_at', '>=', now()->subDays($period))->count(),
        ];

        return response()->json([
            'success' => true,
            'analytics' => [
                'growth' => $revenueGrowth,
                'by_asset' => $revenueByAsset,
                'payouts' => $payoutAnalytics,
                'profit_margin' => $this->calculateProfitMargin($period),
            ],
        ]);
    }

    /**
     * Get fleet analytics
     */
    public function fleetAnalytics(Request $request)
    {
        $period = $request->query('period', '30');

        $fleetUtilization = $this->getFleetUtilizationByDay($period);

        $vehiclePerformance = Vehicle::select('id', 'registration_number', 'model')
            ->with(['rides' => function ($query) use ($period) {
                $query->where('created_at', '>=', now()->subDays($period));
            }])
            ->get()
            ->map(function ($vehicle) {
                return [
                    'vehicle' => $vehicle->registration_number,
                    'model' => $vehicle->model,
                    'total_rides' => $vehicle->rides->count(),
                    'total_revenue' => $vehicle->rides->sum('fare_amount'),
                    'total_distance' => $vehicle->rides->sum('distance'),
                ];
            })
            ->sortByDesc('total_revenue')
            ->values()
            ->take(10);

        $batteryHealth = Telemetry::select('asset_id', DB::raw('avg(battery_level) as avg_level'), DB::raw('avg(temperature) as avg_temp'), DB::raw('min(battery_level) as min_level'))
            ->where('recorded_at', '>=', now()->subDays($period))
            ->groupBy('asset_id')
            ->get()
            ->mapWithKeys(function ($item) {
                return [
                    $item->asset_id => [
                        'average_level' => round($item->avg_level, 2),
                        'average_temp' => round($item->avg_temp, 2),
                        'min_level' => $item->min_level,
                    ]
                ];
            });

        $maintenanceAlerts = $this->getMaintenanceAlerts();

        return response()->json([
            'success' => true,
            'analytics' => [
                'utilization' => $fleetUtilization,
                'top_performers' => $vehiclePerformance,
                'battery_health' => $batteryHealth,
                'maintenance_alerts' => $maintenanceAlerts,
            ],
        ]);
    }

    /**
     * Get system health metrics
     */
    public function systemHealth(Request $request)
    {
        $health = [
            'database' => $this->checkDatabaseHealth(),
            'api' => $this->checkApiHealth(),
            'storage' => $this->checkStorageHealth(),
            'queue' => $this->checkQueueHealth(),
            'cache' => $this->checkCacheHealth(),
        ];

        $overall = collect($health)->every(fn($item) => $item['status'] === 'healthy');

        return response()->json([
            'success' => true,
            'overall_status' => $overall ? 'healthy' : 'degraded',
            'components' => $health,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get KYC management data
     */
    public function kycManagement(Request $request)
    {
        $status = $request->query('status');

        // Using User model with kyc_status field
        $query = User::select('id', 'name', 'email', 'role', 'kyc_status', 'kyc_verified_at', 'created_at', 'updated_at');

        if ($status) {
            $query->where('kyc_status', $status);
        }

        $submissions = $query->orderBy('created_at', 'desc')->paginate(20);

        $stats = [
            'total' => User::whereNotNull('kyc_status')->count(),
            'pending' => User::where('kyc_status', 'pending')->count(),
            'verified' => User::where('kyc_status', 'verified')->count(),
            'approved' => User::where('kyc_status', 'approved')->count(),
            'rejected' => User::where('kyc_status', 'rejected')->count(),
            'avg_processing_time' => 4.5, // Placeholder - calculate from kyc_verified_at if available
        ];

        return response()->json([
            'success' => true,
            'submissions' => $submissions->items(),
            'pagination' => [
                'current_page' => $submissions->currentPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
                'last_page' => $submissions->lastPage(),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Get transaction monitoring data
     */
    public function transactionMonitoring(Request $request)
    {
        $period = $request->query('period', '30');

        $transactions = WalletTransaction::with('user:id,name,email')
            ->where('created_at', '>=', now()->subDays($period))
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        $stats = [
            'total_volume' => WalletTransaction::where('created_at', '>=', now()->subDays($period))->sum('amount'),
            'total_count' => WalletTransaction::where('created_at', '>=', now()->subDays($period))->count(),
            'credits' => WalletTransaction::where('created_at', '>=', now()->subDays($period))->where('type', 'credit')->sum('amount'),
            'debits' => WalletTransaction::where('created_at', '>=', now()->subDays($period))->where('type', 'debit')->sum('amount'),
            'by_type' => WalletTransaction::where('created_at', '>=', now()->subDays($period))
                ->select('type', DB::raw('sum(amount) as total'))
                ->groupBy('type')
                ->get()
                ->pluck('total', 'type'),
        ];

        $largeTransactions = WalletTransaction::where('amount', '>', 10000)
            ->where('created_at', '>=', now()->subDays($period))
            ->with('user:id,name,email')
            ->orderBy('amount', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'transactions' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'last_page' => $transactions->lastPage(),
            ],
            'stats' => $stats,
            'large_transactions' => $largeTransactions,
        ]);
    }

    /**
     * Get audit logs
     */
    public function auditLogs(Request $request)
    {
        $action = $request->query('action');
        $userId = $request->query('user_id');

        $query = AuditLog::with('user:id,name,email');

        if ($action) {
            $query->where('action', $action);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        $stats = [
            'total' => AuditLog::count(),
            'today' => AuditLog::whereDate('created_at', today())->count(),
            'by_action' => AuditLog::select('action', DB::raw('count(*) as count'))
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->pluck('count', 'action'),
        ];

        return response()->json([
            'success' => true,
            'logs' => $logs,
            'stats' => $stats,
        ]);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Helper: Calculate growth rate
     */
    private function calculateGrowthRate($model, $period)
    {
        $current = $model::where('created_at', '>=', now()->subDays($period))->count();
        $previous = $model::where('created_at', '>=', now()->subDays($period * 2))
            ->where('created_at', '<', now()->subDays($period))
            ->count();

        if ($previous == 0) return $current > 0 ? 100 : 0;

        return round((($current - $previous) / $previous) * 100, 2);
    }

    /**
     * Helper: Calculate utilization rate
     */
    private function calculateUtilizationRate($period)
    {
        $totalVehicles = Vehicle::count();
        if ($totalVehicles == 0) return 0;

        $activeVehicles = Ride::where('created_at', '>=', now()->subDays($period))
            ->distinct('vehicle_id')
            ->count('vehicle_id');

        return round(($activeVehicles / $totalVehicles) * 100, 2);
    }

    /**
     * Helper: Get database size
     */
    private function getDatabaseSize()
    {
        try {
            $dbType = config('database.default');

            if ($dbType === 'mysql') {
                $result = DB::select("SELECT SUM(data_length + index_length) as size FROM information_schema.TABLES WHERE table_schema = DATABASE()");
                return round($result[0]->size / 1024 / 1024, 2); // MB
            } elseif ($dbType === 'sqlite') {
                $path = database_path('database.sqlite');
                if (file_exists($path)) {
                    return round(filesize($path) / 1024 / 1024, 2); // MB
                }
            }

            return 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Helper: Get active sessions
     */
    private function getActiveSessions()
    {
        return WalletTransaction::where('created_at', '>=', now()->subHour())
            ->distinct('user_id')
            ->count('user_id');
    }

    /**
     * Helper: Get active users now
     */
    private function getActiveUsersNow()
    {
        return WalletTransaction::where('created_at', '>=', now()->subMinutes(15))
            ->distinct('user_id')
            ->count('user_id');
    }

    /**
     * Helper: Get active vehicles now
     */
    private function getActiveVehiclesNow()
    {
        return Telemetry::where('recorded_at', '>=', now()->subMinutes(15))
            ->where('speed', '>', 0)
            ->distinct('asset_id')
            ->count('asset_id');
    }

    /**
     * Helper: Get current rides
     */
    private function getCurrentRides()
    {
        return Ride::where('status', 'in_progress')->count();
    }

    /**
     * Helper: Get revenue today live
     */
    private function getRevenueTodayLive()
    {
        return Revenue::whereDate('created_at', today())->sum('amount');
    }

    /**
     * Helper: Get active alerts
     */
    private function getActiveAlerts()
    {
        $alerts = [];

        // Low battery vehicles
        $lowBattery = Telemetry::where('recorded_at', '>=', now()->subMinutes(30))
            ->where('battery_level', '<', 20)
            ->count();
        if ($lowBattery > 0) {
            $alerts[] = ['type' => 'low_battery', 'count' => $lowBattery, 'severity' => 'warning'];
        }

        // Pending KYC
        $pendingKyc = User::where('kyc_status', 'pending')->count();
        if ($pendingKyc > 0) {
            $alerts[] = ['type' => 'pending_kyc', 'count' => $pendingKyc, 'severity' => 'info'];
        }

        // Failed payments
        $failedPayouts = Payout::where('status', 'failed')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();
        if ($failedPayouts > 0) {
            $alerts[] = ['type' => 'failed_payouts', 'count' => $failedPayouts, 'severity' => 'error'];
        }

        // Offline vehicles
        $offlineVehicles = Vehicle::whereNotIn('id', function ($query) {
            $query->select('asset_id')
                ->from('telemetries')
                ->where('recorded_at', '>=', now()->subMinutes(30));
        })->count();
        if ($offlineVehicles > 0) {
            $alerts[] = ['type' => 'offline_vehicles', 'count' => $offlineVehicles, 'severity' => 'warning'];
        }

        return $alerts;
    }

    /**
     * Helper: Calculate retention rate
     */
    private function calculateRetentionRate($period)
    {
        $usersStart = User::where('created_at', '<', now()->subDays($period))->count();
        if ($usersStart == 0) return 100;

        $usersActive = WalletTransaction::where('created_at', '>=', now()->subDays($period))
            ->whereIn('user_id', function ($query) use ($period) {
                $query->select('id')
                    ->from('users')
                    ->where('created_at', '<', now()->subDays($period));
            })
            ->distinct('user_id')
            ->count('user_id');

        return round(($usersActive / $usersStart) * 100, 2);
    }

    /**
     * Helper: Calculate profit margin
     */
    private function calculateProfitMargin($period)
    {
        $revenue = Revenue::where('created_at', '>=', now()->subDays($period))->sum('amount');
        $payouts = Payout::where('created_at', '>=', now()->subDays($period))
            ->where('status', 'completed')
            ->sum('amount');

        if ($revenue == 0) return 0;

        return round((($revenue - $payouts) / $revenue) * 100, 2);
    }

    /**
     * Helper: Get fleet utilization by day
     */
    private function getFleetUtilizationByDay($period)
    {
        return Ride::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(DISTINCT vehicle_id) as active_vehicles')
            )
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();
    }

    /**
     * Helper: Get maintenance alerts
     */
    private function getMaintenanceAlerts()
    {
        return Vehicle::where(function ($query) {
                $query->where('odometer', '>', 10000)
                      ->orWhere('last_maintenance_date', '<', now()->subMonths(3));
            })
            ->get(['id', 'registration_number', 'odometer', 'last_maintenance_date'])
            ->map(function ($vehicle) {
                return [
                    'vehicle' => $vehicle->registration_number,
                    'reason' => $vehicle->odometer > 10000 ? 'High mileage' : 'Maintenance overdue',
                    'priority' => 'medium',
                ];
            });
    }

    /**
     * Helper: Check database health
     */
    private function checkDatabaseHealth()
    {
        try {
            DB::select('SELECT 1');
            return ['status' => 'healthy', 'response_time' => 5]; // ms
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'error' => $e->getMessage()];
        }
    }

    /**
     * Helper: Check API health
     */
    private function checkApiHealth()
    {
        return ['status' => 'healthy', 'uptime' => 99.9]; // Mock
    }

    /**
     * Helper: Check storage health
     */
    private function checkStorageHealth()
    {
        try {
            $storagePath = storage_path();
            $free = disk_free_space($storagePath);
            $total = disk_total_space($storagePath);
            $used = (($total - $free) / $total) * 100;

            return [
                'status' => $used < 90 ? 'healthy' : 'warning',
                'used_percent' => round($used, 2),
            ];
        } catch (\Exception $e) {
            return ['status' => 'unknown', 'error' => $e->getMessage()];
        }
    }

    /**
     * Helper: Check queue health
     */
    private function checkQueueHealth()
    {
        $failed = DB::table('failed_jobs')->count();

        return [
            'status' => $failed < 10 ? 'healthy' : 'warning',
            'failed_jobs' => $failed,
        ];
    }

    /**
     * Helper: Check cache health
     */
    private function checkCacheHealth()
    {
        try {
            cache()->put('health_check', true, 60);
            $result = cache()->get('health_check');
            return ['status' => $result ? 'healthy' : 'degraded'];
        } catch (\Exception $e) {
            return ['status' => 'unhealthy', 'error' => $e->getMessage()];
        }
    }

    /**
     * Approve KYC for a user
     */
    public function approveKyc(Request $request, $userId)
    {
        try {
            $user = User::findOrFail($userId);

            // Update KYC status to verified
            $user->kyc_status = 'verified';
            $user->kyc_verified_at = now();
            $user->save();

            // Log the action
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'kyc_approved',
                'description' => "Approved KYC for user: {$user->name} (ID: {$user->id})",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Send KYC approval email
            try {
                $emailService = new EmailNotificationService();
                $emailService->sendKYCVerificationEmail($user, 'approved');
            } catch (\Exception $e) {
                \Log::warning('Failed to send KYC approval email: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'KYC approved successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'kyc_status' => $user->kyc_status,
                    'kyc_verified_at' => $user->kyc_verified_at,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve KYC: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject KYC for a user
     */
    public function rejectKyc(Request $request, $userId)
    {
        try {
            $request->validate([
                'reason' => 'nullable|string|max:500',
            ]);

            $user = User::findOrFail($userId);

            // Update KYC status to rejected
            $user->kyc_status = 'rejected';
            $user->kyc_rejected_reason = $request->input('reason', 'Documents verification failed');
            $user->save();

            // Log the action
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'kyc_rejected',
                'description' => "Rejected KYC for user: {$user->name} (ID: {$user->id}). Reason: {$user->kyc_rejected_reason}",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Send KYC rejection email
            try {
                $emailService = new EmailNotificationService();
                $emailService->sendKYCVerificationEmail($user, 'rejected', $user->kyc_rejected_reason);
            } catch (\Exception $e) {
                \Log::warning('Failed to send KYC rejection email: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'KYC rejected successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'kyc_status' => $user->kyc_status,
                    'kyc_rejected_reason' => $user->kyc_rejected_reason,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject KYC: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all transactions with filtering
     */
    public function getTransactions(Request $request)
    {
        try {
            $type = $request->query('type', 'all');
            $perPage = $request->query('per_page', 50);

            $query = WalletTransaction::with('user', 'wallet')
                ->orderBy('created_at', 'desc');

            // Filter by transaction type
            if ($type !== 'all') {
                $query->where('type', $type);
            }

            $transactions = $query->paginate($perPage);

            // Calculate statistics
            $stats = [
                'total_volume_24h' => WalletTransaction::where('created_at', '>=', now()->subDay())
                    ->sum('amount'),
                'total_count_24h' => WalletTransaction::where('created_at', '>=', now()->subDay())
                    ->count(),
                'pending_count' => WalletTransaction::where('status', 'pending')->count(),
                'success_rate' => $this->calculateSuccessRate(),
            ];

            return response()->json([
                'success' => true,
                'transactions' => $transactions->items(),
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                    'last_page' => $transactions->lastPage(),
                ],
                'statistics' => $stats,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transactions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate transaction success rate
     */
    private function calculateSuccessRate()
    {
        $total = WalletTransaction::count();
        if ($total === 0) return 0;

        $successful = WalletTransaction::where('status', 'completed')->count();
        return round(($successful / $total) * 100, 2);
    }

    /**
     * Get system health status
     */
    public function getSystemHealth(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'system_health' => [
                    'server' => $this->getServerMetrics(),
                    'database' => $this->getDatabaseHealth(),
                    'services' => $this->getServicesStatus(),
                    'system_info' => $this->getSystemInfo(),
                    'logs' => $this->getRecentLogs(5),
                ],
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch system health: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get server metrics
     */
    private function getServerMetrics()
    {
        // CPU, Memory, Disk usage (simplified for demo)
        return [
            'cpu_usage' => rand(30, 60),
            'memory_usage' => rand(60, 80),
            'disk_usage' => rand(30, 50),
            'api_response_time' => rand(80, 150) . 'ms',
        ];
    }

    /**
     * Get services status
     */
    private function getServicesStatus()
    {
        return [
            'laravel_backend' => [
                'status' => 'online',
                'url' => config('app.url', 'http://127.0.0.1:8000'),
            ],
            'database' => [
                'status' => 'connected',
                'type' => config('database.default'),
            ],
            'trovotech_api' => [
                'status' => env('TROVOTECH_API_KEY') ? 'configured' : 'not_configured',
                'configured' => !empty(env('TROVOTECH_API_KEY')),
            ],
            'kyc_provider' => [
                'status' => env('KYC_API_KEY') ? 'configured' : 'not_configured',
                'configured' => !empty(env('KYC_API_KEY')),
            ],
            'oem_telemetry' => [
                'status' => env('OEM_API_KEY') ? 'configured' : 'not_configured',
                'configured' => !empty(env('OEM_API_KEY')),
            ],
        ];
    }

    /**
     * Get system information
     */
    private function getSystemInfo()
    {
        return [
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
            'database_type' => config('database.default'),
            'environment' => config('app.env'),
            'uptime' => $this->getUptime(),
        ];
    }

    /**
     * Get application uptime
     */
    private function getUptime()
    {
        // Simplified uptime calculation
        $startTime = cache()->get('app_start_time', now());
        $diff = now()->diffInMinutes($startTime);

        $hours = floor($diff / 60);
        $minutes = $diff % 60;

        return "{$hours}h {$minutes}m";
    }

    /**
     * Get recent system logs
     */
    private function getRecentLogs($limit = 5)
    {
        return AuditLog::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'level' => $this->getLogLevel($log->action),
                    'message' => $log->description,
                    'timestamp' => $log->created_at->toISOString(),
                ];
            });
    }

    /**
     * Get log level based on action
     */
    private function getLogLevel($action)
    {
        $warningActions = ['kyc_rejected', 'user_suspended', 'transaction_failed'];
        $errorActions = ['system_error', 'api_error'];

        if (in_array($action, $errorActions)) return 'ERROR';
        if (in_array($action, $warningActions)) return 'WARN';
        return 'INFO';
    }

    /**
     * Update API configuration
     */
    public function updateApiConfig(Request $request)
    {
        try {
            $request->validate([
                'trovotech_api_key' => 'nullable|string',
                'trovotech_api_url' => 'nullable|url',
                'kyc_api_key' => 'nullable|string',
                'kyc_api_url' => 'nullable|url',
                'oem_api_key' => 'nullable|string',
                'oem_api_url' => 'nullable|url',
            ]);

            // Update .env file (simplified approach)
            $envFile = base_path('.env');
            $envContent = file_get_contents($envFile);

            $updates = [
                'TROVOTECH_API_KEY' => $request->input('trovotech_api_key'),
                'TROVOTECH_API_URL' => $request->input('trovotech_api_url'),
                'KYC_API_KEY' => $request->input('kyc_api_key'),
                'KYC_API_URL' => $request->input('kyc_api_url'),
                'OEM_API_KEY' => $request->input('oem_api_key'),
                'OEM_API_URL' => $request->input('oem_api_url'),
            ];

            foreach ($updates as $key => $value) {
                if ($value !== null) {
                    if (preg_match("/^{$key}=/m", $envContent)) {
                        $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $envContent);
                    } else {
                        $envContent .= "\n{$key}={$value}";
                    }
                }
            }

            file_put_contents($envFile, $envContent);

            // Log the action
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'api_config_updated',
                'description' => 'Updated API configuration settings',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'API configuration updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update API configuration: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // PAYMENT ADMINISTRATION METHODS
    // ============================================

    /**
     * Get payment management overview
     */
    public function paymentOverview(Request $request)
    {
        $period = $request->query('period', 30);

        // Payment statistics
        $stats = [
            'total_funded' => PaymentRecord::where('type', 'funding')
                ->where('status', 'completed')
                ->sum('amount'),
            'total_withdrawn' => PaymentRecord::where('type', 'withdrawal')
                ->where('status', 'completed')
                ->sum('amount'),
            'total_fees_collected' => PaymentRecord::where('status', 'completed')
                ->sum('fee'),
            'period_funded' => PaymentRecord::where('type', 'funding')
                ->where('status', 'completed')
                ->where('created_at', '>=', now()->subDays($period))
                ->sum('amount'),
            'period_withdrawn' => PaymentRecord::where('type', 'withdrawal')
                ->where('status', 'completed')
                ->where('created_at', '>=', now()->subDays($period))
                ->sum('amount'),
            'period_fees' => PaymentRecord::where('status', 'completed')
                ->where('created_at', '>=', now()->subDays($period))
                ->sum('fee'),
        ];

        // Payment counts by status
        $byStatus = PaymentRecord::select('status', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($item) => [$item->status => ['count' => $item->count, 'total' => $item->total]]);

        // Payment counts by gateway
        $byGateway = PaymentRecord::select('gateway', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('gateway')
            ->get()
            ->mapWithKeys(fn($item) => [$item->gateway => ['count' => $item->count, 'total' => $item->total]]);

        // Daily payment volume
        $dailyVolume = PaymentRecord::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('sum(CASE WHEN type = "funding" THEN amount ELSE 0 END) as funded'),
                DB::raw('sum(CASE WHEN type = "withdrawal" THEN amount ELSE 0 END) as withdrawn'),
                DB::raw('sum(fee) as fees')
            )
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays($period))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Recent large transactions (over N100,000)
        $largeTransactions = PaymentRecord::with('user:id,name,email')
            ->where('amount', '>=', 100000)
            ->where('created_at', '>=', now()->subDays($period))
            ->orderBy('amount', 'desc')
            ->limit(10)
            ->get();

        // Failed payments requiring attention
        $failedPayments = PaymentRecord::with('user:id,name,email')
            ->where('status', 'failed')
            ->where('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        // Pending withdrawals
        $pendingWithdrawals = PaymentRecord::with('user:id,name,email')
            ->where('type', 'withdrawal')
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'overview' => [
                'stats' => $stats,
                'by_status' => $byStatus,
                'by_gateway' => $byGateway,
                'daily_volume' => $dailyVolume,
                'large_transactions' => $largeTransactions,
                'failed_payments' => $failedPayments,
                'pending_withdrawals' => $pendingWithdrawals,
            ],
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get all payment records with filtering
     */
    public function getPaymentRecords(Request $request)
    {
        $query = PaymentRecord::with('user:id,name,email');

        // Filter by type
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by gateway
        if ($request->has('gateway') && $request->gateway) {
            $query->where('gateway', $request->gateway);
        }

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('from_date') && $request->from_date) {
            $query->where('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->where('created_at', '<=', $request->to_date);
        }

        // Filter by amount range
        if ($request->has('min_amount') && $request->min_amount) {
            $query->where('amount', '>=', $request->min_amount);
        }
        if ($request->has('max_amount') && $request->max_amount) {
            $query->where('amount', '<=', $request->max_amount);
        }

        // Search by reference
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('gateway_reference', 'like', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $records = $query->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 50));

        // Calculate filtered totals
        $totals = [
            'count' => $records->total(),
            'total_amount' => PaymentRecord::where(function($q) use ($request) {
                if ($request->has('type') && $request->type) {
                    $q->where('type', $request->type);
                }
                if ($request->has('status') && $request->status) {
                    $q->where('status', $request->status);
                }
            })->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'records' => $records->items(),
            'totals' => $totals,
            'pagination' => [
                'current_page' => $records->currentPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
                'last_page' => $records->lastPage(),
            ],
        ]);
    }

    /**
     * Get payment record details
     */
    public function getPaymentRecord($id)
    {
        $record = PaymentRecord::with(['user:id,name,email,role', 'paymentMethod'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'record' => $record,
        ]);
    }

    /**
     * Retry failed payment
     */
    public function retryPayment(Request $request, $id)
    {
        $record = PaymentRecord::findOrFail($id);

        if ($record->status !== 'failed') {
            return response()->json([
                'success' => false,
                'message' => 'Only failed payments can be retried',
            ], 400);
        }

        // Mark as pending for retry
        $record->status = 'pending';
        $record->metadata = array_merge($record->metadata ?? [], [
            'retry_requested_at' => now()->toISOString(),
            'retry_requested_by' => $request->user()->id,
        ]);
        $record->save();

        // Log the action
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'payment_retry',
            'description' => "Requested retry for payment {$record->reference} (N{$record->amount})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment marked for retry',
            'record' => $record,
        ]);
    }

    /**
     * Manually approve/process a withdrawal
     */
    public function approveWithdrawal(Request $request, $id)
    {
        $record = PaymentRecord::findOrFail($id);

        if ($record->type !== 'withdrawal') {
            return response()->json([
                'success' => false,
                'message' => 'This is not a withdrawal request',
            ], 400);
        }

        if ($record->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending withdrawals can be approved',
            ], 400);
        }

        $record->status = 'completed';
        $record->completed_at = now();
        $record->metadata = array_merge($record->metadata ?? [], [
            'approved_at' => now()->toISOString(),
            'approved_by' => $request->user()->id,
            'approval_note' => $request->input('note', 'Manually approved by admin'),
        ]);
        $record->save();

        // Log the action
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'withdrawal_approved',
            'description' => "Approved withdrawal {$record->reference} for user ID {$record->user_id} (N{$record->amount})",
            'ip_address' => $request->ip(),
        ]);

        // Send email notification
        try {
            $user = User::find($record->user_id);
            if ($user) {
                $emailService = new EmailNotificationService();
                $emailService->sendWithdrawalStatusNotification($user, 'approved', $record->amount / 100);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send withdrawal approval email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal approved successfully',
            'record' => $record,
        ]);
    }

    /**
     * Reject a withdrawal
     */
    public function rejectWithdrawal(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $record = PaymentRecord::findOrFail($id);

        if ($record->type !== 'withdrawal') {
            return response()->json([
                'success' => false,
                'message' => 'This is not a withdrawal request',
            ], 400);
        }

        if ($record->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending withdrawals can be rejected',
            ], 400);
        }

        // Refund the amount back to wallet
        $wallet = Wallet::where('user_id', $record->user_id)->first();
        if ($wallet) {
            $wallet->increment('balance', $record->amount);

            // Create refund transaction
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $record->user_id,
                'type' => 'credit',
                'amount' => $record->amount,
                'description' => "Withdrawal rejected: {$request->reason}",
                'reference' => 'REFUND-' . $record->reference,
                'status' => 'completed',
            ]);
        }

        $record->status = 'failed';
        $record->failed_at = now();
        $record->failure_reason = $request->reason;
        $record->metadata = array_merge($record->metadata ?? [], [
            'rejected_at' => now()->toISOString(),
            'rejected_by' => $request->user()->id,
            'rejection_reason' => $request->reason,
        ]);
        $record->save();

        // Log the action
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'withdrawal_rejected',
            'description' => "Rejected withdrawal {$record->reference} for user ID {$record->user_id}. Reason: {$request->reason}",
            'ip_address' => $request->ip(),
        ]);

        // Send email notification
        try {
            $user = User::find($record->user_id);
            if ($user) {
                $emailService = new EmailNotificationService();
                $emailService->sendWithdrawalStatusNotification($user, 'rejected', $record->amount / 100, $request->reason);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send withdrawal rejection email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal rejected and amount refunded to user wallet',
            'record' => $record,
        ]);
    }

    /**
     * Get all payment methods (bank accounts) across users
     */
    public function getAllPaymentMethods(Request $request)
    {
        $query = PaymentMethod::with('user:id,name,email,role');

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by verification status
        if ($request->has('verified')) {
            $query->where('is_verified', $request->boolean('verified'));
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('account_number', 'like', "%{$search}%")
                  ->orWhere('account_name', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $methods = $query->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 50));

        $stats = [
            'total' => PaymentMethod::count(),
            'verified' => PaymentMethod::where('is_verified', true)->count(),
            'unverified' => PaymentMethod::where('is_verified', false)->count(),
        ];

        return response()->json([
            'success' => true,
            'payment_methods' => $methods->items(),
            'stats' => $stats,
            'pagination' => [
                'current_page' => $methods->currentPage(),
                'per_page' => $methods->perPage(),
                'total' => $methods->total(),
                'last_page' => $methods->lastPage(),
            ],
        ]);
    }

    /**
     * Delete a payment method (admin override)
     */
    public function deletePaymentMethod(Request $request, $id)
    {
        $method = PaymentMethod::findOrFail($id);

        // Log before deletion
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'payment_method_deleted_admin',
            'description' => "Admin deleted payment method: {$method->bank_name} - {$method->account_number} for user ID {$method->user_id}",
            'ip_address' => $request->ip(),
        ]);

        $method->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment method deleted successfully',
        ]);
    }

    /**
     * Get payment gateway configuration status
     */
    public function getPaymentGatewayStatus()
    {
        $paystackConfigured = !empty(config('services.paystack.secret_key')) &&
                              config('services.paystack.secret_key') !== 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

        $flutterwaveConfigured = !empty(config('services.flutterwave.secret_key')) &&
                                  config('services.flutterwave.secret_key') !== 'FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X';

        return response()->json([
            'success' => true,
            'gateways' => [
                'paystack' => [
                    'configured' => $paystackConfigured,
                    'mode' => str_starts_with(config('services.paystack.secret_key', ''), 'sk_live_') ? 'live' : 'test',
                    'features' => ['card', 'bank_transfer', 'ussd', 'mobile_money'],
                ],
                'flutterwave' => [
                    'configured' => $flutterwaveConfigured,
                    'mode' => str_contains(config('services.flutterwave.secret_key', ''), 'FLWSECK-') ? 'live' : 'test',
                    'features' => ['card', 'bank_transfer', 'mobile_money', 'barter'],
                ],
            ],
            'webhook_urls' => [
                'paystack' => config('app.url') . '/api/webhooks/paystack',
                'flutterwave' => config('app.url') . '/api/webhooks/flutterwave',
            ],
        ]);
    }

    /**
     * Get user payment history
     */
    public function getUserPayments(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        $payments = PaymentRecord::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $stats = [
            'total_funded' => PaymentRecord::where('user_id', $userId)
                ->where('type', 'funding')
                ->where('status', 'completed')
                ->sum('amount'),
            'total_withdrawn' => PaymentRecord::where('user_id', $userId)
                ->where('type', 'withdrawal')
                ->where('status', 'completed')
                ->sum('amount'),
            'payment_methods_count' => PaymentMethod::where('user_id', $userId)->count(),
        ];

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'payments' => $payments->items(),
            'stats' => $stats,
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
                'last_page' => $payments->lastPage(),
            ],
        ]);
    }

    /**
     * Export payment records to CSV
     */
    public function exportPayments(Request $request)
    {
        $query = PaymentRecord::with('user:id,name,email');

        // Apply same filters as getPaymentRecords
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('from_date') && $request->from_date) {
            $query->where('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->where('created_at', '<=', $request->to_date);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        $csv = "Reference,Type,Gateway,Amount,Fee,Net Amount,Status,User,Email,Date\n";

        foreach ($records as $record) {
            $csv .= implode(',', [
                $record->reference,
                $record->type,
                $record->gateway,
                $record->amount,
                $record->fee,
                $record->net_amount,
                $record->status,
                '"' . ($record->user->name ?? 'N/A') . '"',
                $record->user->email ?? 'N/A',
                $record->created_at->format('Y-m-d H:i:s'),
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="payments_export_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Get all users with filtering
     */
    public function getUsers(Request $request)
    {
        $query = User::with('wallet:id,user_id,balance,currency');

        // Filter by role
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        // Filter by KYC status
        if ($request->has('kyc_status') && $request->kyc_status) {
            $query->where('kyc_status', $request->kyc_status);
        }

        // Search by name or email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->select('id', 'name', 'email', 'role', 'kyc_status', 'kyc_verified_at', 'created_at', 'updated_at')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'users' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }
}
