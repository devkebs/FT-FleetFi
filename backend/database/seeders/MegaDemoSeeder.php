<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Faker\Factory as Faker;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Asset;
use App\Models\Telemetry;
use App\Models\Vehicle;
use App\Models\Activity;
use App\Models\Revenue;
use App\Models\Token;
use App\Models\Ride;

class MegaDemoSeeder extends Seeder
{
    /**
     * Assumptions:
     * - Create 50 users: 1 existing admin (skip if present), 5 operators, 10 investors, 34 drivers.
     * - Each operator gets 5 vehicles + 5 battery assets (shared pool).
     * - Create 40 assets total (20 vehicles, 15 batteries, 5 charging_cabinet).
     * - Generate 200 telemetry points (recent 10 minutes) across vehicle + battery assets.
     * - Create driver activities (rentals, swaps, charging) and investor activities (revenue entries).
     * - Simple revenue records per vehicle.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Ensure admin exists
        $admin = User::where('email', 'admin@fleetfi.com')->first();
        if (!$admin) {
            $admin = User::firstOrCreate([
                'email' => 'admin@fleetfi.com',
            ],[
                'name' => 'Admin User',
                'password' => Hash::make('Fleet@123'),
                'role' => 'admin',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ]);
            $this->createWallet($admin);
        }

        // Operators
        $operators = collect();
        for ($i = 1; $i <= 5; $i++) {
            $op = User::firstOrCreate([
                'email' => "operator$i@fleetfi.local",
            ],[
                'name' => "Operator $i",
                'password' => Hash::make('Password123!'),
                'role' => 'operator',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ]);
            $this->createWallet($op);
            $operators->push($op);
        }

        // Investors
        $investors = collect();
        for ($i = 1; $i <= 10; $i++) {
            $inv = User::firstOrCreate([
                'email' => "investor$i@fleetfi.local",
            ],[
                'name' => "Investor $i",
                'password' => Hash::make('Password123!'),
                'role' => 'investor',
                'kyc_status' => $i <= 7 ? 'verified' : 'submitted',
                'kyc_submitted_at' => $i > 7 ? now()->subMinutes(rand(5,60)) : null,
                'kyc_verified_at' => $i <= 7 ? now() : null,
            ]);
            $this->createWallet($inv);
            $investors->push($inv);
        }

        // Drivers
        $drivers = collect();
        for ($i = 1; $i <= 34; $i++) {
            $drv = User::firstOrCreate([
                'email' => "driver$i@fleetfi.local",
            ],[
                'name' => "Driver $i",
                'password' => Hash::make('Password123!'),
                'role' => 'driver',
                'kyc_status' => 'submitted',
                'kyc_submitted_at' => now()->subMinutes(rand(1,120)),
            ]);
            $drivers->push($drv);
        }

        // Vehicles (Vehicle model) and matching assets
        $vehicleAssets = collect();
        $existingPlates = Vehicle::pluck('plate_number')->all();
        $plateIndex = 1;
        for ($i = 1; $i <= 20; $i++) {
            $plate = 'EV-' . str_pad($plateIndex, 3, '0', STR_PAD_LEFT);
            while (in_array($plate, $existingPlates, true)) {
                $plateIndex++;
                $plate = 'EV-' . str_pad($plateIndex, 3, '0', STR_PAD_LEFT);
            }
            $existingPlates[] = $plate;

            $vehicle = Vehicle::firstOrCreate([
                'plate_number' => $plate,
            ],[
                'name' => $faker->randomElement(['Electric Scooter','Cargo Bike','E-Bike','EV Car']) . " $i",
                'type' => $faker->randomElement(['scooter','bike','car']),
                'make' => $faker->randomElement(['Yadea','NIU','Tesla','BYD','GenericOEM']),
                'model' => $faker->randomElement(['Model 3','S-Plus','CargoPro','UrbanLite']),
                'year' => rand(2021,2025),
                'status' => $faker->randomElement(['active','maintenance','active','active']),
            ]);

            $assetId = 'VEH' . str_pad($i, 3, '0', STR_PAD_LEFT);
            $asset = Asset::firstOrCreate([
                'asset_id' => $assetId,
            ],[
                'type' => 'vehicle',
                'model' => $vehicle->model,
                'status' => $vehicle->status,
                'soh' => rand(70,100),
                'swaps' => rand(0,200),
                'location' => json_encode(['lat' => $this->randLat(), 'lng' => $this->randLng()]),
                'original_value' => rand(800, 4000),
                'current_value' => rand(600, 3500),
                'daily_swaps' => rand(0,5),
                'is_tokenized' => (bool)rand(0,1),
            ]);
            $vehicleAssets->push($asset);
        }

        // Battery assets
        $batteryAssets = collect();
        for ($i = 1; $i <= 15; $i++) {
            $asset = Asset::firstOrCreate([
                'asset_id' => 'BAT' . str_pad($i, 3, '0', STR_PAD_LEFT),
            ],[
                'type' => 'battery',
                'model' => $faker->randomElement(['LFP-5KWh','NMC-2KWh','LFP-3KWh']),
                'status' => 'active',
                'soh' => rand(75,100),
                'swaps' => rand(50,300),
                'location' => json_encode(['lat' => $this->randLat(), 'lng' => $this->randLng()]),
                'original_value' => rand(200, 800),
                'current_value' => rand(150, 700),
                'daily_swaps' => rand(0,10),
                'is_tokenized' => false,
            ]);
            $batteryAssets->push($asset);
        }

        // Charging cabinets
        for ($i = 1; $i <= 5; $i++) {
            Asset::firstOrCreate([
                'asset_id' => 'CAB' . str_pad($i, 2, '0', STR_PAD_LEFT),
            ],[
                'type' => 'charging_cabinet',
                'model' => 'Cabinet-' . rand(1,5),
                'status' => 'active',
                'soh' => 100,
                'swaps' => 0,
                'location' => json_encode(['lat' => $this->randLat(), 'lng' => $this->randLng()]),
                'original_value' => rand(3000, 7000),
                'current_value' => rand(2500, 6500),
                'daily_swaps' => 0,
                'is_tokenized' => false,
            ]);
        }

        // Telemetry points (recent 10 minutes) for vehicle & battery assets
        $allTelemetryAssets = $vehicleAssets->merge($batteryAssets);
        $telemetryCount = 0;
        foreach ($allTelemetryAssets as $asset) {
            $points = rand(3,6); // points per asset
            for ($p = 0; $p < $points; $p++) {
                Telemetry::create([
                    'asset_id' => $asset->asset_id,
                    'battery_level' => rand(10,100),
                    'km' => rand(0, 5000) + rand(0,99)/100,
                    'latitude' => $this->randLat(),
                    'longitude' => $this->randLng(),
                    'speed' => rand(0,80),
                    'status' => $faker->randomElement(['idle','in_transit','charging','swapping']),
                    'temperature' => rand(20,45) + rand(0,99)/100,
                    'voltage' => rand(40,55) + rand(0,99)/100,
                    'current' => rand(5,40) + rand(0,99)/100,
                    'recorded_at' => now()->subMinutes(rand(0,10))->subSeconds(rand(0,59)),
                    'oem_source' => $faker->randomElement(['qoura','oem_alpha','oem_beta']),
                ]);
                $telemetryCount++;
            }
        }

        // Driver activities
        $vehicles = Vehicle::all();
        foreach ($drivers as $driver) {
            $activitySamples = rand(2,5);
            for ($a = 0; $a < $activitySamples; $a++) {
                $veh = $vehicles->random();
                Activity::create([
                    'user_id' => $driver->id,
                    'vehicle_id' => $veh->id,
                    'action' => $faker->randomElement(['Rental Start','Rental End','Battery Swap','Charging Start','Charging End']),
                    'status' => $faker->randomElement(['completed','in-progress']),
                    'description' => $faker->sentence(),
                    'data' => [
                        'odometer' => rand(0,5000),
                        'battery_level' => rand(10,100)
                    ],
                ]);
            }
        }

        // Investor revenue (associate with first 10 vehicle assets)
        $revVehicles = Vehicle::take(10)->get();
        foreach ($investors as $idx => $inv) {
            foreach ($revVehicles as $veh) {
                Revenue::create([
                    'vehicle_id' => $veh->id,
                    'amount' => rand(50,300) + rand(0,99)/100,
                    'date' => now()->subDays(rand(0,14)),
                    'description' => 'Rental revenue share',
                    'type' => 'rental',
                ]);
            }
        }

        // Simulate rides with proper revenue allocations
        $rideCount = 0;
        $allVehicles = Vehicle::all();
        if ($allVehicles->count() > 0) {
            $ridesPerVehicle = rand(1, 3); // 1-3 rides per vehicle
            $splits = config('fleetfi.revenue.splits', [
                'investor_roi_pct' => 0.50,
                'rider_wage_pct' => 0.30,
                'management_reserve_pct' => 0.15,
                'maintenance_reserve_pct' => 0.05,
            ]);
            $baseRate = config('fleetfi.revenue.base_rate_per_km', 1.25);

            foreach ($allVehicles as $vehicle) {
                $numRides = rand(1, $ridesPerVehicle);
                for ($r = 0; $r < $numRides; $r++) {
                    $distance = round(rand(3, 12) + mt_rand() / mt_getrandmax(), 2);
                    $batteryStart = rand(60, 100);
                    $batteryEnd = max(5, $batteryStart - intval($distance * rand(3, 7)));
                    $swapsBefore = rand(0, 100);
                    $swapsAfter = $swapsBefore + ($batteryEnd < 25 && rand(0, 1) === 1 ? 1 : 0);

                    $gross = round($distance * $baseRate, 2);
                    $investor = round($gross * $splits['investor_roi_pct'], 2);
                    $rider = round($gross * $splits['rider_wage_pct'], 2);
                    $management = round($gross * $splits['management_reserve_pct'], 2);
                    $maintenance = round($gross * $splits['maintenance_reserve_pct'], 2);

                    // Normalize rounding
                    $totalAlloc = $investor + $rider + $management + $maintenance;
                    if ($totalAlloc !== $gross) {
                        $maintenance += ($gross - $totalAlloc);
                    }

                    $startedAt = now()->subDays(rand(0, 14))->subMinutes(rand(10, 40));
                    $endedAt = $startedAt->copy()->addMinutes(rand(10, 40));

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

                    Revenue::create([
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
                        'description' => 'Auto-generated ride revenue',
                    ]);

                    $rideCount++;
                }
            }
        }

        // Mint tokens for a subset of tokenized assets and distribute among investors
        $tokenizedAssets = Asset::where('is_tokenized', true)->take(8)->get();
        $invList = $investors->shuffle()->values();
        $chainIds = ['polygon', 'bsc', 'eth-sepolia'];
        $tokenCount = 0;
        foreach ($tokenizedAssets as $index => $asset) {
            // Skip if tokens already exist for this asset
            if (Token::where('asset_id', $asset->id)->exists()) {
                continue;
            }
            // Choose 3 random investors to own fractions
            $owners = $invList->shuffle()->take(3);
            if ($owners->count() === 0) {
                continue; // safety
            }
            $ownerCount = $owners->count();
            $fractions = [];
            for ($f=0; $f < $ownerCount; $f++) {
                $fractions[] = rand(10,40);
            }
            $sum = array_sum($fractions);
            // Normalize to <= 100
            $scale = 100 / $sum;
            $fractions = array_map(function ($f) use ($scale) { return round($f * $scale, 2); }, $fractions);
            $chain = $chainIds[$index % count($chainIds)];
            foreach ($owners as $i => $owner) {
                Token::create([
                    'asset_id' => $asset->id,
                    'user_id' => $owner->id,
                    'token_id' => strtoupper($chain) . '-' . $asset->asset_id . '-' . ($i+1),
                    'shares' => $fractions[$i],
                    'fraction_owned' => $fractions[$i],
                    'investment_amount' => rand(500, 5000),
                    'current_value' => rand(500, 5500),
                    'total_returns' => rand(0, 800),
                    'status' => 'active',
                    'purchase_date' => now()->subDays(rand(5,90)),
                    'minted_at' => now()->subDays(rand(5,90))->addMinutes(rand(1,60)),
                    'metadata_hash' => 'Qm' . Str::random(44),
                    'trustee_ref' => 'TRUST-' . Str::random(10),
                    'tx_hash' => '0x' . Str::random(64),
                    'chain' => $chain,
                ]);
                $tokenCount++;
            }
        }

        // Summary log
        echo "MegaDemoSeeder complete:\n";
        echo "Users: " . User::count() . "\n";
        echo "Assets: " . Asset::count() . "\n";
        echo "Telemetry points: $telemetryCount\n";
        echo "Activities: " . Activity::count() . "\n";
        echo "Rides: " . Ride::count() . " (created $rideCount this run)\n";
        echo "Revenues: " . Revenue::count() . "\n";
        echo "Tokens: " . Token::count() . " (created $tokenCount this run)\n";
    }

    private function createWallet(User $user): void
    {
        if (!method_exists(Wallet::class, 'create')) return;
        if (!Wallet::where('user_id', $user->id)->exists()) {
            Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => '0x' . Str::random(40),
                'trovotech_wallet_id' => 'TROVO_' . Str::random(12),
                'balance' => rand(0,10000)/100,
                'status' => 'active'
            ]);
        }
    }

    private function randLat(): float
    {
        // Nigeria / West Africa bounding box approximate
        return 4.0 + mt_rand() / mt_getrandmax() * (13.0 - 4.0);
    }

    private function randLng(): float
    {
        return 2.0 + mt_rand() / mt_getrandmax() * (15.0 - 2.0);
    }
}
