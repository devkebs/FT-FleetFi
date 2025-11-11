<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Test Data Summary ===\n\n";

echo "Wallet Transactions: " . DB::table('wallet_transactions')->count() . "\n";
echo "Assets: " . DB::table('assets')->count() . "\n";
echo "Vehicles: " . DB::table('vehicles')->count() . "\n";
echo "Users: " . DB::table('users')->count() . "\n";
echo "Wallets: " . DB::table('wallets')->count() . "\n\n";

echo "Sample transaction:\n";
$txn = DB::table('wallet_transactions')->first();
if ($txn) {
    echo "  Type: {$txn->type}\n";
    echo "  Amount: {$txn->amount} {$txn->currency}\n";
    echo "  Status: {$txn->status}\n";
}

echo "\nSample asset:\n";
$asset = DB::table('assets')->first();
if ($asset) {
    echo "  ID: {$asset->asset_id}\n";
    echo "  Type: {$asset->type}\n";
    echo "  Model: {$asset->model}\n";
    echo "  Status: {$asset->status}\n";
}
