<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class FleetFiTestUsersSeeder extends Seeder
{
    public function run()
    {
        // Clear existing test users
        User::where('email', 'LIKE', '%@fleetfi.test')->delete();

        // Passwords meet security requirements: 12+ chars, uppercase, lowercase, number, special char
        $users = [
            [
                'name' => 'John Operator',
                'email' => 'operator@fleetfi.test',
                'password' => Hash::make('Operator123#'),
                'role' => 'operator',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Mary Driver',
                'email' => 'driver@fleetfi.test',
                'password' => Hash::make('Driver12345#'),
                'role' => 'driver',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'David Investor',
                'email' => 'investor@fleetfi.test',
                'password' => Hash::make('Investor123#'),
                'role' => 'investor',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Admin User',
                'email' => 'admin@fleetfi.test',
                'password' => Hash::make('AdminPass123#'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            User::create($userData);
            echo "Created user: {$userData['email']}\n";
        }

        echo "\n✅ Test users created successfully!\n";
    }
}
