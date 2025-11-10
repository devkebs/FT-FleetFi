<?php

namespace App\Http\Controllers;

use App\Models\Revenue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RevenueController extends Controller
{
    /**
     * Display a listing of revenues.
     */
    public function index(Request $request)
    {
        $query = Revenue::with('vehicle');

        // Filter by vehicle if requested
        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created revenue.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|exists:vehicles,id',
            'amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $revenue = Revenue::create($validator->validated());
        return response()->json($revenue->load('vehicle'), 201);
    }

    /**
     * Display the specified revenue.
     */
    public function show($id)
    {
        $revenue = Revenue::with('vehicle')->find($id);

        if (!$revenue) {
            return response()->json(['message' => 'Revenue not found'], 404);
        }

        return response()->json($revenue);
    }

    /**
     * Update the specified revenue.
     */
    public function update(Request $request, $id)
    {
        $revenue = Revenue::find($id);

        if (!$revenue) {
            return response()->json(['message' => 'Revenue not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'sometimes|exists:vehicles,id',
            'amount' => 'sometimes|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $revenue->update($validator->validated());
        return response()->json($revenue->load('vehicle'));
    }

    /**
     * Remove the specified revenue.
     */
    public function destroy($id)
    {
        $revenue = Revenue::find($id);

        if (!$revenue) {
            return response()->json(['message' => 'Revenue not found'], 404);
        }

        $revenue->delete();
        return response()->json(['message' => 'Revenue deleted successfully']);
    }
}
