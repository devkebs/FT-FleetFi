<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Telemetry;
use App\Models\Asset;
use App\Models\Vehicle;

class TelemetrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vehicles = Vehicle::with('asset')->get();

        if ($vehicles->isEmpty()) {
            $this->command->warn('No vehicles found. Please run AssetVehicleSeeder first.');
            return;
        }

        $totalTelemetry = 0;
        $locations = $this->getLocationCoordinates();

        // Generate telemetry for the last 7 days
        for ($day = 7; $day >= 0; $day--) {
            foreach ($vehicles as $vehicle) {
                // Skip if vehicle is in maintenance
                if ($vehicle->status === 'maintenance') {
                    continue;
                }

                // Random readings per vehicle per day (4-24, every 1-6 hours)
                $readingsPerDay = rand(4, 24);

                for ($i = 0; $i < $readingsPerDay; $i++) {
                    $timestamp = now()->subDays($day)->addHours(rand(0, 23))->addMinutes(rand(0, 59));
                    $location = $locations[array_rand($locations)];

                    // Add some random offset to coordinates for movement
                    $latOffset = (rand(-100, 100) / 10000); // ±0.01 degrees
                    $lonOffset = (rand(-100, 100) / 10000);

                    $isMoving = rand(0, 100) > 30; // 70% chance vehicle is moving
                    $speed = $isMoving ? rand(10, 60) : 0;
                    $batteryDrain = $isMoving ? rand(1, 3) : rand(0, 1);

                    // Calculate battery level (starts high, drains over the day)
                    $dayProgress = $i / $readingsPerDay;
                    $baseBattery = 100 - ($dayProgress * rand(40, 80));
                    $batteryLevel = max(10, min(100, $baseBattery + rand(-5, 5)));

                    Telemetry::create([
                        'asset_id' => $vehicle->asset_id,
                        'latitude' => round($location['lat'] + $latOffset, 6),
                        'longitude' => round($location['lon'] + $lonOffset, 6),
                        'battery_level' => round($batteryLevel, 1),
                        'speed' => $speed,
                        'temperature' => rand(20, 45),
                        'is_charging' => !$isMoving && $batteryLevel < 30 && rand(0, 100) > 70,
                        'odometer' => $vehicle->odometer + ($i * rand(1, 5)),
                        'recorded_at' => $timestamp,
                        'created_at' => $timestamp,
                    ]);

                    $totalTelemetry++;
                }
            }
        }

        $this->command->info("Created {$totalTelemetry} telemetry records");
    }

    private function getLocationCoordinates(): array
    {
        return [
            ['name' => 'Lagos', 'lat' => 6.5244, 'lon' => 3.3792],
            ['name' => 'Abuja', 'lat' => 9.0765, 'lon' => 7.3986],
            ['name' => 'Port Harcourt', 'lat' => 4.8156, 'lon' => 7.0498],
            ['name' => 'Ibadan', 'lat' => 7.3775, 'lon' => 3.9470],
            ['name' => 'Kano', 'lat' => 12.0022, 'lon' => 8.5919],
            ['name' => 'Nairobi', 'lat' => -1.2864, 'lon' => 36.8172],
            ['name' => 'Accra', 'lat' => 5.6037, 'lon' => -0.1870],
            ['name' => 'Cairo', 'lat' => 30.0444, 'lon' => 31.2357],
        ];
    }
}
