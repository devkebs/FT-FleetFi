<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Asset;
use App\Models\Token;
use App\Models\Payout;
use App\Models\AuditLog;
use App\Models\ConfigSetting;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Get admin dashboard overview metrics
     */
    public function overview(Request $request)
    {
        $totalUsers = User::count();
        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role');

        $kycPending = User::where('kyc_status', 'submitted')->count();
        $kycVerified = User::where('kyc_status', 'verified')->count();

        $totalAssets = Asset::count();
        $assetsByStatus = Asset::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $totalRevenue = Payout::sum('amount') ?? 0;
        $monthlyRevenue = Payout::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount') ?? 0;

        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'by_role' => $usersByRole,
                'kyc_pending' => $kycPending,
                'kyc_verified' => $kycVerified,
            ],
            'assets' => [
                'total' => $totalAssets,
                'by_status' => $assetsByStatus,
            ],
            'revenue' => [
                'total' => $totalRevenue,
                'monthly' => $monthlyRevenue,
            ],
        ]);
    }

    /**
     * List all users with pagination
     */
    public function users(Request $request)
    {
        $perPage = $request->get('perPage', 20);
        $search = $request->get('search');

        $query = User::select(['id', 'name', 'email', 'role', 'kyc_status', 'created_at', 'email_verified_at']);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Update user role
     */
    public function updateUserRole(Request $request, $userId)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:investor,operator,driver,admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::findOrFail($userId);
        $oldRole = $user->role;
        $user->update(['role' => $request->role]);
        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'update_role',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'metadata' => [ 'old_role' => $oldRole, 'new_role' => $request->role ],
        ]);

        return response()->json([
            'message' => "User role updated to {$request->role}",
            'user' => $user->only(['id', 'name', 'email', 'role']),
        ]);
    }

    /**
     * Create a new user (admin action)
     */
    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:investor,operator,driver,admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'email_verified_at' => now(), // Auto-verify admin-created users
            ]);

            // Create wallet for user
            Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => '0x' . Str::random(40),
                'trovotech_wallet_id' => 'TROVO_' . Str::random(16),
                'balance' => 0,
                'status' => 'active'
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'create_user',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'metadata' => [ 'role' => $request->role, 'email' => $request->email ],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'User created successfully',
                'user' => $user->only(['id', 'name', 'email', 'role', 'created_at']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'User creation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Suspend or activate user account
     */
    public function toggleUserStatus(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        // Using a simple flag - you could add a 'status' column to users table
        // For now, we'll use email_verified_at as a proxy (null = suspended)
        $isSuspended = is_null($user->email_verified_at);

        $previous = $user->email_verified_at ? 'active' : 'suspended';
        $user->update([
            'email_verified_at' => $isSuspended ? now() : null,
        ]);
        $current = $isSuspended ? 'active' : 'suspended';
        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'toggle_user_status',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'metadata' => [ 'previous' => $previous, 'current' => $current ],
        ]);

        $status = $isSuspended ? 'activated' : 'suspended';

        return response()->json([
            'message' => "User {$status}",
            'user' => $user->only(['id', 'name', 'email', 'email_verified_at']),
            'status' => $status,
        ]);
    }

    /**
     * Get system activity logs (placeholder - would need audit log table)
     */
    public function activityLogs(Request $request)
    {
        $perPage = (int)$request->get('perPage', 25);
        $action = $request->get('action');
        $entityType = $request->get('entity_type');
        $query = AuditLog::with('user')->orderBy('created_at','desc');
        if ($action) { $query->where('action', $action); }
        if ($entityType) { $query->where('entity_type', $entityType); }
        $logs = $query->paginate($perPage);
        return response()->json($logs);
    }

    /**
     * Get revenue statistics
     */
    public function revenueStats(Request $request)
    {
        $months = $request->get('months', 6);

        $monthlyData = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $amount = Payout::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->sum('amount') ?? 0;

            $monthlyData[] = [
                'month' => $date->format('Y-m'),
                'label' => $date->format('M Y'),
                'amount' => $amount,
            ];
        }

        return response()->json([
            'monthly' => $monthlyData,
            'total' => Payout::sum('amount') ?? 0,
        ]);
    }

    /**
     * Get all system configuration settings
     */
    public function configIndex(Request $request)
    {
        $keys = [
            'platform_fee_percent' => ['default' => 2.5, 'type' => 'number'],
            'investor_payout_day' => ['default' => 5, 'type' => 'number'],
            'maintenance_mode' => ['default' => false, 'type' => 'boolean'],
            'token_mint_limit' => ['default' => 1000, 'type' => 'number'],
            'kyc_required_roles' => ['default' => ['investor','operator'], 'type' => 'json'],
            // OEM Telemetry integration
            'oem_telemetry_api_key' => ['default' => '', 'type' => 'string', 'secret' => true],
            'oem_telemetry_enabled' => ['default' => true, 'type' => 'boolean'],
            // TrovoTech integration settings
            'trovotech_base_url' => ['default' => '', 'type' => 'string'],
            'trovotech_api_key' => ['default' => '', 'type' => 'string', 'secret' => true],
            'trovotech_webhook_secret' => ['default' => '', 'type' => 'string', 'secret' => true],
            'trovotech_timeout_ms' => ['default' => 10000, 'type' => 'number'],
            'trovotech_sandbox_enabled' => ['default' => true, 'type' => 'boolean'],
            'trovotech_endpoints' => ['default' => [
                'wallet' => '/wallet',
                'mint_token' => '/token/mint',
                'payout_initiate' => '/payout/initiate',
                'telemetry_sync' => '/telemetry/sync',
                'tokens_my' => '/tokens/my',
                'asset_metadata' => '/asset/{assetId}/metadata'
            ], 'type' => 'json'],
        ];
        $data = [];
        foreach ($keys as $key => $meta) {
            $val = ConfigSetting::getValue($key, $meta['default']);
            $isSecret = isset($meta['secret']) && $meta['secret'] === true;
            // Mask secret values in responses
            $displayVal = $isSecret && !empty($val) ? '********' : $val;
            $row = [ 'key' => $key, 'value' => $displayVal, 'type' => $meta['type'] ];
            if ($isSecret) { $row['isSecret'] = true; }
            $data[] = $row;
        }
        return response()->json(['settings' => $data]);
    }

    /**
     * Update a configuration setting
     */
    public function configUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key' => 'required|string',
            'value' => 'required',
            'type' => 'required|in:string,number,boolean,json',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        // Prevent accidentally storing masked placeholders for secrets
        if (in_array($request->key, ['trovotech_api_key','trovotech_webhook_secret','oem_telemetry_api_key'], true) && $request->value === '********') {
            return response()->json(['message' => 'No change for secret; provide a new value to update.'], 200);
        }

        // Validate URL fields
        if ($request->key === 'trovotech_base_url') {
            if (!filter_var($request->value, FILTER_VALIDATE_URL)) {
                return response()->json(['message' => 'Invalid URL format for trovotech_base_url'], 422);
            }
        }

        // Validate endpoint JSON structure
        if ($request->key === 'trovotech_endpoints' && $request->type === 'json') {
            if (!is_array($request->value)) {
                return response()->json(['message' => 'trovotech_endpoints must be a JSON object'], 422);
            }
            foreach ($request->value as $k => $v) {
                if (!is_string($v) || !str_starts_with($v, '/')) {
                    return response()->json(['message' => "Endpoint '{$k}' must be a path starting with /"], 422);
                }
            }
        }

        $setting = ConfigSetting::setValue($request->key, $request->value, $request->type);
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'config_update',
            'entity_type' => 'config_setting',
            'entity_id' => (string)$setting->id,
            'metadata' => [ 'key' => $request->key, 'value' => $request->value ]
        ]);
        return response()->json(['message' => 'Setting updated', 'setting' => [ 'key' => $setting->key, 'value' => ConfigSetting::castValue($setting->value, $setting->type), 'type' => $setting->type ]]);
    }

    /**
     * TrovoTech configuration status summary
     */
    public function trovotechStatus(Request $request)
    {
        $base = ConfigSetting::getValue('trovotech_base_url', '');
        $apiKey = ConfigSetting::getValue('trovotech_api_key', '');
        $sandbox = ConfigSetting::getValue('trovotech_sandbox_enabled', true);
        $timeout = (int)ConfigSetting::getValue('trovotech_timeout_ms', 10000);
        $configured = !empty($base) && !empty($apiKey);
        return response()->json([
            'configured' => $configured,
            'sandbox' => (bool)$sandbox,
            'timeout_ms' => $timeout,
            'base_url_set' => !empty($base),
            'api_key_set' => !empty($apiKey),
        ]);
    }

    /**
     * Test TrovoTech API connectivity
     * POST /api/admin/trovotech/test-connection
     */
    public function trovotechTestConnection(Request $request)
    {
        $client = new \App\Services\TrovotechClient();
        $result = $client->testConnection();

        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'trovotech_test_connection',
            'entity_type' => 'config_setting',
            'entity_id' => '0',
            'metadata' => [
                'success' => $result['success'],
                'latency_ms' => $result['latency_ms'] ?? null,
                'status_code' => $result['status_code'] ?? null,
            ],
        ]);

        return response()->json($result);
    }
}

