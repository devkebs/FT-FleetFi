<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class HealthController extends Controller
{
    private static $startedAt;

    public function __construct()
    {
        if (!self::$startedAt) {
            self::$startedAt = now();
        }
    }

    public function ping()
    {
        return response()->json(['status' => 'ok']);
    }

    public function health()
    {
        $dbOk = true;
        try {
            DB::select('select 1');
        } catch (\Throwable $e) {
            $dbOk = false;
            Log::error('Health DB check failed', ['error' => $e->getMessage()]);
        }

        $cacheOk = true;
        try {
            Cache::put('healthcheck', 'ok', 10);
            $cacheOk = Cache::get('healthcheck') === 'ok';
        } catch (\Throwable $e) {
            $cacheOk = false;
            Log::error('Health cache check failed', ['error' => $e->getMessage()]);
        }

        $version = config('app.version', '0.1.0');
        $gitHash = null; // Removed exec() for security

        return response()->json([
            'status' => ($dbOk && $cacheOk) ? 'healthy' : 'degraded',
            'timestamp' => now()->toISOString(),
            'uptime_seconds' => now()->diffInSeconds(self::$startedAt),
            'app' => [
                'env' => config('app.env'),
                'debug' => config('app.debug'),
                'version' => $version,
                'git_hash' => $gitHash ?: null,
            ],
            'checks' => [
                'database' => $dbOk ? 'ok' : 'fail',
                'cache' => $cacheOk ? 'ok' : 'fail',
            ],
        ]);
    }
}
