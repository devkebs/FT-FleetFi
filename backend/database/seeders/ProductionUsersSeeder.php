<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Str;

class ProductionUsersSeeder extends Seeder
{
    /**
     * Create 10 production-ready users with clear credentials.
     * Run: php artisan db:seed --class=ProductionUsersSeeder
     */
    public function run(): void
    {
        $users = [
            // Admin
            [
                'name' => 'Admin User',
                'email' => 'admin@fleetfi.com',
                'password' => 'Fleet@Admin2025!',
                'role' => 'admin',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            
            // Operators (2)
            [
                'name' => 'Fleet Operator',
                'email' => 'operator@fleetfi.com',
                'password' => 'Operator@2025!',
                'role' => 'operator',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            [
                'name' => 'Operations Manager',
                'email' => 'ops.manager@fleetfi.com',
                'password' => 'OpsManager@2025!',
                'role' => 'operator',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            
            // Investors (4)
            [
                'name' => 'Sarah Investor',
                'email' => 'sarah.investor@example.com',
                'password' => 'Sarah@Invest2025!',
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            [
                'name' => 'Michael Chen',
                'email' => 'michael.chen@example.com',
                'password' => 'Michael@Invest2025!',
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            [
                'name' => 'Amara Okafor',
                'email' => 'amara.okafor@example.com',
                'password' => 'Amara@Invest2025!',
                'role' => 'investor',
                'kyc_status' => 'pending',
                'kyc_verified_at' => null,
            ],
            [
                'name' => 'David Thompson',
                'email' => 'david.thompson@example.com',
                'password' => 'David@Invest2025!',
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            
            // Drivers (3)
            [
                'name' => 'James Driver',
                'email' => 'james.driver@example.com',
                'password' => 'James@Drive2025!',
                'role' => 'driver',
                'kyc_status' => 'submitted',
                'kyc_submitted_at' => now()->subDays(2),
            ],
            [
                'name' => 'Chioma Nwankwo',
                'email' => 'chioma.driver@example.com',
                'password' => 'Chioma@Drive2025!',
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            [
                'name' => 'Abdul Rahman',
                'email' => 'abdul.driver@example.com',
                'password' => 'Abdul@Drive2025!',
                'role' => 'driver',
                'kyc_status' => 'pending',
                'kyc_submitted_at' => null,
            ],
        ];

        echo "Creating production users...\n";
        echo str_repeat('=', 80) . "\n";

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'kyc_status' => $userData['kyc_status'],
                    'kyc_verified_at' => $userData['kyc_verified_at'] ?? null,
                    'kyc_submitted_at' => $userData['kyc_submitted_at'] ?? null,
                ]
            );

            // Create wallet for each user
            if (!Wallet::where('user_id', $user->id)->exists()) {
                Wallet::create([
                    'user_id' => $user->id,
                    'wallet_address' => '0x' . Str::random(40),
                    'trovotech_wallet_id' => 'TROVO_' . Str::random(12),
                    'balance' => $userData['role'] === 'investor' ? rand(1000, 50000) / 10 : 0,
                    'status' => 'active'
                ]);
            }

            echo sprintf(
                "✓ %s (%s) - %s\n",
                str_pad($userData['name'], 25),
                str_pad($userData['role'], 10),
                $userData['email']
            );
        }

        echo str_repeat('=', 80) . "\n";
        echo "Total users created: " . count($users) . "\n";
        echo "\nCredentials saved to: LOGIN_CREDENTIALS.md\n";
    }
}
