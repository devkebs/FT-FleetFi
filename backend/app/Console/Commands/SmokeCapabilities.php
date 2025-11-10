<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SmokeCapabilities extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'smoke:capabilities {--base=/}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Smoke test /api/login and /api/capabilities for all roles without starting a server';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Running capabilities smoke test...');

        $roles = [
            'admin' => ['email' => 'admin@fleetfi.com', 'password' => 'Fleet@123'],
            'operator' => ['email' => 'operator1@fleetfi.local', 'password' => 'Password123!'],
            'investor' => ['email' => 'investor1@fleetfi.local', 'password' => 'Password123!'],
            'driver' => ['email' => 'driver1@fleetfi.local', 'password' => 'Password123!'],
        ];

        $kernel = App::make(\Illuminate\Contracts\Http\Kernel::class);

        $summary = [];

        foreach ($roles as $role => $creds) {
            $this->line("\n=== Role: {$role} ===");
            $payload = json_encode(['email' => $creds['email'], 'password' => $creds['password']]);

            // Internal POST /api/login
            $loginReq = Request::create('/api/login', 'POST', [], [], [], [
                'HTTP_ACCEPT' => 'application/json',
                'CONTENT_TYPE' => 'application/json',
            ], $payload);

            $loginResp = $kernel->handle($loginReq);
            $status = $loginResp->getStatusCode();
            if ($status !== Response::HTTP_OK) {
                $this->error("Login failed (HTTP {$status})");
                $this->line($loginResp->getContent());
                $kernel->terminate($loginReq, $loginResp);
                continue;
            }

            $data = json_decode($loginResp->getContent(), true);
            $token = $data['token'] ?? null;
            $apiRole = $data['user']['role'] ?? 'unknown';
            $kernel->terminate($loginReq, $loginResp);

            if (!$token) {
                $this->error('No token returned from login');
                continue;
            }
            $this->info("Logged in as {$creds['email']} (API role: {$apiRole})");

            // Internal GET /api/capabilities
            $capReq = Request::create('/api/capabilities', 'GET', [], [], [], [
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ]);
            $capResp = $kernel->handle($capReq);
            $capStatus = $capResp->getStatusCode();
            if ($capStatus !== Response::HTTP_OK) {
                $this->error("Capabilities failed (HTTP {$capStatus})");
                $this->line($capResp->getContent());
                $kernel->terminate($capReq, $capResp);
                continue;
            }

            $caps = json_decode($capResp->getContent(), true);
            $actions = $caps['capabilities'] ?? [];
            $summary[$role] = $actions;
            $this->info('Capabilities: ' . count($actions) . ' actions');
            foreach ($actions as $a) {
                $this->line(' - ' . $a);
            }
            $kernel->terminate($capReq, $capResp);
        }

        $this->line("\n=== Summary ===");
        foreach ($summary as $r => $actions) {
            $this->line(str_pad($r, 10) . ': ' . str_pad((string)count($actions), 2, ' ', STR_PAD_LEFT) . ' actions');
        }

        $this->line("\nSmoke test complete.");
        return Command::SUCCESS;
    }
}
