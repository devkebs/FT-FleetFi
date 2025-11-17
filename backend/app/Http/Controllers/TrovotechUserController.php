<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use App\Services\TrovotechClient;
use App\Services\StellarWalletHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Trovotech User Management Controller
 *
 * Handles user onboarding, KYC updates, and wallet management
 * for the Trovotech blockchain integration.
 */
class TrovotechUserController extends Controller
{
    private TrovotechClient $client;

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->client = new TrovotechClient();
    }

    /**
     * Onboard the authenticated user to Trovotech
     * POST /api/trovotech/users/onboard
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function onboardUser(Request $request)
    {
        $user = $request->user();

        // Check if user already has a Trovotech wallet
        $existingWallet = Wallet::where('user_id', $user->id)
            ->where('wallet_type', 'trovotech')
            ->first();

        if ($existingWallet) {
            return response()->json([
                'message' => 'User already onboarded to Trovotech',
                'wallet' => [
                    'address' => $existingWallet->wallet_address,
                    'balance' => $existingWallet->balance,
                    'trovotech_username' => $existingWallet->trovotech_username,
                ],
            ], 200);
        }

        // Validate additional data if provided
        $validator = Validator::make($request->all(), [
            'mobile' => 'nullable|string',
            'mobile_country_code' => 'nullable|string',
            'public_key' => 'nullable|string|size:56',
            'referrer' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Generate or use provided public key
            $publicKey = $request->input('public_key');
            $secretKey = null;

            if (!$publicKey) {
                // Generate mock keypair for sandbox/development
                $keypair = StellarWalletHelper::generateMockKeypair();
                $publicKey = $keypair['publicKey'];
                $secretKey = $keypair['secretKey'];

                Log::info('Generated mock Stellar keypair for user', [
                    'user_id' => $user->id,
                    'public_key' => StellarWalletHelper::formatPublicKeyShort($publicKey),
                ]);
            }

            // Validate public key format
            if (!StellarWalletHelper::isValidPublicKey($publicKey)) {
                return response()->json([
                    'message' => 'Invalid Stellar public key format',
                ], 400);
            }

            // Prepare onboarding data
            $onboardData = [
                'email' => $user->email,
                'firstName' => $user->name ?? 'FleetFi User',
                'lastName' => '',
                'mobile' => $request->input('mobile', '0000000000'),
                'mobileCountryCode' => $request->input('mobile_country_code', '+234'),
                'publicKey' => $publicKey,
                'primarySigner' => $publicKey, // Same as publicKey for new wallets
                'corporate' => 0, // Individual user
            ];

            if ($request->has('referrer')) {
                $onboardData['referrer'] = $request->input('referrer');
            }

            // Call Trovotech API
            $response = $this->client->onboardUser($onboardData);

            // Store wallet in database
            $wallet = Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => $response['publicKey'] ?? $publicKey,
                'wallet_type' => 'trovotech',
                'balance' => 0,
                'trovotech_username' => $response['username'] ?? null,
                'primary_signer' => $response['primarySigner'] ?? $publicKey,
            ]);

            // Log wallet generation for audit
            StellarWalletHelper::logWalletGeneration(
                $wallet->wallet_address,
                (string) $user->id,
                'trovotech_onboarding'
            );

            return response()->json([
                'message' => 'User onboarded successfully to Trovotech',
                'trovotech' => [
                    'username' => $response['username'] ?? null,
                    'publicKey' => $response['publicKey'] ?? null,
                ],
                'wallet' => [
                    'address' => $wallet->wallet_address,
                    'balance' => $wallet->balance,
                    'trovotech_username' => $wallet->trovotech_username,
                ],
                // Only return secret key if we generated it (development mode)
                'secret_key' => $secretKey ? [
                    'value' => $secretKey,
                    'warning' => 'STORE THIS SECURELY - It will not be shown again!',
                ] : null,
            ], 201);

        } catch (\RuntimeException $e) {
            Log::error('Trovotech user onboarding failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to onboard user to Trovotech',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update KYC status for a user
     * POST /api/trovotech/users/kyc/update
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateKyc(Request $request)
    {
        // Only admin or operator can update KYC
        if (!in_array($request->user()->role, ['admin', 'operator'])) {
            return response()->json([
                'message' => 'Unauthorized - only admin or operator can update KYC',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'kyc_level' => 'required|integer|min:1|max:4',
            'kyc_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $targetUser = User::findOrFail($request->input('user_id'));

            // Get user's Trovotech wallet
            $wallet = Wallet::where('user_id', $targetUser->id)
                ->where('wallet_type', 'trovotech')
                ->first();

            if (!$wallet || !$wallet->trovotech_username) {
                return response()->json([
                    'message' => 'User not onboarded to Trovotech',
                ], 404);
            }

            // Call Trovotech API
            $response = $this->client->updateUserKyc(
                $wallet->trovotech_username,
                $request->input('kyc_level'),
                json_encode($request->input('kyc_data'))
            );

            // Update local user record
            $targetUser->update([
                'kyc_verified' => $request->input('kyc_level') >= 1,
                'kyc_level' => $request->input('kyc_level'),
            ]);

            Log::info('KYC updated for user', [
                'user_id' => $targetUser->id,
                'kyc_level' => $request->input('kyc_level'),
                'updated_by' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'KYC status updated successfully',
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'kyc_level' => $targetUser->kyc_level,
                    'kyc_verified' => $targetUser->kyc_verified,
                ],
                'trovotech_response' => $response,
            ], 200);

        } catch (\RuntimeException $e) {
            Log::error('KYC update failed', [
                'user_id' => $request->input('user_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to update KYC status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get Trovotech wallet information for authenticated user
     * GET /api/trovotech/users/wallet
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getWallet(Request $request)
    {
        $user = $request->user();

        $wallet = Wallet::where('user_id', $user->id)
            ->where('wallet_type', 'trovotech')
            ->first();

        if (!$wallet) {
            return response()->json([
                'message' => 'No Trovotech wallet found for user',
                'suggestion' => 'Call POST /api/trovotech/users/onboard to create one',
            ], 404);
        }

        return response()->json([
            'wallet' => [
                'address' => $wallet->wallet_address,
                'address_short' => StellarWalletHelper::formatPublicKeyShort($wallet->wallet_address),
                'balance' => $wallet->balance,
                'trovotech_username' => $wallet->trovotech_username,
                'created_at' => $wallet->created_at->toISOString(),
            ],
            'network' => StellarWalletHelper::getNetworkPassphrase(),
        ], 200);
    }

    /**
     * Get real keypair generation instructions
     * GET /api/trovotech/users/keypair-instructions
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getKeypairInstructions()
    {
        return response()->json(
            StellarWalletHelper::getRealKeypairInstructions(),
            200
        );
    }
}
