<?php

namespace App\Services\Kyc;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class IdentityPassProvider implements KycProviderInterface
{
    protected string $baseUrl;
    protected ?string $apiKey;
    protected ?string $secret;

    public function __construct()
    {
        $this->baseUrl = config('kyc.identitypass.base_url', 'https://api.theidentitypass.com');
        $this->apiKey = config('kyc.identitypass.api_key', env('IDENTITYPASS_API_KEY', 'test_key'));
        $this->secret = config('kyc.identitypass.webhook_secret', env('IDENTITYPASS_WEBHOOK_SECRET', 'test_secret'));
    }

    public function initiate(User $user, array $payload): array
    {
        // Example: NIN verification request structure (simplified)
        // Real endpoint differs; adjust once official docs confirmed.
        $type = $payload['document_type'] ?? 'nin';
        $idNumber = $payload['document_number'] ?? '';

        $endpoint = match($type) {
            'nin' => '/identitypass/nin/verification',
            'bvn' => '/identitypass/bvn/verification',
            'drivers_license' => '/identitypass/drivers_license/verification',
            'passport' => '/identitypass/passport/verification',
            default => '/identitypass/nin/verification'
        };

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'Accept' => 'application/json',
        ])->post($this->baseUrl . $endpoint, [
            'number' => $idNumber,
        ]);

        if (!$response->ok()) {
            return [
                'ref' => null,
                'status' => 'failed',
                'raw' => $response->json(),
            ];
        }

        $data = $response->json();
        // IdentityPass often returns verification data directly (no async ref); for demo we fabricate ref
        $reference = $data['request_id'] ?? 'ip_' . uniqid();
        $providerStatus = ($data['status'] ?? 'failed') === 'success' ? 'verified' : 'in_progress';

        return [
            'ref' => $reference,
            'status' => $providerStatus,
            'raw' => $data,
        ];
    }

    public function poll(string $reference): array
    {
        // Some providers require re-query for updates; stub returns static structure.
        return [
            'ref' => $reference,
            'status' => 'verified', // simulate verified after poll
            'raw' => ['reference' => $reference, 'simulated' => true]
        ];
    }

    public function verifyWebhook(array $headers, string $rawBody): bool
    {
        // Placeholder signature verification
        if (!$this->secret) return false;
        $provided = $headers['x-identitypass-signature'] ?? ''; // Example header name
        $expected = hash_hmac('sha256', $rawBody, $this->secret);
        return hash_equals($expected, $provided);
    }
}
