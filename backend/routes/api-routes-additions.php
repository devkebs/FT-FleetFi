<?php

// ============================================================================
// FLEETFI - API ROUTES TO ADD
// Add these routes to: backend/routes/api.php
// ============================================================================

use App\Http\Controllers\DriverController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\WalletController;

// ============================================================================
// DRIVER ROUTES
// Add inside Route::middleware(['auth:sanctum'])->group(function () {
// ============================================================================

Route::middleware(['role:driver'])->prefix('driver')->group(function () {
    // Driver Dashboard
    Route::get('/assignments', [DriverController::class, 'myAssignments']);
    Route::get('/earnings', [DriverController::class, 'myEarnings']);
    
    // Battery Swaps
    Route::get('/swaps', [DriverController::class, 'mySwaps']);
    Route::post('/log-swap', [DriverController::class, 'logSwap']);
    
    // Maintenance
    Route::post('/report-maintenance', [DriverController::class, 'reportMaintenance']);
    Route::get('/maintenance-reports', [DriverController::class, 'myMaintenanceReports']);
});

// ============================================================================
// OPERATOR ROUTES (ADD TO EXISTING OPERATOR GROUP)
// Add inside Route::middleware(['role:operator'])->group(function () {
// ============================================================================

// Payout Distribution - Get tokens for an asset
Route::get('/assets/{assetId}/tokens', [AssetController::class, 'getAssetTokens']);

// Route::post('/trovotech/payout/initiate', [TrovotechController::class, 'initiatePayout']);

// ============================================================================
// WALLET & BLOCKCHAIN ROUTES (NEW)
// ============================================================================
Route::middleware(['auth:sanctum'])->prefix('wallet')->group(function () {
    Route::post('/create', [WalletController::class, 'create']);
    Route::get('/balance', [WalletController::class, 'show']);
});

// ============================================================================
// COMPLETE ROUTE STRUCTURE (FOR REFERENCE)
// ============================================================================

/*
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Driver Routes (NEW)
    Route::middleware(['role:driver'])->prefix('driver')->group(function () {
        Route::get('/assignments', [DriverController::class, 'myAssignments']);
        Route::get('/earnings', [DriverController::class, 'myEarnings']);
        Route::get('/swaps', [DriverController::class, 'mySwaps']);
        Route::post('/log-swap', [DriverController::class, 'logSwap']);
        Route::post('/report-maintenance', [DriverController::class, 'reportMaintenance']);
        Route::get('/maintenance-reports', [DriverController::class, 'myMaintenanceReports']);
    });
    
    // Operator Routes (ENHANCED)
    Route::middleware(['role:operator'])->group(function () {
        // ... existing operator routes ...
        
        // NEW: Payout Distribution
        Route::get('/assets/{assetId}/tokens', [AssetController::class, 'getAssetTokens']);
    });

    // ============================================================================
    // NOTIFICATION ROUTES (NEW)
    // ============================================================================
    Route::middleware(['auth:sanctum'])->prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    // ============================================================================
    // ADMIN ROUTES (NEW)
    // ============================================================================
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::put('/users/{userId}/status', [AdminController::class, 'updateUserStatus']);
        Route::post('/operators', [AdminController::class, 'createOperator']);
        
        // Analytics
        Route::get('/analytics/dashboard', [AnalyticsController::class, 'getDashboardData']);

        // Minting (New)
        Route::post('/assets/{assetId}/mint', [AssetController::class, 'mint']);
    });
    
    // Investor Routes (Already exist - no changes needed)
    // ... existing investor routes ...
});
*/
