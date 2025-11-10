<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RequestIdMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $requestId = $request->headers->get('X-Request-Id') ?: (string) Str::uuid();
        $start = microtime(true);

        /** @var \Illuminate\Http\Response|\Symfony\Component\HttpFoundation\Response $response */
        $response = $next($request);

        $durationMs = (int) ((microtime(true) - $start) * 1000);

        $response->headers->set('X-Request-Id', $requestId);
        $response->headers->set('X-Response-Time-ms', (string) $durationMs);

        $userId = optional($request->user())->id;
        Log::info('api.request', [
            'id' => $requestId,
            'method' => $request->getMethod(),
            'path' => $request->getPathInfo(),
            'status' => method_exists($response, 'getStatusCode') ? $response->getStatusCode() : null,
            'duration_ms' => $durationMs,
            'user_id' => $userId,
        ]);

        return $response;
    }
}
