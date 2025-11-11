<?php

namespace Database\Factories;

use App\Models\Wallet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class WalletFactory extends Factory
{
    protected $model = Wallet::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'wallet_address' => '0x' . bin2hex(random_bytes(20)),
            'trovotech_wallet_id' => 'TROVO_' . strtoupper(substr(md5(uniqid()), 0, 16)),
            'balance' => $this->faker->numberBetween(0, 1000000),
            'currency' => 'NGN',
            'status' => 'active',
        ];
    }
}
