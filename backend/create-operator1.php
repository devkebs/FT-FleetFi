<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Check if operator1 exists
$existing = User::where('email', 'operator1@fleetfi.com')->first();

if ($existing) {
    echo "operator1@fleetfi.com already exists!\n";
    echo "Name: " . $existing->name . "\n";
    echo "Role: " . $existing->role . "\n";
} else {
    // Create operator1
    $user = User::create([
        'name' => 'Fleet Operator One',
        'email' => 'operator1@fleetfi.com',
        'password' => Hash::make('operator123'),
        'role' => 'operator',
        'kyc_status' => 'verified',
        'kyc_verified_at' => now()->subDays(10),
    ]);

    echo "✅ Created operator1@fleetfi.com successfully!\n";
    echo "Name: " . $user->name . "\n";
    echo "Role: " . $user->role . "\n";
}
