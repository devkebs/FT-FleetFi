<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;
use App\Models\Revenue;
use App\Models\Activity;
use App\Models\User;

class DemoDataSeeder extends Seeder
{
    public function run()
    {
        // Create some vehicles
        $vehicles = [
            [
                'name' => 'Tesla Model 3',
                'status' => 'active',
                'type' => 'sedan',
                'plate_number' => 'EV-001',
            ],
            [
                'name' => 'Tesla Model Y',
                'status' => 'active',
                'type' => 'suv',
                'plate_number' => 'EV-002',
            ],
            [
                'name' => 'Chevrolet Bolt',
                'status' => 'maintenance',
                'type' => 'hatchback',
                'plate_number' => 'EV-003',
            ],
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::create($vehicle);
        }

        // Create some revenue records
        $revenues = [
            [
                'vehicle_id' => 1,
                'amount' => 1200.00,
                'date' => now()->subDays(5),
                'description' => 'Weekly rental',
                'type' => 'rental'
            ],
            [
                'vehicle_id' => 2,
                'amount' => 900.00,
                'date' => now()->subDays(3),
                'description' => 'Weekly rental',
                'type' => 'rental'
            ],
            [
                'vehicle_id' => 1,
                'amount' => 150.00,
                'date' => now()->subDays(2),
                'description' => 'Maintenance service',
                'type' => 'service'
            ],
        ];

        foreach ($revenues as $revenue) {
            Revenue::create($revenue);
        }

        // Create some activities
        $admin = User::where('email', 'admin@fleetfi.com')->first();

        $activities = [
            [
                'user_id' => $admin->id,
                'vehicle_id' => 1,
                'action' => 'Vehicle Rental',
                'status' => 'completed',
                'description' => 'Vehicle rented for 1 week',
            ],
            [
                'user_id' => $admin->id,
                'vehicle_id' => 2,
                'action' => 'Vehicle Rental',
                'status' => 'completed',
                'description' => 'Vehicle rented for 1 week',
            ],
            [
                'user_id' => $admin->id,
                'vehicle_id' => 3,
                'action' => 'Maintenance',
                'status' => 'in-progress',
                'description' => 'Regular maintenance check',
            ],
            [
                'user_id' => $admin->id,
                'vehicle_id' => 1,
                'action' => 'Revenue Collection',
                'status' => 'completed',
                'description' => 'Weekly rental payment received',
            ],
        ];

        foreach ($activities as $activity) {
            Activity::create($activity);
        }
    }
}
