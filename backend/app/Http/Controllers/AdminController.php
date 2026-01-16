<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Asset;
use App\Models\Rider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * Get system-wide statistics
     */
    public function getStats()
    {
        $stats = [
            'total_users' => User::count(),
            'total_drivers' => User::where('role', 'driver')->count(),
            'total_investors' => User::where('role', 'investor')->count(),
            'total_operators' => User::where('role', 'operator')->count(),
            'active_fleets' => Asset::select('fleet_id')->distinct()->count(),
            'total_assets' => Asset::count(),
            'total_revenue' => 12500000, // Example aggregate
            'system_health' => '99.9%'
        ];

        return response()->json(['stats' => $stats]);
    }

    /**
     * Get paginated users list
     */
    public function getUsers(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json(['users' => $users]);
    }

    /**
     * Update user status (suspend/activate)
     */
    public function updateUserStatus(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        
        $data = $request->validate([
            'status' => 'required|in:active,suspended'
        ]);

        $user->status = $data['status'];
        $user->save();

        return response()->json(['message' => "User {$user->name} is now {$user->status}"]);
    }

    /**
     * Create a new Operator
     */
    public function createOperator(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'company_name' => 'required|string'
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'operator',
            'status' => 'active',
            'company' => $data['company_name']
        ]);

        return response()->json([
            'message' => 'Operator created successfully',
            'user' => $user
        ], 201);
    }
}
