<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\FleetController;

/*
|--------------------------------------------------------------------------
| Fleet Engine API Routes (Battery Swap Operations)
|--------------------------------------------------------------------------
|
| These routes handle the Google Fleet Engine integration for battery
| swap operations. All routes require authentication.
|
*/

Route::middleware('auth:sanctum')->group(function () {

    // Driver-specific routes (for drivers)
    Route::prefix('drivers')->middleware('role:driver')->group(function () {
        Route::get('/profile', [DriverController::class, 'getProfile']);
        Route::get('/metrics', [DriverController::class, 'getMetrics']);
        Route::get('/earnings', [DriverController::class, 'getEarnings']); // Backward compatibility
        Route::put('/profile', [DriverController::class, 'updateProfile']);
    });

    // Fleet Engine routes (for battery swap operations)
    Route::prefix('fleet')->group(function () {
        // Location tracking
        Route::post('/location', [FleetController::class, 'updateDriverLocation'])
            ->middleware('role:driver');

        // Driver status and shift management
        Route::put('/drivers/{driverId}/status', [FleetController::class, 'updateDriverStatus'])
            ->middleware('role:driver');
        Route::post('/drivers/{driverId}/shift/start', [FleetController::class, 'startShift'])
            ->middleware('role:driver');
        Route::post('/drivers/{driverId}/shift/end', [FleetController::class, 'endShift'])
            ->middleware('role:driver');

        // Active swap task
        Route::get('/drivers/{driverId}/active-task', [FleetController::class, 'getActiveSwapTask'])
            ->middleware('role:driver');

        // Swap task history
        Route::get('/drivers/{driverId}/swap-tasks', [FleetController::class, 'getSwapTaskHistory'])
            ->middleware('role:driver');

        // Swap task management
        Route::post('/swap-tasks/{taskId}/start', [FleetController::class, 'startSwapTask'])
            ->middleware('role:driver');
        Route::put('/swap-tasks/{taskId}/status', [FleetController::class, 'updateSwapTaskStatus'])
            ->middleware('role:driver');

        // Swap stations
        Route::get('/swap-stations/nearby', [FleetController::class, 'getNearbySwapStations'])
            ->middleware('role:driver');

        // Create new swap task
        Route::post('/swap-tasks', [FleetController::class, 'createSwapTask'])
            ->middleware('role:driver');

        // Current driver's active task and history (convenience routes using 'me')
        Route::get('/drivers/me/active-task', [FleetController::class, 'getMyActiveSwapTask'])
            ->middleware('role:driver');
        Route::get('/drivers/me/swap-tasks', [FleetController::class, 'getMySwapTaskHistory'])
            ->middleware('role:driver');
        Route::get('/drivers/me/swap-stats', [FleetController::class, 'getMySwapStats'])
            ->middleware('role:driver');
    });
});
