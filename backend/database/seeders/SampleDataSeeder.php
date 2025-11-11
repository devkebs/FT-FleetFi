<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SampleDataSeeder extends Seeder
{
    /**
     * Seed comprehensive sample data for API testing
     */
    public function run(): void
    {
        $this->command->info('Seeding sample data for API testing...');

        // Clear existing transaction data
        DB::table('wallet_transactions')->delete();
        DB::table('audit_logs')->delete();

        $this->seedWalletTransactions();
        $this->seedAuditLogs();

        $this->command->info('✓ Sample data seeded successfully!');
    }

    /**
     * Seed wallet transactions for transaction monitoring
     */
    private function seedWalletTransactions(): void
    {
        $users = DB::table('users')->get();

        $transactions = [];
        $transactionTypes = ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'token_purchase', 'payout_received'];
        $statuses = ['completed', 'pending', 'failed'];

        foreach ($users as $user) {
            $numTransactions = rand(3, 8);

            for ($i = 0; $i < $numTransactions; $i++) {
                $type = $transactionTypes[array_rand($transactionTypes)];
                $status = $i === 0 ? 'pending' : ($statuses[array_rand($statuses)]);

                // Determine amount based on type and role
                $amount = match($type) {
                    'deposit' => rand(1000, 50000),
                    'withdrawal' => rand(500, 20000),
                    'token_purchase' => rand(10000, 200000),
                    'payout_received' => rand(2000, 10000),
                    'transfer_in' => rand(1000, 15000),
                    'transfer_out' => rand(1000, 15000),
                    default => rand(100, 1000)
                };

                // Make withdrawals and transfer_out negative
                if (in_array($type, ['withdrawal', 'transfer_out'])) {
                    $amount = -abs($amount);
                }

                $transactions[] = [
                    'wallet_id' => $user->id, // wallet_id matches user_id
                    'user_id' => $user->id,
                    'type' => $type,
                    'amount' => $amount,
                    'currency' => 'NGN',
                    'status' => $status,
                    'tx_hash' => $status === 'completed' ? hash('sha256', Str::random(40)) : null,
                    'from_address' => in_array($type, ['deposit', 'transfer_in']) ? ('0x' . bin2hex(random_bytes(20))) : null,
                    'to_address' => in_array($type, ['withdrawal', 'transfer_out']) ? ('0x' . bin2hex(random_bytes(20))) : null,
                    'related_token_id' => null, // No tokens yet
                    'description' => $this->getTransactionDescription($type, $user->role),
                    'metadata' => json_encode([
                        'ip_address' => '192.168.' . rand(1, 255) . '.' . rand(1, 255),
                        'user_agent' => 'Mozilla/5.0',
                        'device' => rand(0, 1) ? 'web' : 'mobile',
                    ]),
                    'completed_at' => $status === 'completed' ? Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23)) : null,
                    'created_at' => Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
                    'updated_at' => Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
                ];
            }
        }

        // Insert in chunks
        foreach (array_chunk($transactions, 100) as $chunk) {
            DB::table('wallet_transactions')->insert($chunk);
        }

        $this->command->info('  → Created ' . count($transactions) . ' wallet transactions');
    }

    /**
     * Seed audit logs for system monitoring
     */
    private function seedAuditLogs(): void
    {
        $users = DB::table('users')->where('role', 'admin')->get();
        $actions = [
            'user_login' => 'User logged in successfully',
            'user_logout' => 'User logged out',
            'kyc_approved' => 'Approved KYC for user ID: %d',
            'kyc_rejected' => 'Rejected KYC for user ID: %d',
            'user_created' => 'Created new user account',
            'user_updated' => 'Updated user profile',
            'user_deleted' => 'Deleted user account',
            'asset_created' => 'Added new vehicle to fleet',
            'asset_updated' => 'Updated vehicle information',
            'investment_created' => 'New investment received',
            'payout_processed' => 'Processed monthly payout',
            'config_updated' => 'Updated system configuration',
            'api_config_updated' => 'Updated API configuration settings',
            'password_changed' => 'User changed password',
            'transaction_failed' => 'Transaction failed - insufficient funds',
        ];

        $logs = [];

        foreach ($users as $user) {
            $numLogs = rand(10, 25);

            for ($i = 0; $i < $numLogs; $i++) {
                $action = array_rand($actions);
                $description = $actions[$action];

                // Add dynamic user IDs for KYC actions
                if (str_contains($action, 'kyc_')) {
                    $description = sprintf($description, rand(1, 35));
                }

                $logs[] = [
                    'user_id' => $user->id,
                    'action' => $action,
                    'description' => $description,
                    'ip_address' => '192.168.' . rand(1, 255) . '.' . rand(1, 255),
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'metadata' => json_encode([
                        'module' => rand(0, 1) ? 'admin' : 'api',
                        'endpoint' => '/api/admin/' . $action,
                    ]),
                    'created_at' => Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
                    'updated_at' => Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
                ];
            }
        }

        // Insert in chunks
        foreach (array_chunk($logs, 100) as $chunk) {
            DB::table('audit_logs')->insert($chunk);
        }

        $this->command->info('  → Created ' . count($logs) . ' audit log entries');
    }

    /**
     * Get transaction description based on type and role
     */
    private function getTransactionDescription(string $type, string $role): string
    {
        return match($type) {
            'deposit' => 'Wallet deposit via bank transfer',
            'withdrawal' => 'Withdrawal to bank account',
            'token_purchase' => match($role) {
                'investor' => 'Investment in EV fleet tokenization',
                default => 'Purchased fleet asset tokens'
            },
            'payout_received' => match($role) {
                'investor' => 'Monthly revenue payout received',
                'driver' => 'Driver earnings payout',
                'operator' => 'Operator revenue share',
                default => 'System payout'
            },
            'transfer_in' => 'Received wallet transfer',
            'transfer_out' => 'Sent wallet transfer',
            default => 'General transaction'
        };
    }
}
