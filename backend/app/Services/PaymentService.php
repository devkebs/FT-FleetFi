<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\PaymentMethod;
use App\Models\PaymentRecord;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    // Nigerian banks list (most common)
    public const NIGERIAN_BANKS = [
        ['code' => '044', 'name' => 'Access Bank'],
        ['code' => '023', 'name' => 'Citibank Nigeria'],
        ['code' => '063', 'name' => 'Diamond Bank'],
        ['code' => '050', 'name' => 'Ecobank Nigeria'],
        ['code' => '084', 'name' => 'Enterprise Bank'],
        ['code' => '070', 'name' => 'Fidelity Bank'],
        ['code' => '011', 'name' => 'First Bank of Nigeria'],
        ['code' => '214', 'name' => 'First City Monument Bank'],
        ['code' => '058', 'name' => 'Guaranty Trust Bank'],
        ['code' => '030', 'name' => 'Heritage Bank'],
        ['code' => '301', 'name' => 'Jaiz Bank'],
        ['code' => '082', 'name' => 'Keystone Bank'],
        ['code' => '526', 'name' => 'Parallex Bank'],
        ['code' => '076', 'name' => 'Polaris Bank'],
        ['code' => '101', 'name' => 'Providus Bank'],
        ['code' => '221', 'name' => 'Stanbic IBTC Bank'],
        ['code' => '068', 'name' => 'Standard Chartered Bank'],
        ['code' => '232', 'name' => 'Sterling Bank'],
        ['code' => '100', 'name' => 'Suntrust Bank'],
        ['code' => '032', 'name' => 'Union Bank of Nigeria'],
        ['code' => '033', 'name' => 'United Bank for Africa'],
        ['code' => '215', 'name' => 'Unity Bank'],
        ['code' => '035', 'name' => 'Wema Bank'],
        ['code' => '057', 'name' => 'Zenith Bank'],
        ['code' => '999992', 'name' => 'Opay'],
        ['code' => '999991', 'name' => 'PalmPay'],
        ['code' => '999993', 'name' => 'Kuda Bank'],
        ['code' => '999994', 'name' => 'Moniepoint'],
    ];

    /**
     * Get list of supported banks
     */
    public function getBanks(): array
    {
        // Try to get from Paystack for latest list
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
            ])->get('https://api.paystack.co/bank');

            if ($response->successful() && $response->json('status')) {
                return $response->json('data');
            }
        } catch (\Exception $e) {
            Log::warning('Failed to fetch banks from Paystack', ['error' => $e->getMessage()]);
        }

        return self::NIGERIAN_BANKS;
    }

    /**
     * Verify bank account
     */
    public function verifyBankAccount(string $accountNumber, string $bankCode): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
        ])->get('https://api.paystack.co/bank/resolve', [
            'account_number' => $accountNumber,
            'bank_code' => $bankCode,
        ]);

        if ($response->successful() && $response->json('status')) {
            return [
                'success' => true,
                'account_name' => $response->json('data.account_name'),
                'account_number' => $response->json('data.account_number'),
                'bank_id' => $response->json('data.bank_id'),
            ];
        }

        return [
            'success' => false,
            'error' => $response->json('message') ?? 'Account verification failed',
        ];
    }

    /**
     * Create transfer recipient (for withdrawals)
     */
    public function createTransferRecipient(User $user, string $accountNumber, string $bankCode, string $accountName): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
        ])->post('https://api.paystack.co/transferrecipient', [
            'type' => 'nuban',
            'name' => $accountName,
            'account_number' => $accountNumber,
            'bank_code' => $bankCode,
            'currency' => 'NGN',
        ]);

        if ($response->successful() && $response->json('status')) {
            return [
                'success' => true,
                'recipient_code' => $response->json('data.recipient_code'),
                'details' => $response->json('data.details'),
            ];
        }

        return [
            'success' => false,
            'error' => $response->json('message') ?? 'Failed to create transfer recipient',
        ];
    }

    /**
     * Add bank account as payment method
     */
    public function addBankAccount(User $user, string $accountNumber, string $bankCode): array
    {
        // Find bank name
        $banks = $this->getBanks();
        $bank = collect($banks)->firstWhere('code', $bankCode);
        $bankName = $bank['name'] ?? 'Unknown Bank';

        // Verify account
        $verification = $this->verifyBankAccount($accountNumber, $bankCode);
        if (!$verification['success']) {
            return $verification;
        }

        // Create transfer recipient for withdrawals
        $recipient = $this->createTransferRecipient(
            $user,
            $accountNumber,
            $bankCode,
            $verification['account_name']
        );

        if (!$recipient['success']) {
            return $recipient;
        }

        // Check if account already exists
        $existing = PaymentMethod::where('user_id', $user->id)
            ->where('account_number', $accountNumber)
            ->where('bank_code', $bankCode)
            ->first();

        if ($existing) {
            return [
                'success' => false,
                'error' => 'This bank account is already added',
            ];
        }

        // Create payment method
        $isFirst = PaymentMethod::where('user_id', $user->id)->count() === 0;

        $paymentMethod = PaymentMethod::create([
            'user_id' => $user->id,
            'type' => PaymentMethod::TYPE_BANK_ACCOUNT,
            'bank_code' => $bankCode,
            'bank_name' => $bankName,
            'account_number' => $accountNumber,
            'account_name' => $verification['account_name'],
            'recipient_code' => $recipient['recipient_code'],
            'is_default' => $isFirst,
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        return [
            'success' => true,
            'payment_method' => $paymentMethod,
        ];
    }

    /**
     * Initialize payment for wallet funding
     */
    public function initializeFunding(User $user, float $amount, string $gateway = 'paystack'): array
    {
        $reference = $this->generateReference('FUND');
        $fee = $this->calculateFee($amount, $gateway, 'funding');

        DB::beginTransaction();
        try {
            // Create payment record
            $paymentRecord = PaymentRecord::create([
                'user_id' => $user->id,
                'reference' => $reference,
                'gateway' => $gateway,
                'type' => PaymentRecord::TYPE_FUNDING,
                'amount' => $amount,
                'fee' => $fee,
                'net_amount' => $amount - $fee,
                'currency' => 'NGN',
                'status' => PaymentRecord::STATUS_PENDING,
            ]);

            // Initialize with payment gateway
            if ($gateway === 'paystack') {
                $result = $this->initializePaystack($user, $amount, $reference);
            } else {
                $result = $this->initializeFlutterwave($user, $amount, $reference);
            }

            if (!$result['success']) {
                DB::rollBack();
                return $result;
            }

            $paymentRecord->update([
                'authorization_url' => $result['authorization_url'],
                'gateway_reference' => $result['access_code'] ?? null,
            ]);

            DB::commit();

            return [
                'success' => true,
                'reference' => $reference,
                'authorization_url' => $result['authorization_url'],
                'access_code' => $result['access_code'] ?? null,
                'amount' => $amount,
                'fee' => $fee,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment initialization failed', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Failed to initialize payment',
            ];
        }
    }

    /**
     * Process withdrawal
     */
    public function processWithdrawal(User $user, float $amount, int $paymentMethodId): array
    {
        $paymentMethod = PaymentMethod::where('id', $paymentMethodId)
            ->where('user_id', $user->id)
            ->where('is_verified', true)
            ->first();

        if (!$paymentMethod) {
            return ['success' => false, 'error' => 'Invalid payment method'];
        }

        if (!$paymentMethod->recipient_code) {
            return ['success' => false, 'error' => 'Payment method not set up for withdrawals'];
        }

        // Check wallet balance
        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet || $wallet->balance < $amount) {
            return ['success' => false, 'error' => 'Insufficient balance'];
        }

        $reference = $this->generateReference('WDR');
        $fee = $this->calculateFee($amount, 'paystack', 'withdrawal');
        $netAmount = $amount - $fee;

        DB::beginTransaction();
        try {
            // Debit wallet first
            $wallet->decrement('balance', $amount);

            // Create wallet transaction
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'withdrawal',
                'amount' => $amount,
                'currency' => 'NGN',
                'status' => 'pending',
                'description' => "Withdrawal to {$paymentMethod->bank_name} - {$paymentMethod->masked_account_number}",
                'metadata' => [
                    'payment_method_id' => $paymentMethodId,
                    'bank_name' => $paymentMethod->bank_name,
                    'account_number' => $paymentMethod->account_number,
                ],
            ]);

            // Create payment record
            $paymentRecord = PaymentRecord::create([
                'user_id' => $user->id,
                'wallet_transaction_id' => $transaction->id,
                'reference' => $reference,
                'gateway' => 'paystack',
                'type' => PaymentRecord::TYPE_WITHDRAWAL,
                'amount' => $amount,
                'fee' => $fee,
                'net_amount' => $netAmount,
                'currency' => 'NGN',
                'status' => PaymentRecord::STATUS_PROCESSING,
                'metadata' => [
                    'recipient_code' => $paymentMethod->recipient_code,
                    'bank_name' => $paymentMethod->bank_name,
                ],
            ]);

            // Initiate transfer
            $transferResult = $this->initiateTransfer(
                $paymentMethod->recipient_code,
                $netAmount,
                $reference,
                "FleetFi Withdrawal - {$user->name}"
            );

            if (!$transferResult['success']) {
                // Refund wallet
                $wallet->increment('balance', $amount);
                $transaction->update(['status' => 'failed']);
                $paymentRecord->markFailed($transferResult['error']);

                DB::commit();
                return $transferResult;
            }

            $paymentRecord->update([
                'gateway_reference' => $transferResult['transfer_code'],
                'gateway_response' => $transferResult,
            ]);

            DB::commit();

            // Log audit
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'withdrawal_initiated',
                'description' => "Withdrawal of ₦{$amount} to {$paymentMethod->bank_name}",
            ]);

            return [
                'success' => true,
                'reference' => $reference,
                'amount' => $amount,
                'fee' => $fee,
                'net_amount' => $netAmount,
                'transfer_code' => $transferResult['transfer_code'],
                'message' => 'Withdrawal is being processed',
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Withdrawal failed', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => 'Withdrawal failed. Please try again.'];
        }
    }

    /**
     * Initiate Paystack transfer
     */
    private function initiateTransfer(string $recipientCode, float $amount, string $reference, string $reason): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
        ])->post('https://api.paystack.co/transfer', [
            'source' => 'balance',
            'amount' => $amount * 100, // Convert to kobo
            'recipient' => $recipientCode,
            'reason' => $reason,
            'reference' => $reference,
        ]);

        if ($response->successful() && $response->json('status')) {
            return [
                'success' => true,
                'transfer_code' => $response->json('data.transfer_code'),
                'status' => $response->json('data.status'),
            ];
        }

        return [
            'success' => false,
            'error' => $response->json('message') ?? 'Transfer initiation failed',
        ];
    }

    /**
     * Verify and complete payment
     */
    public function verifyAndCompletePayment(string $reference, string $gateway): array
    {
        $paymentRecord = PaymentRecord::where('reference', $reference)->first();

        if (!$paymentRecord) {
            return ['success' => false, 'error' => 'Payment not found'];
        }

        if ($paymentRecord->status === PaymentRecord::STATUS_COMPLETED) {
            return ['success' => true, 'message' => 'Payment already completed'];
        }

        // Verify with gateway
        if ($gateway === 'paystack') {
            $result = $this->verifyPaystack($reference);
        } else {
            $result = $this->verifyFlutterwave($reference);
        }

        if (!$result['success']) {
            $paymentRecord->markFailed($result['error']);
            return $result;
        }

        DB::beginTransaction();
        try {
            // Credit wallet
            $user = $paymentRecord->user;
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0, 'currency' => 'NGN']
            );

            $wallet->increment('balance', $paymentRecord->net_amount);

            // Create wallet transaction
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'user_id' => $user->id,
                'type' => 'deposit',
                'amount' => $paymentRecord->net_amount,
                'currency' => 'NGN',
                'status' => 'completed',
                'description' => "Wallet funding via {$gateway}",
                'tx_hash' => $reference,
                'completed_at' => now(),
            ]);

            $paymentRecord->update([
                'wallet_transaction_id' => $transaction->id,
                'status' => PaymentRecord::STATUS_COMPLETED,
                'gateway_response' => $result,
                'completed_at' => now(),
            ]);

            DB::commit();

            // Log audit
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'payment_completed',
                'description' => "Wallet funded with ₦{$paymentRecord->net_amount} via {$gateway}",
            ]);

            return [
                'success' => true,
                'amount' => $paymentRecord->amount,
                'net_amount' => $paymentRecord->net_amount,
                'new_balance' => $wallet->fresh()->balance,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment completion failed', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => 'Failed to complete payment'];
        }
    }

    /**
     * Calculate payment fee
     */
    public function calculateFee(float $amount, string $gateway, string $type): float
    {
        if ($type === 'withdrawal') {
            // Flat fee for withdrawals
            if ($amount <= 5000) return 10;
            if ($amount <= 50000) return 25;
            return 50;
        }

        // Funding fees (Paystack: 1.5% + ₦100, capped at ₦2000)
        if ($gateway === 'paystack') {
            $fee = ($amount * 0.015) + 100;
            return min($fee, 2000);
        }

        // Flutterwave: 1.4%, capped at ₦2000
        if ($gateway === 'flutterwave') {
            $fee = $amount * 0.014;
            return min($fee, 2000);
        }

        return 0;
    }

    /**
     * Generate unique reference
     */
    private function generateReference(string $prefix = 'PAY'): string
    {
        return $prefix . '-' . strtoupper(Str::random(8)) . '-' . time();
    }

    /**
     * Initialize Paystack payment
     */
    private function initializePaystack(User $user, float $amount, string $reference): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => $user->email,
            'amount' => $amount * 100,
            'currency' => 'NGN',
            'reference' => $reference,
            'callback_url' => config('app.frontend_url') . '/payment/callback',
            'metadata' => [
                'user_id' => $user->id,
                'user_name' => $user->name,
            ],
        ]);

        if ($response->successful() && $response->json('status')) {
            return [
                'success' => true,
                'authorization_url' => $response->json('data.authorization_url'),
                'access_code' => $response->json('data.access_code'),
                'reference' => $response->json('data.reference'),
            ];
        }

        return [
            'success' => false,
            'error' => $response->json('message') ?? 'Failed to initialize payment',
        ];
    }

    /**
     * Initialize Flutterwave payment
     */
    private function initializeFlutterwave(User $user, float $amount, string $reference): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.flutterwave.secret_key'),
        ])->post('https://api.flutterwave.com/v3/payments', [
            'tx_ref' => $reference,
            'amount' => $amount,
            'currency' => 'NGN',
            'redirect_url' => config('app.frontend_url') . '/payment/callback',
            'customer' => [
                'email' => $user->email,
                'name' => $user->name,
            ],
            'meta' => [
                'user_id' => $user->id,
            ],
        ]);

        if ($response->successful() && $response->json('status') === 'success') {
            return [
                'success' => true,
                'authorization_url' => $response->json('data.link'),
                'reference' => $reference,
            ];
        }

        return [
            'success' => false,
            'error' => $response->json('message') ?? 'Failed to initialize payment',
        ];
    }

    /**
     * Verify Paystack payment
     */
    private function verifyPaystack(string $reference): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
        ])->get("https://api.paystack.co/transaction/verify/{$reference}");

        if ($response->successful() && $response->json('status')) {
            $data = $response->json('data');

            if ($data['status'] === 'success') {
                return [
                    'success' => true,
                    'amount' => $data['amount'] / 100,
                    'currency' => $data['currency'],
                    'gateway_reference' => $data['id'],
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'Payment verification failed',
        ];
    }

    /**
     * Verify Flutterwave payment
     */
    private function verifyFlutterwave(string $reference): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.flutterwave.secret_key'),
        ])->get("https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref={$reference}");

        if ($response->successful() && $response->json('status') === 'success') {
            $data = $response->json('data');

            if ($data['status'] === 'successful') {
                return [
                    'success' => true,
                    'amount' => $data['amount'],
                    'currency' => $data['currency'],
                    'gateway_reference' => $data['id'],
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'Payment verification failed',
        ];
    }

    /**
     * Get payment history
     */
    public function getPaymentHistory(User $user, int $limit = 20): array
    {
        return PaymentRecord::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
