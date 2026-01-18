<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Asset;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Rider;
use App\Models\Ride;
use App\Models\Schedule;
use App\Models\Revenue;
use Carbon\Carbon;

class OperatorDashboardSeeder extends Seeder
{
    public function run()
    {
        echo "Starting Operator Dashboard Seeder...\n\n";

        // Get or create operator user
        $operator = User::where('email', 'operator@fleetfi.test')->first();
        if (!$operator) {
            $operator = User::create([
                'name' => 'John Operator',
                'email' => 'operator@fleetfi.test',
                'password' => Hash::make('Operator123#'),
                'role' => 'operator',
                'email_verified_at' => now(),
            ]);
            echo "Created operator user: operator@fleetfi.test\n";
        }

        // ================================================================
        // ASSETS (Vehicles/Batteries)
        // ================================================================
        echo "\nCreating assets...\n";

        $assetData = [
            // Keke (3-wheelers)
            [
                'asset_id' => 'KEKE-001',
                'type' => 'vehicle',
                'model' => 'Keke Marwa Electric',
                'status' => 'In Use',
                'soh' => 92,
                'swaps' => 145,
                'daily_swaps' => 3,
                'location' => 'Ikeja, Lagos',
                'original_value' => 850000,
                'current_value' => 780000,
                'is_tokenized' => true,
                'total_ownership_sold' => 65,
                'min_investment' => 10000,
                'expected_roi' => 18.5,
                'risk_level' => 'low',
            ],
            [
                'asset_id' => 'KEKE-002',
                'type' => 'vehicle',
                'model' => 'Keke Marwa Electric',
                'status' => 'Available',
                'soh' => 88,
                'swaps' => 98,
                'daily_swaps' => 2,
                'location' => 'Surulere, Lagos',
                'original_value' => 850000,
                'current_value' => 750000,
                'is_tokenized' => true,
                'total_ownership_sold' => 40,
                'min_investment' => 10000,
                'expected_roi' => 16.2,
                'risk_level' => 'low',
            ],
            [
                'asset_id' => 'KEKE-003',
                'type' => 'vehicle',
                'model' => 'Keke Marwa Electric',
                'status' => 'In Use',
                'soh' => 95,
                'swaps' => 210,
                'daily_swaps' => 4,
                'location' => 'Lekki, Lagos',
                'original_value' => 850000,
                'current_value' => 800000,
                'is_tokenized' => true,
                'total_ownership_sold' => 85,
                'min_investment' => 10000,
                'expected_roi' => 22.0,
                'risk_level' => 'low',
            ],
            // Okada (2-wheelers)
            [
                'asset_id' => 'OKADA-001',
                'type' => 'vehicle',
                'model' => 'Ogun Electric Bike',
                'status' => 'In Use',
                'soh' => 90,
                'swaps' => 320,
                'daily_swaps' => 5,
                'location' => 'Victoria Island, Lagos',
                'original_value' => 450000,
                'current_value' => 420000,
                'is_tokenized' => true,
                'total_ownership_sold' => 100,
                'min_investment' => 5000,
                'expected_roi' => 24.0,
                'risk_level' => 'medium',
            ],
            [
                'asset_id' => 'OKADA-002',
                'type' => 'vehicle',
                'model' => 'Ogun Electric Bike',
                'status' => 'Charging',
                'soh' => 78,
                'swaps' => 180,
                'daily_swaps' => 3,
                'location' => 'Yaba, Lagos',
                'original_value' => 450000,
                'current_value' => 380000,
                'is_tokenized' => true,
                'total_ownership_sold' => 55,
                'min_investment' => 5000,
                'expected_roi' => 19.5,
                'risk_level' => 'medium',
            ],
            [
                'asset_id' => 'OKADA-003',
                'type' => 'vehicle',
                'model' => 'Ogun Electric Bike',
                'status' => 'In Use',
                'soh' => 85,
                'swaps' => 250,
                'daily_swaps' => 4,
                'location' => 'Ikoyi, Lagos',
                'original_value' => 450000,
                'current_value' => 400000,
                'is_tokenized' => true,
                'total_ownership_sold' => 70,
                'min_investment' => 5000,
                'expected_roi' => 21.0,
                'risk_level' => 'medium',
            ],
            // Batteries
            [
                'asset_id' => 'BAT-001',
                'type' => 'battery',
                'model' => '72V 40Ah Li-ion',
                'status' => 'Available',
                'soh' => 96,
                'swaps' => 450,
                'daily_swaps' => 8,
                'location' => 'Swap Station Ikeja',
                'original_value' => 280000,
                'current_value' => 260000,
                'is_tokenized' => false,
                'total_ownership_sold' => 0,
                'min_investment' => 0,
                'expected_roi' => 0,
                'risk_level' => 'low',
            ],
            [
                'asset_id' => 'BAT-002',
                'type' => 'battery',
                'model' => '72V 40Ah Li-ion',
                'status' => 'In Use',
                'soh' => 89,
                'swaps' => 380,
                'daily_swaps' => 6,
                'location' => 'Swap Station Lekki',
                'original_value' => 280000,
                'current_value' => 240000,
                'is_tokenized' => false,
                'total_ownership_sold' => 0,
                'min_investment' => 0,
                'expected_roi' => 0,
                'risk_level' => 'low',
            ],
            // Maintenance vehicle
            [
                'asset_id' => 'KEKE-004',
                'type' => 'vehicle',
                'model' => 'Keke Marwa Electric',
                'status' => 'Maintenance',
                'soh' => 65,
                'swaps' => 420,
                'daily_swaps' => 0,
                'location' => 'Service Center, Ikeja',
                'original_value' => 850000,
                'current_value' => 550000,
                'is_tokenized' => true,
                'total_ownership_sold' => 30,
                'min_investment' => 10000,
                'expected_roi' => 12.0,
                'risk_level' => 'high',
            ],
        ];

        foreach ($assetData as $data) {
            Asset::updateOrCreate(
                ['asset_id' => $data['asset_id']],
                $data
            );
            echo "  Created/Updated asset: {$data['asset_id']} - {$data['model']}\n";
        }

        // ================================================================
        // RIDERS
        // ================================================================
        echo "\nCreating riders...\n";

        $riderData = [
            ['name' => 'Adebayo Okonkwo', 'phone' => '08012345678', 'email' => 'adebayo@example.com', 'status' => 'active'],
            ['name' => 'Chinedu Eze', 'phone' => '08098765432', 'email' => 'chinedu@example.com', 'status' => 'active'],
            ['name' => 'Musa Ibrahim', 'phone' => '08055512345', 'email' => 'musa@example.com', 'status' => 'active'],
            ['name' => 'Oluwaseun Adeyemi', 'phone' => '08033344556', 'email' => 'seun@example.com', 'status' => 'active'],
            ['name' => 'Emeka Nwosu', 'phone' => '08077889900', 'email' => 'emeka@example.com', 'status' => 'inactive'],
            ['name' => 'Yakubu Abubakar', 'phone' => '08066677788', 'email' => 'yakubu@example.com', 'status' => 'active'],
        ];

        $riders = [];
        foreach ($riderData as $data) {
            $rider = Rider::updateOrCreate(
                ['email' => $data['email']],
                $data
            );
            $riders[] = $rider;
            echo "  Created/Updated rider: {$data['name']}\n";
        }

        // Assign some riders to assets
        $assets = Asset::where('type', 'vehicle')->where('status', 'In Use')->get();
        foreach ($assets as $index => $asset) {
            if (isset($riders[$index])) {
                $riders[$index]->update(['assigned_asset_id' => $asset->id]);
                echo "  Assigned {$riders[$index]->name} to {$asset->asset_id}\n";
            }
        }

        // ================================================================
        // DRIVERS (with user accounts)
        // ================================================================
        echo "\nCreating drivers...\n";

        $driverData = [
            [
                'user' => ['name' => 'Adebayo Okonkwo', 'email' => 'adebayo.driver@fleetfi.test', 'role' => 'driver'],
                'license_number' => 'LIC-001-2024',
                'license_expiry' => '2026-12-31',
                'status' => 'available',
                'total_swaps' => 45,
                'total_distance_km' => 1250.5,
                'current_latitude' => 6.5244,
                'current_longitude' => 3.3792,
            ],
            [
                'user' => ['name' => 'Chinedu Eze', 'email' => 'chinedu.driver@fleetfi.test', 'role' => 'driver'],
                'license_number' => 'LIC-002-2024',
                'license_expiry' => '2025-08-15',
                'status' => 'driving',
                'total_swaps' => 62,
                'total_distance_km' => 1890.3,
                'current_latitude' => 6.4541,
                'current_longitude' => 3.3947,
            ],
            [
                'user' => ['name' => 'Musa Ibrahim', 'email' => 'musa.driver@fleetfi.test', 'role' => 'driver'],
                'license_number' => 'LIC-003-2024',
                'license_expiry' => '2025-11-20',
                'status' => 'offline',
                'total_swaps' => 38,
                'total_distance_km' => 980.0,
                'current_latitude' => 6.4698,
                'current_longitude' => 3.5852,
            ],
        ];

        $drivers = [];
        $vehicleAssets = Asset::where('type', 'vehicle')->where('status', 'In Use')->get();

        foreach ($driverData as $index => $data) {
            $user = User::updateOrCreate(
                ['email' => $data['user']['email']],
                [
                    'name' => $data['user']['name'],
                    'password' => Hash::make('Driver12345#'),
                    'role' => 'driver',
                    'email_verified_at' => now(),
                ]
            );

            $vehicleId = isset($vehicleAssets[$index]) ? $vehicleAssets[$index]->id : null;

            $driver = Driver::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'license_number' => $data['license_number'],
                    'license_expiry' => $data['license_expiry'],
                    'vehicle_id' => $vehicleId,
                    'status' => $data['status'],
                    'total_swaps' => $data['total_swaps'],
                    'total_distance_km' => $data['total_distance_km'],
                    'current_latitude' => $data['current_latitude'],
                    'current_longitude' => $data['current_longitude'],
                    'last_location_update' => now(),
                ]
            );
            $drivers[] = $driver;
            echo "  Created/Updated driver: {$data['user']['name']} (Vehicle: " . ($vehicleId ? $vehicleAssets[$index]->asset_id : 'None') . ")\n";
        }

        // ================================================================
        // TRIPS
        // ================================================================
        echo "\nCreating trips...\n";

        $lagosLocations = [
            ['name' => 'Ikeja', 'lat' => 6.6018, 'lng' => 3.3515],
            ['name' => 'Lekki', 'lat' => 6.4698, 'lng' => 3.5852],
            ['name' => 'Victoria Island', 'lat' => 6.4281, 'lng' => 3.4219],
            ['name' => 'Surulere', 'lat' => 6.5059, 'lng' => 3.3509],
            ['name' => 'Yaba', 'lat' => 6.5158, 'lng' => 3.3785],
            ['name' => 'Ikoyi', 'lat' => 6.4541, 'lng' => 3.4378],
            ['name' => 'Ajah', 'lat' => 6.4698, 'lng' => 3.5852],
            ['name' => 'Maryland', 'lat' => 6.5689, 'lng' => 3.3651],
        ];

        // Create completed trips for the last 30 days
        foreach ($drivers as $driver) {
            if (!$driver->vehicle_id) continue;

            for ($day = 30; $day >= 0; $day--) {
                $date = Carbon::now()->subDays($day);
                $tripsPerDay = rand(2, 5);

                for ($t = 0; $t < $tripsPerDay; $t++) {
                    $start = $lagosLocations[array_rand($lagosLocations)];
                    $end = $lagosLocations[array_rand($lagosLocations)];
                    $distance = rand(3, 25) + (rand(0, 99) / 100);
                    $duration = (int)($distance * rand(3, 6));
                    $batteryStart = rand(60, 95);
                    $batteryEnd = max(20, $batteryStart - rand(10, 30));

                    $baseFare = 200;
                    $distanceFare = $distance * 50;
                    $bonus = rand(0, 100);
                    $totalEarnings = $baseFare + $distanceFare + $bonus;

                    Trip::create([
                        'driver_id' => $driver->id,
                        'vehicle_id' => $driver->vehicle_id,
                        'start_latitude' => $start['lat'],
                        'start_longitude' => $start['lng'],
                        'start_address' => $start['name'] . ', Lagos',
                        'end_latitude' => $end['lat'],
                        'end_longitude' => $end['lng'],
                        'end_address' => $end['name'] . ', Lagos',
                        'distance_km' => $distance,
                        'duration_minutes' => $duration,
                        'battery_start' => $batteryStart,
                        'battery_end' => $batteryEnd,
                        'started_at' => $date->copy()->addHours(rand(6, 20))->addMinutes(rand(0, 59)),
                        'ended_at' => $date->copy()->addHours(rand(6, 20))->addMinutes(rand(0, 59) + $duration),
                        'status' => 'completed',
                        'base_fare' => $baseFare,
                        'distance_fare' => $distanceFare,
                        'bonus' => $bonus,
                        'deductions' => 0,
                        'total_earnings' => $totalEarnings,
                    ]);
                }
            }
            echo "  Created trips for driver: {$driver->user->name}\n";
        }

        // Create one active trip for a driver
        if (count($drivers) > 0 && $drivers[1]->vehicle_id) {
            $start = $lagosLocations[array_rand($lagosLocations)];
            Trip::create([
                'driver_id' => $drivers[1]->id,
                'vehicle_id' => $drivers[1]->vehicle_id,
                'start_latitude' => $start['lat'],
                'start_longitude' => $start['lng'],
                'start_address' => $start['name'] . ', Lagos',
                'started_at' => now()->subMinutes(15),
                'status' => 'active',
                'battery_start' => 85,
            ]);
            echo "  Created active trip for: {$drivers[1]->user->name}\n";
        }

        // ================================================================
        // RIDES (for revenue tracking)
        // ================================================================
        echo "\nCreating rides for revenue...\n";

        $vehicles = Asset::where('type', 'vehicle')->get();
        foreach ($vehicles as $vehicle) {
            for ($day = 14; $day >= 0; $day--) {
                $date = Carbon::now()->subDays($day);
                $ridesPerDay = rand(3, 8);

                for ($r = 0; $r < $ridesPerDay; $r++) {
                    $distance = rand(5, 30) + (rand(0, 99) / 100);
                    $revenue = $distance * rand(80, 120);
                    $batteryStart = rand(70, 100);
                    $batteryEnd = max(20, $batteryStart - rand(15, 35));

                    $startTime = $date->copy()->addHours(rand(6, 21))->addMinutes(rand(0, 59));
                    $endTime = $startTime->copy()->addMinutes(rand(15, 60));

                    Ride::create([
                        'vehicle_id' => $vehicle->id,
                        'distance_km' => $distance,
                        'battery_start' => $batteryStart,
                        'battery_end' => $batteryEnd,
                        'swaps_before' => $vehicle->swaps,
                        'swaps_after' => $vehicle->swaps + ($batteryEnd < 30 ? 1 : 0),
                        'revenue_amount' => $revenue,
                        'started_at' => $startTime,
                        'ended_at' => $endTime,
                    ]);
                }
            }
            echo "  Created rides for vehicle: {$vehicle->asset_id}\n";
        }

        // ================================================================
        // SCHEDULES
        // ================================================================
        echo "\nCreating schedules...\n";

        $scheduleData = [
            ['asset_id' => 'KEKE-001', 'type' => 'swap', 'scheduled_at' => now()->addHours(2), 'status' => 'pending', 'note' => 'Battery swap scheduled'],
            ['asset_id' => 'KEKE-002', 'type' => 'charge', 'scheduled_at' => now()->addHours(4), 'status' => 'pending', 'note' => 'Full charge needed'],
            ['asset_id' => 'OKADA-001', 'type' => 'swap', 'scheduled_at' => now()->addDay(), 'status' => 'pending', 'note' => 'Scheduled maintenance swap'],
            ['asset_id' => 'KEKE-003', 'type' => 'swap', 'scheduled_at' => now()->subHours(3), 'status' => 'completed', 'note' => 'Battery swap completed'],
            ['asset_id' => 'OKADA-002', 'type' => 'charge', 'scheduled_at' => now()->subHours(6), 'status' => 'completed', 'note' => 'Overnight charging completed'],
            ['asset_id' => 'BAT-001', 'type' => 'charge', 'scheduled_at' => now()->addHours(1), 'status' => 'pending', 'note' => 'Charging scheduled'],
        ];

        foreach ($scheduleData as $data) {
            $asset = Asset::where('asset_id', $data['asset_id'])->first();
            if ($asset) {
                Schedule::create([
                    'asset_id' => $asset->id,
                    'type' => $data['type'],
                    'scheduled_at' => $data['scheduled_at'],
                    'status' => $data['status'],
                    'note' => $data['note'],
                ]);
                echo "  Created schedule: {$data['type']} for {$data['asset_id']}\n";
            }
        }

        // ================================================================
        // REVENUE RECORDS
        // ================================================================
        echo "\nCreating revenue records...\n";

        foreach ($vehicles as $vehicle) {
            for ($day = 30; $day >= 0; $day--) {
                $date = Carbon::now()->subDays($day);
                $dailyRevenue = rand(8000, 25000);

                Revenue::create([
                    'vehicle_id' => $vehicle->id,
                    'amount' => $dailyRevenue,
                    'source' => 'ride',
                    'investor_roi_amount' => $dailyRevenue * 0.15,
                    'rider_wage_amount' => $dailyRevenue * 0.60,
                    'management_reserve_amount' => $dailyRevenue * 0.15,
                    'maintenance_reserve_amount' => $dailyRevenue * 0.10,
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);
            }
            echo "  Created revenue records for: {$vehicle->asset_id}\n";
        }

        echo "\n========================================\n";
        echo "Operator Dashboard Seeder completed!\n";
        echo "========================================\n\n";
        echo "Summary:\n";
        echo "  - Assets: " . Asset::count() . "\n";
        echo "  - Riders: " . Rider::count() . "\n";
        echo "  - Drivers: " . Driver::count() . "\n";
        echo "  - Trips: " . Trip::count() . "\n";
        echo "  - Rides: " . Ride::count() . "\n";
        echo "  - Schedules: " . Schedule::count() . "\n";
        echo "  - Revenue Records: " . Revenue::count() . "\n";
        echo "\nLogin as operator:\n";
        echo "  Email: operator@fleetfi.test\n";
        echo "  Password: Operator123#\n";
    }
}
