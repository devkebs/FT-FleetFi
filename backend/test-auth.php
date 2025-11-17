<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing Auth Token Generation ===\n\n";

// Get admin user
$admin = App\Models\User::where('email', 'admin@fleetfi.com')->first();

if (!$admin) {
    echo "ERROR: Admin user not found!\n";
    exit(1);
}

echo "Admin user found:\n";
echo "  ID: {$admin->id}\n";
echo "  Name: {$admin->name}\n";
echo "  Email: {$admin->email}\n";
echo "  Role: {$admin->role}\n\n";

// Check existing tokens
$existingTokens = DB::table('personal_access_tokens')->where('tokenable_id', $admin->id)->count();
echo "Existing tokens: {$existingTokens}\n";

if ($existingTokens > 0) {
    echo "Clearing old tokens...\n";
    DB::table('personal_access_tokens')->where('tokenable_id', $admin->id)->delete();
}

// Create new token
$token = $admin->createToken('admin-dashboard')->plainTextToken;

echo "\nNew token created:\n";
echo "  Token: {$token}\n\n";

echo "You can use this token to test API calls:\n";
echo "curl -H \"Authorization: Bearer {$token}\" -H \"Accept: application/json\" http://127.0.0.1:8000/api/admin/users\n";
