<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\SwapTask;
use App\Models\SwapStation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FleetController extends Controller
{
    /**
     * Update driver location
     */
    public function updateDriverLocation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'driver_id' => 'required|exists:drivers,id',
            'vehicle_id' => 'nullable|exists:assets,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'heading' => 'nullable|numeric|between:0,360',
            'speed' => 'nullable|numeric|min:0',
            'accuracy' => 'nullable|numeric|min:0',
            'timestamp' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $driver = Driver::find($request->driver_id);
        $driver->updateLocation($request->latitude, $request->longitude);

        return response()->json([
            'success' => true,
            'message' => 'Location updated successfully',
        ]);
    }

    /**
     * Update driver status
     */
    public function updateDriverStatus(Request $request, $driverId)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:offline,available,driving,at_station,on_swap',
            'timestamp' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $driver = Driver::findOrFail($driverId);
        $driver->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'driver' => $driver,
        ]);
    }

    /**
     * Get active swap task for driver
     */
    public function getActiveSwapTask($driverId)
    {
        $driver = Driver::findOrFail($driverId);
        $activeTask = $driver->activeSwapTask()->with('swapStation')->first();

        if (!$activeTask) {
            return response()->json([
                'success' => true,
                'task' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'task' => $activeTask,
        ]);
    }

    /**
     * Get swap task history for driver
     */
    public function getSwapTaskHistory(Request $request, $driverId)
    {
        $limit = $request->input('limit', 20);

        $driver = Driver::findOrFail($driverId);
        $tasks = $driver->swapTasks()
            ->with('swapStation')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'tasks' => $tasks,
        ]);
    }

    /**
     * Start a swap task
     */
    public function startSwapTask(Request $request, $taskId)
    {
        $validator = Validator::make($request->all(), [
            'driver_id' => 'required|exists:drivers,id',
            'vehicle_id' => 'nullable|exists:assets,id',
            'station_location' => 'required|array',
            'station_location.latitude' => 'required|numeric',
            'station_location.longitude' => 'required|numeric',
            'timestamp' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $task = SwapTask::findOrFail($taskId);
        $task->start();

        // Update driver status
        $driver = Driver::find($request->driver_id);
        $driver->update(['status' => 'driving']);

        return response()->json([
            'success' => true,
            'task' => $task->load('swapStation'),
        ]);
    }

    /**
     * Update swap task status
     */
    public function updateSwapTaskStatus(Request $request, $taskId)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:assigned,enroute_to_station,arrived_at_station,swapping,swap_complete,back_to_base,completed,canceled',
            'location' => 'nullable|array',
            'location.latitude' => 'nullable|numeric',
            'location.longitude' => 'nullable|numeric',
            'battery_level' => 'nullable|integer|between:0,100',
            'driver_id' => 'required|exists:drivers,id',
            'timestamp' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $task = SwapTask::findOrFail($taskId);
        $updateData = ['status' => $request->status];

        // Handle status-specific logic
        switch ($request->status) {
            case 'arrived_at_station':
                $driver = Driver::find($request->driver_id);
                $driver->update(['status' => 'at_station']);
                break;

            case 'swapping':
                $driver = Driver::find($request->driver_id);
                $driver->update(['status' => 'on_swap']);
                if ($request->has('battery_level')) {
                    $updateData['battery_level_before'] = $request->battery_level;
                }
                break;

            case 'swap_complete':
                if ($request->has('battery_level')) {
                    $updateData['battery_level_after'] = $request->battery_level;
                }
                break;

            case 'completed':
                $task->complete();
                $driver = Driver::find($request->driver_id);
                $driver->update(['status' => 'available']);
                break;

            case 'canceled':
                $task->cancel();
                break;
        }

        $task->update($updateData);

        return response()->json([
            'success' => true,
            'task' => $task->load('swapStation'),
        ]);
    }

    /**
     * Get nearby swap stations
     */
    public function getNearbySwapStations(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'nullable|numeric|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $radiusKm = $request->input('radius', 10);
        $stations = SwapStation::getNearby(
            $request->latitude,
            $request->longitude,
            $radiusKm
        );

        return response()->json([
            'success' => true,
            'stations' => $stations,
            'count' => $stations->count(),
        ]);
    }

    /**
     * Start driver shift (clock in)
     */
    public function startShift(Request $request, $driverId)
    {
        $validator = Validator::make($request->all(), [
            'timestamp' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $driver = Driver::findOrFail($driverId);
        $driver->clockIn();

        return response()->json([
            'success' => true,
            'message' => 'Shift started successfully',
            'driver' => $driver,
        ]);
    }

    /**
     * End driver shift (clock out)
     */
    public function endShift(Request $request, $driverId)
    {
        $validator = Validator::make($request->all(), [
            'timestamp' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $driver = Driver::findOrFail($driverId);
        $driver->clockOut();

        return response()->json([
            'success' => true,
            'message' => 'Shift ended successfully',
            'driver' => $driver,
        ]);
    }
}
