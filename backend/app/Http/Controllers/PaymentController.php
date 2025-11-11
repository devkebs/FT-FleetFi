<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\AuditLog;

class PaymentController extends Controller
{
    /**
     * Verify payment from Paystack or Flutterwave
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'reference' => 'required|string',
            'gateway' => 'required|in:paystack,flutterwave',
        ]);

        $user = $request->user();
        $reference = $request->reference;
        $gateway = $request->gateway;

        try {
            if ($gateway === 'paystack') {
                $result = $this->verifyPaystack($reference);
            } else {
                $result = $this->verifyFlutterwave($reference);
            }

            if ($result['success']) {
                // Credit user's wallet
                $this->creditWallet($user, $result['amount'], $reference, $gateway);

                // Log audit
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'payment_verified',
                    'description' => "Payment verified: {$reference} via {$gateway}",
                    'ip_address' => $request->ip(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Payment verified successfully',
                    'amount' => $result['amount'],
                    'reference' => $reference,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed',
                    'error' => $result['error'],
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Payment verification error', [
                'reference' => $reference,
                'gateway' => $gateway,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify Paystack payment
     */
    private function verifyPaystack(string $reference): array
    {
        $secretKey = config('services.paystack.secret_key');

        if (!$secretKey) {
            throw new \Exception('Paystack secret key not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$secretKey}",
        ])->get("https://api.paystack.co/transaction/verify/{$reference}");

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status'] && $data['data']['status'] === 'success') {
                return [
                    'success' => true,
                    'amount' => $data['data']['amount'] / 100, // Convert from kobo to naira
                    'currency' => $data['data']['currency'],
                    'customer_email' => $data['data']['customer']['email'],
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'Payment not successful',
        ];
    }

    /**
     * Verify Flutterwave payment
     */
    private function verifyFlutterwave(string $reference): array
    {
        $secretKey = config('services.flutterwave.secret_key');

        if (!$secretKey) {
            throw new \Exception('Flutterwave secret key not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$secretKey}",
        ])->get("https://api.flutterwave.com/v3/transactions/{$reference}/verify");

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status'] === 'success' && $data['data']['status'] === 'successful') {
                return [
                    'success' => true,
                    'amount' => $data['data']['amount'],
                    'currency' => $data['data']['currency'],
                    'customer_email' => $data['data']['customer']['email'],
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'Payment not successful',
        ];
    }

    /**
     * Credit user wallet after successful payment
     */
    private function creditWallet(User $user, float $amount, string $reference, string $gateway): void
    {
        // Get or create wallet
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // Create transaction record
        WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => $amount,
            'description' => "Wallet funding via {$gateway}",
            'reference' => $reference,
            'status' => 'completed',
        ]);

        // Update wallet balance
        $wallet->increment('balance', $amount);

        Log::info('Wallet credited', [
            'user_id' => $user->id,
            'amount' => $amount,
            'reference' => $reference,
            'gateway' => $gateway,
        ]);
    }

    /**
     * Initialize payment (for server-side payment flow)
     */
    public function initializePayment(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'gateway' => 'required|in:paystack,flutterwave',
            'purpose' => 'required|in:investment,wallet_funding,subscription',
        ]);

        $user = $request->user();
        $amount = $request->amount;
        $gateway = $request->gateway;

        try {
            if ($gateway === 'paystack') {
                $result = $this->initializePaystack($user, $amount);
            } else {
                $result = $this->initializeFlutterwave($user, $amount);
            }

            return response()->json([
                'success' => true,
                'authorization_url' => $result['authorization_url'],
                'access_code' => $result['access_code'] ?? null,
                'reference' => $result['reference'],
            ]);
        } catch (\Exception $e) {
            Log::error('Payment initialization error', [
                'user_id' => $user->id,
                'amount' => $amount,
                'gateway' => $gateway,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Initialize Paystack payment
     */
    private function initializePaystack(User $user, float $amount): array
    {
        $secretKey = config('services.paystack.secret_key');

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$secretKey}",
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => $user->email,
            'amount' => $amount * 100, // Convert to kobo
            'currency' => 'NGN',
            'callback_url' => config('app.frontend_url') . '/payment/callback',
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status']) {
                return [
                    'authorization_url' => $data['data']['authorization_url'],
                    'access_code' => $data['data']['access_code'],
                    'reference' => $data['data']['reference'],
                ];
            }
        }

        throw new \Exception('Failed to initialize Paystack payment');
    }

    /**
     * Initialize Flutterwave payment
     */
    private function initializeFlutterwave(User $user, float $amount): array
    {
        $secretKey = config('services.flutterwave.secret_key');
        $reference = 'FLW-' . time() . '-' . rand(1000, 9999);

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$secretKey}",
        ])->post('https://api.flutterwave.com/v3/payments', [
            'tx_ref' => $reference,
            'amount' => $amount,
            'currency' => 'NGN',
            'redirect_url' => config('app.frontend_url') . '/payment/callback',
            'customer' => [
                'email' => $user->email,
                'name' => $user->name,
            ],
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status'] === 'success') {
                return [
                    'authorization_url' => $data['data']['link'],
                    'reference' => $reference,
                ];
            }
        }

        throw new \Exception('Failed to initialize Flutterwave payment');
    }

    /**
     * Webhook handler for Paystack
     */
    public function paystackWebhook(Request $request)
    {
        // Verify webhook signature
        $signature = $request->header('X-Paystack-Signature');
        $secretKey = config('services.paystack.secret_key');

        if (!$signature || $signature !== hash_hmac('sha512', $request->getContent(), $secretKey)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'charge.success') {
            $reference = $data['reference'];
            $amount = $data['amount'] / 100;
            $email = $data['customer']['email'];

            $user = User::where('email', $email)->first();

            if ($user) {
                $this->creditWallet($user, $amount, $reference, 'paystack');
            }
        }

        return response()->json(['message' => 'Webhook processed']);
    }

    /**
     * Webhook handler for Flutterwave
     */
    public function flutterwaveWebhook(Request $request)
    {
        // Verify webhook signature
        $signature = $request->header('verif-hash');
        $secretHash = config('services.flutterwave.webhook_secret');

        if (!$signature || $signature !== $secretHash) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'charge.completed' && $data['status'] === 'successful') {
            $reference = $data['tx_ref'];
            $amount = $data['amount'];
            $email = $data['customer']['email'];

            $user = User::where('email', $email)->first();

            if ($user) {
                $this->creditWallet($user, $amount, $reference, 'flutterwave');
            }
        }

        return response()->json(['message' => 'Webhook processed']);
    }
}
