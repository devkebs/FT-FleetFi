<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Wallet;
use App\Models\AuditLog;
use App\Models\WalletTransaction;
use App\Models\Token;

class UserManagementController extends Controller
{
    /**
     * Get all users with advanced filtering and pagination
     */
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $search = $request->query('search');
        $role = $request->query('role');
        $kycStatus = $request->query('kyc_status');
        $status = $request->query('status'); // active/inactive
        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');

        $query = User::with(['wallet']);

        // Search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($role && $role !== 'all') {
            $query->where('role', $role);
        }

        // KYC status filter
        if ($kycStatus && $kycStatus !== 'all') {
            $query->where('kyc_status', $kycStatus);
        }

        // Active/Inactive filter
        if ($status === 'active') {
            $query->whereNotNull('email_verified_at');
        } elseif ($status === 'inactive') {
            $query->whereNull('email_verified_at');
        }

        // Sorting
        $allowedSorts = ['name', 'email', 'role', 'kyc_status', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $users = $query->paginate($perPage);

        // Add additional user stats
        $users->getCollection()->transform(function($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'kyc_status' => $user->kyc_status,
                'email_verified_at' => $user->email_verified_at,
                'is_active' => !is_null($user->email_verified_at),
                'created_at' => $user->created_at,
                'wallet_balance' => $user->wallet ? $user->wallet->balance : 0,
                'wallet_currency' => $user->wallet ? $user->wallet->currency : 'NGN',
                'total_investments' => Token::where('user_id', $user->id)->sum('investment_amount') ?? 0,
                'total_transactions' => WalletTransaction::where('user_id', $user->id)->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'users' => $users,
            'stats' => [
                'total' => User::count(),
                'by_role' => User::select('role', DB::raw('count(*) as count'))
                    ->groupBy('role')
                    ->get()
                    ->pluck('count', 'role'),
                'by_kyc' => User::select('kyc_status', DB::raw('count(*) as count'))
                    ->groupBy('kyc_status')
                    ->get()
                    ->pluck('count', 'kyc_status'),
                'active' => User::whereNotNull('email_verified_at')->count(),
                'inactive' => User::whereNull('email_verified_at')->count(),
            ],
        ]);
    }

    /**
     * Get single user details
     */
    public function show($id)
    {
        $user = User::with(['wallet', 'tokens.asset', 'walletTransactions' => function($q) {
            $q->orderBy('created_at', 'desc')->limit(10);
        }])->findOrFail($id);

        // Get user statistics
        $stats = [
            'total_investments' => Token::where('user_id', $id)->sum('investment_amount') ?? 0,
            'total_tokens' => Token::where('user_id', $id)->sum('shares') ?? 0,
            'total_transactions' => WalletTransaction::where('user_id', $id)->count(),
            'total_deposits' => WalletTransaction::where('user_id', $id)
                ->where('type', 'deposit')
                ->sum('amount') ?? 0,
            'total_withdrawals' => WalletTransaction::where('user_id', $id)
                ->where('type', 'withdrawal')
                ->sum('amount') ?? 0,
        ];

        // Get recent activity logs
        $activityLogs = AuditLog::where('user_id', $id)
            ->orWhere('entity_id', $id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'user' => $user,
            'stats' => $stats,
            'activity_logs' => $activityLogs,
        ]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:investor,operator,driver,admin',
            'phone' => 'nullable|string|max:20',
            'kyc_status' => 'nullable|in:pending,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'phone' => $request->phone,
                'kyc_status' => $request->kyc_status ?? 'pending',
                'email_verified_at' => now(), // Auto-verify admin-created users
            ]);

            // Create wallet automatically
            Wallet::create([
                'user_id' => $user->id,
                'balance' => 0,
                'currency' => 'NGN',
            ]);

            // Log the action
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_created',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'metadata' => [
                    'created_by' => $request->user()->name,
                    'role' => $user->role,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'user' => $user,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user information
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|in:investor,operator,driver,admin',
            'kyc_status' => 'sometimes|in:pending,approved,rejected',
            'password' => 'sometimes|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $oldData = $user->only(['name', 'email', 'role', 'kyc_status']);
        $changes = [];

        if ($request->has('name') && $request->name !== $user->name) {
            $user->name = $request->name;
            $changes['name'] = ['from' => $oldData['name'], 'to' => $request->name];
        }

        if ($request->has('email') && $request->email !== $user->email) {
            $user->email = $request->email;
            $changes['email'] = ['from' => $oldData['email'], 'to' => $request->email];
        }

        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }

        if ($request->has('role') && $request->role !== $user->role) {
            $user->role = $request->role;
            $changes['role'] = ['from' => $oldData['role'], 'to' => $request->role];
        }

        if ($request->has('kyc_status') && $request->kyc_status !== $user->kyc_status) {
            $user->kyc_status = $request->kyc_status;
            $changes['kyc_status'] = ['from' => $oldData['kyc_status'], 'to' => $request->kyc_status];
        }

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
            $changes['password'] = 'updated';
        }

        $user->save();

        // Log the changes
        if (!empty($changes)) {
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_updated',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'metadata' => [
                    'updated_by' => $request->user()->name,
                    'changes' => $changes,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Delete user (soft delete or hard delete)
     */
    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent self-deletion
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 403);
        }

        // Check if user has investments
        $hasInvestments = Token::where('user_id', $id)->exists();
        if ($hasInvestments) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete user with active investments. Please transfer or liquidate investments first.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Log the deletion
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_deleted',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'metadata' => [
                    'deleted_by' => $request->user()->name,
                    'user_email' => $user->email,
                    'user_role' => $user->role,
                ],
            ]);

            // Delete related records
            Wallet::where('user_id', $id)->delete();
            WalletTransaction::where('user_id', $id)->delete();

            // Delete user
            $user->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle user active status
     */
    public function toggleStatus($id, Request $request)
    {
        $user = User::findOrFail($id);

        if ($user->email_verified_at) {
            $user->email_verified_at = null;
            $status = 'deactivated';
        } else {
            $user->email_verified_at = now();
            $status = 'activated';
        }

        $user->save();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_status_changed',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'metadata' => [
                'changed_by' => $request->user()->name,
                'status' => $status,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => "User {$status} successfully",
            'user' => $user,
        ]);
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->new_password);
        $user->save();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'password_reset',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'metadata' => [
                'reset_by' => $request->user()->name,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully'
        ]);
    }

    /**
     * Bulk operations on multiple users
     */
    public function bulkAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:activate,deactivate,delete,update_role,approve_kyc,reject_kyc',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'role' => 'required_if:action,update_role|in:investor,operator,driver,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $userIds = $request->user_ids;
        $action = $request->action;
        $affected = 0;

        DB::beginTransaction();
        try {
            switch ($action) {
                case 'activate':
                    $affected = User::whereIn('id', $userIds)->update([
                        'email_verified_at' => now()
                    ]);
                    break;

                case 'deactivate':
                    $affected = User::whereIn('id', $userIds)
                        ->where('id', '!=', $request->user()->id) // Don't deactivate self
                        ->update(['email_verified_at' => null]);
                    break;

                case 'delete':
                    // Don't delete self or users with investments
                    $usersToDelete = User::whereIn('id', $userIds)
                        ->where('id', '!=', $request->user()->id)
                        ->whereNotExists(function($query) {
                            $query->select(DB::raw(1))
                                  ->from('tokens')
                                  ->whereColumn('tokens.user_id', 'users.id');
                        })
                        ->get();

                    foreach ($usersToDelete as $user) {
                        Wallet::where('user_id', $user->id)->delete();
                        WalletTransaction::where('user_id', $user->id)->delete();
                    }

                    $affected = User::whereIn('id', $usersToDelete->pluck('id'))->delete();
                    break;

                case 'update_role':
                    $affected = User::whereIn('id', $userIds)
                        ->where('id', '!=', $request->user()->id) // Don't change own role
                        ->update(['role' => $request->role]);
                    break;

                case 'approve_kyc':
                    $affected = User::whereIn('id', $userIds)
                        ->update(['kyc_status' => 'approved']);
                    break;

                case 'reject_kyc':
                    $affected = User::whereIn('id', $userIds)
                        ->update(['kyc_status' => 'rejected']);
                    break;
            }

            // Log bulk action
            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'bulk_user_action',
                'entity_type' => 'user',
                'entity_id' => null,
                'metadata' => [
                    'action' => $action,
                    'user_ids' => $userIds,
                    'affected_count' => $affected,
                    'performed_by' => $request->user()->name,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Bulk action completed: {$affected} users affected",
                'affected' => $affected,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Bulk action failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export users to CSV
     */
    public function exportCsv(Request $request)
    {
        $role = $request->query('role');
        $kycStatus = $request->query('kyc_status');

        $query = User::query();

        if ($role && $role !== 'all') {
            $query->where('role', $role);
        }

        if ($kycStatus && $kycStatus !== 'all') {
            $query->where('kyc_status', $kycStatus);
        }

        $users = $query->get();

        $filename = 'users_export_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($users) {
            $file = fopen('php://output', 'w');

            // CSV headers
            fputcsv($file, [
                'ID', 'Name', 'Email', 'Phone', 'Role', 'KYC Status',
                'Email Verified', 'Created At', 'Wallet Balance'
            ]);

            // CSV rows
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->phone ?? '',
                    $user->role,
                    $user->kyc_status,
                    $user->email_verified_at ? 'Yes' : 'No',
                    $user->created_at->format('Y-m-d H:i:s'),
                    $user->wallet ? $user->wallet->balance : 0,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
