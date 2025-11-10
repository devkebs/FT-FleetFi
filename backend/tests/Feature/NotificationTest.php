<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;

class NotificationTest extends TestCase
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

    public function test_user_can_get_notifications()
    {
        Notification::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'type', 'title', 'message', 'is_read', 'created_at'],
                ],
            ])
            ->assertJsonCount(3, 'data');
    }

    public function test_user_can_get_unread_count()
    {
        Notification::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'is_read' => false,
        ]);
        Notification::factory()->create([
            'user_id' => $this->user->id,
            'is_read' => true,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/notifications/unread-count');

        $response->assertStatus(200)
            ->assertJson(['count' => 2]);
    }

    public function test_user_can_mark_notification_as_read()
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'is_read' => false,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200);
        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_user_can_mark_all_notifications_as_read()
    {
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'is_read' => false,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/notifications/mark-all-read');

        $response->assertStatus(200);
        $this->assertEquals(0, Notification::where('user_id', $this->user->id)
            ->where('is_read', false)
            ->count());
    }

    public function test_user_can_delete_notification()
    {
        $notification = Notification::factory()->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    public function test_user_cannot_access_other_users_notifications()
    {
        $otherUser = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(404);
    }
}
