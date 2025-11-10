<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Asset;
use App\Models\Token;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InvestmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $investor;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->investor = User::factory()->create(['role' => 'investor']);
        $this->token = $this->investor->createToken('test-token')->plainTextToken;
    }

    public function test_investor_can_mint_token_for_asset()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/trovotech/token/mint', [
            'assetId' => 'VEH001',
            'assetType' => 'EV',
            'fractionOwned' => 10,
            'investAmount' => 50000,
            'investorWallet' => '0xTestWallet',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'tokenId',
                'assetId',
                'assetModel',
                'fractionOwned',
                'investmentAmount',
                'currentValue',
                'chain',
                'mintedAt',
            ]);

        $this->assertDatabaseHas('tokens', [
            'user_id' => $this->investor->id,
            'fraction_owned' => 10,
            'investment_amount' => 50000,
        ]);

        $this->assertDatabaseHas('assets', [
            'asset_id' => 'VEH001',
            'type' => 'EV',
        ]);
    }

    public function test_cannot_invest_more_than_remaining_ownership()
    {
        $asset = Asset::factory()->create(['asset_id' => 'VEH002']);
        Token::factory()->create([
            'user_id' => User::factory()->create()->id,
            'asset_id' => $asset->id,
            'fraction_owned' => 95,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/trovotech/token/mint', [
            'assetId' => 'VEH002',
            'assetType' => 'EV',
            'fractionOwned' => 10,
            'investAmount' => 50000,
            'investorWallet' => '0xTestWallet',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Insufficient remaining ownership']);
    }

    public function test_investor_can_get_their_tokens()
    {
        $asset = Asset::factory()->create();
        Token::factory()->count(2)->create([
            'user_id' => $this->investor->id,
            'asset_id' => $asset->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/trovotech/tokens/my');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_multiple_investors_can_own_fractions_of_same_asset()
    {
        $asset = Asset::factory()->create(['asset_id' => 'VEH003']);
        
        // First investor owns 40%
        Token::factory()->create([
            'user_id' => User::factory()->create()->id,
            'asset_id' => $asset->id,
            'fraction_owned' => 40,
        ]);

        // Current investor invests 30%
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/trovotech/token/mint', [
            'assetId' => 'VEH003',
            'assetType' => 'EV',
            'fractionOwned' => 30,
            'investAmount' => 150000,
            'investorWallet' => '0xTestWallet',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tokens', [
            'user_id' => $this->investor->id,
            'fraction_owned' => 30,
        ]);

        // Verify remaining ownership is 30%
        $response->assertJsonPath('remainingOwnership', 30);
    }
}
