<?php

namespace App\Services\Kyc;

use App\Models\User;

interface KycProviderInterface
{
    /**
     * Initiate verification with provider. Returns [ref, status, raw].
     */
    public function initiate(User $user, array $payload): array;

    /**
     * Poll provider for current status using reference.
     */
    public function poll(string $reference): array;

    /**
     * Verify webhook signature and parse payload.
     */
    public function verifyWebhook(array $headers, string $rawBody): bool;
}
