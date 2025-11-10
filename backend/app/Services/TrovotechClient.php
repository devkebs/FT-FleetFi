<?php

namespace App\Services;

use App\Models\ConfigSetting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

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
            'wallet' => '/wallet',
            'mint_token' => '/token/mint',
            'payout_initiate' => '/payout/initiate',
            'telemetry_sync' => '/telemetry/sync',
            'tokens_my' => '/tokens/my',
            'asset_metadata' => '/asset/{assetId}/metadata'
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
     *
     * @param string $method HTTP method
     * @param string $endpointKey Key from endpoints map
     * @param array $params URL params to replace in path
     * @param array $body Request body (for POST/PATCH)
     * @return array Decoded JSON response
     * @throws \RuntimeException
     */
    public function request(string $method, string $endpointKey, array $params = [], array $body = []): array
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('TrovoTech not configured');
        }

        try {
            $client = new Client([
                'timeout' => $this->timeoutMs / 1000.0,
                'http_errors' => true,
            ]);

            $url = $this->url($endpointKey, $params);

            $options = [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'X-Sandbox' => $this->sandbox ? '1' : '0',
                ],
            ];

            if (!empty($body)) {
                $options['json'] = $body;
            }

            $response = $client->request($method, $url, $options);

            return json_decode($response->getBody()->getContents(), true) ?? [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException('TrovoTech API error: ' . $e->getMessage());
        }
    }
}
