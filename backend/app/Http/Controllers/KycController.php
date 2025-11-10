<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use App\Services\Kyc\KycService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class KycController extends Controller
{
    protected $kycService;
    protected $notificationService;

    public function __construct(KycService $kycService, NotificationService $notificationService)
    {
        $this->kycService = $kycService;
        $this->notificationService = $notificationService;
    }

    /**
     * Get the authenticated user's KYC status
     */
    public function status(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'kyc_status' => $user->kyc_status ?? 'pending',
            'kyc_submitted_at' => $user->kyc_submitted_at,
            'kyc_verified_at' => $user->kyc_verified_at,
            'kyc_document_type' => $user->kyc_document_type,
        ]);
    }

    /**
     * Submit KYC information
     */
    public function submit(Request $request)
    {
        $user = $request->user();

        if ($user->kyc_status === 'verified') {
            return response()->json(['message' => 'KYC already verified'], 400);
        }

        $validator = Validator::make($request->all(), [
            'document_type' => 'required|in:nin,bvn,drivers_license,passport',
            'document_number' => 'required|string|max:120',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Record initial local submission timestamp
        $user->kyc_status = 'submitted';
        $user->kyc_submitted_at = now();
        $user->kyc_document_type = $request->document_type;
        $user->kyc_document_number = $request->document_number;
        $user->save();

        $service = new KycService();
        $providerResult = $service->initiate($user, [
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
        ]);

        \App\Models\AuditLog::create([
            'user_id' => $user->id,
            'action' => 'kyc_initiated',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'metadata' => [
                'provider' => 'identitypass',
                'reference' => $providerResult['ref'],
                'status' => $providerResult['status']
            ],
        ]);

        return response()->json([
            'message' => 'KYC verification initiated',
            'provider_status' => $providerResult['status'],
            'provider_ref' => $providerResult['ref'],
            'internal_status' => $user->kyc_status,
        ]);
    }

    /**
     * Review and approve/reject KYC (operator/admin only)
     */
    public function review(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'action' => 'required|in:approve,reject',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $targetUser = User::findOrFail($request->user_id);
        $reviewer = $request->user();

        if ($targetUser->kyc_status === 'verified') {
            return response()->json(['message' => 'KYC already verified'], 400);
        }

        $previous = $targetUser->kyc_status;
        $newStatus = $request->action === 'approve' ? 'verified' : 'rejected';
        $targetUser->update([
            'kyc_status' => $newStatus,
            'kyc_verified_at' => $request->action === 'approve' ? now() : null,
            'kyc_verified_by' => $reviewer->id,
        ]);
        
        // Send notification to user
        if ($newStatus === 'verified') {
            $this->notificationService->notifyKycApproved($targetUser);
        } else {
            $reason = $request->note ?? 'Please resubmit with correct information.';
            $this->notificationService->notifyKycRejected($targetUser, $reason);
        }
        
        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'kyc_review',
            'entity_type' => 'user',
            'entity_id' => $targetUser->id,
            'metadata' => [ 'previous' => $previous, 'current' => $targetUser->kyc_status ],
        ]);

        return response()->json(['message' => "KYC {$newStatus} for user {$targetUser->name}", 'user' => $targetUser->only(['id', 'name', 'email', 'kyc_status', 'kyc_verified_at']),]);
    }

    /**
     * List all users pending KYC review (operator/admin only)
     */
    public function pending(Request $request)
    {
        $pendingUsers = User::whereIn('kyc_status', ['submitted'])
            ->select([
                'id', 'name', 'email', 'role', 'kyc_status', 'kyc_submitted_at',
                'kyc_document_type', 'kyc_document_number',
                'kyc_provider', 'kyc_provider_ref', 'kyc_provider_status', 'kyc_last_checked_at', 'kyc_failure_reason'
            ])
            ->orderBy('kyc_submitted_at', 'desc')
            ->get();

        return response()->json([
            'count' => $pendingUsers->count(),
            'users' => $pendingUsers,
        ]);
    }

    /**
     * Poll provider to refresh latest status (operator/admin or owner)
     */
    public function poll(Request $request)
    {
        $user = $request->user();
        $service = new KycService();
        $result = $service->poll($user);
        return response()->json([
            'provider_status' => $result['status'],
            'internal_status' => $user->kyc_status,
            'ref' => $user->kyc_provider_ref,
        ]);
    }

    /**
     * Admin: Poll provider for a specific user ID
     */
    public function adminPollUser(Request $request, int $userId)
    {
        $target = User::findOrFail($userId);
        $service = new KycService();
        $result = $service->poll($target);
        return response()->json([
            'provider_status' => $result['status'],
            'internal_status' => $target->kyc_status,
            'ref' => $target->kyc_provider_ref,
            'user_id' => $target->id,
        ]);
    }
}

