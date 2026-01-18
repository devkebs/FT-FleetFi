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

    /**
     * Create a new swap task
     */
    public function createSwapTask(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'station_id' => 'required|exists:swap_stations,id',
            'vehicle_id' => 'nullable|exists:assets,id',
            'battery_level_before' => 'nullable|integer|between:0,100',
            'notes' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth()->user();
        $driver = Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver profile not found',
            ], 404);
        }

        // Check for existing active task
        $existingTask = $driver->activeSwapTask()->first();
        if ($existingTask) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active swap task',
                'task' => $existingTask->load('swapStation'),
            ], 400);
        }

        $station = SwapStation::findOrFail($request->station_id);

        // Create task
        $task = SwapTask::create([
            'task_number' => 'SWAP-' . strtoupper(uniqid()),
            'driver_id' => $driver->id,
            'vehicle_id' => $request->vehicle_id,
            'asset_id' => $request->vehicle_id,
            'swap_station_id' => $station->id,
            'status' => 'pending',
            'battery_level_before' => $request->battery_level_before,
            'notes' => $request->notes,
        ]);

        // Estimate wait time based on station availability
        $estimatedWait = $station->available_batteries > 3 ? 5 : ($station->available_batteries > 0 ? 10 : 20);

        return response()->json([
            'success' => true,
            'message' => 'Swap task created successfully',
            'task' => $task->load('swapStation'),
            'estimated_wait' => $estimatedWait,
        ], 201);
    }

    /**
     * Get current authenticated driver's active swap task
     */
    public function getMyActiveSwapTask()
    {
        $user = auth()->user();
        $driver = Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            return response()->json([
                'has_active_task' => false,
                'task' => null,
            ]);
        }

        $activeTask = SwapTask::where('driver_id', $driver->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['swapStation', 'vehicle'])
            ->first();

        return response()->json([
            'has_active_task' => $activeTask !== null,
            'task' => $activeTask,
        ]);
    }

    /**
     * Get current authenticated driver's swap task history
     */
    public function getMySwapTaskHistory(Request $request)
    {
        $user = auth()->user();
        $driver = Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            return response()->json([
                'tasks' => [],
                'total' => 0,
                'current_page' => 1,
                'last_page' => 1,
            ]);
        }

        $perPage = $request->input('per_page', 10);
        $status = $request->input('status');

        $query = SwapTask::where('driver_id', $driver->id)
            ->with(['swapStation', 'vehicle'])
            ->orderBy('created_at', 'desc');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $tasks = $query->paginate($perPage);

        return response()->json([
            'tasks' => $tasks->items(),
            'total' => $tasks->total(),
            'current_page' => $tasks->currentPage(),
            'last_page' => $tasks->lastPage(),
        ]);
    }

    /**
     * Get current authenticated driver's swap statistics
     */
    public function getMySwapStats()
    {
        $user = auth()->user();
        $driver = Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            return response()->json([
                'today' => ['count' => 0, 'avg_duration' => 0],
                'this_week' => ['count' => 0, 'avg_duration' => 0],
                'this_month' => ['count' => 0, 'avg_duration' => 0],
                'lifetime' => ['count' => 0, 'total_bonuses' => 0],
            ]);
        }

        // Today's stats
        $todayTasks = SwapTask::where('driver_id', $driver->id)
            ->where('status', 'completed')
            ->whereDate('completed_at', today())
            ->get();

        $todayAvgDuration = $todayTasks->avg('duration_minutes') ?? 0;

        // This week's stats
        $weekTasks = SwapTask::where('driver_id', $driver->id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [now()->startOfWeek(), now()])
            ->get();

        $weekAvgDuration = $weekTasks->avg('duration_minutes') ?? 0;

        // This month's stats
        $monthTasks = SwapTask::where('driver_id', $driver->id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [now()->startOfMonth(), now()])
            ->get();

        $monthAvgDuration = $monthTasks->avg('duration_minutes') ?? 0;

        // Lifetime stats
        $lifetimeTasks = SwapTask::where('driver_id', $driver->id)
            ->where('status', 'completed')
            ->count();

        // Total bonuses from swap earnings
        $totalBonuses = \App\Models\DriverEarning::where('driver_id', $driver->id)
            ->where('source_type', 'swap')
            ->sum('net_amount');

        return response()->json([
            'today' => [
                'count' => $todayTasks->count(),
                'avg_duration' => round($todayAvgDuration, 1),
            ],
            'this_week' => [
                'count' => $weekTasks->count(),
                'avg_duration' => round($weekAvgDuration, 1),
            ],
            'this_month' => [
                'count' => $monthTasks->count(),
                'avg_duration' => round($monthAvgDuration, 1),
            ],
            'lifetime' => [
                'count' => $lifetimeTasks,
                'total_bonuses' => round($totalBonuses, 2),
            ],
        ]);
    }
}
