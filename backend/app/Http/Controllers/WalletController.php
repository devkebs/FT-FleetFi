<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    /**
     * Create a wallet for a user (Trovotech Integration)
     */
    public function create(Request $request)
    {
        $request->validate([
            'currency' => 'nullable|string|max:10',
        ]);

        $user = $request->user();

        // Check if wallet already exists
        if ($user->wallet) {
            return response()->json(['message' => 'Wallet already exists'], 400);
        }

        try {
            // Generate unique wallet address
            $walletAddress = '0x' . bin2hex(random_bytes(20));

            // TODO: Call Trovotech API for wallet creation
            // $response = Http::post('https://trovotech-api.com/wallet/create', [
            //     'user_id' => $user->id,
            //     'email' => $user->email,
            // ]);
            // $walletData = $response->json();

            // Create wallet in database
            $wallet = Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => $walletAddress,
                'trovotech_wallet_id' => 'TROVO_' . Str::random(16),
                'balance' => 0,
                'currency' => $request->input('currency', 'NGN'),
                'status' => 'active',
            ]);

            return response()->json([
                'message' => 'Wallet created successfully',
                'wallet' => $wallet,
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create wallet'], 500);
        }
    }

    /**
     * Get wallet balance
     */
    public function getBalance(Request $request, $userId)
    {
        $wallet = Wallet::where('user_id', $userId)->first();

        if (!$wallet) {
            return response()->json(['message' => 'Wallet not found'], 404);
        }

        return response()->json(['balance' => $wallet->balance]);
    }

    /**
     * Get user wallet details
     */
    public function show($userId)
    {
        $wallet = Wallet::where('user_id', $userId)->with('user')->first();

        if (!$wallet) {
            return response()->json(['message' => 'Wallet not found'], 404);
        }

        return response()->json($wallet);
    }

    /**
     * Get wallet transaction history
     */
    public function getTransactions(Request $request, $userId)
    {
        $wallet = Wallet::where('user_id', $userId)->first();

        if (!$wallet) {
            return response()->json(['message' => 'Wallet not found'], 404);
        }

        $transactions = WalletTransaction::where('wallet_id', $wallet->id)
            ->with('relatedToken')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json($transactions);
    }

    /**
     * Transfer funds to another wallet
     */
    public function transfer(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'from_user_id' => 'nullable|exists:users,id',
            'to_address' => 'required_without:recipient_email|string',
            'recipient_email' => 'required_without:to_address|email|exists:users,email',
            'amount' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Use authenticated user if from_user_id not provided
        $fromUserId = $request->from_user_id ?? $request->user()->id;
        $fromWallet = Wallet::where('user_id', $fromUserId)->first();

        if (!$fromWallet) {
            return response()->json(['message' => 'Source wallet not found'], 404);
        }

        if ($fromWallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient balance'], 422);
        }

        // Find destination wallet by address or email
        if ($request->has('recipient_email')) {
            $recipientUser = User::where('email', $request->recipient_email)->first();
            if (!$recipientUser) {
                return response()->json(['message' => 'Recipient user not found'], 404);
            }
            $toWallet = Wallet::where('user_id', $recipientUser->id)->first();
        } else {
            $toWallet = Wallet::where('wallet_address', $request->to_address)->first();
        }

        if (!$toWallet) {
            return response()->json(['message' => 'Destination wallet not found'], 404);
        }

        if ($fromWallet->id === $toWallet->id) {
            return response()->json(['message' => 'Cannot transfer to same wallet'], 422);
        }

        try {
            DB::beginTransaction();

            // Deduct from source
            $fromWallet->decrement('balance', $request->amount);

            // Add to destination
            $toWallet->increment('balance', $request->amount);

            // Create outgoing transaction
            $outgoingTx = WalletTransaction::create([
                'wallet_id' => $fromWallet->id,
                'user_id' => $fromUserId,
                'type' => 'transfer_out',
                'amount' => $request->amount,
                'status' => 'completed',
                'from_address' => $fromWallet->wallet_address,
                'to_address' => $toWallet->wallet_address,
                'tx_hash' => '0x' . Str::random(64), // Mock tx hash
                'description' => 'Transfer to ' . $toWallet->wallet_address,
                'completed_at' => now(),
            ]);

            // Create incoming transaction
            WalletTransaction::create([
                'wallet_id' => $toWallet->id,
                'user_id' => $toWallet->user_id,
                'type' => 'transfer_in',
                'amount' => $request->amount,
                'status' => 'completed',
                'from_address' => $fromWallet->wallet_address,
                'to_address' => $toWallet->wallet_address,
                'tx_hash' => $outgoingTx->tx_hash,
                'description' => 'Transfer from ' . $fromWallet->wallet_address,
                'completed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Transfer successful',
                'transaction' => $outgoingTx,
                'new_balance' => $fromWallet->balance,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Transfer failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
