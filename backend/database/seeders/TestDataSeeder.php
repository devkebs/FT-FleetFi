<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    /**
     * Run all test data seeders
     */
    public function run(): void
    {
        $this->command->info('=== Seeding Test Data for API Testing ===');
        $this->command->newLine();

        // Seed users first (if not already seeded)
        $this->call([
            UserSeeder::class,
            SampleDataSeeder::class,
            AssetVehicleTestDataSeeder::class,
        ]);

        $this->command->newLine();
        $this->command->info('=== Test Data Seeding Complete ===');
        $this->command->info('You can now test all admin dashboard APIs with realistic data');
    }
}
