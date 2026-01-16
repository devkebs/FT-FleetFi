<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\Trip;
use App\Models\DriverEarning;
use App\Models\Rider;
use App\Models\Asset;
use App\Models\Ride;
use App\Models\SwapEvent;
use App\Models\SwapTask;
use App\Models\MaintenanceRequest;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DriverController extends Controller
{
    /**
     * Get or create driver profile for authenticated user
     */
    private function getDriverProfile()
    {
        $user = Auth::user();

        // Try to find existing driver profile
        $driver = Driver::where('user_id', $user->id)->first();

        if (!$driver) {
            // Create a driver profile if it doesn't exist
            $driver = Driver::create([
                'user_id' => $user->id,
                'license_number' => 'DRV-' . strtoupper(uniqid()),
                'license_expiry' => now()->addYears(2),
                'status' => 'available',
            ]);
        }

        return $driver;
    }

    /**
     * Get driver dashboard summary
     * GET /api/driver/dashboard
     */
    public function dashboard()
    {
        $driver = $this->getDriverProfile();

        // Get today's stats
        $todayTrips = Trip::byDriver($driver->id)->today()->get();
        $todayEarnings = DriverEarning::byDriver($driver->id)->today()->sum('net_amount');

        // Get weekly stats
        $weekTrips = Trip::byDriver($driver->id)->thisWeek()->count();
        $weekEarnings = DriverEarning::byDriver($driver->id)->thisWeek()->sum('net_amount');

        // Get monthly stats
        $monthTrips = Trip::byDriver($driver->id)->thisMonth()->count();
        $monthEarnings = DriverEarning::byDriver($driver->id)->thisMonth()->sum('net_amount');

        // Get lifetime stats
        $totalTrips = Trip::byDriver($driver->id)->completed()->count();
        $totalDistance = Trip::byDriver($driver->id)->completed()->sum('distance_km');
        $totalEarnings = DriverEarning::byDriver($driver->id)->sum('net_amount');
        $pendingEarnings = DriverEarning::byDriver($driver->id)->pending()->sum('net_amount');

        // Get active trip if any
        $activeTrip = Trip::byDriver($driver->id)->active()->with('vehicle')->first();

        // Get recent trips
        $recentTrips = Trip::byDriver($driver->id)
            ->with('vehicle')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // Get assigned vehicle
        $vehicle = $driver->assignedVehicle;

        return response()->json([
            'driver' => [
                'id' => $driver->id,
                'status' => $driver->status,
                'is_on_shift' => $driver->shift_start !== null && $driver->shift_end === null,
                'shift_start' => $driver->shift_start,
            ],
            'vehicle' => $vehicle ? [
                'id' => $vehicle->id,
                'asset_id' => $vehicle->asset_id,
                'model' => $vehicle->model,
                'soh' => $vehicle->soh,
                'location' => $vehicle->location,
            ] : null,
            'active_trip' => $activeTrip,
            'today' => [
                'trips' => $todayTrips->count(),
                'earnings' => round($todayEarnings, 2),
                'distance' => round($todayTrips->sum('distance_km'), 2),
            ],
            'this_week' => [
                'trips' => $weekTrips,
                'earnings' => round($weekEarnings, 2),
            ],
            'this_month' => [
                'trips' => $monthTrips,
                'earnings' => round($monthEarnings, 2),
            ],
            'lifetime' => [
                'total_trips' => $totalTrips,
                'total_distance' => round($totalDistance, 2),
                'total_earnings' => round($totalEarnings, 2),
                'pending_earnings' => round($pendingEarnings, 2),
            ],
            'recent_trips' => $recentTrips->map(function ($trip) {
                return [
                    'id' => $trip->id,
                    'trip_id' => $trip->trip_id,
                    'distance_km' => $trip->distance_km,
                    'duration_minutes' => $trip->duration_minutes,
                    'total_earnings' => $trip->total_earnings,
                    'status' => $trip->status,
                    'started_at' => $trip->started_at,
                    'ended_at' => $trip->ended_at,
                    'vehicle' => $trip->vehicle ? $trip->vehicle->model : null,
                ];
            }),
        ]);
    }

    // =========================================================================
    // TRIP MANAGEMENT
    // =========================================================================

    /**
     * Get all trips for driver
     * GET /api/driver/trips
     */
    public function getTrips(Request $request)
    {
        $driver = $this->getDriverProfile();

        $query = Trip::byDriver($driver->id)->with('vehicle');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('started_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('started_at', '<=', $request->to_date);
        }

        $perPage = $request->input('per_page', 15);
        $trips = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'trips' => $trips->items(),
            'total' => $trips->total(),
            'current_page' => $trips->currentPage(),
            'last_page' => $trips->lastPage(),
        ]);
    }

    /**
     * Get active trip
     * GET /api/driver/trips/active
     */
    public function getActiveTrip()
    {
        $driver = $this->getDriverProfile();

        $activeTrip = Trip::byDriver($driver->id)
            ->active()
            ->with('vehicle')
            ->first();

        if (!$activeTrip) {
            return response()->json([
                'has_active_trip' => false,
                'trip' => null,
            ]);
        }

        return response()->json([
            'has_active_trip' => true,
            'trip' => $activeTrip,
        ]);
    }

    /**
     * Start a new trip
     * POST /api/driver/trips/start
     */
    public function startTrip(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'nullable|exists:assets,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'address' => 'nullable|string|max:255',
            'battery_start' => 'nullable|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $driver = $this->getDriverProfile();

        // Check if driver already has an active trip
        $existingTrip = Trip::byDriver($driver->id)->active()->first();
        if ($existingTrip) {
            return response()->json([
                'error' => 'You already have an active trip. Please end it first.',
                'active_trip' => $existingTrip,
            ], 400);
        }

        // Get vehicle (from request or assigned vehicle)
        $vehicleId = $request->vehicle_id ?? $driver->vehicle_id;

        // Create the trip
        $trip = Trip::create([
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicleId,
            'start_latitude' => $request->latitude,
            'start_longitude' => $request->longitude,
            'start_address' => $request->address,
            'battery_start' => $request->battery_start,
            'status' => Trip::STATUS_ACTIVE,
            'started_at' => now(),
        ]);

        // Update driver status
        $driver->status = 'driving';
        $driver->save();

        return response()->json([
            'message' => 'Trip started successfully',
            'trip' => $trip->load('vehicle'),
        ], 201);
    }

    /**
     * End active trip
     * PATCH /api/driver/trips/{tripId}/end
     */
    public function endTrip(Request $request, $tripId)
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'address' => 'nullable|string|max:255',
            'distance_km' => 'required|numeric|min:0',
            'battery_end' => 'nullable|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $driver = $this->getDriverProfile();

        $trip = Trip::where('id', $tripId)
            ->orWhere('trip_id', $tripId)
            ->where('driver_id', $driver->id)
            ->active()
            ->first();

        if (!$trip) {
            return response()->json(['error' => 'Active trip not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Complete the trip
            $trip->complete([
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'address' => $request->address,
            ], $request->distance_km);

            $trip->battery_end = $request->battery_end;
            $trip->save();

            // Create earnings record
            $earning = DriverEarning::createFromTrip($trip);

            // Update driver status
            $driver->status = 'available';
            $driver->total_distance_km = ($driver->total_distance_km ?? 0) + $request->distance_km;
            $driver->save();

            DB::commit();

            return response()->json([
                'message' => 'Trip completed successfully',
                'trip' => $trip->fresh()->load('vehicle'),
                'earning' => $earning,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to end trip: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cancel active trip
     * PATCH /api/driver/trips/{tripId}/cancel
     */
    public function cancelTrip(Request $request, $tripId)
    {
        $driver = $this->getDriverProfile();

        $trip = Trip::where('id', $tripId)
            ->orWhere('trip_id', $tripId)
            ->where('driver_id', $driver->id)
            ->active()
            ->first();

        if (!$trip) {
            return response()->json(['error' => 'Active trip not found'], 404);
        }

        $trip->cancel($request->reason);

        // Update driver status
        $driver->status = 'available';
        $driver->save();

        return response()->json([
            'message' => 'Trip cancelled',
            'trip' => $trip,
        ]);
    }

    /**
     * Get single trip details
     * GET /api/driver/trips/{tripId}
     */
    public function getTripDetails($tripId)
    {
        $driver = $this->getDriverProfile();

        $trip = Trip::where('id', $tripId)
            ->orWhere('trip_id', $tripId)
            ->where('driver_id', $driver->id)
            ->with(['vehicle', 'earnings'])
            ->first();

        if (!$trip) {
            return response()->json(['error' => 'Trip not found'], 404);
        }

        return response()->json(['trip' => $trip]);
    }

    // =========================================================================
    // EARNINGS MANAGEMENT
    // =========================================================================

    /**
     * Get earnings summary
     * GET /api/driver/earnings
     */
    public function getEarningsSummary(Request $request)
    {
        $driver = $this->getDriverProfile();

        $today = DriverEarning::byDriver($driver->id)->today()->sum('net_amount');
        $thisWeek = DriverEarning::byDriver($driver->id)->thisWeek()->sum('net_amount');
        $thisMonth = DriverEarning::byDriver($driver->id)->thisMonth()->sum('net_amount');
        $lifetime = DriverEarning::byDriver($driver->id)->sum('net_amount');
        $pending = DriverEarning::byDriver($driver->id)->pending()->sum('net_amount');
        $paid = DriverEarning::byDriver($driver->id)->paid()->sum('net_amount');

        // Get breakdown by source type
        $breakdown = DriverEarning::byDriver($driver->id)
            ->thisMonth()
            ->selectRaw('source_type, SUM(net_amount) as total, COUNT(*) as count')
            ->groupBy('source_type')
            ->get()
            ->keyBy('source_type');

        return response()->json([
            'summary' => [
                'today' => round($today, 2),
                'this_week' => round($thisWeek, 2),
                'this_month' => round($thisMonth, 2),
                'lifetime' => round($lifetime, 2),
                'pending' => round($pending, 2),
                'paid' => round($paid, 2),
            ],
            'breakdown' => [
                'trips' => [
                    'total' => round($breakdown->get('trip')?->total ?? 0, 2),
                    'count' => $breakdown->get('trip')?->count ?? 0,
                ],
                'swaps' => [
                    'total' => round($breakdown->get('swap')?->total ?? 0, 2),
                    'count' => $breakdown->get('swap')?->count ?? 0,
                ],
                'bonuses' => [
                    'total' => round($breakdown->get('bonus')?->total ?? 0, 2),
                    'count' => $breakdown->get('bonus')?->count ?? 0,
                ],
            ],
        ]);
    }

    /**
     * Get earnings history
     * GET /api/driver/earnings/history
     */
    public function getEarningsHistory(Request $request)
    {
        $driver = $this->getDriverProfile();

        $query = DriverEarning::byDriver($driver->id)->with('trip');

        // Filter by source type
        if ($request->has('source_type') && $request->source_type !== 'all') {
            $query->bySourceType($request->source_type);
        }

        // Filter by payment status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('payment_status', $request->status);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('earned_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('earned_at', '<=', $request->to_date);
        }

        $perPage = $request->input('per_page', 20);
        $earnings = $query->orderByDesc('earned_at')->paginate($perPage);

        return response()->json([
            'earnings' => $earnings->items(),
            'total' => $earnings->total(),
            'current_page' => $earnings->currentPage(),
            'last_page' => $earnings->lastPage(),
        ]);
    }

    /**
     * Get daily earnings for chart
     * GET /api/driver/earnings/daily
     */
    public function getDailyEarnings(Request $request)
    {
        $driver = $this->getDriverProfile();
        $days = $request->input('days', 7);

        $earnings = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayEarnings = DriverEarning::byDriver($driver->id)
                ->whereDate('earned_at', $date->toDateString())
                ->sum('net_amount');

            $tripCount = Trip::byDriver($driver->id)
                ->whereDate('started_at', $date->toDateString())
                ->completed()
                ->count();

            $earnings[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'earnings' => round($dayEarnings, 2),
                'trips' => $tripCount,
            ];
        }

        return response()->json([
            'daily_earnings' => $earnings,
            'total' => round(array_sum(array_column($earnings, 'earnings')), 2),
        ]);
    }

    /**
     * Get monthly report
     * GET /api/driver/earnings/monthly/{year}/{month}
     */
    public function getMonthlyReport($year, $month)
    {
        $driver = $this->getDriverProfile();

        $earnings = DriverEarning::byDriver($driver->id)
            ->whereYear('earned_at', $year)
            ->whereMonth('earned_at', $month)
            ->get();

        $trips = Trip::byDriver($driver->id)
            ->whereYear('started_at', $year)
            ->whereMonth('started_at', $month)
            ->completed()
            ->get();

        return response()->json([
            'period' => [
                'year' => (int)$year,
                'month' => (int)$month,
                'month_name' => date('F', mktime(0, 0, 0, $month, 1)),
            ],
            'summary' => [
                'total_earnings' => round($earnings->sum('net_amount'), 2),
                'gross_earnings' => round($earnings->sum('gross_amount'), 2),
                'commission' => round($earnings->sum('commission'), 2),
                'total_trips' => $trips->count(),
                'total_distance' => round($trips->sum('distance_km'), 2),
                'avg_trip_earnings' => $trips->count() > 0
                    ? round($earnings->where('source_type', 'trip')->sum('net_amount') / $trips->count(), 2)
                    : 0,
            ],
            'breakdown' => $earnings->groupBy('source_type')->map(function ($group, $type) {
                return [
                    'type' => $type,
                    'count' => $group->count(),
                    'total' => round($group->sum('net_amount'), 2),
                ];
            })->values(),
        ]);
    }

    // =========================================================================
    // PAYOUT MANAGEMENT
    // =========================================================================

    /**
     * Request payout to wallet
     * POST /api/driver/payouts/request
     */
    public function requestPayout(Request $request)
    {
        $driver = $this->getDriverProfile();
        $user = Auth::user();

        // Get pending earnings
        $pendingEarnings = DriverEarning::byDriver($driver->id)->pending()->get();
        $totalPending = $pendingEarnings->sum('net_amount');

        if ($totalPending <= 0) {
            return response()->json(['error' => 'No pending earnings to withdraw'], 400);
        }

        // Get or create wallet
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet) {
            return response()->json(['error' => 'Please create a wallet first'], 400);
        }

        try {
            DB::beginTransaction();

            // Create wallet transaction
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'payout_received',
                'amount' => $totalPending,
                'currency' => 'NGN',
                'status' => 'completed',
                'tx_hash' => '0x' . bin2hex(random_bytes(32)),
                'from_address' => 'FLEETFI-PAYOUTS',
                'to_address' => $wallet->wallet_address,
                'description' => 'Driver earnings payout',
                'metadata' => [
                    'source' => 'driver_earnings',
                    'earnings_count' => $pendingEarnings->count(),
                    'period' => now()->format('Y-m'),
                ],
                'completed_at' => now(),
            ]);

            // Update wallet balance
            $wallet->increment('balance', $totalPending);

            // Mark earnings as paid
            foreach ($pendingEarnings as $earning) {
                $earning->markAsPaid($transaction->id);
            }

            DB::commit();

            return response()->json([
                'message' => 'Payout processed successfully',
                'amount' => round($totalPending, 2),
                'new_balance' => round($wallet->fresh()->balance, 2),
                'transaction' => $transaction,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Payout failed: ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // SHIFT MANAGEMENT
    // =========================================================================

    /**
     * Clock in - start shift
     * POST /api/driver/shift/start
     */
    public function clockIn()
    {
        $driver = $this->getDriverProfile();

        if ($driver->shift_start && !$driver->shift_end) {
            return response()->json(['error' => 'You are already clocked in'], 400);
        }

        $driver->clockIn();

        return response()->json([
            'message' => 'Shift started successfully',
            'shift_start' => $driver->shift_start,
            'status' => $driver->status,
        ]);
    }

    /**
     * Clock out - end shift
     * POST /api/driver/shift/end
     */
    public function clockOut()
    {
        $driver = $this->getDriverProfile();

        if (!$driver->shift_start || $driver->shift_end) {
            return response()->json(['error' => 'You are not clocked in'], 400);
        }

        // Check for active trips
        $activeTrip = Trip::byDriver($driver->id)->active()->first();
        if ($activeTrip) {
            return response()->json([
                'error' => 'Please end your active trip before clocking out',
                'active_trip' => $activeTrip,
            ], 400);
        }

        $shiftStart = $driver->shift_start;
        $driver->clockOut();

        // Calculate shift stats
        $shiftEarnings = DriverEarning::byDriver($driver->id)
            ->where('earned_at', '>=', $shiftStart)
            ->sum('net_amount');

        $shiftTrips = Trip::byDriver($driver->id)
            ->where('started_at', '>=', $shiftStart)
            ->completed()
            ->count();

        return response()->json([
            'message' => 'Shift ended successfully',
            'shift_summary' => [
                'started_at' => $shiftStart,
                'ended_at' => $driver->shift_end,
                'duration_hours' => round($shiftStart->diffInMinutes($driver->shift_end) / 60, 2),
                'trips_completed' => $shiftTrips,
                'earnings' => round($shiftEarnings, 2),
            ],
        ]);
    }

    // =========================================================================
    // LEGACY ENDPOINTS (kept for backward compatibility)
    // =========================================================================

    /**
     * Get current driver's assigned vehicles
     * GET /api/driver/assignments
     */
    public function myAssignments()
    {
        $user = Auth::user();
        $driver = $this->getDriverProfile();

        $assets = [];
        if ($driver->vehicle_id) {
            $asset = Asset::find($driver->vehicle_id);
            if ($asset) {
                $assets[] = [
                    'asset' => $asset,
                    'assignment_date' => $driver->updated_at,
                    'driver_status' => $driver->status
                ];
            }
        }

        // Also check legacy Rider model
        $rider = Rider::where('email', $user->email)->first();
        if ($rider && $rider->assigned_asset_id && empty($assets)) {
            $asset = Asset::where('asset_id', $rider->assigned_asset_id)->first();
            if ($asset) {
                $assets[] = [
                    'asset' => $asset,
                    'assignment_date' => $rider->updated_at,
                    'rider_status' => $rider->status
                ];
            }
        }

        return response()->json([
            'driver' => $driver,
            'rider' => $rider,
            'assigned_assets' => $assets
        ]);
    }

    /**
     * Get driver's earnings summary (legacy)
     * GET /api/driver/earnings/legacy
     */
    public function myEarningsLegacy(Request $request)
    {
        $user = Auth::user();
        $rider = Rider::where('email', $user->email)->first();

        if (!$rider) {
            return response()->json(['error' => 'Rider not found'], 404);
        }

        if (!$rider->assigned_asset_id) {
            return response()->json([
                'total_earnings' => 0,
                'today_earnings' => 0,
                'total_rides' => 0,
                'total_distance' => 0,
                'rides' => []
            ]);
        }

        $asset = Asset::where('asset_id', $rider->assigned_asset_id)->first();
        if (!$asset) {
            return response()->json(['error' => 'Asset not found'], 404);
        }

        $rides = Ride::where('vehicle_id', $asset->id)
            ->with('revenue')
            ->orderByDesc('ended_at')
            ->get();

        $totalEarnings = $rides->sum(function($ride) {
            return $ride->revenue ? $ride->revenue->rider_wage_amount : 0;
        });

        $todayEarnings = $rides->filter(function($ride) {
            return $ride->ended_at >= now()->startOfDay();
        })->sum(function($ride) {
            return $ride->revenue ? $ride->revenue->rider_wage_amount : 0;
        });

        return response()->json([
            'total_earnings' => (float)$totalEarnings,
            'today_earnings' => (float)$todayEarnings,
            'total_rides' => $rides->count(),
            'total_distance' => (float)$rides->sum('distance_km'),
            'rides' => $rides->take(20)->map(function($ride) {
                return [
                    'id' => $ride->id,
                    'distance_km' => (float)$ride->distance_km,
                    'earnings' => $ride->revenue ? (float)$ride->revenue->rider_wage_amount : 0,
                    'battery_start' => $ride->battery_start,
                    'battery_end' => $ride->battery_end,
                    'started_at' => $ride->started_at,
                    'ended_at' => $ride->ended_at
                ];
            })
        ]);
    }

    /**
     * Log a battery swap by driver
     * POST /api/driver/log-swap
     */
    public function logSwap(Request $request)
    {
        $data = $request->validate([
            'asset_id' => 'required|string|exists:assets,asset_id',
            'station_location' => 'required|string',
            'battery_before' => 'required|integer|min:0|max:100',
            'battery_after' => 'required|integer|min:0|max:100',
            'notes' => 'nullable|string|max:500'
        ]);

        $user = Auth::user();
        $driver = $this->getDriverProfile();

        $asset = Asset::where('asset_id', $data['asset_id'])->first();

        // Create swap event
        $swapEvent = SwapEvent::create([
            'asset_id' => $asset->id,
            'station_id' => null,
            'occurred_at' => now(),
            'battery_before' => $data['battery_before'],
            'battery_after' => $data['battery_after'],
            'notes' => $data['notes'] ?? "Driver swap at {$data['station_location']}"
        ]);

        // Update asset swap count
        $asset->increment('swaps');

        // Update driver stats
        $driver->increment('total_swaps');

        // Create swap bonus earning
        $bonus = 100; // ₦100 per swap
        DriverEarning::createSwapBonus($driver->id, null, $bonus, "Swap at {$data['station_location']}");

        return response()->json([
            'message' => 'Swap logged successfully',
            'swap_event' => $swapEvent,
            'bonus_earned' => $bonus,
        ], 201);
    }

    /**
     * Get driver's swap history
     * GET /api/driver/swaps
     */
    public function mySwaps()
    {
        $user = Auth::user();
        $driver = $this->getDriverProfile();

        $swaps = [];

        // Get from SwapTask if available
        if (class_exists(SwapTask::class)) {
            $swapTasks = SwapTask::where('driver_id', $driver->id)
                ->orderByDesc('created_at')
                ->limit(50)
                ->get();

            foreach ($swapTasks as $task) {
                $swaps[] = [
                    'id' => $task->id,
                    'task_number' => $task->task_number,
                    'status' => $task->status,
                    'battery_before' => $task->battery_soh_before,
                    'battery_after' => $task->battery_soh_after,
                    'completed_at' => $task->completed_at,
                    'created_at' => $task->created_at,
                ];
            }
        }

        // Also get legacy swap events
        if ($driver->vehicle_id) {
            $legacySwaps = SwapEvent::where('asset_id', $driver->vehicle_id)
                ->orderByDesc('occurred_at')
                ->limit(50)
                ->get();

            foreach ($legacySwaps as $swap) {
                $swaps[] = [
                    'id' => 'legacy-' . $swap->id,
                    'status' => 'completed',
                    'battery_before' => $swap->battery_before,
                    'battery_after' => $swap->battery_after,
                    'completed_at' => $swap->occurred_at,
                    'created_at' => $swap->created_at,
                ];
            }
        }

        return response()->json(['swaps' => $swaps]);
    }

    /**
     * Report maintenance issue
     * POST /api/driver/report-maintenance
     */
    public function reportMaintenance(Request $request)
    {
        $data = $request->validate([
            'asset_id' => 'required|string|exists:assets,asset_id',
            'issue_type' => 'required|string|in:mechanical,electrical,battery,body,other',
            'severity' => 'required|string|in:low,medium,high,critical',
            'description' => 'required|string|max:1000',
            'photo_url' => 'nullable|url'
        ]);

        $user = Auth::user();
        $driver = $this->getDriverProfile();
        $rider = Rider::where('email', $user->email)->first();

        $asset = Asset::where('asset_id', $data['asset_id'])->first();

        $maintenanceRequest = MaintenanceRequest::create([
            'asset_id' => $asset->id,
            'reported_by' => $user->id,
            'rider_id' => $rider?->id,
            'driver_id' => $driver->id,
            'issue_type' => $data['issue_type'],
            'severity' => $data['severity'],
            'description' => $data['description'],
            'photo_url' => $data['photo_url'] ?? null,
            'status' => 'pending',
            'reported_at' => now()
        ]);

        if ($data['severity'] === 'critical') {
            $asset->status = 'Maintenance';
            $asset->save();

            $driver->status = 'offline';
            $driver->save();
        }

        return response()->json([
            'message' => 'Maintenance request submitted successfully',
            'request' => $maintenanceRequest
        ], 201);
    }

    /**
     * Get driver's maintenance reports
     * GET /api/driver/maintenance-reports
     */
    public function myMaintenanceReports()
    {
        $user = Auth::user();

        $reports = MaintenanceRequest::where('reported_by', $user->id)
            ->with('asset')
            ->orderByDesc('reported_at')
            ->get();

        return response()->json(['reports' => $reports]);
    }
}
