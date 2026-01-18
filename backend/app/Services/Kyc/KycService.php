<?php

namespace App\Services\Kyc;

use App\Models\User;
use App\Services\EmailNotificationService;
use Illuminate\Support\Facades\Log;

class KycService
{
    protected KycProviderInterface $provider;

    public function __construct()
    {
        $providerName = config('kyc.provider', env('KYC_PROVIDER', 'identitypass'));
        // For now only IdentityPass; could switch on $providerName
        $this->provider = new IdentityPassProvider();
    }

    public function initiate(User $user, array $payload): array
    {
        $result = $this->provider->initiate($user, $payload);
        $user->kyc_provider = 'identitypass';
        $user->kyc_provider_ref = $result['ref'];
        $user->kyc_provider_status = $result['status'];
        $user->kyc_last_checked_at = now();

        $previousStatus = $user->kyc_status;

        // Map provider status to internal status
        $user->kyc_status = $result['status'] === 'verified' ? 'verified' : 'submitted';

        if ($user->kyc_status === 'verified') {
            $user->kyc_verified_at = now();
        }

        $user->save();

        // Send email notification if status changed to verified
        if ($previousStatus !== 'verified' && $user->kyc_status === 'verified') {
            $this->sendKycStatusEmail($user, 'verified');
        } elseif ($result['status'] === 'failed') {
            $this->sendKycStatusEmail($user, 'failed', $result['raw']['message'] ?? null);
        }

        return $result;
    }

    public function poll(User $user): array
    {
        if (!$user->kyc_provider_ref) {
            return ['status' => $user->kyc_status, 'message' => 'No provider reference'];
        }

        $previousStatus = $user->kyc_status;

        $result = $this->provider->poll($user->kyc_provider_ref);
        $user->kyc_provider_status = $result['status'];
        $user->kyc_last_checked_at = now();
        $user->kyc_status = $result['status'] === 'verified' ? 'verified' : $user->kyc_status;

        if ($user->kyc_status === 'verified' && !$user->kyc_verified_at) {
            $user->kyc_verified_at = now();
        }

        $user->save();

        // Send email notification if status changed to verified
        if ($previousStatus !== 'verified' && $user->kyc_status === 'verified') {
            $this->sendKycStatusEmail($user, 'verified');
        }

        return $result;
    }

    /**
     * Send KYC status notification email
     */
    protected function sendKycStatusEmail(User $user, string $status, ?string $reason = null): void
    {
        try {
            $emailService = new EmailNotificationService();
            $emailService->sendKYCVerificationEmail($user, $status, $reason);
        } catch (\Exception $e) {
            Log::warning('Failed to send KYC status email', [
                'user_id' => $user->id,
                'status' => $status,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
