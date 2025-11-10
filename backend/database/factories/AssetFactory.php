<?php

namespace Database\Factories;

use App\Models\Asset;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssetFactory extends Factory
{
    protected $model = Asset::class;

    public function definition(): array
    {
        $types = ['vehicle', 'battery', 'charging_cabinet'];
        $type = $this->faker->randomElement($types);

        return [
            'asset_id' => strtoupper($this->faker->unique()->bothify('???###')),
            'type' => $type,
            'model' => $this->faker->randomElement([
                'Tesla Model 3',
                'Nissan Leaf',
                'BYD E6',
                'LG Chem Battery Pack',
                'CATL Battery 100kWh',
                'ABB Charging Station',
            ]),
            'status' => $this->faker->randomElement(['active', 'maintenance', 'retired']),
            'soh' => $this->faker->numberBetween(70, 100),
            'swaps' => $this->faker->numberBetween(0, 500),
            'location' => $this->faker->randomElement(['Lagos', 'Abuja', 'Port Harcourt', 'Kano']),
            'original_value' => $this->faker->numberBetween(500000, 5000000),
            'current_value' => $this->faker->numberBetween(400000, 4500000),
            'daily_swaps' => $this->faker->numberBetween(0, 50),
            'is_tokenized' => $this->faker->boolean(40),
        ];
    }
}
