<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== Testing Operator Accounts ===\n\n";

$operators = User::where('role', 'operator')->get();

echo "Total operators found: " . $operators->count() . "\n\n";

foreach ($operators as $op) {
    echo "Email: " . $op->email . "\n";
    echo "Name: " . $op->name . "\n";
    echo "Role: " . $op->role . "\n";

    // Test password
    $passwordWorks = Hash::check('operator123', $op->password);
    echo "Password 'operator123' works: " . ($passwordWorks ? 'YES' : 'NO') . "\n";
    echo "---\n";
}
