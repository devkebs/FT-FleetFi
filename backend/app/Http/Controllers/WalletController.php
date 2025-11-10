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
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::find($request->user_id);

        // Check if wallet already exists
        $existingWallet = Wallet::where('user_id', $user->id)->first();
        if ($existingWallet) {
            return response()->json([
                'message' => 'Wallet already exists for this user',
                'wallet' => $existingWallet
            ], 200);
        }

        try {
            // TODO: Call Trovotech API for wallet creation
            // $response = Http::post('https://trovotech-api.com/wallet/create', [
            //     'name' => $user->name,
            //     'email' => $user->email,
            //     'phone' => $user->phone
            // ]);

            // Mock response for MVP
            $wallet = Wallet::create([
                'user_id' => $user->id,
                'wallet_address' => '0x' . Str::random(40),
                'trovotech_wallet_id' => 'TROVO_' . Str::random(16),
                'balance' => 0,
                'status' => 'active'
            ]);

            return response()->json([
                'message' => 'Wallet created successfully',
                'wallet' => $wallet
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create wallet',
                'error' => $e->getMessage()
            ], 500);
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
            'from_user_id' => 'required|exists:users,id',
            'to_address' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fromWallet = Wallet::where('user_id', $request->from_user_id)->first();

        if (!$fromWallet) {
            return response()->json(['message' => 'Source wallet not found'], 404);
        }

        if ($fromWallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient balance'], 422);
        }

        // Find destination wallet
        $toWallet = Wallet::where('wallet_address', $request->to_address)->first();

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
                'user_id' => $request->from_user_id,
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
