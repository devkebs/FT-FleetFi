<?php

namespace Database\Factories;

use App\Models\Token;
use App\Models\User;
use App\Models\Asset;
use Illuminate\Database\Eloquent\Factories\Factory;

class TokenFactory extends Factory
{
    protected $model = Token::class;

    public function definition(): array
    {
        $investmentAmount = $this->faker->numberBetween(50000, 1000000);
        $fractionOwned = $this->faker->numberBetween(5, 50);

        return [
            'user_id' => User::factory(),
            'asset_id' => Asset::factory(),
            'token_id' => 'TOKEN_' . strtoupper($this->faker->unique()->bothify('????????????????')),
            'shares' => $fractionOwned,
            'fraction_owned' => $fractionOwned,
            'investment_amount' => $investmentAmount,
            'current_value' => $investmentAmount * $this->faker->randomFloat(2, 0.9, 1.3),
            'total_returns' => $this->faker->numberBetween(0, $investmentAmount * 0.2),
            'status' => $this->faker->randomElement(['active', 'sold', 'liquidated']),
            'chain' => 'polygon',
            'minted_at' => now()->subDays(rand(1, 90)),
            'metadata_hash' => 'IPFS_' . md5($this->faker->uuid),
            'trustee_ref' => 'TRUSTEE_' . time() . rand(1000, 9999),
            'tx_hash' => 'BANTU_TX_' . strtoupper($this->faker->bothify('????????????????????????????????')),
        ];
    }
}
