<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Revenue;
use App\Models\Asset;
use App\Models\Ride;
use App\Models\Vehicle;
use App\Models\User;

class RevenueRideSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $assets = Asset::where('type', '!=', 'swap_station')->get();
        $drivers = User::where('role', 'driver')->where('kyc_status', 'approved')->get();

        if ($assets->isEmpty()) {
            $this->command->warn('No assets found. Please run AssetVehicleSeeder first.');
            return;
        }

        $totalRevenue = 0;
        $totalRides = 0;

        // Generate revenue and rides for the last 90 days
        for ($day = 90; $day >= 0; $day--) {
            $date = now()->subDays($day);

            // Random number of active assets per day (60-90% of fleet)
            $activeAssets = $assets->random(rand(
                (int)($assets->count() * 0.6),
                (int)($assets->count() * 0.9)
            ));

            foreach ($activeAssets as $asset) {
                $vehicle = Vehicle::where('asset_id', $asset->id)->first();

                if (!$vehicle) continue;

                // 2-8 rides per vehicle per day
                $ridesPerDay = rand(2, 8);
                $dailyRevenue = 0;

                for ($i = 0; $i < $ridesPerDay; $i++) {
                    $driver = $drivers->isNotEmpty() ? $drivers->random() : null;

                    // Generate ride details
                    $distance = rand(5, 50) / 10; // 0.5 to 5.0 km
                    $duration = rand(10, 60); // 10-60 minutes
                    $fareAmount = $this->calculateFare($asset->type, $distance);

                    Ride::create([
                        'vehicle_id' => $vehicle->id,
                        'user_id' => $driver?->id,
                        'start_time' => $date->copy()->addHours(rand(6, 22))->addMinutes(rand(0, 59)),
                        'end_time' => $date->copy()->addHours(rand(6, 22))->addMinutes(rand(0, 59)),
                        'distance' => $distance,
                        'duration' => $duration,
                        'fare_amount' => $fareAmount,
                        'status' => 'completed',
                        'created_at' => $date,
                    ]);

                    $dailyRevenue += $fareAmount;
                    $totalRides++;
                }

                // Create daily revenue record
                if ($dailyRevenue > 0) {
                    Revenue::create([
                        'asset_id' => $asset->id,
                        'source' => 'rides',
                        'total_amount' => $dailyRevenue,
                        'operator_share' => $dailyRevenue * 0.3, // 30% to operator
                        'investor_share' => $dailyRevenue * 0.65, // 65% to investors
                        'platform_fee' => $dailyRevenue * 0.05, // 5% platform fee
                        'created_at' => $date,
                    ]);

                    $totalRevenue += $dailyRevenue;
                }
            }
        }

        $this->command->info("Created {$totalRides} rides and revenue records totaling $" . number_format($totalRevenue, 2));
    }

    private function calculateFare(string $vehicleType, float $distance): float
    {
        $baseRates = [
            'electric_bike' => 5.0,
            'electric_scooter' => 3.5,
            'electric_car' => 15.0,
        ];

        $perKmRates = [
            'electric_bike' => 2.5,
            'electric_scooter' => 2.0,
            'electric_car' => 8.0,
        ];

        $baseFare = $baseRates[$vehicleType] ?? 5.0;
        $perKmFare = $perKmRates[$vehicleType] ?? 2.0;

        return round($baseFare + ($distance * $perKmFare), 2);
    }
}
