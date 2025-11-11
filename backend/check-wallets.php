<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Checking Wallets ===\n\n";

// Check if wallets table exists
if (Schema::hasTable('wallets')) {
    echo "WALLETS TABLE EXISTS\n";
    echo "Columns:\n";
    $columns = Schema::getColumnListing('wallets');
    foreach ($columns as $column) {
        echo "  - {$column}\n";
    }
    
    echo "\nWallets count: " . DB::table('wallets')->count() . "\n";
    
    $wallet = DB::table('wallets')->first();
    if ($wallet) {
        echo "\nSample wallet:\n";
        print_r($wallet);
    }
} else {
    echo "WALLETS TABLE DOES NOT EXIST\n";
}
