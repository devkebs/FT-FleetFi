<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InvestmentController extends Controller
{
    /**
     * Display a listing of investments.
     */
    public function index(Request $request)
    {
        $query = Investment::with('user');

        // Filter by user if requested
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by status if requested
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created investment.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $investment = Investment::create($validator->validated());
        return response()->json($investment->load('user'), 201);
    }

    /**
     * Display the specified investment.
     */
    public function show($id)
    {
        $investment = Investment::with('user')->find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        return response()->json($investment);
    }

    /**
     * Update the specified investment.
     */
    public function update(Request $request, $id)
    {
        $investment = Investment::find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|exists:users,id',
            'amount' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:pending,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $investment->update($validator->validated());
        return response()->json($investment->load('user'));
    }

    /**
     * Remove the specified investment.
     */
    public function destroy($id)
    {
        $investment = Investment::find($id);

        if (!$investment) {
            return response()->json(['message' => 'Investment not found'], 404);
        }

        $investment->delete();
        return response()->json(['message' => 'Investment deleted successfully']);
    }
}
