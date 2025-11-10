<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get admin user and create token
$admin = App\Models\User::where('role', 'admin')->first();
if (!$admin) {
    echo "No admin user found!\n";
    exit(1);
}

$token = $admin->createToken('analytics-test')->plainTextToken;
echo "Admin: {$admin->name} ({$admin->email})\n";
echo "Token: {$token}\n\n";

// Test the analytics endpoint
$url = 'http://127.0.0.1:8000/api/analytics/dashboard';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: {$httpCode}\n";
echo "Response:\n";
echo $response;
echo "\n";
