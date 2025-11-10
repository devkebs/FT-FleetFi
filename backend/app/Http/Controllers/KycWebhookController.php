<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Services\Kyc\IdentityPassProvider;

class KycWebhookController extends Controller
{
    public function handleIdentityPass(Request $request)
    {
        $provider = new IdentityPassProvider();
        $raw = $request->getContent();
        $headers = array_change_key_case($request->headers->all(), CASE_LOWER);
        // Normalize single header values
        $flatHeaders = [];
        foreach ($headers as $k => $v) { $flatHeaders[$k] = is_array($v) ? ($v[0] ?? '') : $v; }

        if (!$provider->verifyWebhook($flatHeaders, $raw)) {
            Log::warning('IdentityPass webhook signature invalid');
            return response()->json(['message' => 'invalid signature'], 401);
        }

        $payload = json_decode($raw, true) ?: [];
        // Attempt to read reference and status based on common patterns
        $reference = $payload['request_id'] ?? $payload['reference'] ?? null;
        $status = strtolower($payload['status'] ?? ($payload['verification_status'] ?? ''));

        if (!$reference) {
            Log::warning('IdentityPass webhook missing reference', $payload);
            return response()->json(['message' => 'missing reference'], 422);
        }

        $user = User::where('kyc_provider', 'identitypass')
            ->where('kyc_provider_ref', $reference)
            ->first();

        if (!$user) {
            Log::warning('IdentityPass webhook user not found for ref: '.$reference);
            return response()->json(['message' => 'user not found'], 200);
        }

        $user->kyc_provider_status = $status ?: 'in_progress';
        $user->kyc_last_checked_at = now();
        // Map to internal status
        $map = config('kyc.status_map');
        if (isset($map[$user->kyc_provider_status])) {
            $user->kyc_status = $map[$user->kyc_provider_status];
        }
        if (str_contains($user->kyc_provider_status, 'fail') || $user->kyc_provider_status === 'failed') {
            $user->kyc_failure_reason = $payload['reason'] ?? ($payload['message'] ?? null);
        }
        $user->save();

        \App\Models\AuditLog::create([
            'user_id' => $user->id,
            'action' => 'kyc_webhook_update',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'metadata' => [ 'provider' => 'identitypass', 'status' => $user->kyc_provider_status, 'reference' => $reference ],
        ]);

        return response()->json(['message' => 'ok']);
    }
}
