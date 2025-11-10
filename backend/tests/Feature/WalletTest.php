<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;

class WalletTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'investor']);
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    public function test_user_can_create_wallet()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/wallet/create', [
            'currency' => 'NGN',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'user_id',
                'balance',
                'currency',
            ]);

        $this->assertDatabaseHas('wallets', [
            'user_id' => $this->user->id,
            'currency' => 'NGN',
        ]);
    }

    public function test_user_can_get_wallet_balance()
    {
        $wallet = Wallet::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 100000,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/wallet/{$this->user->id}/balance");

        $response->assertStatus(200)
            ->assertJson(['balance' => 100000]);
    }

    public function test_user_can_transfer_funds()
    {
        $sender = Wallet::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 100000,
        ]);

        $recipient = User::factory()->create();
        $recipientWallet = Wallet::factory()->create([
            'user_id' => $recipient->id,
            'balance' => 50000,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/wallet/transfer', [
            'recipient_email' => $recipient->email,
            'amount' => 25000,
            'description' => 'Test transfer',
        ]);

        $response->assertStatus(200);

        $this->assertEquals(75000, $sender->fresh()->balance);
        $this->assertEquals(75000, $recipientWallet->fresh()->balance);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $sender->id,
            'type' => 'transfer_out',
            'amount' => 25000,
        ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $recipientWallet->id,
            'type' => 'transfer_in',
            'amount' => 25000,
        ]);
    }

    public function test_transfer_fails_with_insufficient_balance()
    {
        $wallet = Wallet::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 10000,
        ]);

        $recipient = User::factory()->create();
        Wallet::factory()->create(['user_id' => $recipient->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/wallet/transfer', [
            'recipient_email' => $recipient->email,
            'amount' => 50000,
            'description' => 'Test transfer',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_get_wallet_transactions()
    {
        $wallet = Wallet::factory()->create(['user_id' => $this->user->id]);
        WalletTransaction::factory()->count(5)->create(['wallet_id' => $wallet->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/wallet/{$this->user->id}/transactions");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'type', 'amount', 'description', 'created_at'],
                ],
            ])
            ->assertJsonCount(5, 'data');
    }
}
