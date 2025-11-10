<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     * Allows middleware usage like: ->middleware('role:operator') or multiple roles 'role:investor,operator'
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Flatten comma-delimited entries (Laravel passes colon split and additional params)
        $expanded = [];
        foreach ($roles as $r) {
            foreach (explode(',', $r) as $piece) {
                $trim = trim($piece);
                if ($trim !== '') $expanded[] = $trim;
            }
        }
        $expanded = array_unique($expanded);

        if (!in_array($user->role, $expanded, true)) {
            return response()->json(['message' => 'Forbidden: role not permitted'], 403);
        }
        return $next($request);
    }
}
