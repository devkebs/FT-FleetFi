<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('🌱 Starting FleetFi Database Seeding...');

        $this->call([
            UserSeeder::class,
        ]);

        $this->command->info('✅ FleetFi Database Seeding Complete!');
    }
}
