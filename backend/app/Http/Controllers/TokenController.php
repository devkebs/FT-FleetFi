<?php

namespace App\Http\Controllers;

use App\Models\Token;
use App\Models\Asset;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TokenController extends Controller
{
    /**
     * Mint a new token (tokenize an asset)
     */
    public function mint(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asset_id' => 'required|exists:assets,id',
            'user_id' => 'required|exists:users,id',
            'shares' => 'required|numeric|min:0.01|max:100',
            'investment_amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $asset = Asset::find($request->asset_id);

        // Calculate current total shares for this asset
        $totalShares = Token::where('asset_id', $asset->id)->sum('shares');

        if ($totalShares + $request->shares > 100) {
            return response()->json([
                'message' => 'Cannot mint token: exceeds 100% ownership',
                'available_shares' => 100 - $totalShares
            ], 422);
        }

        try {
            // TODO: Call Trovotech API for token minting
            // $response = Http::post('https://trovotech-api.com/token/mint', [
            //     'asset_id' => $asset->asset_id,
            //     'owner_id' => $request->user_id,
            //     'shares' => $request->shares
            // ]);

            // Create token record
            $token = Token::create([
                'asset_id' => $asset->id,
                'user_id' => $request->user_id,
                'token_id' => 'TKN_' . Str::random(20),
                'shares' => $request->shares,
                'investment_amount' => $request->investment_amount,
                'current_value' => $request->investment_amount,
                'total_returns' => 0,
                'status' => 'active',
                'purchase_date' => now()
            ]);

            // Mark asset as tokenized
            $asset->update(['is_tokenized' => true]);

            return response()->json([
                'message' => 'Token minted successfully',
                'token' => $token->load(['asset', 'user'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mint token',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all tokens for a user
     */
    public function getUserTokens($userId)
    {
        $tokens = Token::where('user_id', $userId)
            ->with(['asset', 'user'])
            ->get();

        return response()->json($tokens);
    }

    /**
     * Get token details
     */
    public function show($id)
    {
        $token = Token::with(['asset', 'user'])->find($id);

        if (!$token) {
            return response()->json(['message' => 'Token not found'], 404);
        }

        return response()->json($token);
    }

    /**
     * Transfer token to another user
     */
    public function transfer(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'new_user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $token = Token::find($id);

        if (!$token) {
            return response()->json(['message' => 'Token not found'], 404);
        }

        // TODO: Call Trovotech API for token transfer

        $token->update(['user_id' => $request->new_user_id]);

        return response()->json([
            'message' => 'Token transferred successfully',
            'token' => $token->load(['asset', 'user'])
        ]);
    }

    /**
     * Get portfolio summary for current user (aggregated by chain)
     */
    public function portfolio(Request $request)
    {
        $user = $request->user();
        $tokens = Token::where('user_id', $user->id)
            ->with(['asset'])
            ->get();

        // Overall aggregates
        $totalInvestment = $tokens->sum('investment_amount');
        $totalCurrentValue = $tokens->sum('current_value');
        $totalReturns = $tokens->sum('total_returns');

        // Group by chain
        $byChain = $tokens->groupBy('chain')->map(function ($groupedTokens, $chain) {
            return [
                'chain' => $chain ?? 'unknown',
                'count' => $groupedTokens->count(),
                'total_investment' => $groupedTokens->sum('investment_amount'),
                'total_current_value' => $groupedTokens->sum('current_value'),
                'total_returns' => $groupedTokens->sum('total_returns'),
                'roi_percent' => $groupedTokens->sum('investment_amount') > 0
                    ? round(($groupedTokens->sum('total_returns') / $groupedTokens->sum('investment_amount')) * 100, 2)
                    : 0,
            ];
        })->values();

        return response()->json([
            'overall' => [
                'total_tokens' => $tokens->count(),
                'total_investment' => $totalInvestment,
                'total_current_value' => $totalCurrentValue,
                'total_returns' => $totalReturns,
                'roi_percent' => $totalInvestment > 0 ? round(($totalReturns / $totalInvestment) * 100, 2) : 0,
            ],
            'by_chain' => $byChain,
            'tokens' => $tokens->map(function($token) {
                return [
                    'id' => $token->id,
                    'token_id' => $token->token_id,
                    'asset_id' => $token->asset_id,
                    'asset_model' => $token->asset->model ?? null,
                    'fraction_owned' => $token->fraction_owned,
                    'investment_amount' => $token->investment_amount,
                    'current_value' => $token->current_value,
                    'total_returns' => $token->total_returns,
                    'status' => $token->status,
                    'chain' => $token->chain,
                    'minted_at' => $token->minted_at,
                    'tx_hash' => $token->tx_hash,
                ];
            }),
        ]);
    }
}
