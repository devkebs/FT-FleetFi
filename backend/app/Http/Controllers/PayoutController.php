<?php

namespace App\Http\Controllers;

use App\Models\Payout;
use App\Models\Token;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PayoutController extends Controller
{
    /**
     * Initiate a payout for asset token holders
     */
    public function initiate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asset_id' => 'required|exists:assets,id',
            'total_amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $asset = Asset::find($request->asset_id);
        $tokens = Token::where('asset_id', $asset->id)
            ->where('status', 'active')
            ->get();

        if ($tokens->isEmpty()) {
            return response()->json(['message' => 'No active tokens for this asset'], 400);
        }

        try {
            DB::beginTransaction();

            $payouts = [];

            foreach ($tokens as $token) {
                // Calculate payout based on share percentage
                $payoutAmount = ($request->total_amount * $token->shares) / 100;

                $payout = Payout::create([
                    'user_id' => $token->user_id,
                    'amount' => $payoutAmount,
                ]);

                // Update token total returns
                $token->update([
                    'total_returns' => $token->total_returns + $payoutAmount,
                    'current_value' => $token->investment_amount + $token->total_returns + $payoutAmount
                ]);

                // TODO: Call Trovotech API for payout initiation
                // $response = Http::post('https://trovotech-api.com/payout/initiate', [
                //     'wallet_id' => $token->user->wallet->trovotech_wallet_id,
                //     'amount' => $payoutAmount,
                //     'asset_id' => $asset->asset_id
                // ]);

                $payouts[] = $payout;
            }

            DB::commit();

            return response()->json([
                'message' => 'Payouts initiated successfully',
                'total_payouts' => count($payouts),
                'total_amount' => $request->total_amount,
                'payouts' => $payouts
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to initiate payouts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all payouts for a user
     */
    public function getUserPayouts($userId)
    {
        $payouts = Payout::where('user_id', $userId)->get();
        return response()->json($payouts);
    }

    /**
     * Get payout details
     */
    public function show($id)
    {
        $payout = Payout::with('user')->find($id);

        if (!$payout) {
            return response()->json(['message' => 'Payout not found'], 404);
        }

        return response()->json($payout);
    }
}
