<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Asset;
use App\Models\Token;
use App\Models\Telemetry;
use App\Models\Revenue;
use App\Models\Payout;
use App\Models\SwapStation;
use App\Models\Rider;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MVPDemoSeeder extends Seeder
{
    /**
     * Run the database seeds for FleetFi MVP Demo
     */
    public function run()
    {
        // Create demo users
        $investor1 = User::create([
            'name' => 'John Investor',
            'email' => 'investor@fleetfi.com',
            'password' => Hash::make('password123'),
            'role' => 'investor'
        ]);

        $investor2 = User::create([
            'name' => 'Sarah Capital',
            'email' => 'sarah@fleetfi.com',
            'password' => Hash::make('password123'),
            'role' => 'investor'
        ]);

        $operator = User::create([
            'name' => 'Mike Operator',
            'email' => 'operator@fleetfi.com',
            'password' => Hash::make('password123'),
            'role' => 'operator'
        ]);

        // Create wallets for users
        foreach ([$investor1, $investor2, $operator] as $user) {
            Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => '0x' . Str::random(40),
                'trovotech_wallet_id' => 'TROVO_' . Str::random(16),
                'balance' => rand(1000, 50000),
                'status' => 'active',
                'verified_at' => now()
            ]);
        }

        // Create swap stations
        $stations = [
            ['name' => 'Ilorin Central Station', 'location' => 'Ilorin, Kwara State'],
            ['name' => 'GRA Swap Point', 'location' => 'GRA, Ilorin'],
            ['name' => 'University Road Station', 'location' => 'University of Ilorin Road']
        ];

        foreach ($stations as $station) {
            SwapStation::create($station);
        }

        // Riders (demo)
        Rider::create(['name' => 'Adewale Johnson', 'email' => 'adewale.j@fleetfi.com', 'phone' => '+2348012345678', 'status' => 'active']);
        Rider::create(['name' => 'Fatima Abdullahi', 'email' => 'fatima.a@fleetfi.com', 'phone' => '+2348023456789', 'status' => 'active']);
        Rider::create(['name' => 'Chukwudi Okafor', 'email' => 'chukwudi.o@fleetfi.com', 'phone' => '+2348034567890', 'status' => 'active']);
        Rider::create(['name' => 'Amina Bello', 'email' => 'amina.b@fleetfi.com', 'phone' => '+2348045678901', 'status' => 'inactive']);

        // Create assets (EVs, batteries, charging cabinets)
        $assets = [
            [
                'asset_id' => 'EV-001',
                'type' => 'vehicle',
                'model' => 'FleetFi EV Pro',
                'status' => 'active',
                'soh' => 92,
                'swaps' => 245,
                'location' => 'Ilorin Central Station',
                'original_value' => 35000,
                'daily_swaps' => 12,
                'is_tokenized' => true
            ],
            [
                'asset_id' => 'EV-002',
                'type' => 'vehicle',
                'model' => 'FleetFi EV Pro',
                'status' => 'active',
                'soh' => 88,
                'swaps' => 312,
                'location' => 'GRA Swap Point',
                'original_value' => 35000,
                'current_value' => 30000,
                'daily_swaps' => 15,
                'is_tokenized' => true
            ],
            [
                'asset_id' => 'EV-003',
                'type' => 'vehicle',
                'model' => 'FleetFi EV Standard',
                'status' => 'maintenance',
                'soh' => 78,
                'swaps' => 521,
                'location' => 'University Road Station',
                'original_value' => 28000,
                'current_value' => 22000,
                'daily_swaps' => 8,
                'is_tokenized' => true
            ],
            [
                'asset_id' => 'BAT-001',
                'type' => 'battery',
                'model' => 'LiFePO4 100kWh',
                'status' => 'active',
                'soh' => 95,
                'swaps' => 120,
                'location' => 'Ilorin Central Station',
                'original_value' => 8000,
                'current_value' => 7500,
                'daily_swaps' => 20,
                'is_tokenized' => false
            ],
            [
                'asset_id' => 'CAB-001',
                'type' => 'charging_cabinet',
                'model' => 'SwapPro 8000',
                'status' => 'active',
                'soh' => 98,
                'swaps' => 1200,
                'location' => 'Ilorin Central Station',
                'original_value' => 15000,
                'current_value' => 14500,
                'daily_swaps' => 45,
                'is_tokenized' => false
            ]
        ];

        foreach ($assets as $assetData) {
            $asset = Asset::create($assetData);

            // Also create in vehicles table for revenue tracking
            if ($asset->type === 'vehicle') {
                $vehicle = Vehicle::create([
                    'name' => $asset->model,
                    'type' => 'EV',
                    'plate_number' => $asset->asset_id,
                    'make' => 'FleetFi',
                    'model' => $asset->model,
                    'year' => '2024',
                    'status' => $asset->status
                ]);

                // Create telemetry data for vehicles
                for ($i = 0; $i < 5; $i++) {
                    Telemetry::create([
                        'asset_id' => $asset->asset_id,
                        'battery_level' => rand(20, 100),
                        'km' => rand(100, 500) + ($i * 50),
                        'latitude' => 8.4799 + (rand(-100, 100) / 10000),
                        'longitude' => 4.5418 + (rand(-100, 100) / 10000),
                        'speed' => rand(0, 80),
                        'status' => ['idle', 'in_transit', 'charging'][rand(0, 2)],
                        'recorded_at' => now()->subHours(5 - $i)
                    ]);
                }

                // Create revenue records
                for ($i = 0; $i < 3; $i++) {
                    Revenue::create([
                        'vehicle_id' => $vehicle->id,
                        'amount' => rand(500, 2000),
                        'date' => now()->subDays(rand(1, 30)),
                        'description' => 'Battery swap revenue',
                        'type' => 'rental'
                    ]);
                }
            }
        }

        // Create tokens (tokenize assets)
        $tokenizedAssets = Asset::where('is_tokenized', true)->get();

        foreach ($tokenizedAssets as $asset) {
            // Investor 1 owns 60% of EV-001
            if ($asset->asset_id === 'EV-001') {
                Token::create([
                    'asset_id' => $asset->id,
                    'user_id' => $investor1->id,
                    'token_id' => 'TKN_' . Str::random(20),
                    'shares' => 60,
                    'investment_amount' => 21000,
                    'current_value' => 19200,
                    'total_returns' => 3500,
                    'status' => 'active',
                    'purchase_date' => now()->subMonths(6)
                ]);

                // Investor 2 owns 40% of EV-001
                Token::create([
                    'asset_id' => $asset->id,
                    'user_id' => $investor2->id,
                    'token_id' => 'TKN_' . Str::random(20),
                    'shares' => 40,
                    'investment_amount' => 14000,
                    'current_value' => 12800,
                    'total_returns' => 2100,
                    'status' => 'active',
                    'purchase_date' => now()->subMonths(6)
                ]);
            }

            // Investor 1 owns 100% of EV-002
            if ($asset->asset_id === 'EV-002') {
                Token::create([
                    'asset_id' => $asset->id,
                    'user_id' => $investor1->id,
                    'token_id' => 'TKN_' . Str::random(20),
                    'shares' => 100,
                    'investment_amount' => 35000,
                    'current_value' => 30000,
                    'total_returns' => 5800,
                    'status' => 'active',
                    'purchase_date' => now()->subMonths(8)
                ]);
            }

            // Investor 2 owns 75% of EV-003
            if ($asset->asset_id === 'EV-003') {
                Token::create([
                    'asset_id' => $asset->id,
                    'user_id' => $investor2->id,
                    'token_id' => 'TKN_' . Str::random(20),
                    'shares' => 75,
                    'investment_amount' => 21000,
                    'current_value' => 16500,
                    'total_returns' => 2200,
                    'status' => 'active',
                    'purchase_date' => now()->subMonths(4)
                ]);
            }
        }

        // Create payouts for investors
        for ($i = 0; $i < 5; $i++) {
            Payout::create([
                'user_id' => $investor1->id,
                'amount' => rand(500, 1500)
            ]);

            Payout::create([
                'user_id' => $investor2->id,
                'amount' => rand(300, 1000)
            ]);
        }

        $this->command->info('MVP Demo data seeded successfully!');
        $this->command->info('');
        $this->command->info('Test Accounts:');
        $this->command->info('Investor 1: investor@fleetfi.com / password123');
        $this->command->info('Investor 2: sarah@fleetfi.com / password123');
        $this->command->info('Operator: operator@fleetfi.com / password123');
    }
}
