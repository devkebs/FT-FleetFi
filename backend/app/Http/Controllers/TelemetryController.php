<?php

namespace App\Http\Controllers;

use App\Models\Telemetry;
use App\Models\Asset;
use App\Models\ConfigSetting;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;

class TelemetryController extends Controller
{
    /**
     * Store telemetry data from OEM (Qoura, vehicle manufacturers, etc.)
     * Public endpoint with API key authentication
     * POST /api/telemetry
     */
    public function store(Request $request)
    {
        // Authenticate OEM webhook request
        if (!$this->authenticateOemRequest($request)) {
            Log::warning('Unauthorized telemetry submission attempt', [
                'ip' => $request->ip(),
                'headers' => $request->headers->all()
            ]);
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'asset_id' => 'required|string',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'km' => 'nullable|numeric|min:0',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'speed' => 'nullable|integer|min:0',
            'status' => 'nullable|in:idle,in_transit,charging,swapping',
            'temperature' => 'nullable|numeric',
            'voltage' => 'nullable|numeric',
            'current' => 'nullable|numeric',
            'recorded_at' => 'required|date',
            'oem_source' => 'nullable|string|max:50', // e.g., 'qoura', 'manufacturer_x'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = $validator->validated();
            $data['oem_source'] = $data['oem_source'] ?? 'unknown';

            $telemetry = Telemetry::create($data);

            // Update asset with latest telemetry data
            $asset = Asset::where('asset_id', $request->asset_id)->first();
            if ($asset) {
                $updates = [];
                if ($request->has('battery_level')) {
                    $updates['soh'] = $request->battery_level;
                }
                if ($request->has('latitude') && $request->has('longitude')) {
                    $updates['location'] = json_encode([
                        'lat' => $request->latitude,
                        'lng' => $request->longitude
                    ]);
                }
                if (!empty($updates)) {
                    $asset->update($updates);
                }

                // Broadcast telemetry update to connected clients
                $this->broadcastTelemetryUpdate($telemetry, $asset);
            }

            Log::info('Telemetry stored', [
                'asset_id' => $request->asset_id,
                'source' => $data['oem_source']
            ]);

            return response()->json([
                'message' => 'Telemetry data stored successfully',
                'telemetry' => $telemetry
            ], 201);
        } catch (\Exception $e) {
            Log::error('Telemetry storage failed', [
                'error' => $e->getMessage(),
                'asset_id' => $request->asset_id ?? 'unknown'
            ]);

            return response()->json([
                'message' => 'Failed to store telemetry data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Authenticate OEM webhook request using API key
     */
    private function authenticateOemRequest(Request $request): bool
    {
        // Check for API key in header (X-OEM-API-Key or Authorization Bearer)
        $apiKey = $request->header('X-OEM-API-Key')
                  ?? $request->bearerToken();

        if (!$apiKey) {
            return false;
        }

        // Get configured OEM API key from settings
        $configuredKey = ConfigSetting::getValue('oem_telemetry_api_key', '');

        if (empty($configuredKey)) {
            // If no key configured, allow (backward compatibility)
            return true;
        }

        return hash_equals($configuredKey, $apiKey);
    }

    /**
     * Broadcast telemetry update to connected clients via event
     */
    private function broadcastTelemetryUpdate(Telemetry $telemetry, Asset $asset): void
    {
        // Dispatch event that can be picked up by WebSocket/SSE or polling
        Event::dispatch('telemetry.updated', [
            'asset_id' => $telemetry->asset_id,
            'asset_type' => $asset->type,
            'battery_level' => $telemetry->battery_level,
            'km' => $telemetry->km,
            'latitude' => $telemetry->latitude,
            'longitude' => $telemetry->longitude,
            'speed' => $telemetry->speed,
            'status' => $telemetry->status,
            'temperature' => $telemetry->temperature,
            'voltage' => $telemetry->voltage,
            'current' => $telemetry->current,
            'recorded_at' => $telemetry->recorded_at->toISOString(),
            'oem_source' => $telemetry->oem_source,
        ]);
    }

    /**
     * Get telemetry history for an asset
     */
    public function getAssetTelemetry($assetId)
    {
        $telemetries = Telemetry::where('asset_id', $assetId)
            ->orderBy('recorded_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($telemetries);
    }

    /**
     * Get latest telemetry for an asset
     */
    public function getLatest($assetId)
    {
        $telemetry = Telemetry::where('asset_id', $assetId)
            ->orderBy('recorded_at', 'desc')
            ->first();

        if (!$telemetry) {
            return response()->json(['message' => 'No telemetry data found'], 404);
        }

        return response()->json($telemetry);
    }

    /**
     * Get live telemetry for all active assets (for operator dashboard)
     * GET /api/telemetry/live
     */
    public function getLiveTelemetry(Request $request)
    {
        $user = $request->user();
        $vehicleId = $request->query('vehicle_id');
        $operatorId = $request->query('operator_id');

        // Build query for latest telemetry
        $query = Telemetry::where('recorded_at', '>=', now()->subMinutes(15))
            ->orderBy('recorded_at', 'desc');

        // Filter by vehicle if specified
        if ($vehicleId) {
            $query->where('asset_id', $vehicleId);
        }

        // Filter by operator's assets if specified
        if ($operatorId) {
            $operatorAssets = Asset::where('user_id', $operatorId)->pluck('asset_id');
            $query->whereIn('asset_id', $operatorAssets);
        }

        $recentTelemetry = $query->get()
            ->groupBy('asset_id')
            ->map(function ($records) {
                return $records->first(); // Get most recent for each asset
            })
            ->values();

        // Enrich with asset and vehicle details
        $vehicles = $recentTelemetry->map(function ($telemetry) {
            $asset = Asset::where('asset_id', $telemetry->asset_id)
                ->with('vehicle')
                ->first();

            if (!$asset) {
                return null;
            }

            $vehicle = $asset->vehicle;
            $driver = $vehicle && $vehicle->assigned_driver_id
                ? \App\Models\User::find($vehicle->assigned_driver_id)
                : null;

            // Determine status based on telemetry
            $status = $this->determineVehicleStatus($telemetry);

            // Get route history (last 20 positions)
            $routeHistory = Telemetry::where('asset_id', $telemetry->asset_id)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->where('recorded_at', '>=', now()->subHours(2))
                ->orderBy('recorded_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($t) {
                    return [
                        'lat' => $t->latitude,
                        'lng' => $t->longitude,
                    ];
                })
                ->reverse()
                ->values();

            return [
                'vehicle_id' => $asset->id,
                'vehicle_registration' => $vehicle->registration_number ?? 'UNKNOWN',
                'latitude' => $telemetry->latitude ?? 0,
                'longitude' => $telemetry->longitude ?? 0,
                'speed' => $telemetry->speed ?? 0,
                'battery_level' => $telemetry->battery_level ?? 0,
                'battery_temperature' => $telemetry->temperature ?? 25,
                'odometer' => $telemetry->km ?? 0,
                'status' => $status,
                'driver_id' => $driver->id ?? null,
                'driver_name' => $driver->name ?? null,
                'last_updated' => $telemetry->recorded_at->toISOString(),
                'route_history' => $routeHistory,
            ];
        })->filter(); // Remove null entries

        return response()->json([
            'success' => true,
            'vehicles' => $vehicles->values(),
            'count' => $vehicles->count(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Determine vehicle status based on telemetry data
     */
    private function determineVehicleStatus($telemetry): string
    {
        if ($telemetry->status === 'charging') {
            return 'charging';
        }

        // Check if data is stale (no update in last 10 minutes)
        if ($telemetry->recorded_at < now()->subMinutes(10)) {
            return 'offline';
        }

        // Check if moving
        if ($telemetry->speed > 5) {
            return 'active';
        }

        return 'idle';
    }

    /**
     * Get telemetry statistics for an asset
     */
    public function getStatistics(Request $request, $assetId)
    {
        $days = $request->query('days', 7);

        $telemetries = Telemetry::where('asset_id', $assetId)
            ->where('recorded_at', '>=', now()->subDays($days))
            ->orderBy('recorded_at', 'asc')
            ->get();

        if ($telemetries->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No telemetry data found',
            ], 404);
        }

        $stats = [
            'total_distance' => $telemetries->max('km') - $telemetries->min('km'),
            'average_speed' => $telemetries->avg('speed'),
            'max_speed' => $telemetries->max('speed'),
            'average_battery' => $telemetries->avg('battery_level'),
            'min_battery' => $telemetries->min('battery_level'),
            'max_battery' => $telemetries->max('battery_level'),
            'average_temperature' => $telemetries->avg('temperature'),
            'max_temperature' => $telemetries->max('temperature'),
            'data_points' => $telemetries->count(),
            'period_days' => $days,
        ];

        return response()->json([
            'success' => true,
            'asset_id' => $assetId,
            'statistics' => $stats,
        ]);
    }

    /**
     * Get telemetry alerts (low battery, high temperature, etc.)
     */
    public function getAlerts(Request $request)
    {
        $recentTelemetry = Telemetry::where('recorded_at', '>=', now()->subMinutes(30))
            ->get()
            ->groupBy('asset_id')
            ->map(function ($records) {
                return $records->first();
            });

        $alerts = [];

        foreach ($recentTelemetry as $telemetry) {
            $asset = Asset::where('asset_id', $telemetry->asset_id)->first();

            // Low battery alert
            if ($telemetry->battery_level < 20) {
                $alerts[] = [
                    'type' => 'low_battery',
                    'severity' => $telemetry->battery_level < 10 ? 'critical' : 'warning',
                    'asset_id' => $telemetry->asset_id,
                    'vehicle' => $asset->vehicle->registration_number ?? 'UNKNOWN',
                    'message' => "Battery level at {$telemetry->battery_level}%",
                    'value' => $telemetry->battery_level,
                    'timestamp' => $telemetry->recorded_at->toISOString(),
                ];
            }

            // High temperature alert
            if ($telemetry->temperature > 45) {
                $alerts[] = [
                    'type' => 'high_temperature',
                    'severity' => $telemetry->temperature > 50 ? 'critical' : 'warning',
                    'asset_id' => $telemetry->asset_id,
                    'vehicle' => $asset->vehicle->registration_number ?? 'UNKNOWN',
                    'message' => "Battery temperature at {$telemetry->temperature}°C",
                    'value' => $telemetry->temperature,
                    'timestamp' => $telemetry->recorded_at->toISOString(),
                ];
            }

            // Offline alert (no data in last 15 minutes)
            if ($telemetry->recorded_at < now()->subMinutes(15)) {
                $alerts[] = [
                    'type' => 'offline',
                    'severity' => 'info',
                    'asset_id' => $telemetry->asset_id,
                    'vehicle' => $asset->vehicle->registration_number ?? 'UNKNOWN',
                    'message' => "No data received since {$telemetry->recorded_at->diffForHumans()}",
                    'value' => now()->diffInMinutes($telemetry->recorded_at),
                    'timestamp' => $telemetry->recorded_at->toISOString(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'alerts' => $alerts,
            'count' => count($alerts),
        ]);
    }
}
