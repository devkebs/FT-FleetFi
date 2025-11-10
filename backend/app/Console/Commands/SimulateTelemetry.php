<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Asset;
use App\Models\Telemetry;

class SimulateTelemetry extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'telemetry:simulate
                            {--interval=5 : Seconds between telemetry generation}
                            {--count= : Total number of iterations (omit for infinite)}
                            {--assets= : Comma-separated asset IDs to simulate (omit for all active assets)}';

    /**
     * The console command description.
     */
    protected $description = 'Continuously generate simulated telemetry data for active assets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $interval = (int) $this->option('interval');
        $count = $this->option('count') ? (int) $this->option('count') : null;
        $assetFilter = $this->option('assets');

        $this->info('Starting telemetry simulator...');
        $this->info("Interval: {$interval}s | Count: " . ($count ?? 'infinite'));

        $iteration = 0;
        while (true) {
            $iteration++;

            // Fetch assets to simulate
            $query = Asset::query();
            if ($assetFilter) {
                $assetIds = array_map('trim', explode(',', $assetFilter));
                $query->whereIn('asset_id', $assetIds);
            } else {
                $query->where('status', 'active');
            }
            $assets = $query->get();

            if ($assets->isEmpty()) {
                $this->warn('No assets found to simulate telemetry.');
                break;
            }

            // Generate telemetry for each asset
            foreach ($assets as $asset) {
                Telemetry::create([
                    'asset_id' => $asset->asset_id,
                    'battery_level' => rand(10, 100),
                    'km' => rand(0, 5000) + rand(0, 99) / 100,
                    'latitude' => $this->randLat(),
                    'longitude' => $this->randLng(),
                    'speed' => rand(0, 80),
                    'status' => $this->randomStatus(),
                    'temperature' => rand(20, 45) + rand(0, 99) / 100,
                    'voltage' => rand(40, 55) + rand(0, 99) / 100,
                    'current' => rand(5, 40) + rand(0, 99) / 100,
                    'recorded_at' => now(),
                    'oem_source' => $this->randomOem(),
                ]);
            }

            $this->info("[Iteration {$iteration}] Generated telemetry for " . $assets->count() . " assets.");

            // Exit if count limit reached
            if ($count && $iteration >= $count) {
                $this->info('Reached iteration limit. Exiting.');
                break;
            }

            // Sleep for interval
            sleep($interval);
        }

        return 0;
    }

    /**
     * Generate random latitude within Nigeria/West Africa.
     */
    private function randLat(): float
    {
        return 4.0 + mt_rand() / mt_getrandmax() * (13.0 - 4.0);
    }

    /**
     * Generate random longitude within Nigeria/West Africa.
     */
    private function randLng(): float
    {
        return 2.0 + mt_rand() / mt_getrandmax() * (15.0 - 2.0);
    }

    /**
     * Random telemetry status.
     */
    private function randomStatus(): string
    {
        $statuses = ['idle', 'in_transit', 'charging', 'swapping'];
        return $statuses[array_rand($statuses)];
    }

    /**
     * Random OEM source.
     */
    private function randomOem(): string
    {
        $oems = ['qoura', 'oem_alpha', 'oem_beta'];
        return $oems[array_rand($oems)];
    }
}
