<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Stellar Wallet Utilities for Trovotech Integration
 *
 * This helper class provides utilities for generating and validating
 * Stellar-compatible wallet addresses for the Trovotech/Bantu blockchain.
 *
 * NOTE: PHP cannot generate real Stellar keypairs natively.
 * For production, use one of these approaches:
 * 1. Frontend generation (JavaScript with @stellar/stellar-sdk)
 * 2. External service call to Node.js microservice
 * 3. PHP Stellar SDK (if available)
 *
 * This class provides mock generation for development/testing.
 */
class StellarWalletHelper
{
    /**
     * Validate if a string is a valid Stellar public key
     *
     * @param string $publicKey
     * @return bool
     */
    public static function isValidPublicKey(string $publicKey): bool
    {
        // Stellar public keys:
        // - Start with 'G'
        // - Are 56 characters long
        // - Are base32 encoded
        return strlen($publicKey) === 56 && $publicKey[0] === 'G';
    }

    /**
     * Validate if a string is a valid Stellar secret key
     *
     * @param string $secretKey
     * @return bool
     */
    public static function isValidSecretKey(string $secretKey): bool
    {
        // Stellar secret keys:
        // - Start with 'S'
        // - Are 56 characters long
        // - Are base32 encoded
        return strlen($secretKey) === 56 && $secretKey[0] === 'S';
    }

    /**
     * Generate a mock Stellar public key for development/testing
     *
     * WARNING: This is NOT a real Stellar keypair!
     * Use only for development/testing when blockchain integration is disabled.
     *
     * @param string|null $seed Optional seed for deterministic generation
     * @return string Mock public key starting with 'G'
     */
    public static function generateMockPublicKey(?string $seed = null): string
    {
        $seed = $seed ?? Str::random(32);
        $hash = hash('sha256', $seed);

        // Generate a 56-character string starting with 'G'
        // Using base32-like characters (uppercase A-Z, 2-7)
        $base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $publicKey = 'G';

        for ($i = 0; $i < 55; $i++) {
            $index = hexdec(substr($hash, $i % 64, 2)) % 32;
            $publicKey .= $base32Chars[$index];
        }

        return $publicKey;
    }

    /**
     * Generate a mock Stellar secret key for development/testing
     *
     * WARNING: This is NOT a real Stellar keypair!
     * Use only for development/testing when blockchain integration is disabled.
     *
     * @param string|null $seed Optional seed for deterministic generation
     * @return string Mock secret key starting with 'S'
     */
    public static function generateMockSecretKey(?string $seed = null): string
    {
        $seed = $seed ?? Str::random(32);
        $hash = hash('sha256', 'SECRET_' . $seed);

        // Generate a 56-character string starting with 'S'
        $base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secretKey = 'S';

        for ($i = 0; $i < 55; $i++) {
            $index = hexdec(substr($hash, $i % 64, 2)) % 32;
            $secretKey .= $base32Chars[$index];
        }

        return $secretKey;
    }

    /**
     * Generate a mock Stellar keypair for development/testing
     *
     * WARNING: This is NOT a real Stellar keypair!
     * The public and secret keys are not cryptographically related.
     * Use only for development/testing when blockchain integration is disabled.
     *
     * @return array{publicKey: string, secretKey: string}
     */
    public static function generateMockKeypair(): array
    {
        $seed = Str::random(32);

        return [
            'publicKey' => self::generateMockPublicKey($seed),
            'secretKey' => self::generateMockSecretKey($seed),
        ];
    }

    /**
     * Format a public key for display (first 8 and last 8 characters)
     *
     * @param string $publicKey
     * @return string
     */
    public static function formatPublicKeyShort(string $publicKey): string
    {
        if (strlen($publicKey) < 16) {
            return $publicKey;
        }

        return substr($publicKey, 0, 8) . '...' . substr($publicKey, -8);
    }

    /**
     * Get the network passphrase for the current environment
     *
     * @return string
     */
    public static function getNetworkPassphrase(): string
    {
        $sandbox = config('services.trovotech.sandbox', true);

        return $sandbox
            ? env('STELLAR_NETWORK_PASSPHRASE', 'Bantu Testnet ; January 2022')
            : 'Bantu Public Network ; January 2022';
    }

    /**
     * Log wallet generation for audit purposes
     *
     * @param string $publicKey
     * @param string $userId
     * @param string $purpose
     * @return void
     */
    public static function logWalletGeneration(string $publicKey, string $userId, string $purpose = 'user_wallet'): void
    {
        Log::info('Stellar wallet generated', [
            'public_key' => self::formatPublicKeyShort($publicKey),
            'user_id' => $userId,
            'purpose' => $purpose,
            'network' => self::getNetworkPassphrase(),
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Instructions for generating real Stellar keypairs
     *
     * @return array
     */
    public static function getRealKeypairInstructions(): array
    {
        return [
            'message' => 'To generate real Stellar keypairs, use one of these methods:',
            'methods' => [
                'frontend' => [
                    'description' => 'Use @stellar/stellar-sdk in JavaScript/TypeScript',
                    'code' => "import { Keypair } from '@stellar/stellar-sdk';\nconst pair = Keypair.random();",
                    'recommended' => true,
                ],
                'nodejs_service' => [
                    'description' => 'Create a Node.js microservice with Stellar SDK',
                    'endpoint' => 'POST /api/stellar/generate-keypair',
                    'recommended' => true,
                ],
                'php_sdk' => [
                    'description' => 'Use ZuluCrypto/stellar-api-php package',
                    'package' => 'composer require zulucrypto/stellar-api',
                    'recommended' => false,
                ],
            ],
            'security_notes' => [
                'Never log or display secret keys in production',
                'Store secret keys encrypted in the database',
                'Use environment variables for service keys',
                'Implement proper key rotation policies',
            ],
        ];
    }
}
