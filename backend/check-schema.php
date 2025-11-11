<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "\n=== Database Schema Inspector ===\n\n";

// Check assets table
if (Schema::hasTable('assets')) {
    echo "ASSETS TABLE:\n";
    $columns = Schema::getColumnListing('assets');
    foreach ($columns as $col) {
        echo "  - {$col}\n";
    }
} else {
    echo "Assets table does not exist\n";
}

echo "\n";

// Check vehicles table
if (Schema::hasTable('vehicles')) {
    echo "VEHICLES TABLE:\n";
    $columns = Schema::getColumnListing('vehicles');
    foreach ($columns as $col) {
        echo "  - {$col}\n";
    }
} else {
    echo "Vehicles table does not exist\n";
}

echo "\n";

// Check wallet_transactions
if (Schema::hasTable('wallet_transactions')) {
    echo "WALLET_TRANSACTIONS TABLE:\n";
    $columns = Schema::getColumnListing('wallet_transactions');
    foreach ($columns as $col) {
        echo "  - {$col}\n";
    }
    echo "\nCurrent count: " . DB::table('wallet_transactions')->count() . "\n";
} else {
    echo "Wallet_transactions table does not exist\n";
}

echo "\n";
