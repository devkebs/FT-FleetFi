<?php

namespace App\Http\Controllers;

use App\Models\SwapStation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SwapStationController extends Controller
{
    /**
     * Display a listing of swap stations.
     */
    public function index(Request $request)
    {
        $query = SwapStation::query();

        // Filter by location if requested
        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created swap station.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $swapStation = SwapStation::create($validator->validated());
        return response()->json($swapStation, 201);
    }

    /**
     * Display the specified swap station.
     */
    public function show($id)
    {
        $swapStation = SwapStation::find($id);

        if (!$swapStation) {
            return response()->json(['message' => 'Swap station not found'], 404);
        }

        return response()->json($swapStation);
    }

    /**
     * Update the specified swap station.
     */
    public function update(Request $request, $id)
    {
        $swapStation = SwapStation::find($id);

        if (!$swapStation) {
            return response()->json(['message' => 'Swap station not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $swapStation->update($validator->validated());
        return response()->json($swapStation);
    }

    /**
     * Remove the specified swap station.
     */
    public function destroy($id)
    {
        $swapStation = SwapStation::find($id);

        if (!$swapStation) {
            return response()->json(['message' => 'Swap station not found'], 404);
        }

        $swapStation->delete();
        return response()->json(['message' => 'Swap station deleted successfully']);
    }
}
