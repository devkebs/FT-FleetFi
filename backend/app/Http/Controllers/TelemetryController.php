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
        // Get latest telemetry for each unique asset in last 5 minutes
        $recentTelemetry = Telemetry::where('recorded_at', '>=', now()->subMinutes(5))
            ->orderBy('recorded_at', 'desc')
            ->get()
            ->groupBy('asset_id')
            ->map(function ($records) {
                return $records->first(); // Get most recent for each asset
            })
            ->values();

        // Enrich with asset details
        $enriched = $recentTelemetry->map(function ($telemetry) {
            $asset = Asset::where('asset_id', $telemetry->asset_id)->first();
            return [
                'asset_id' => $telemetry->asset_id,
                'asset_type' => $asset->type ?? 'unknown',
                'asset_model' => $asset->model ?? null,
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
                'age_seconds' => now()->diffInSeconds($telemetry->recorded_at),
            ];
        });

        return response()->json([
            'telemetry' => $enriched,
            'count' => $enriched->count(),
            'as_of' => now()->toISOString(),
        ]);
    }
}
