<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TrovoTechService;

class AssetController extends Controller
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
     * Get tokens for a specific asset (from previous requirements)
     */
    public function getAssetTokens($assetId)
    {
        // Mock data
        return response()->json([
            'asset_id' => $assetId,
            'token_symbol' => 'AST-' . $assetId,
            'total_supply' => 10000,
            'available_supply' => 2500,
            'price_per_token' => 50.00
        ]);
    }

    /**
     * Mint new tokens for an asset (Blockchain Integration)
     */
    public function mint(Request $request, $assetId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        $amount = $request->input('amount');

        // Call the mock blockchain service if available
        $result = null;
        if ($this->blockchainService) {
            $result = $this->blockchainService->mintAssetToken($assetId, $amount);
        } else {
            // Mock result when service not available
            $result = [
                'tx_hash' => '0x' . bin2hex(random_bytes(32)),
                'asset_id' => $assetId,
                'amount' => $amount,
                'status' => 'success'
            ];
        }

        return response()->json([
            'message' => 'Tokens minted successfully on TrovoTech chain',
            'transaction' => $result
        ]);
    }
}
