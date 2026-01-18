<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentMethodController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Get list of supported banks
     */
    public function getBanks()
    {
        $banks = $this->paymentService->getBanks();

        return response()->json([
            'success' => true,
            'banks' => $banks,
        ]);
    }

    /**
     * Verify a bank account
     */
    public function verifyAccount(Request $request)
    {
        $request->validate([
            'account_number' => 'required|string|size:10',
            'bank_code' => 'required|string',
        ]);

        $result = $this->paymentService->verifyBankAccount(
            $request->account_number,
            $request->bank_code
        );

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'account_name' => $result['account_name'],
                'account_number' => $result['account_number'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'],
        ], 400);
    }

    /**
     * Get user's payment methods
     */
    public function index()
    {
        $user = Auth::user();

        $methods = PaymentMethod::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($method) {
                return [
                    'id' => $method->id,
                    'type' => $method->type,
                    'bank_name' => $method->bank_name,
                    'account_number' => $method->masked_account_number,
                    'account_name' => $method->account_name,
                    'display_name' => $method->display_name,
                    'is_default' => $method->is_default,
                    'is_verified' => $method->is_verified,
                    'created_at' => $method->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'payment_methods' => $methods,
        ]);
    }

    /**
     * Add a new bank account
     */
    public function store(Request $request)
    {
        $request->validate([
            'account_number' => 'required|string|size:10',
            'bank_code' => 'required|string',
        ]);

        $user = Auth::user();

        $result = $this->paymentService->addBankAccount(
            $user,
            $request->account_number,
            $request->bank_code
        );

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Bank account added successfully',
                'payment_method' => [
                    'id' => $result['payment_method']->id,
                    'type' => $result['payment_method']->type,
                    'bank_name' => $result['payment_method']->bank_name,
                    'account_number' => $result['payment_method']->masked_account_number,
                    'account_name' => $result['payment_method']->account_name,
                    'is_default' => $result['payment_method']->is_default,
                    'is_verified' => $result['payment_method']->is_verified,
                ],
            ], 201);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'],
        ], 400);
    }

    /**
     * Set a payment method as default
     */
    public function setDefault(Request $request, $id)
    {
        $user = Auth::user();

        $method = PaymentMethod::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => 'Payment method not found',
            ], 404);
        }

        $method->setAsDefault();

        return response()->json([
            'success' => true,
            'message' => 'Default payment method updated',
        ]);
    }

    /**
     * Delete a payment method
     */
    public function destroy($id)
    {
        $user = Auth::user();

        $method = PaymentMethod::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => 'Payment method not found',
            ], 404);
        }

        // Don't allow deletion of the only payment method if there are pending withdrawals
        if ($method->is_default) {
            $otherMethods = PaymentMethod::where('user_id', $user->id)
                ->where('id', '!=', $id)
                ->count();

            if ($otherMethods > 0) {
                // Set another method as default
                PaymentMethod::where('user_id', $user->id)
                    ->where('id', '!=', $id)
                    ->first()
                    ->setAsDefault();
            }
        }

        $method->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment method deleted',
        ]);
    }
}
