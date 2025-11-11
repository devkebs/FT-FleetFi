<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Payout;
use App\Models\User;
use App\Models\Token;
use App\Models\WalletTransaction;

class PayoutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $investors = User::where('role', 'investor')
            ->where('kyc_status', 'approved')
            ->get();

        if ($investors->isEmpty()) {
            $this->command->warn('No approved investors found.');
            return;
        }

        $totalPayouts = 0;

        foreach ($investors as $investor) {
            // Each investor gets 2-5 payouts over the last 90 days
            $numPayouts = rand(2, 5);

            for ($i = 0; $i < $numPayouts; $i++) {
                $amount = rand(500, 5000) / 10; // $50 to $500
                $status = $this->getPayoutStatus($i);
                $createdAt = now()->subDays(rand(10, 90));

                $payout = Payout::create([
                    'user_id' => $investor->id,
                    'amount' => $amount,
                    'status' => $status,
                    'payout_method' => 'bank_transfer',
                    'scheduled_date' => $createdAt,
                    'processed_date' => $status === 'completed' ? $createdAt->addDays(rand(1, 3)) : null,
                    'created_at' => $createdAt,
                ]);

                // Create wallet transaction for completed payouts
                if ($status === 'completed') {
                    WalletTransaction::create([
                        'user_id' => $investor->id,
                        'type' => 'credit',
                        'amount' => $amount,
                        'description' => "Payout #{$payout->id} - Investment returns",
                        'status' => 'completed',
                        'created_at' => $payout->processed_date,
                    ]);
                }

                $totalPayouts++;
            }
        }

        $this->command->info("Created {$totalPayouts} payout records");
    }

    private function getPayoutStatus(int $index): string
    {
        // Most payouts are completed, some pending, few failed
        if ($index === 0) {
            return ['pending', 'failed'][rand(0, 1)]; // Latest payout might be pending/failed
        }

        $random = rand(1, 100);
        if ($random > 95) return 'failed';
        if ($random > 85) return 'pending';
        return 'completed';
    }
}
