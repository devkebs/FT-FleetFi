<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     *
     * @return void
     */
    public function boot()
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            // Fleet Engine routes (battery swap operations)
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/fleet.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     *
     * @return void
     */
    protected function configureRateLimiting()
    {
        // General API rate limit - 60 requests per minute
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Strict rate limit for authentication endpoints - 5 attempts per minute
        // Prevents brute force attacks on login/register
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function () {
                return response()->json([
                    'error' => 'Too many attempts',
                    'message' => 'Too many authentication attempts. Please try again in 1 minute.'
                ], 429);
            });
        });

        // Password reset rate limit - 3 attempts per hour per email/IP
        // Prevents enumeration and abuse of password reset
        RateLimiter::for('password-reset', function (Request $request) {
            $key = $request->input('email', '') . '|' . $request->ip();
            return Limit::perHour(3)->by($key)->response(function () {
                return response()->json([
                    'error' => 'Too many attempts',
                    'message' => 'Too many password reset requests. Please try again later.'
                ], 429);
            });
        });

        // Sensitive operations rate limit - 10 per minute
        // For wallet transfers, investments, etc.
        RateLimiter::for('sensitive', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip())->response(function () {
                return response()->json([
                    'error' => 'Too many requests',
                    'message' => 'Please slow down. Too many requests for sensitive operations.'
                ], 429);
            });
        });
    }
}
