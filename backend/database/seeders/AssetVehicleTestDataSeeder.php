<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class AssetVehicleTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Get all operators
        $operators = User::where('role', 'operator')->get();

        if ($operators->isEmpty()) {
            $this->command->warn('No operators found. Please run UserSeeder first.');
            return;
        }

        // Vehicle types and models
        $vehicleModels = [
            'e_bike' => ['E-Bike Pro 2024', 'Pedego Element', 'RadRunner Plus'],
            'e_scooter' => ['Xiaomi Mi Pro 3', 'Segway P100', 'Scoot Pro Max'],
            'e_car' => ['Tesla Model 3', 'BYD Atto 3', 'Nissan Leaf', 'Chevrolet Bolt'],
            'e_van' => ['Ford E-Transit', 'Mercedes eSprinter', 'Rivian EDV']
        ];

        $makes = [
            'e_bike' => ['Trek', 'Pedego', 'Rad Power'],
            'e_scooter' => ['Xiaomi', 'Segway', 'Scoot'],
            'e_car' => ['Tesla', 'BYD', 'Nissan', 'Chevrolet'],
            'e_van' => ['Ford', 'Mercedes', 'Rivian']
        ];

        $locations = [
            'Lagos, Nigeria',
            'Nairobi, Kenya',
            'Cape Town, South Africa',
            'Accra, Ghana',
            'Kigali, Rwanda',
            'Dar es Salaam, Tanzania'
        ];

        $assetId = 1;

        // Create 8-15 vehicles for each operator
        foreach ($operators as $operator) {
            $vehicleCount = rand(8, 15);

            $this->command->info("Creating {$vehicleCount} vehicles for operator: {$operator->name}");

            for ($i = 0; $i < $vehicleCount; $i++) {
                // Pick a random vehicle type and model
                $type = array_rand($vehicleModels);
                $model = $vehicleModels[$type][array_rand($vehicleModels[$type])];
                $make = $makes[$type][array_rand($makes[$type])];

                $assetIdStr = 'ASSET-' . str_pad($assetId, 5, '0', STR_PAD_LEFT);
                $tokenId = rand(1000, 9999);

                // Create asset (matching actual schema)
                $assetData = [
                    'asset_id' => $assetIdStr,
                    'type' => $type,
                    'model' => $model,
                    'status' => $faker->randomElement(['active', 'maintenance', 'inactive']),
                    'soh' => rand(75, 100), // State of Health percentage
                    'swaps' => rand(0, 500), // Total battery swaps
                    'location' => $faker->randomElement($locations),
                    'original_value' => rand(50000, 500000), // $50k - $500k
                    'current_value' => rand(40000, 450000),
                    'daily_swaps' => rand(0, 20),
                    'is_tokenized' => $faker->boolean(70), // 70% tokenized
                    'token_id' => 'TKN-' . $tokenId,
                    'metadata_hash' => $faker->sha256(),
                    'trustee_ref' => 'TRUSTEE-' . strtoupper($faker->bothify('???###')),
                    'telemetry_uri' => 'https://telemetry.fleetfi.io/assets/' . $assetIdStr,
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                DB::table('assets')->insert($assetData);

                // Create corresponding vehicle record (matching actual schema)
                $vehicleData = [
                    'name' => $model . ' #' . $assetId,
                    'status' => $assetData['status'],
                    'type' => $type,
                    'plate_number' => $this->generatePlateNumber(),
                    'make' => $make,
                    'model' => $model,
                    'year' => rand(2020, 2025),
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                DB::table('vehicles')->insert($vehicleData);

                $assetId++;
            }
        }

        $totalAssets = ($assetId - 1);
        $this->command->info("Created {$totalAssets} assets and vehicles successfully!");
    }

    /**
     * Generate a random vehicle registration plate number
     */
    private function generatePlateNumber(): string
    {
        $letters = chr(rand(65, 90)) . chr(rand(65, 90)) . chr(rand(65, 90));
        $numbers = rand(100, 999);
        $suffix = chr(rand(65, 90)) . chr(rand(65, 90));

        return "{$letters}-{$numbers}-{$suffix}";
    }
}
