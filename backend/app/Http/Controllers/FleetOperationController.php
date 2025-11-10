<?php

namespace App\Http\Controllers;

use App\Models\FleetOperation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FleetOperationController extends Controller
{
    /**
     * Display a listing of fleet operations.
     */
    public function index(Request $request)
    {
        $query = FleetOperation::with('vehicle');

        // Filter by vehicle if requested
        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        // Filter by operation type if requested
        if ($request->has('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created fleet operation.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|exists:vehicles,id',
            'operation_type' => 'required|in:swap,maintenance,inspection,delivery,pickup',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $operation = FleetOperation::create($validator->validated());
        return response()->json($operation->load('vehicle'), 201);
    }

    /**
     * Display the specified fleet operation.
     */
    public function show($id)
    {
        $operation = FleetOperation::with('vehicle')->find($id);

        if (!$operation) {
            return response()->json(['message' => 'Fleet operation not found'], 404);
        }

        return response()->json($operation);
    }

    /**
     * Update the specified fleet operation.
     */
    public function update(Request $request, $id)
    {
        $operation = FleetOperation::find($id);

        if (!$operation) {
            return response()->json(['message' => 'Fleet operation not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'sometimes|exists:vehicles,id',
            'operation_type' => 'sometimes|in:swap,maintenance,inspection,delivery,pickup',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $operation->update($validator->validated());
        return response()->json($operation->load('vehicle'));
    }

    /**
     * Remove the specified fleet operation.
     */
    public function destroy($id)
    {
        $operation = FleetOperation::find($id);

        if (!$operation) {
            return response()->json(['message' => 'Fleet operation not found'], 404);
        }

        $operation->delete();
        return response()->json(['message' => 'Fleet operation deleted successfully']);
    }
}
