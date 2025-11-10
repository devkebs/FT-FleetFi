<?php

namespace App\Http\Controllers;

use App\Models\RoleCapability;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleCapabilityController extends Controller
{
    /**
     * Get all capabilities, optionally filtered by role
     */
    public function index(Request $request)
    {
        $query = RoleCapability::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $capabilities = $query->orderBy('role')->orderBy('capability')->get();

        return response()->json([
            'capabilities' => $capabilities
        ]);
    }

    /**
     * Get role statistics
     */
    public function getRoleStats()
    {
        $roles = ['admin', 'operator', 'investor', 'driver'];
        $stats = [];

        foreach ($roles as $role) {
            $totalUsers = User::where('role', $role)->count();
            $activeUsers = User::where('role', $role)
                ->where('is_active', true)
                ->count();
            $capabilitiesCount = RoleCapability::where('role', $role)
                ->where('is_enabled', true)
                ->count();

            $stats[] = [
                'role' => $role,
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'capabilities_count' => $capabilitiesCount
            ];
        }

        return response()->json([
            'stats' => $stats
        ]);
    }

    /**
     * Create a new capability
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'role' => 'required|in:investor,operator,driver,admin',
            'capability' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_enabled' => 'boolean'
        ]);

        // Check if capability already exists for this role
        $existing = RoleCapability::where('role', $validated['role'])
            ->where('capability', $validated['capability'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This capability already exists for the role'
            ], 422);
        }

        $capability = RoleCapability::create($validated);

        return response()->json([
            'message' => 'Capability created successfully',
            'capability' => $capability
        ], 201);
    }

    /**
     * Update a capability
     */
    public function update(Request $request, $id)
    {
        $capability = RoleCapability::findOrFail($id);

        $validated = $request->validate([
            'capability' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_enabled' => 'sometimes|boolean'
        ]);

        $capability->update($validated);

        return response()->json([
            'message' => 'Capability updated successfully',
            'capability' => $capability
        ]);
    }

    /**
     * Delete a capability
     */
    public function destroy($id)
    {
        $capability = RoleCapability::findOrFail($id);
        $capability->delete();

        return response()->json([
            'message' => 'Capability deleted successfully'
        ]);
    }

    /**
     * Get capabilities for a specific user's role
     */
    public function getUserCapabilities(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $capabilities = RoleCapability::where('role', $user->role)
            ->where('is_enabled', true)
            ->pluck('capability')
            ->toArray();

        return response()->json([
            'role' => $user->role,
            'capabilities' => $capabilities
        ]);
    }

    /**
     * Check if user has a specific capability
     */
    public function checkCapability(Request $request, $capability)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'has_capability' => false
            ]);
        }

        $hasCapability = RoleCapability::where('role', $user->role)
            ->where('capability', $capability)
            ->where('is_enabled', true)
            ->exists();

        return response()->json([
            'has_capability' => $hasCapability
        ]);
    }
}
