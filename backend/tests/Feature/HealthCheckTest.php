<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_ping_endpoint_returns_ok()
    {
        $response = $this->getJson('/api/ping');

        $response->assertStatus(200)
            ->assertJson(['status' => 'ok']);
    }

    public function test_health_endpoint_returns_system_status()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
                'uptime_seconds',
                'app' => ['env', 'debug', 'version', 'git_hash'],
                'checks' => ['database', 'cache'],
            ]);

        $this->assertContains($response->json('status'), ['healthy', 'degraded']);
        $this->assertEquals('ok', $response->json('checks.database'));
        $this->assertEquals('ok', $response->json('checks.cache'));
    }

    public function test_health_response_includes_request_id_header()
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Request-Id');
        $response->assertHeader('X-Response-Time-ms');
    }
}
