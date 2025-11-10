<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // For API-only usage (this project), don't attempt to redirect to a named
        // 'login' route (which isn't defined) because that causes a
        // RouteNotFoundException. Return null so the framework will return an
        // unauthenticated response (401) for API requests instead of trying
        // to redirect.
        if (! $request->expectsJson()) {
            return null;
        }
    }
}
