<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Token;
use App\Models\Asset;
use App\Models\User;
use App\Models\WalletTransaction;

class InvestmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $investors = User::where('role', 'investor')
            ->where('kyc_status', 'verified')
            ->get();

        $assets = Asset::all();

        if ($investors->isEmpty() || $assets->isEmpty()) {
            $this->command->warn('No investors or assets found. Please run UserSeeder and AssetVehicleSeeder first.');
            return;
        }

        $totalInvestments = 0;

        // Each investor invests in 1-5 assets
        foreach ($investors as $investor) {
            $numInvestments = rand(1, 5);
            $randomAssets = $assets->random(min($numInvestments, $assets->count()));

            foreach ($randomAssets as $asset) {
                // Random investment amount (10% to 50% of asset value)
                $investmentAmount = $asset->value * (rand(10, 50) / 100);
                $tokenCount = rand(100, 5000);

                Token::create([
                    'user_id' => $investor->id,
                    'asset_id' => $asset->id,
                    'token_count' => $tokenCount,
                    'amount' => $investmentAmount,
                    'purchase_price' => $investmentAmount / $tokenCount,
                    'purchase_date' => now()->subDays(rand(1, 60)),
                    'status' => 'active',
                ]);

                // Create wallet transaction for the investment
                WalletTransaction::create([
                    'user_id' => $investor->id,
                    'type' => 'debit',
                    'amount' => $investmentAmount,
                    'description' => "Investment in {$asset->name}",
                    'status' => 'completed',
                    'created_at' => now()->subDays(rand(1, 60)),
                ]);

                $totalInvestments++;
            }
        }

        $this->command->info("Created {$totalInvestments} token investments");
    }
}
