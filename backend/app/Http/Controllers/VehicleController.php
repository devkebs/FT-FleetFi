<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehicleController extends Controller
{
    /**
     * Display a listing of vehicles.
     */
    public function index()
    {
        $vehicles = Vehicle::all();
        return response()->json($vehicles);
    }

    /**
     * Store a newly created vehicle.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asset_id' => 'required|string|unique:vehicles,asset_id',
            'type' => 'required|in:EV,Battery,Cabinet',
            'model' => 'required|string|max:255',
            'status' => 'required|in:Available,In Use,Charging,Maintenance',
            'soh' => 'required|numeric|min:0|max:100',
            'swaps' => 'required|integer|min:0',
            'location' => 'required|string|max:255',
            'original_value' => 'required|numeric|min:0',
            'daily_swaps' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $vehicle = Vehicle::create($request->all());
        return response()->json($vehicle, 201);
    }

    /**
     * Display the specified vehicle.
     */
    public function show($id)
    {
        $vehicle = Vehicle::findOrFail($id);
        return response()->json($vehicle);
    }

    /**
     * Update the specified vehicle.
     */
    public function update(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'asset_id' => 'sometimes|string|unique:vehicles,asset_id,' . $id,
            'type' => 'sometimes|in:EV,Battery,Cabinet',
            'model' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:Available,In Use,Charging,Maintenance',
            'soh' => 'sometimes|numeric|min:0|max:100',
            'swaps' => 'sometimes|integer|min:0',
            'location' => 'sometimes|string|max:255',
            'original_value' => 'sometimes|numeric|min:0',
            'daily_swaps' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $vehicle->update($request->all());
        return response()->json($vehicle);
    }

    /**
     * Remove the specified vehicle.
     */
    public function destroy($id)
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle deleted successfully'], 200);
    }
}
