<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Wallet;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            // Admin Users (3)
            [
                'name' => 'System Administrator',
                'email' => 'admin@fleetfi.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            [
                'name' => 'Jane Admin',
                'email' => 'jane.admin@fleetfi.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],
            [
                'name' => 'Mike Admin',
                'email' => 'mike.admin@fleetfi.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
            ],

            // Operator Users (5)
            [
                'name' => 'Fleet Operator One',
                'email' => 'operator1@fleetfi.com',
                'password' => Hash::make('operator123'),
                'role' => 'operator',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(10),
            ],
            [
                'name' => 'Sarah Williams',
                'email' => 'sarah.operator@fleetfi.com',
                'password' => Hash::make('operator123'),
                'role' => 'operator',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(15),
            ],
            [
                'name' => 'David Brown',
                'email' => 'david.fleet@fleetfi.com',
                'password' => Hash::make('operator123'),
                'role' => 'operator',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(20),
            ],
            [
                'name' => 'Emma Transport',
                'email' => 'emma.transport@fleetfi.com',
                'password' => Hash::make('operator123'),
                'role' => 'operator',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(25),
            ],
            [
                'name' => 'James Logistics',
                'email' => 'james.logistics@fleetfi.com',
                'password' => Hash::make('operator123'),
                'role' => 'operator',
                'kyc_status' => 'pending',
                'kyc_verified_at' => null,
            ],

            // Investor Users (12)
            [
                'name' => 'John Investor',
                'email' => 'john.investor@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(30),
            ],
            [
                'name' => 'Olivia Harris',
                'email' => 'olivia.harris@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(25),
            ],
            [
                'name' => 'Robert Martinez',
                'email' => 'robert.investor@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(20),
            ],
            [
                'name' => 'Lisa Anderson',
                'email' => 'lisa.anderson@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(18),
            ],
            [
                'name' => 'Ahmed Hassan',
                'email' => 'ahmed.hassan@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(15),
            ],
            [
                'name' => 'Sophia Taylor',
                'email' => 'sophia.taylor@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(12),
            ],
            [
                'name' => 'Kevin O\'Brien',
                'email' => 'kevin.obrien@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(10),
            ],
            [
                'name' => 'Yuki Tanaka',
                'email' => 'yuki.tanaka@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(8),
            ],
            [
                'name' => 'Carlos Rodriguez',
                'email' => 'carlos.rodriguez@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(5),
            ],
            [
                'name' => 'Anna Kowalski',
                'email' => 'anna.kowalski@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(3),
            ],
            [
                'name' => 'Michael Brown',
                'email' => 'michael.brown@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'pending',
                'kyc_verified_at' => null,
            ],
            [
                'name' => 'Nina Patel',
                'email' => 'nina.patel@example.com',
                'password' => Hash::make('investor123'),
                'role' => 'investor',
                'kyc_status' => 'verified',
                'kyc_verified_at' => null,
            ],

            // Driver Users (15)
            [
                'name' => 'Tom Driver',
                'email' => 'tom.driver@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(40),
            ],
            [
                'name' => 'Alice Johnson',
                'email' => 'alice.johnson@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(35),
            ],
            [
                'name' => 'Bob Wilson',
                'email' => 'bob.wilson@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(30),
            ],
            [
                'name' => 'Carlos Rivera',
                'email' => 'carlos.rivera@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(28),
            ],
            [
                'name' => 'Daniel Lee',
                'email' => 'daniel.lee@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(25),
            ],
            [
                'name' => 'Eva Martinez',
                'email' => 'eva.martinez@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(22),
            ],
            [
                'name' => 'Frank Thompson',
                'email' => 'frank.thompson@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(20),
            ],
            [
                'name' => 'Grace Okonkwo',
                'email' => 'grace.okonkwo@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(18),
            ],
            [
                'name' => 'Henry Davis',
                'email' => 'henry.davis@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(15),
            ],
            [
                'name' => 'Lisa Green',
                'email' => 'lisa.green@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(12),
            ],
            [
                'name' => 'Jack Miller',
                'email' => 'jack.miller@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(10),
            ],
            [
                'name' => 'Kate Brown',
                'email' => 'kate.brown@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now()->subDays(8),
            ],
            [
                'name' => 'Leo Garcia',
                'email' => 'leo.garcia@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'pending',
                'kyc_verified_at' => null,
            ],
            [
                'name' => 'Maya Singh',
                'email' => 'maya.singh@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'pending',
                'kyc_verified_at' => null,
            ],
            [
                'name' => 'Noah Taylor',
                'email' => 'noah.taylor@fleetfi.com',
                'password' => Hash::make('driver123'),
                'role' => 'driver',
                'kyc_status' => 'pending',
                'kyc_verified_at' => null,
            ],
        ];

        foreach ($users as $userData) {
            $user = User::create($userData);

            // Create wallet for each user
            Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => '0x' . strtoupper(bin2hex(random_bytes(20))),
                'balance' => $this->getInitialBalance($user->role),
            ]);
        }

        $this->command->info('Created ' . count($users) . ' users with wallets');
    }

    private function getInitialBalance(string $role): float
    {
        return match($role) {
            'admin' => 1000000.00,
            'operator' => 500000.00,
            'investor' => rand(50000, 200000),
            'driver' => rand(5000, 15000),
            default => 0,
        };
    }
}
