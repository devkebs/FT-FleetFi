<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement([
                'kyc_approved',
                'kyc_rejected',
                'investment_completed',
                'payout_received',
                'system_alert',
            ]),
            'title' => $this->faker->sentence(5),
            'message' => $this->faker->sentence(10),
            'data' => null,
            'action_url' => $this->faker->optional()->url(),
            'is_read' => $this->faker->boolean(30),
            'read_at' => function (array $attributes) {
                return $attributes['is_read'] ? now()->subHours(rand(1, 48)) : null;
            },
        ];
    }

    public function unread(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_read' => true,
            'read_at' => now()->subHours(rand(1, 48)),
        ]);
    }
}
