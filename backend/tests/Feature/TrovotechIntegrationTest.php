<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Asset;
use App\Models\Wallet;
use App\Models\Token as AssetToken;
use App\Models\WebhookLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

class TrovotechIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $investor;
    protected $asset;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test investor
        $this->investor = User::factory()->create([
            'email' => 'investor@test.com',
            'role' => 'investor',
            'kyc_status' => 'verified',
        ]);

        // Create test asset
        $this->asset = Asset::factory()->create([
            'asset_id' => 'TEST_EV_001',
            'type' => 'EV',
            'model' => 'Test Electric Vehicle',
            'status' => 'Available',
            'soh' => 95,
        ]);

        // Enable sandbox mode for testing
        Config::set('services.trovotech.sandbox_mode', true);
    }

    /** @test */
    public function test_wallet_creation_flow()
    {
        $this->actingAs($this->investor, 'sanctum');

        // Create wallet
        $response = $this->postJson('/api/trovotech/wallet/create');

        $response->assertStatus(201)
            ->assertJsonStructure([
                'walletAddress',
                'balance',
                'trusteeRef',
                'createdAt',
            ]);

        // Verify wallet stored in database
        $this->assertDatabaseHas('wallets', [
            'user_id' => $this->investor->id,
        ]);

        // Subsequent call should return existing wallet
        $response2 = $this->postJson('/api/trovotech/wallet/create');
        $response2->assertStatus(200);

        // Wallet address should be same
        $this->assertEquals(
            $response->json('walletAddress'),
            $response2->json('walletAddress')
        );
    }

    /** @test */
    public function test_token_minting_flow()
    {
        // Create wallet first
        $wallet = Wallet::create([
            'user_id' => $this->investor->id,
            'wallet_address' => 'GBANTU' . strtoupper(substr(md5('test'), 0, 48)),
            'balance' => 100000,
        ]);

        $this->actingAs($this->investor, 'sanctum');

        // Mint token
        $mintRequest = [
            'assetId' => (string) $this->asset->id,
            'assetType' => 'EV',
            'fractionOwned' => 25,
            'investAmount' => 50000,
            'investorWallet' => $wallet->wallet_address,
        ];

        $response = $this->postJson('/api/trovotech/token/mint', $mintRequest);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'tokenId',
                'assetId',
                'fractionOwned',
                'investmentAmount',
                'txHash',
                'mintedAt',
            ]);

        // Verify token stored in database
        $this->assertDatabaseHas('tokens', [
            'user_id' => $this->investor->id,
            'asset_id' => $this->asset->id,
            'fraction_owned' => 25,
            'investment_amount' => 50000,
        ]);

        // Verify asset ownership tracking
        $allocated = AssetToken::where('asset_id', $this->asset->id)
            ->sum('fraction_owned');
        $this->assertEquals(25, $allocated);
    }

    /** @test */
    public function test_ownership_allocation_limits()
    {
        $wallet = Wallet::create([
            'user_id' => $this->investor->id,
            'wallet_address' => 'GBANTU' . strtoupper(substr(md5('test'), 0, 48)),
            'balance' => 500000,
        ]);

        $this->actingAs($this->investor, 'sanctum');

        // Mint 80% ownership
        $this->postJson('/api/trovotech/token/mint', [
            'assetId' => (string) $this->asset->id,
            'assetType' => 'EV',
            'fractionOwned' => 80,
            'investAmount' => 200000,
            'investorWallet' => $wallet->wallet_address,
        ])->assertStatus(201);

        // Try to mint another 30% (should fail - exceeds 100%)
        $response = $this->postJson('/api/trovotech/token/mint', [
            'assetId' => (string) $this->asset->id,
            'assetType' => 'EV',
            'fractionOwned' => 30,
            'investAmount' => 75000,
            'investorWallet' => $wallet->wallet_address,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Insufficient remaining ownership',
            ]);

        // Verify only 80% allocated
        $allocated = AssetToken::where('asset_id', $this->asset->id)
            ->sum('fraction_owned');
        $this->assertEquals(80, $allocated);
    }

    /** @test */
    public function test_webhook_token_minted_event()
    {
        $wallet = Wallet::create([
            'user_id' => $this->investor->id,
            'wallet_address' => 'GBANTU_TEST_WALLET',
            'balance' => 0,
        ]);

        // Simulate TrovoTech webhook
        $webhookPayload = [
            'event_type' => 'token.minted',
            'data' => [
                'token_id' => 'TOKEN_WEBHOOK_001',
                'tx_hash' => 'BANTU_TX_WEBHOOK_TEST',
                'asset_id' => $this->asset->id,
                'investor_wallet' => $wallet->wallet_address,
                'fraction_owned' => 15,
                'investment_amount' => 35000,
                'current_value' => 35000,
                'chain' => 'bantu',
                'metadata_hash' => 'IPFS_HASH_001',
                'trustee_ref' => 'TRUSTEE_001',
                'minted_at' => now()->toISOString(),
            ],
        ];

        $response = $this->postJson('/api/webhooks/trovotech', $webhookPayload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'event_type' => 'token.minted',
            ]);

        // Verify webhook logged
        $this->assertDatabaseHas('webhook_logs', [
            'source' => 'trovotech',
            'event_type' => 'token.minted',
            'status' => 'processed',
        ]);

        // Verify token created
        $this->assertDatabaseHas('tokens', [
            'token_id' => 'TOKEN_WEBHOOK_001',
            'tx_hash' => 'BANTU_TX_WEBHOOK_TEST',
            'user_id' => $this->investor->id,
            'asset_id' => $this->asset->id,
        ]);
    }

    /** @test */
    public function test_webhook_payout_completed_event()
    {
        // Create token first
        $token = AssetToken::create([
            'user_id' => $this->investor->id,
            'asset_id' => $this->asset->id,
            'token_id' => 'TOKEN_PAYOUT_TEST',
            'fraction_owned' => 20,
            'investment_amount' => 50000,
            'current_value' => 50000,
            'total_returns' => 0,
            'tx_hash' => 'TX_INITIAL',
        ]);

        $wallet = Wallet::create([
            'user_id' => $this->investor->id,
            'wallet_address' => 'GBANTU_PAYOUT_TEST',
            'balance' => 0,
        ]);

        // Simulate payout webhook
        $webhookPayload = [
            'event_type' => 'payout.completed',
            'data' => [
                'payout_id' => 'PAYOUT_001',
                'tx_hash' => 'BANTU_PAYOUT_TX',
                'period' => '2025-11',
                'description' => 'Monthly revenue distribution',
                'distributions' => [
                    [
                        'token_id' => 'TOKEN_PAYOUT_TEST',
                        'investor_wallet' => $wallet->wallet_address,
                        'amount' => 5000,
                    ],
                ],
                'completed_at' => now()->toISOString(),
            ],
        ];

        $response = $this->postJson('/api/webhooks/trovotech', $webhookPayload);

        $response->assertStatus(200);

        // Verify payout recorded
        $this->assertDatabaseHas('payouts', [
            'token_id' => $token->id,
            'amount' => 5000,
            'tx_hash' => 'BANTU_PAYOUT_TX',
            'status' => 'completed',
        ]);

        // Verify wallet balance updated
        $wallet->refresh();
        $this->assertEquals(5000, $wallet->balance);

        // Verify token returns updated
        $token->refresh();
        $this->assertEquals(5000, $token->total_returns);
        $this->assertEquals(55000, $token->current_value); // 50000 + 5000
    }

    /** @test */
    public function test_webhook_signature_verification_in_production()
    {
        // Switch to production mode (disables automatic pass)
        Config::set('services.trovotech.sandbox_mode', false);
        Config::set('services.trovotech.webhook_secret', 'test_secret_key');

        $payload = [
            'event_type' => 'token.minted',
            'data' => ['test' => 'data'],
        ];

        $payloadJson = json_encode($payload);
        $validSignature = hash_hmac('sha256', $payloadJson, 'test_secret_key');

        // Valid signature should pass
        $response = $this->postJson('/api/webhooks/trovotech', $payload, [
            'X-TrovoTech-Signature' => $validSignature,
        ]);

        $response->assertStatus(200);

        // Invalid signature should fail
        $response2 = $this->postJson('/api/webhooks/trovotech', $payload, [
            'X-TrovoTech-Signature' => 'invalid_signature',
        ]);

        $response2->assertStatus(401)
            ->assertJson(['error' => 'Invalid signature']);
    }

    /** @test */
    public function test_get_my_tokens()
    {
        // Create multiple tokens
        $tokens = AssetToken::factory()->count(3)->create([
            'user_id' => $this->investor->id,
        ]);

        $this->actingAs($this->investor, 'sanctum');

        $response = $this->getJson('/api/trovotech/tokens/my');

        $response->assertStatus(200)
            ->assertJsonCount(3)
            ->assertJsonStructure([[
                'tokenId',
                'assetId',
                'assetModel',
                'fractionOwned',
                'investmentAmount',
                'currentValue',
                'totalReturns',
                'chain',
                'txHash',
                'mintedAt',
            ]]);
    }

    /** @test */
    public function test_end_to_end_investment_flow()
    {
        $this->actingAs($this->investor, 'sanctum');

        // Step 1: Create wallet
        $walletResponse = $this->postJson('/api/trovotech/wallet/create');
        $walletResponse->assertStatus(201);
        $walletAddress = $walletResponse->json('walletAddress');

        // Step 2: Mint token
        $mintResponse = $this->postJson('/api/trovotech/token/mint', [
            'assetId' => (string) $this->asset->id,
            'assetType' => 'EV',
            'fractionOwned' => 10,
            'investAmount' => 25000,
            'investorWallet' => $walletAddress,
        ]);

        $mintResponse->assertStatus(201);
        $tokenId = $mintResponse->json('tokenId');

        // Step 3: Verify token appears in my tokens
        $tokensResponse = $this->getJson('/api/trovotech/tokens/my');
        $tokensResponse->assertStatus(200);

        $myTokens = $tokensResponse->json();
        $this->assertCount(1, $myTokens);
        $this->assertEquals($tokenId, $myTokens[0]['tokenId']);

        // Step 4: Simulate blockchain confirmation webhook
        $confirmationPayload = [
            'event_type' => 'token.minted',
            'data' => [
                'token_id' => $tokenId,
                'tx_hash' => 'BANTU_CONFIRMED_TX',
                'asset_id' => $this->asset->id,
                'investor_wallet' => $walletAddress,
                'minted_at' => now()->toISOString(),
            ],
        ];

        $webhookResponse = $this->postJson('/api/webhooks/trovotech', $confirmationPayload);
        $webhookResponse->assertStatus(200);

        // Step 5: Verify token updated with confirmed tx_hash
        $token = AssetToken::where('token_id', $tokenId)->first();
        $this->assertEquals('BANTU_CONFIRMED_TX', $token->tx_hash);
        $this->assertEquals('active', $token->status);
    }
}
