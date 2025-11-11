<?php

namespace Database\Factories;

use App\Models\WalletTransaction;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Factories\Factory;

class WalletTransactionFactory extends Factory
{
    protected $model = WalletTransaction::class;

    public function definition(): array
    {
        $wallet = Wallet::factory()->create();
        
        return [
            'wallet_id' => $wallet->id,
            'user_id' => $wallet->user_id,
            'type' => $this->faker->randomElement([
                'deposit',
                'withdrawal',
                'transfer_in',
                'transfer_out',
                'token_purchase',
                'payout_received',
            ]),
            'amount' => $this->faker->numberBetween(1000, 500000),
            'description' => $this->faker->sentence(6),
            'status' => $this->faker->randomElement(['pending', 'completed', 'failed']),
            'tx_hash' => $this->faker->optional()->sha256,
            'metadata' => null,
        ];
    }
}
