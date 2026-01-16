<?php

use App\Http\Controllers\PayoutController;
use App\Http\Controllers\MaintenanceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Operator Routes - Payout Distribution
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:operator'])->prefix('operator')->group(function () {
    // Payout Distribution
    Route::get('/assets-for-payout', [PayoutController::class, 'getAssetsForPayout']);
    Route::post('/distribute-payout', [PayoutController::class, 'distributePayout']);
    Route::get('/payout-history', [PayoutController::class, 'getPayoutHistory']);
    
    // Maintenance Approval
    Route::get('/maintenance-requests', [MaintenanceController::class, 'getOperatorMaintenanceRequests']);
    Route::post('/maintenance-requests/{id}/approve', [MaintenanceController::class, 'approveMaintenanceRequest']);
    Route::post('/maintenance-requests/{id}/reject', [MaintenanceController::class, 'rejectMaintenanceRequest']);
    Route::post('/maintenance-requests/{id}/complete', [MaintenanceController::class, 'completeMaintenanceRequest']);
    Route::get('/maintenance-stats', [MaintenanceController::class, 'getMaintenanceStats']);
    Route::get('/maintenance-report', [MaintenanceController::class, 'getMaintenanceReport']);
});

/*
|--------------------------------------------------------------------------
| Investor Routes - Payout History
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:investor'])->prefix('investor')->group(function () {
    Route::get('/payouts', [PayoutController::class, 'getInvestorPayouts']);
});
