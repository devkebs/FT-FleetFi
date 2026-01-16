<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Str;

class WalletTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates wallets and comprehensive transaction history for all users
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Create or get wallet for user
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'wallet_address' => 'G' . strtoupper(Str::random(55)), // Stellar-like address
                    'trovotech_wallet_id' => 'TRV-' . strtoupper(Str::random(16)),
                    'balance' => $this->getInitialBalance($user->role),
                    'currency' => 'NGN',
                    'status' => 'active',
                    'verified_at' => now()->subDays(rand(7, 30)),
                ]
            );

            // Generate transaction history based on role
            $this->generateTransactionHistory($wallet, $user);
        }

        $this->command->info('Wallet transactions seeded successfully!');
        $this->command->info('Total wallets: ' . Wallet::count());
        $this->command->info('Total transactions: ' . WalletTransaction::count());
    }

    private function getInitialBalance(string $role): float
    {
        return match ($role) {
            'admin' => rand(500000, 1000000),
            'operator' => rand(200000, 500000),
            'investor' => rand(50000, 200000),
            'driver' => rand(5000, 50000),
            default => rand(10000, 50000),
        };
    }

    private function generateTransactionHistory(Wallet $wallet, User $user): void
    {
        $transactionTypes = $this->getTransactionTypesForRole($user->role);
        $numTransactions = rand(5, 15);

        // Start from 30 days ago
        $startDate = now()->subDays(30);

        for ($i = 0; $i < $numTransactions; $i++) {
            $type = $transactionTypes[array_rand($transactionTypes)];
            $transactionDate = $startDate->copy()->addDays(rand(0, 30))->addHours(rand(0, 23));

            $transaction = $this->createTransaction($wallet, $user, $type, $transactionDate);
        }
    }

    private function getTransactionTypesForRole(string $role): array
    {
        return match ($role) {
            'investor' => ['deposit', 'token_purchase', 'payout_received', 'withdrawal', 'transfer_out'],
            'operator' => ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payout_received'],
            'driver' => ['payout_received', 'withdrawal', 'transfer_in', 'deposit'],
            'admin' => ['deposit', 'withdrawal', 'transfer_in', 'transfer_out'],
            default => ['deposit', 'withdrawal'],
        };
    }

    private function createTransaction(Wallet $wallet, User $user, string $type, $date): WalletTransaction
    {
        $amount = $this->getAmountForType($type, $user->role);
        $status = $this->getRandomStatus();

        $descriptions = $this->getDescriptionsForType($type);
        $description = $descriptions[array_rand($descriptions)];

        return WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'user_id' => $user->id,
            'type' => $type,
            'amount' => $amount,
            'currency' => 'NGN',
            'status' => $status,
            'tx_hash' => $status === 'completed' ? $this->generateTxHash() : null,
            'from_address' => in_array($type, ['deposit', 'transfer_in', 'payout_received'])
                ? 'G' . strtoupper(Str::random(55))
                : $wallet->wallet_address,
            'to_address' => in_array($type, ['withdrawal', 'transfer_out', 'token_purchase'])
                ? 'G' . strtoupper(Str::random(55))
                : $wallet->wallet_address,
            'description' => $description,
            'metadata' => $this->generateMetadata($type),
            'completed_at' => $status === 'completed' ? $date : null,
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    private function getAmountForType(string $type, string $role): float
    {
        $baseAmount = match ($type) {
            'deposit' => rand(10000, 100000),
            'withdrawal' => rand(5000, 50000),
            'transfer_in' => rand(1000, 20000),
            'transfer_out' => rand(1000, 20000),
            'token_purchase' => rand(25000, 150000),
            'payout_received' => rand(2000, 25000),
            default => rand(1000, 10000),
        };

        // Adjust based on role
        $multiplier = match ($role) {
            'admin' => 2.0,
            'operator' => 1.5,
            'investor' => 1.2,
            'driver' => 0.5,
            default => 1.0,
        };

        return round($baseAmount * $multiplier, 2);
    }

    private function getRandomStatus(): string
    {
        $rand = rand(1, 100);
        if ($rand <= 85) return 'completed';
        if ($rand <= 95) return 'pending';
        return 'failed';
    }

    private function generateTxHash(): string
    {
        return '0x' . bin2hex(random_bytes(32));
    }

    private function getDescriptionsForType(string $type): array
    {
        return match ($type) {
            'deposit' => [
                'Bank transfer deposit',
                'Paystack deposit',
                'Flutterwave deposit',
                'Mobile money deposit',
                'Card deposit',
            ],
            'withdrawal' => [
                'Bank withdrawal',
                'ATM withdrawal',
                'Mobile money withdrawal',
                'Transfer to bank account',
            ],
            'transfer_in' => [
                'Received from user',
                'Internal transfer received',
                'Bonus credit',
                'Referral bonus',
            ],
            'transfer_out' => [
                'Transfer to user',
                'Internal transfer sent',
                'Payment for services',
            ],
            'token_purchase' => [
                'E-Keke Token Purchase - 25% stake',
                'E-Keke Token Purchase - 50% stake',
                'Battery Asset Token - 10% stake',
                'Fleet Token Investment',
                'EV Asset Fractional Purchase',
            ],
            'payout_received' => [
                'Monthly revenue share payout',
                'Quarterly dividend payout',
                'Driver earnings payout',
                'Operator commission payout',
                'Investment returns',
            ],
            default => ['Transaction'],
        };
    }

    private function generateMetadata(string $type): array
    {
        $base = [
            'source' => 'FleetFi Platform',
            'version' => '1.0',
        ];

        return match ($type) {
            'token_purchase' => array_merge($base, [
                'asset_type' => ['E-Keke', 'Battery', 'Charging Cabinet'][rand(0, 2)],
                'fraction_percentage' => rand(10, 50),
                'roi_projection' => rand(15, 45) . '%',
            ]),
            'payout_received' => array_merge($base, [
                'payout_period' => now()->subMonth()->format('F Y'),
                'gross_revenue' => rand(50000, 200000),
                'share_percentage' => rand(40, 60),
            ]),
            'deposit' => array_merge($base, [
                'payment_method' => ['bank_transfer', 'card', 'mobile_money'][rand(0, 2)],
                'reference' => 'REF-' . strtoupper(Str::random(10)),
            ]),
            'withdrawal' => array_merge($base, [
                'bank_name' => ['GTBank', 'First Bank', 'Access Bank', 'Zenith Bank'][rand(0, 3)],
                'account_last4' => rand(1000, 9999),
            ]),
            default => $base,
        };
    }
}
