<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vehicle;
use App\Models\Ride;
use App\Models\Revenue;
use App\Models\Asset;
use App\Models\FleetOperation;
use Illuminate\Support\Carbon;

class SimulateRide extends Command
{
    protected $signature = 'simulate:ride {--vehicle_id=} {--distance_km=}';
    protected $description = 'Simulate a completed ride, generating revenue allocations and telemetry placeholders';

    public function handle(): int
    {
        $vehicleId = $this->option('vehicle_id');
        $vehicle = null;

        if ($vehicleId) {
            $vehicle = Vehicle::find($vehicleId);
            if (!$vehicle) {
                $this->error("Vehicle ID {$vehicleId} not found");
                return 1;
            }
        } else {
            $vehicle = Vehicle::inRandomOrder()->first();
        }

        if (!$vehicle) {
            $this->warn('No vehicles found. Creating a demo vehicle.');
            $vehicle = Vehicle::create([
                'name' => 'Demo Vehicle',
                'type' => 'ev',
                'plate_number' => 'DEMO-' . strtoupper(substr(md5(uniqid()), 0, 6)),
                'status' => 'active',
            ]);
        }

        $distance = $this->option('distance_km');
        if (!$distance) {
            $distance = round(rand(3, 12) + mt_rand() / mt_getrandmax(), 2); // 3-12 km with fractional component
        } else {
            $distance = (float)$distance;
        }

        $batteryStart = rand(60, 100);
        // Assume consumption roughly 3-7% per km (simplified)
        $consumptionPerKm = rand(3, 7); // percentage points per km (simplified model)
        $batteryEnd = max(5, $batteryStart - intval($distance * ($consumptionPerKm / 1))); // ensure not below 5%

        $swapsBefore = rand(0, 100);
        $performedSwap = $batteryEnd < 25 && rand(0, 1) === 1; // maybe swap if below 25%
        $swapsAfter = $swapsBefore + ($performedSwap ? 1 : 0);

        $baseRate = config('fleetfi.revenue.base_rate_per_km', 1.25);
        $gross = round($distance * $baseRate, 2);

        $splits = config('fleetfi.revenue.splits');
        $investor = round($gross * $splits['investor_roi_pct'], 2);
        $rider = round($gross * $splits['rider_wage_pct'], 2);
        $management = round($gross * $splits['management_reserve_pct'], 2);
        $maintenance = round($gross * $splits['maintenance_reserve_pct'], 2);

        // Normalize to avoid rounding drift: adjust maintenance to match gross exactly
        $totalAlloc = $investor + $rider + $management + $maintenance;
        if ($totalAlloc !== $gross) {
            $diff = $gross - $totalAlloc;
            $maintenance += $diff; // adjust final bucket
        }

        $startedAt = now()->subMinutes(rand(10, 40));
        $endedAt = now();

        $ride = Ride::create([
            'vehicle_id' => $vehicle->id,
            'distance_km' => $distance,
            'battery_start' => $batteryStart,
            'battery_end' => $batteryEnd,
            'swaps_before' => $swapsBefore,
            'swaps_after' => $swapsAfter,
            'revenue_amount' => $gross,
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
        ]);

        $revenue = Revenue::create([
            'vehicle_id' => $vehicle->id,
            'ride_id' => $ride->id,
            'source' => 'ride',
            'amount' => $gross,
            'investor_roi_amount' => $investor,
            'rider_wage_amount' => $rider,
            'management_reserve_amount' => $management,
            'maintenance_reserve_amount' => $maintenance,
            'date' => $endedAt->toDateString(),
            'type' => 'ride',
            'description' => 'Auto-generated from simulate:ride',
        ]);

        // Log a fleet operation record if model exists
        if (class_exists(FleetOperation::class)) {
            FleetOperation::create([
                'vehicle_id' => $vehicle->id,
                'operation_type' => 'ride_completed'
            ]);
        }

        $this->info('Ride simulated successfully.');
        $this->line("Vehicle: {$vehicle->id} | Distance: {$distance} km | Gross: {$gross}");
        $this->line("Allocations -> Investor: {$investor} Rider: {$rider} Mgmt: {$management} Maint: {$maintenance}");
        $this->line("Ride ID: {$ride->id} Revenue ID: {$revenue->id}");

        return 0;
    }
}
