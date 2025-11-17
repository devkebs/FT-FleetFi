<?php

namespace App\Services;

use App\Models\ConfigSetting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class TrovotechClient
{
    protected string $baseUrl;
    protected string $apiKey;
    protected bool $sandbox;
    protected int $timeoutMs;
    protected array $endpoints;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) ConfigSetting::getValue('trovotech_base_url', ''), '/');
        $this->apiKey = (string) ConfigSetting::getValue('trovotech_api_key', '');
        $this->sandbox = (bool) ConfigSetting::getValue('trovotech_sandbox_enabled', true);
        $this->timeoutMs = (int) ConfigSetting::getValue('trovotech_timeout_ms', 10000);
        $this->endpoints = (array) ConfigSetting::getValue('trovotech_endpoints', [
            // Legacy endpoints
            'wallet' => '/wallet',
            'mint_token' => '/token/mint',
            'payout_initiate' => '/payout/initiate',
            'telemetry_sync' => '/telemetry/sync',
            'tokens_my' => '/tokens/my',
            'asset_metadata' => '/asset/{assetId}/metadata',

            // New Trovotech API v1 endpoints (per official documentation)
            'user_onboard' => '/v1/trovo-api/users/onboard',
            'user_update_kyc' => '/v1/trovo-api/users/update-kyc',
            'token_mint' => '/v1/trovo-api/tokens/mint',
        ]);
    }

    public function isConfigured(): bool
    {
        return !empty($this->baseUrl) && !empty($this->apiKey);
    }

    public function getConfigSummary(): array
    {
        return [
            'base_url_set' => !empty($this->baseUrl),
            'api_key_set' => !empty($this->apiKey),
            'sandbox' => $this->sandbox,
            'timeout_ms' => $this->timeoutMs,
        ];
    }

    /**
     * Build a full URL from an endpoint key and path params.
     */
    public function url(string $endpointKey, array $params = []): string
    {
        $path = $this->endpoints[$endpointKey] ?? '';
        foreach ($params as $k => $v) {
            $path = str_replace('{'.$k.'}', $v, $path);
        }
        return $this->baseUrl . $path;
    }

    /**
     * Test connectivity to the configured base URL.
     * Performs HEAD or GET request with API key to verify reachability and authentication.
     *
     * @return array{success: bool, status_code?: int, latency_ms?: float, error?: string}
     */
    public function testConnection(): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'TrovoTech not configured'];
        }

        try {
            $client = new Client([
                'timeout' => $this->timeoutMs / 1000.0,
                'http_errors' => false,
            ]);

            $start = microtime(true);
            $response = $client->request('HEAD', $this->baseUrl, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Accept' => 'application/json',
                ],
            ]);
            $latencyMs = round((microtime(true) - $start) * 1000, 2);

            $statusCode = $response->getStatusCode();
            $success = $statusCode >= 200 && $statusCode < 300;

            return [
                'success' => $success,
                'status_code' => $statusCode,
                'latency_ms' => $latencyMs,
            ];
        } catch (GuzzleException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generic request method for calling TrovoTech endpoints with Guzzle.
     * Includes automatic retry logic for transient failures.
     *
     * @param string $method HTTP method
     * @param string $endpointKey Key from endpoints map
     * @param array $params URL params to replace in path
     * @param array $body Request body (for POST/PATCH)
     * @param int $maxRetries Maximum retry attempts (default 3)
     * @return array Decoded JSON response
     * @throws \RuntimeException
     */
    public function request(string $method, string $endpointKey, array $params = [], array $body = [], int $maxRetries = 3): array
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('TrovoTech not configured - check TROVOTECH_BASE_URL and TROVOTECH_API_KEY');
        }

        $attempt = 0;
        $lastException = null;

        while ($attempt < $maxRetries) {
            try {
                $attempt++;

                $client = new Client([
                    'timeout' => $this->timeoutMs / 1000.0,
                    'http_errors' => true,
                ]);

                $url = $this->url($endpointKey, $params);

                $options = [
                    'headers' => [
                        'X-TW-SERVICE-LINK-API-KEY' => $this->apiKey,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                        'X-Request-ID' => uniqid('ft_', true), // For request tracing
                    ],
                ];

                if (!empty($body)) {
                    $options['json'] = $body;
                }

                $response = $client->request($method, $url, $options);
                $data = json_decode($response->getBody()->getContents(), true) ?? [];

                // Log successful request in non-sandbox
                if (!$this->sandbox) {
                    Log::info('TrovoTech API request successful', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'attempt' => $attempt,
                    ]);
                }

                return $data;

            } catch (GuzzleException $e) {
                $lastException = $e;
                $statusCode = $e->getCode();

                // Don't retry on client errors (4xx)
                if ($statusCode >= 400 && $statusCode < 500) {
                    Log::error('TrovoTech API client error (no retry)', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'status' => $statusCode,
                        'error' => $e->getMessage(),
                    ]);
                    throw new \RuntimeException("TrovoTech API error ({$statusCode}): " . $e->getMessage());
                }

                // Retry on server errors (5xx) or network issues
                if ($attempt < $maxRetries) {
                    $delay = min(pow(2, $attempt) * 100000, 2000000); // Exponential backoff, max 2s
                    Log::warning('TrovoTech API error, retrying...', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'attempt' => $attempt,
                        'max_retries' => $maxRetries,
                        'delay_ms' => $delay / 1000,
                        'error' => $e->getMessage(),
                    ]);
                    usleep($delay);
                } else {
                    Log::error('TrovoTech API error after max retries', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'attempts' => $attempt,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        throw new \RuntimeException('TrovoTech API error after ' . $maxRetries . ' attempts: ' . ($lastException ? $lastException->getMessage() : 'Unknown error'));
    }

    /**
     * Onboard a new user to Trovotech
     * Creates a Trovo app profile and default primary wallet
     *
     * @param array $userData User data for onboarding
     * @return array Response from Trovotech API
     * @throws \RuntimeException
     */
    public function onboardUser(array $userData): array
    {
        return $this->request('POST', 'user_onboard', [], $userData);
    }

    /**
     * Update KYC status for a Trovotech user
     *
     * @param string $username Target Trovo username
     * @param int $kycStatus KYC level (1-4)
     * @param string $kycJsonData Raw KYC JSON from provider
     * @return array Response from Trovotech API
     * @throws \RuntimeException
     */
    public function updateUserKyc(string $username, int $kycStatus, string $kycJsonData): array
    {
        return $this->request('POST', 'user_update_kyc', [], [
            'targetTrovoUsername' => $username,
            'kycStatus' => $kycStatus,
            'kycJsonData' => $kycJsonData,
        ]);
    }

    /**
     * Phase 1: Initialize token mint (get unsigned transaction)
     *
     * @param string $destination Public key or Trovo username of subwallet recipient
     * @param string $assetIssuer 56-character public key of the issuer
     * @param string $assetCode Asset code (up to 12 alphanumeric characters)
     * @param string $amount Token units to mint
     * @param string|null $memo Optional memo (max 28 bytes)
     * @param string|null $publicKey Issuer's public key for header
     * @param string|null $signer Signer's public key for header
     * @return array Unsigned transaction data
     * @throws \RuntimeException
     */
    public function initTokenMint(
        string $destination,
        string $assetIssuer,
        string $assetCode,
        string $amount,
        ?string $memo = null,
        ?string $publicKey = null,
        ?string $signer = null
    ): array {
        $body = [
            'destination' => $destination,
            'assetIssuer' => $assetIssuer,
            'assetCode' => $assetCode,
            'amount' => $amount,
        ];

        if ($memo) {
            $body['memo'] = $memo;
        }

        // Add wallet-specific headers if provided
        $headers = [];
        if ($publicKey) {
            $headers['X-TW-PUBLIC-KEY'] = $publicKey;
        }
        if ($signer) {
            $headers['X-TW-SIGNER'] = $signer;
        }

        return $this->requestWithHeaders('POST', 'token_mint', [], $body, $headers);
    }

    /**
     * Phase 2: Commit signed token mint transaction
     *
     * @param array $signedTransaction Complete transaction data with signature
     * @param string|null $publicKey Issuer's public key for header
     * @param string|null $signer Signer's public key for header
     * @return array Final transaction result
     * @throws \RuntimeException
     */
    public function commitTokenMint(
        array $signedTransaction,
        ?string $publicKey = null,
        ?string $signer = null
    ): array {
        // Add wallet-specific headers if provided
        $headers = [];
        if ($publicKey) {
            $headers['X-TW-PUBLIC-KEY'] = $publicKey;
        }
        if ($signer) {
            $headers['X-TW-SIGNER'] = $signer;
        }

        return $this->requestWithHeaders('POST', 'token_mint', [], $signedTransaction, $headers);
    }

    /**
     * Request with custom headers
     * Enhanced version of request() that allows additional headers
     *
     * @param string $method HTTP method
     * @param string $endpointKey Key from endpoints map
     * @param array $params URL params to replace in path
     * @param array $body Request body
     * @param array $customHeaders Additional headers to merge
     * @param int $maxRetries Maximum retry attempts
     * @return array Decoded JSON response
     * @throws \RuntimeException
     */
    private function requestWithHeaders(
        string $method,
        string $endpointKey,
        array $params = [],
        array $body = [],
        array $customHeaders = [],
        int $maxRetries = 3
    ): array {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('TrovoTech not configured - check TROVOTECH_BASE_URL and TROVOTECH_API_KEY');
        }

        $attempt = 0;
        $lastException = null;

        while ($attempt < $maxRetries) {
            try {
                $attempt++;

                $client = new Client([
                    'timeout' => $this->timeoutMs / 1000.0,
                    'http_errors' => true,
                ]);

                $url = $this->url($endpointKey, $params);

                $headers = array_merge([
                    'X-TW-SERVICE-LINK-API-KEY' => $this->apiKey,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'X-Request-ID' => uniqid('ft_', true),
                ], $customHeaders);

                $options = ['headers' => $headers];

                if (!empty($body)) {
                    $options['json'] = $body;
                }

                $response = $client->request($method, $url, $options);
                $data = json_decode($response->getBody()->getContents(), true) ?? [];

                if (!$this->sandbox) {
                    Log::info('TrovoTech API request successful', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'attempt' => $attempt,
                    ]);
                }

                return $data;

            } catch (GuzzleException $e) {
                $lastException = $e;
                $statusCode = $e->getCode();

                if ($statusCode >= 400 && $statusCode < 500) {
                    Log::error('TrovoTech API client error (no retry)', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'status' => $statusCode,
                        'error' => $e->getMessage(),
                    ]);
                    throw new \RuntimeException("TrovoTech API error ({$statusCode}): " . $e->getMessage());
                }

                if ($attempt < $maxRetries) {
                    $delay = min(pow(2, $attempt) * 100000, 2000000);
                    Log::warning('TrovoTech API error, retrying...', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'attempt' => $attempt,
                        'max_retries' => $maxRetries,
                        'delay_ms' => $delay / 1000,
                        'error' => $e->getMessage(),
                    ]);
                    usleep($delay);
                } else {
                    Log::error('TrovoTech API error after max retries', [
                        'method' => $method,
                        'endpoint' => $endpointKey,
                        'attempts' => $attempt,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        throw new \RuntimeException('TrovoTech API error after ' . $maxRetries . ' attempts: ' . ($lastException ? $lastException->getMessage() : 'Unknown error'));
    }
}
