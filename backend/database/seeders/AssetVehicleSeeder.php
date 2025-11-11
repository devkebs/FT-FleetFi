<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Asset;
use App\Models\Vehicle;
use App\Models\User;

class AssetVehicleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vehicles = [
            // Electric Bikes (20)
            ['type' => 'vehicle', 'model' => 'E-Bike Pro 2024', 'value' => 3500, 'count' => 5],
            ['type' => 'vehicle', 'model' => 'E-Bike Plus 2024', 'value' => 3200, 'count' => 5],
            ['type' => 'vehicle', 'model' => 'E-Bike Lite 2024', 'value' => 2800, 'count' => 5],
            ['type' => 'vehicle', 'model' => 'E-Bike Cargo 2024', 'value' => 4200, 'count' => 5],

            // Electric Scooters (15)
            ['type' => 'vehicle', 'model' => 'E-Scooter Pro', 'value' => 2500, 'count' => 5],
            ['type' => 'vehicle', 'model' => 'E-Scooter Urban', 'value' => 2200, 'count' => 5],
            ['type' => 'vehicle', 'model' => 'E-Scooter Sport', 'value' => 2800, 'count' => 5],

            // Electric Cars (10)
            ['type' => 'vehicle', 'model' => 'Tesla Model 3', 'value' => 45000, 'count' => 2],
            ['type' => 'vehicle', 'model' => 'Nissan Leaf', 'value' => 32000, 'count' => 2],
            ['type' => 'vehicle', 'model' => 'Hyundai Kona EV', 'value' => 38000, 'count' => 2],
            ['type' => 'vehicle', 'model' => 'Chevrolet Bolt', 'value' => 35000, 'count' => 2],
            ['type' => 'vehicle', 'model' => 'VW ID.4', 'value' => 42000, 'count' => 2],

            // Charging Cabinets/Swap Stations (5)
            ['type' => 'charging_cabinet', 'model' => 'SwapStation Pro', 'value' => 150000, 'count' => 3],
            ['type' => 'charging_cabinet', 'model' => 'SwapStation Compact', 'value' => 100000, 'count' => 2],
        ];

        $counter = 1;
        $totalAssets = 0;

        foreach ($vehicles as $vehicleType) {
            for ($i = 0; $i < $vehicleType['count']; $i++) {
                // Create Asset
                $asset = Asset::create([
                    'asset_id' => 'ASSET-' . str_pad($counter, 5, '0', STR_PAD_LEFT),
                    'type' => $vehicleType['type'],
                    'model' => $vehicleType['model'],
                    'status' => $this->getRandomStatus(),
                    'location' => $this->getRandomLocation(),
                    'original_value' => $vehicleType['value'],
                    'current_value' => $vehicleType['value'] * (rand(85, 100) / 100),
                    'soh' => rand(85, 100),
                    'swaps' => rand(0, 500),
                    'daily_swaps' => rand(0, 15),
                    'is_tokenized' => rand(0, 100) > 30, // 70% tokenized
                    'created_at' => now()->subDays(rand(1, 90)),
                ]);

                // Create Vehicle entry if it's a vehicle type
                if ($vehicleType['type'] === 'vehicle') {
                    $regNumber = 'EV-' . str_pad($counter, 4, '0', STR_PAD_LEFT);

                    Vehicle::create([
                        'asset_id' => $asset->id,
                        'registration_number' => $regNumber,
                        'model' => $vehicleType['model'],
                        'year' => rand(2022, 2024),
                        'status' => $asset->status,
                        'battery_capacity' => $this->getBatteryCapacity($vehicleType['model']),
                        'current_battery_level' => rand(15, 100),
                        'odometer' => rand(1000, 25000),
                        'last_maintenance_date' => now()->subDays(rand(10, 90)),
                        'next_maintenance_due' => now()->addDays(rand(10, 60)),
                    ]);
                }

                $counter++;
                $totalAssets++;
            }
        }

        $this->command->info("Created {$totalAssets} assets and vehicles");
    }

    private function getRandomStatus(): string
    {
        $statuses = ['active', 'active', 'active', 'active', 'idle', 'idle', 'maintenance', 'charging'];
        return $statuses[array_rand($statuses)];
    }

    private function getRandomLocation(): string
    {
        $locations = [
            'Lagos, Nigeria',
            'Abuja, Nigeria',
            'Port Harcourt, Nigeria',
            'Ibadan, Nigeria',
            'Kano, Nigeria',
            'Nairobi, Kenya',
            'Accra, Ghana',
            'Cairo, Egypt',
        ];
        return $locations[array_rand($locations)];
    }

    private function getBatteryCapacity(string $model): int
    {
        if (str_contains($model, 'Car') || str_contains($model, 'Tesla') ||
            str_contains($model, 'Nissan') || str_contains($model, 'Hyundai') ||
            str_contains($model, 'Chevrolet') || str_contains($model, 'VW')) {
            return rand(40000, 75000); // Wh (40-75 kWh)
        } elseif (str_contains($model, 'Scooter')) {
            return rand(400, 800); // Wh
        } else {
            return rand(600, 1000); // Wh (bikes)
        }
    }
}
