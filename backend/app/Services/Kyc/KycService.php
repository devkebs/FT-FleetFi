<?php

namespace App\Services\Kyc;

use App\Models\User;

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
        // Map provider status to internal status
        $user->kyc_status = $result['status'] === 'verified' ? 'verified' : 'submitted';
        $user->save();
        return $result;
    }

    public function poll(User $user): array
    {
        if (!$user->kyc_provider_ref) {
            return ['status' => $user->kyc_status, 'message' => 'No provider reference'];
        }
        $result = $this->provider->poll($user->kyc_provider_ref);
        $user->kyc_provider_status = $result['status'];
        $user->kyc_last_checked_at = now();
        $user->kyc_status = $result['status'] === 'verified' ? 'verified' : $user->kyc_status;
        $user->save();
        return $result;
    }
}
