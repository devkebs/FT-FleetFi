<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Services\TrovoTechService;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;

class WalletController extends Controller
{
    protected $blockchainService = null;

    public function __construct()
    {
        // TrovoTechService is optional - only instantiate if class exists
        if (class_exists('App\Services\TrovoTechService')) {
            $this->blockchainService = new TrovoTechService();
        }
    }

    /**
     * Create a new wallet for the authenticated user
     */
    public function create(Request $request)
    {
        $user = Auth::user();

        // Check if user already has a wallet
        $existingWallet = Wallet::where('user_id', $user->id)->first();
        if ($existingWallet) {
            return response()->json([
                'message' => 'Wallet already exists',
                'wallet' => $existingWallet
            ], 200);
        }

        // Create wallet in database
        $wallet = Wallet::create([
            'user_id' => $user->id,
            'wallet_address' => 'G' . strtoupper(Str::random(55)),
            'trovotech_wallet_id' => 'TRV-' . strtoupper(Str::random(16)),
            'balance' => 0,
            'currency' => 'NGN',
            'status' => 'active',
            'verified_at' => now(),
        ]);

        // Also create via blockchain service for external integration (if available)
        $blockchainWallet = null;
        if ($this->blockchainService) {
            $blockchainWallet = $this->blockchainService->createWallet($user->id);
        }

        return response()->json([
            'message' => 'Wallet created successfully',
            'wallet' => $wallet,
            'blockchain' => $blockchainWallet
        ], 201);
    }

    /**
     * Get wallet details for a specific user
     */
    public function show($userId = null)
    {
        $targetUserId = $userId ?? Auth::id();

        $wallet = Wallet::where('user_id', $targetUserId)->first();

        if (!$wallet) {
            return response()->json([
                'error' => 'Wallet not found',
                'message' => 'No wallet exists for this user'
            ], 404);
        }

        return response()->json([
            'wallet' => $wallet,
            'user_id' => $targetUserId
        ]);
    }

    /**
     * Get wallet for authenticated user (shortcut)
     */
    public function myWallet()
    {
        $user = Auth::user();

        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json([
                'error' => 'Wallet not found',
                'message' => 'You do not have a wallet yet. Please create one.',
                'has_wallet' => false
            ], 404);
        }

        // Get recent transactions
        $recentTransactions = WalletTransaction::where('wallet_id', $wallet->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'wallet' => $wallet,
            'has_wallet' => true,
            'recent_transactions' => $recentTransactions
        ]);
    }

    /**
     * Get wallet balance
     */
    public function getBalance($userId = null)
    {
        $targetUserId = $userId ?? Auth::id();

        $wallet = Wallet::where('user_id', $targetUserId)->first();

        if (!$wallet) {
            return response()->json([
                'balance' => 0,
                'currency' => 'NGN',
                'has_wallet' => false
            ]);
        }

        return response()->json([
            'balance' => $wallet->balance,
            'currency' => $wallet->currency,
            'has_wallet' => true,
            'wallet_address' => $wallet->wallet_address,
            'status' => $wallet->status
        ]);
    }

    /**
     * Get transaction history
     */
    public function getTransactions(Request $request, $userId = null)
    {
        $targetUserId = $userId ?? Auth::id();

        $wallet = Wallet::where('user_id', $targetUserId)->first();

        if (!$wallet) {
            return response()->json([
                'transactions' => [],
                'total' => 0,
                'message' => 'No wallet found'
            ]);
        }

        $query = WalletTransaction::where('wallet_id', $wallet->id);

        // Filter by type if provided
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $perPage = $request->input('per_page', 10);
        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'transactions' => $transactions->items(),
            'total' => $transactions->total(),
            'current_page' => $transactions->currentPage(),
            'last_page' => $transactions->lastPage(),
            'per_page' => $transactions->perPage()
        ]);
    }

    /**
     * Get wallet statistics
     */
    public function getStats($userId = null)
    {
        $targetUserId = $userId ?? Auth::id();

        $wallet = Wallet::where('user_id', $targetUserId)->first();

        if (!$wallet) {
            return response()->json([
                'stats' => null,
                'message' => 'No wallet found'
            ]);
        }

        $transactions = WalletTransaction::where('wallet_id', $wallet->id);

        // Calculate stats
        $totalDeposits = (clone $transactions)
            ->whereIn('type', ['deposit', 'transfer_in', 'payout_received'])
            ->where('status', 'completed')
            ->sum('amount');

        $totalWithdrawals = (clone $transactions)
            ->whereIn('type', ['withdrawal', 'transfer_out', 'token_purchase'])
            ->where('status', 'completed')
            ->sum('amount');

        $pendingTransactions = (clone $transactions)
            ->where('status', 'pending')
            ->count();

        $monthlyIncome = (clone $transactions)
            ->whereIn('type', ['deposit', 'transfer_in', 'payout_received'])
            ->where('status', 'completed')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $monthlyExpense = (clone $transactions)
            ->whereIn('type', ['withdrawal', 'transfer_out', 'token_purchase'])
            ->where('status', 'completed')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        // Transaction counts by type
        $transactionsByType = WalletTransaction::where('wallet_id', $wallet->id)
            ->selectRaw('type, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        return response()->json([
            'stats' => [
                'balance' => $wallet->balance,
                'currency' => $wallet->currency,
                'total_deposits' => $totalDeposits,
                'total_withdrawals' => $totalWithdrawals,
                'pending_transactions' => $pendingTransactions,
                'monthly_income' => $monthlyIncome,
                'monthly_expense' => $monthlyExpense,
                'net_monthly' => $monthlyIncome - $monthlyExpense,
                'transactions_by_type' => $transactionsByType
            ],
            'wallet_address' => $wallet->wallet_address,
            'wallet_status' => $wallet->status
        ]);
    }

    /**
     * Transfer funds between wallets
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'to_address' => 'required|string',
            'amount' => 'required|numeric|min:100',
            'description' => 'nullable|string|max:255'
        ]);

        $user = Auth::user();
        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json(['error' => 'You do not have a wallet'], 400);
        }

        if ($wallet->balance < $request->amount) {
            return response()->json(['error' => 'Insufficient balance'], 400);
        }

        // Find recipient wallet
        $recipientWallet = Wallet::where('wallet_address', $request->to_address)->first();

        if (!$recipientWallet) {
            return response()->json(['error' => 'Recipient wallet not found'], 404);
        }

        if ($recipientWallet->id === $wallet->id) {
            return response()->json(['error' => 'Cannot transfer to your own wallet'], 400);
        }

        // Create outgoing transaction
        $outTransaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'user_id' => $user->id,
            'type' => 'transfer_out',
            'amount' => $request->amount,
            'currency' => 'NGN',
            'status' => 'completed',
            'tx_hash' => '0x' . bin2hex(random_bytes(32)),
            'from_address' => $wallet->wallet_address,
            'to_address' => $request->to_address,
            'description' => $request->description ?? 'Transfer to user',
            'metadata' => ['source' => 'FleetFi Platform', 'version' => '1.0'],
            'completed_at' => now(),
        ]);

        // Create incoming transaction for recipient
        $inTransaction = WalletTransaction::create([
            'wallet_id' => $recipientWallet->id,
            'user_id' => $recipientWallet->user_id,
            'type' => 'transfer_in',
            'amount' => $request->amount,
            'currency' => 'NGN',
            'status' => 'completed',
            'tx_hash' => $outTransaction->tx_hash,
            'from_address' => $wallet->wallet_address,
            'to_address' => $request->to_address,
            'description' => 'Received from user',
            'metadata' => ['source' => 'FleetFi Platform', 'version' => '1.0'],
            'completed_at' => now(),
        ]);

        // Update balances
        $wallet->decrement('balance', $request->amount);
        $recipientWallet->increment('balance', $request->amount);

        return response()->json([
            'message' => 'Transfer successful',
            'transaction' => $outTransaction,
            'new_balance' => $wallet->fresh()->balance
        ]);
    }

    /**
     * Deposit funds (simulated for demo)
     */
    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'payment_method' => 'nullable|string'
        ]);

        $user = Auth::user();
        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json(['error' => 'You do not have a wallet'], 400);
        }

        // Create deposit transaction
        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'user_id' => $user->id,
            'type' => 'deposit',
            'amount' => $request->amount,
            'currency' => 'NGN',
            'status' => 'completed',
            'tx_hash' => '0x' . bin2hex(random_bytes(32)),
            'from_address' => 'EXTERNAL',
            'to_address' => $wallet->wallet_address,
            'description' => ucfirst($request->payment_method ?? 'bank_transfer') . ' deposit',
            'metadata' => [
                'source' => 'FleetFi Platform',
                'version' => '1.0',
                'payment_method' => $request->payment_method ?? 'bank_transfer',
                'reference' => 'REF-' . strtoupper(Str::random(10))
            ],
            'completed_at' => now(),
        ]);

        // Update balance
        $wallet->increment('balance', $request->amount);

        return response()->json([
            'message' => 'Deposit successful',
            'transaction' => $transaction,
            'new_balance' => $wallet->fresh()->balance
        ]);
    }

    /**
     * Withdraw funds (simulated for demo)
     */
    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'bank_account' => 'nullable|string'
        ]);

        $user = Auth::user();
        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json(['error' => 'You do not have a wallet'], 400);
        }

        if ($wallet->balance < $request->amount) {
            return response()->json(['error' => 'Insufficient balance'], 400);
        }

        // Create withdrawal transaction
        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'amount' => $request->amount,
            'currency' => 'NGN',
            'status' => 'completed',
            'tx_hash' => '0x' . bin2hex(random_bytes(32)),
            'from_address' => $wallet->wallet_address,
            'to_address' => 'BANK-' . ($request->bank_account ?? 'DEFAULT'),
            'description' => 'Bank withdrawal',
            'metadata' => [
                'source' => 'FleetFi Platform',
                'version' => '1.0',
                'bank_name' => $request->bank_name ?? 'GTBank',
                'account_last4' => substr($request->bank_account ?? '0000', -4)
            ],
            'completed_at' => now(),
        ]);

        // Update balance
        $wallet->decrement('balance', $request->amount);

        return response()->json([
            'message' => 'Withdrawal successful',
            'transaction' => $transaction,
            'new_balance' => $wallet->fresh()->balance
        ]);
    }
}
