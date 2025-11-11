<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Testing Admin Dashboard Endpoints ===\n\n";

// Test 1: Get Users
echo "1. Testing getUsers() method:\n";
$users = App\Models\User::with('wallet:id,user_id,balance,currency')
    ->select('id', 'name', 'email', 'role', 'kyc_status', 'kyc_verified_at', 'created_at', 'updated_at')
    ->orderBy('created_at', 'desc')
    ->take(5)
    ->get();

echo "   Users found: " . $users->count() . "\n";
foreach ($users as $user) {
    $balance = $user->wallet ? $user->wallet->balance : 'N/A';
    echo "   - {$user->name} ({$user->email}) | Role: {$user->role} | KYC: {$user->kyc_status} | Balance: {$balance}\n";
}
echo "\n";

// Test 2: Get KYC submissions
echo "2. Testing kycManagement() method:\n";
$kycUsers = App\Models\User::select('id', 'name', 'email', 'role', 'kyc_status', 'kyc_document_type', 'kyc_submitted_at', 'created_at')
    ->orderBy('created_at', 'desc')
    ->take(5)
    ->get();

echo "   KYC submissions found: " . $kycUsers->count() . "\n";
foreach ($kycUsers as $user) {
    echo "   - {$user->name} | KYC: {$user->kyc_status} | Doc: " . ($user->kyc_document_type ?? 'N/A') . "\n";
}
echo "\n";

// Test 3: Get Transactions
echo "3. Testing getTransactions() method:\n";
$transactions = App\Models\WalletTransaction::with('user:id,name,email', 'wallet:id,user_id,balance')
    ->orderBy('created_at', 'desc')
    ->take(5)
    ->get();

echo "   Transactions found: " . $transactions->count() . "\n";
foreach ($transactions as $txn) {
    $userName = $txn->user ? $txn->user->name : 'N/A';
    echo "   - ID: {$txn->id} | User: {$userName} | Type: {$txn->type} | Amount: {$txn->amount} {$txn->currency}\n";
}
echo "\n";

// Test 4: Stats
echo "4. Testing KYC stats:\n";
$stats = [
    'total' => App\Models\User::whereNotNull('kyc_status')->count(),
    'pending' => App\Models\User::where('kyc_status', 'pending')->count(),
    'verified' => App\Models\User::where('kyc_status', 'verified')->count(),
    'approved' => App\Models\User::where('kyc_status', 'approved')->count(),
    'rejected' => App\Models\User::where('kyc_status', 'rejected')->count(),
];
echo "   Total: {$stats['total']}, Verified: {$stats['verified']}, Pending: {$stats['pending']}, Approved: {$stats['approved']}, Rejected: {$stats['rejected']}\n";
echo "\n";

echo "=== All Tests Completed ===\n";
