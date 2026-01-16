<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use App\Http\Controllers\AuthController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\InvestmentController;
use App\Http\Controllers\RevenueController;
use App\Http\Controllers\SwapStationController;
use App\Http\Controllers\FleetOperationController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\TokenController;
use App\Http\Controllers\PayoutController;
use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\RiderController;
use App\Http\Controllers\OperationScheduleController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\TrovotechController;
use App\Http\Controllers\TrovotechUserController;
use App\Http\Controllers\KycController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CapabilitiesController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\KycWebhookController;
use App\Http\Controllers\TrovotechWebhookController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\DriverController;

// Public routes
Route::get('/ping', [HealthController::class, 'ping']);
Route::get('/health', [HealthController::class, 'health']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Public vehicle listing (for display purposes)
Route::get('/vehicles', [VehicleController::class, 'index']);

// Telemetry ingestion (Qoura/OEM integration - webhook endpoint)
Route::post('/telemetry', [TelemetryController::class, 'store']);

// Public KYC webhooks (provider callbacks) - secured by signature
Route::post('/kyc/webhook/identitypass', [KycWebhookController::class, 'handleIdentityPass']);

// TrovoTech blockchain webhooks - secured by signature
Route::post('/webhooks/trovotech', [TrovotechWebhookController::class, 'handle']);

// Payment gateway webhooks
Route::post('/webhooks/paystack', [PaymentController::class, 'paystackWebhook']);
Route::post('/webhooks/flutterwave', [PaymentController::class, 'flutterwaveWebhook']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Capabilities - what the current role can do
    Route::get('/capabilities', [CapabilitiesController::class, 'index']);
    Route::get('/my-capabilities', [\App\Http\Controllers\RoleCapabilityController::class, 'getUserCapabilities']);
    Route::get('/check-capability/{capability}', [\App\Http\Controllers\RoleCapabilityController::class, 'checkCapability']);

    // Live telemetry endpoint for real-time dashboard
    Route::get('/telemetry/live', [TelemetryController::class, 'getLiveTelemetry'])->middleware('role:operator,admin');
    Route::get('/telemetry/alerts', [TelemetryController::class, 'getAlerts'])->middleware('role:operator,admin');
    Route::get('/telemetry/{assetId}/statistics', [TelemetryController::class, 'getStatistics'])->middleware('role:operator,admin');

    // Portfolio endpoints for investors
    Route::prefix('portfolio')->middleware('role:investor,operator')->group(function () {
        Route::get('/', [PortfolioController::class, 'index']);
        Route::get('/performance', [PortfolioController::class, 'performance']);
        Route::get('/revenue-breakdown', [PortfolioController::class, 'revenueBreakdown']);
        Route::get('/export', [PortfolioController::class, 'exportCsv']);
        Route::get('/{id}', [PortfolioController::class, 'show']);
    });

    // Investment endpoints - Full investor journey
    Route::prefix('invest')->middleware('role:investor,operator')->group(function () {
        // Portfolio management
        Route::get('/portfolio', [InvestmentController::class, 'portfolio']);
        Route::get('/portfolio/performance', [InvestmentController::class, 'performance']);
        Route::get('/history', [InvestmentController::class, 'history']);

        // Available assets for investment
        Route::get('/assets', [InvestmentController::class, 'availableAssets']);
        Route::get('/assets/{id}', [InvestmentController::class, 'assetDetails']);

        // Investment actions
        Route::post('/purchase', [InvestmentController::class, 'invest']);
        Route::post('/simulate-payout', [InvestmentController::class, 'simulatePayout']);
    });

    // Legacy investment endpoints (backward compatibility)
    Route::get('/investments', [PortfolioController::class, 'index'])->middleware('role:investor,operator');
    Route::get('/investments/{id}', [PortfolioController::class, 'show'])->middleware('role:investor,operator');

    // Payment endpoints
    Route::prefix('payments')->group(function () {
        Route::post('/initialize', [PaymentController::class, 'initializePayment']);
        Route::post('/verify', [PaymentController::class, 'verifyPayment']);
    });

    // Operations & revenue endpoints (simulation layer) - read-only for most roles
    Route::get('/rides', [OperationsController::class, 'rides'])->middleware('role:operator,admin');
    Route::get('/revenue/summary', [OperationsController::class, 'revenueSummary'])->middleware('role:investor,operator,admin');

    // Operator-only routes
    Route::middleware('role:operator')->group(function () {
        Route::apiResource('vehicles', VehicleController::class)->except(['index']);
        Route::apiResource('revenues', RevenueController::class);
        Route::apiResource('swap-stations', SwapStationController::class);
        Route::apiResource('fleet-operations', FleetOperationController::class);
        Route::apiResource('assets', AssetController::class);
        Route::post('/riders/assign', [RiderController::class, 'assign']);
        Route::post('/operations/schedule/swap', [OperationScheduleController::class, 'scheduleSwap']);
        Route::post('/operations/schedule/charge', [OperationScheduleController::class, 'scheduleCharge']);
        Route::patch('/operations/schedules/{id}/status', [OperationScheduleController::class, 'updateStatus']);
        Route::post('/riders/unassign', [RiderController::class, 'unassign']);
        Route::get('/assets/export.csv', [ExportController::class, 'assetsCsv']);
        // TrovoTech operator actions
        Route::post('/trovotech/payout/initiate', [TrovotechController::class, 'initiatePayout']);
        Route::post('/trovotech/telemetry/sync', [TrovotechController::class, 'syncTelemetry']);
    });

    // Shared read-only routes for authenticated users (investors, drivers also)
    Route::get('/riders', [RiderController::class, 'index'])->middleware('role:operator'); // keep restricted
    Route::get('/operations/schedules', [OperationScheduleController::class, 'index'])->middleware('role:operator');

    // Assets - investors can view to decide what to invest in
    Route::get('/assets', [AssetController::class, 'index'])->middleware('role:investor,operator,admin');

    // Token & wallet: investor and operator can view their tokens/wallet
    Route::post('/wallet/create', [WalletController::class, 'create'])->middleware('role:investor,operator,driver');
    Route::get('/wallet/me', [WalletController::class, 'myWallet'])->middleware('role:investor,operator,driver');
    Route::get('/wallet/me/stats', [WalletController::class, 'getStats'])->middleware('role:investor,operator,driver');
    Route::get('/wallet/{userId}', [WalletController::class, 'show'])->middleware('role:investor,operator,driver');
    Route::get('/wallet/{userId}/balance', [WalletController::class, 'getBalance'])->middleware('role:investor,operator,driver');
    Route::get('/wallet/{userId}/transactions', [WalletController::class, 'getTransactions'])->middleware('role:investor,operator,driver');
    Route::get('/wallet/{userId}/stats', [WalletController::class, 'getStats'])->middleware('role:investor,operator,driver');
    Route::post('/wallet/transfer', [WalletController::class, 'transfer'])->middleware('role:investor,operator');
    Route::post('/wallet/deposit', [WalletController::class, 'deposit'])->middleware('role:investor,operator,driver');
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw'])->middleware('role:investor,operator,driver');

    // =========================================================================
    // DRIVER ROUTES - Trip & Earnings Tracking
    // =========================================================================
    Route::prefix('driver')->middleware('role:driver,operator')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DriverController::class, 'dashboard']);

        // Trip Management
        Route::get('/trips', [DriverController::class, 'getTrips']);
        Route::get('/trips/active', [DriverController::class, 'getActiveTrip']);
        Route::post('/trips/start', [DriverController::class, 'startTrip']);
        Route::patch('/trips/{tripId}/end', [DriverController::class, 'endTrip']);
        Route::patch('/trips/{tripId}/cancel', [DriverController::class, 'cancelTrip']);
        Route::get('/trips/{tripId}', [DriverController::class, 'getTripDetails']);

        // Earnings Management
        Route::get('/earnings', [DriverController::class, 'getEarningsSummary']);
        Route::get('/earnings/history', [DriverController::class, 'getEarningsHistory']);
        Route::get('/earnings/daily', [DriverController::class, 'getDailyEarnings']);
        Route::get('/earnings/monthly/{year}/{month}', [DriverController::class, 'getMonthlyReport']);
        Route::get('/earnings/legacy', [DriverController::class, 'myEarningsLegacy']);

        // Payouts
        Route::post('/payouts/request', [DriverController::class, 'requestPayout']);

        // Shift Management
        Route::post('/shift/start', [DriverController::class, 'clockIn']);
        Route::post('/shift/end', [DriverController::class, 'clockOut']);

        // Legacy endpoints (backward compatibility)
        Route::get('/assignments', [DriverController::class, 'myAssignments']);
        Route::post('/log-swap', [DriverController::class, 'logSwap']);
        Route::get('/swaps', [DriverController::class, 'mySwaps']);
        Route::post('/report-maintenance', [DriverController::class, 'reportMaintenance']);
        Route::get('/maintenance-reports', [DriverController::class, 'myMaintenanceReports']);
    });

    // Token management (investor minting moved to trovotech routes with operator restriction above for on-chain); local token show/transfer allowed to all authenticated roles for now
    Route::get('/token/{id}', [TokenController::class, 'show'])->middleware('role:investor,operator');
    Route::post('/token/{id}/transfer', [TokenController::class, 'transfer'])->middleware('role:investor,operator');
    Route::get('/user/{userId}/tokens', [TokenController::class, 'getUserTokens'])->middleware('role:investor,operator,driver');
    Route::get('/tokens/portfolio', [TokenController::class, 'portfolio'])->middleware('role:investor,operator');

    // Payout viewing for investors/operators; initiation restricted earlier
    Route::get('/payout/{id}', [PayoutController::class, 'show'])->middleware('role:investor,operator');
    Route::get('/user/{userId}/payouts', [PayoutController::class, 'getUserPayouts'])->middleware('role:investor,operator');

    // Telemetry viewing allowed to operator (could extend to driver for assigned assets later)
    Route::get('/telemetry/{assetId}', [TelemetryController::class, 'getAssetTelemetry'])->middleware('role:operator');
    Route::get('/telemetry/{assetId}/latest', [TelemetryController::class, 'getLatest'])->middleware('role:operator');

    // KYC routes
    Route::get('/kyc/status', [KycController::class, 'status']); // All authenticated users can check their status
    Route::post('/kyc/submit', [KycController::class, 'submit'])->middleware('role:investor,operator'); // Investors and operators submit KYC
    Route::post('/kyc/review', [KycController::class, 'review'])->middleware('role:operator,admin'); // Operators and admins can review
    Route::get('/kyc/pending', [KycController::class, 'pending'])->middleware('role:operator,admin'); // Operators and admins see pending list
    Route::post('/kyc/poll', [KycController::class, 'poll']); // Refresh provider status
    Route::post('/kyc/admin/poll/{userId}', [KycController::class, 'adminPollUser'])->middleware('role:operator,admin'); // Admin/operator poll specific user

    // Admin-only routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Debug endpoint
        Route::get('/debug', function () {
            return response()->json([
                'success' => true,
                'message' => 'Admin routes are accessible',
                'user' => auth()->user(),
                'users_count' => \App\Models\User::count(),
                'transactions_count' => \App\Models\WalletTransaction::count(),
            ]);
        });

        // Admin dashboard analytics endpoints
        Route::get('/dashboard/overview', [AdminDashboardController::class, 'overview']);
        Route::get('/dashboard/realtime', [AdminDashboardController::class, 'realtime']);
        Route::get('/dashboard/user-analytics', [AdminDashboardController::class, 'userAnalytics']);
        Route::get('/dashboard/revenue-analytics', [AdminDashboardController::class, 'revenueAnalytics']);
        Route::get('/dashboard/fleet-analytics', [AdminDashboardController::class, 'fleetAnalytics']);
        Route::get('/dashboard/system-health', [AdminDashboardController::class, 'systemHealth']);
        Route::get('/dashboard/kyc-management', [AdminDashboardController::class, 'kycManagement']);
        Route::get('/dashboard/transaction-monitoring', [AdminDashboardController::class, 'transactionMonitoring']);
        Route::get('/dashboard/audit-logs', [AdminDashboardController::class, 'auditLogs']);

        // New admin dashboard action endpoints
        Route::post('/kyc/approve/{userId}', [AdminDashboardController::class, 'approveKyc']);
        Route::post('/kyc/reject/{userId}', [AdminDashboardController::class, 'rejectKyc']);
        Route::get('/transactions', [AdminDashboardController::class, 'getTransactions']);
        Route::get('/system-health', [AdminDashboardController::class, 'getSystemHealth']);
        Route::post('/api-config', [AdminDashboardController::class, 'updateApiConfig']);
        Route::get('/users', [AdminDashboardController::class, 'getUsers']);

        // Existing admin routes
        Route::get('/overview', [AdminController::class, 'overview']);
        // Route::get('/users', [AdminController::class, 'users']); // REPLACED with AdminDashboardController@getUsers
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::patch('/users/{userId}/role', [AdminController::class, 'updateUserRole']);
        Route::patch('/users/{userId}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::get('/revenue-stats', [AdminController::class, 'revenueStats']);
        Route::get('/activity-logs', [AdminController::class, 'activityLogs']);
        Route::get('/config', [AdminController::class, 'configIndex']);
        Route::patch('/config', [AdminController::class, 'configUpdate']);
        Route::get('/trovotech/status', [AdminController::class, 'trovotechStatus']);
        Route::post('/trovotech/test-connection', [AdminController::class, 'trovotechTestConnection']);

        // Asset management CRUD for admin (duplicate of operator capabilities)
        Route::get('/assets', [AssetController::class, 'index']);
        Route::post('/assets', [AssetController::class, 'store']);
        Route::get('/assets/{id}', [AssetController::class, 'show']);
        Route::put('/assets/{id}', [AssetController::class, 'update']);
        Route::patch('/assets/{id}', [AssetController::class, 'update']);
        Route::delete('/assets/{id}', [AssetController::class, 'destroy']);

        // Role & Capability Management
        Route::get('/capabilities', [\App\Http\Controllers\RoleCapabilityController::class, 'index']);
        Route::post('/capabilities', [\App\Http\Controllers\RoleCapabilityController::class, 'store']);
        Route::put('/capabilities/{id}', [\App\Http\Controllers\RoleCapabilityController::class, 'update']);
        Route::delete('/capabilities/{id}', [\App\Http\Controllers\RoleCapabilityController::class, 'destroy']);
        Route::get('/role-stats', [\App\Http\Controllers\RoleCapabilityController::class, 'getRoleStats']);

        // User Management - Comprehensive CRUD operations
        Route::prefix('user-management')->group(function () {
            Route::get('/', [\App\Http\Controllers\UserManagementController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\UserManagementController::class, 'store']);
            Route::get('/{id}', [\App\Http\Controllers\UserManagementController::class, 'show']);
            Route::put('/{id}', [\App\Http\Controllers\UserManagementController::class, 'update']);
            Route::patch('/{id}', [\App\Http\Controllers\UserManagementController::class, 'update']);
            Route::delete('/{id}', [\App\Http\Controllers\UserManagementController::class, 'destroy']);
            Route::post('/{id}/toggle-status', [\App\Http\Controllers\UserManagementController::class, 'toggleStatus']);
            Route::post('/{id}/reset-password', [\App\Http\Controllers\UserManagementController::class, 'resetPassword']);
            Route::post('/bulk-action', [\App\Http\Controllers\UserManagementController::class, 'bulkAction']);
            Route::get('/export/csv', [\App\Http\Controllers\UserManagementController::class, 'exportCsv']);
        });
    });

    // TrovoTech public/auth investor/operator endpoints separated for clarity
    Route::prefix('trovotech')->group(function () {
        // Legacy wallet endpoints (backward compatibility)
        Route::get('/wallet', [TrovotechController::class, 'getWallet'])->middleware('role:investor,operator,driver');
        Route::post('/wallet/create', [TrovotechController::class, 'createWallet'])->middleware('role:investor,operator');
        Route::get('/tokens/my', [TrovotechController::class, 'getMyTokens'])->middleware('role:investor,operator,driver');
        Route::get('/asset/{assetId}/metadata', [TrovotechController::class, 'getAssetMetadata'])->middleware('role:investor,operator,driver');
        Route::post('/token/mint', [TrovotechController::class, 'mintToken'])->middleware('role:investor,operator');

        // New Trovotech API v1 endpoints (per official documentation)
        Route::prefix('users')->group(function () {
            // User onboarding - creates Trovo profile and wallet
            Route::post('/onboard', [TrovotechUserController::class, 'onboardUser'])->middleware('role:investor,operator,driver');

            // KYC management - admin/operator only
            Route::post('/kyc/update', [TrovotechUserController::class, 'updateKyc'])->middleware('role:admin,operator');

            // Get wallet info for authenticated user
            Route::get('/wallet', [TrovotechUserController::class, 'getWallet'])->middleware('role:investor,operator,driver');

            // Helper: Get keypair generation instructions
            Route::get('/keypair-instructions', [TrovotechUserController::class, 'getKeypairInstructions']);
        });

        // Mint restricted earlier for operator; investors may request via operator workflow (kept operator-only above)
    });

    // Analytics tracking routes (all authenticated users can track their own behavior)
    Route::prefix('analytics')->group(function () {
        Route::post('/session/start', [AnalyticsController::class, 'trackSession']);
        Route::post('/session/end', [AnalyticsController::class, 'endSession']);
        Route::post('/event', [AnalyticsController::class, 'trackEvent']);
        Route::post('/feedback', [AnalyticsController::class, 'submitFeedback']);
        Route::post('/sentiment', [AnalyticsController::class, 'trackSentiment']);

        // Admin-only analytics dashboard
        Route::get('/dashboard', [AnalyticsController::class, 'getDashboard'])->middleware('role:admin');
        Route::get('/user/{userId}/insights', [AnalyticsController::class, 'getUserInsights'])->middleware('role:admin');
    });

    // Notification routes (all authenticated users)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
        Route::delete('/delete-all-read', [NotificationController::class, 'deleteAllRead']);
    });
});

