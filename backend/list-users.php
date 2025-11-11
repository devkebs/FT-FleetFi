<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n=== FleetFi User Accounts ===\n\n";

$users = DB::table('users')
    ->select('id', 'name', 'email', 'role', 'kyc_status')
    ->orderBy('role')
    ->orderBy('id')
    ->get();

$roleGroups = $users->groupBy('role');

foreach ($roleGroups as $role => $roleUsers) {
    echo strtoupper($role) . " USERS (" . $roleUsers->count() . "):\n";
    echo str_repeat('-', 100) . "\n";

    foreach ($roleUsers as $user) {
        $password = match($role) {
            'admin' => 'admin123',
            'operator' => 'operator123',
            'investor' => 'investor123',
            'driver' => 'driver123',
            default => 'password123'
        };

        printf(
            "ID: %-3d | %-30s | %-35s | KYC: %-10s | Password: %s\n",
            $user->id,
            $user->name,
            $user->email,
            $user->kyc_status,
            $password
        );
    }
    echo "\n";
}

echo "Total Users: " . $users->count() . "\n";
echo "\nQuick Test Accounts:\n";
echo "  Admin:    admin@fleetfi.com / admin123\n";
echo "  Operator: operator1@fleetfi.com / operator123\n";
echo "  Investor: john.investor@example.com / investor123\n";
echo "  Driver:   tom.driver@fleetfi.com / driver123\n";
echo "\n";
