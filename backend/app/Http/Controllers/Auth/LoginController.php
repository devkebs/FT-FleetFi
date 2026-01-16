<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            if (Auth::attempt($credentials)) {
                $user = Auth::user();
ECHO is off.
                return response()->json([
                    'success' => true,
                    'user' => $user,
                    'redirect' => $this->getRedirectUrl($user->role)
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);

        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
ECHO is off.
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during login'
            ], 500);
        }
    }

    private function getRedirectUrl($role)
    {
        $urls = [
            'operator' => '/operator/dashboard',
            'driver' => '/driver/dashboard',
            'investor' => '/investor/dashboard',
            'admin' => '/admin/dashboard'
        ];

        return $urls[$role] ?? '/dashboard';
    }
}
