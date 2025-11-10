<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AssetController extends Controller
{
    /**
     * Display a listing of assets.
     */
    public function index(Request $request)
    {
        $query = Asset::with(['tokens', 'telemetries']);

        // Filter by type if requested
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status if requested
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter tokenized assets
        if ($request->has('is_tokenized')) {
            $query->where('is_tokenized', $request->is_tokenized);
        }

        // Pagination params
        $page = (int)($request->get('page', 1));
        $perPage = (int)($request->get('perPage', 10));
        if ($perPage <= 0) { $perPage = 10; }
        $total = $query->count();
        $results = $query->forPage($page, $perPage)->get()->map(function($asset) {
            // Aggregate ownership
            $allocated = $asset->tokens->sum('fraction_owned');
            $remaining = max(0, 100 - $allocated);
            $asset->ownership_allocated = round($allocated, 2);
            $asset->ownership_remaining = round($remaining, 2);
            return $asset;
        });
        $totalPages = (int)ceil($total / $perPage);

        return response()->json([
            'data' => $results,
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => $totalPages,
        ]);
    }

    /**
     * Store a newly created asset.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asset_id' => 'required|string|unique:assets,asset_id',
            'type' => 'required|in:vehicle,battery,charging_cabinet',
            'model' => 'nullable|string|max:255',
            'status' => 'required|in:active,maintenance,retired',
            'soh' => 'required|integer|min:0|max:100',
            'swaps' => 'nullable|integer|min:0',
            'location' => 'nullable|string|max:255',
            'original_value' => 'required|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'daily_swaps' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $asset = Asset::create($validator->validated());
        return response()->json($asset, 201);
    }

    /**
     * Display the specified asset.
     */
    public function show($id)
    {
        $asset = Asset::with(['tokens.user', 'telemetries'])->find($id);

        if (!$asset) {
            return response()->json(['message' => 'Asset not found'], 404);
        }

        return response()->json($asset);
    }

    /**
     * Update the specified asset.
     */
    public function update(Request $request, $id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json(['message' => 'Asset not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'asset_id' => 'sometimes|string|unique:assets,asset_id,' . $id,
            'type' => 'sometimes|in:vehicle,battery,charging_cabinet',
            'model' => 'nullable|string|max:255',
            'status' => 'sometimes|in:active,maintenance,retired',
            'soh' => 'sometimes|integer|min:0|max:100',
            'swaps' => 'nullable|integer|min:0',
            'location' => 'nullable|string|max:255',
            'original_value' => 'sometimes|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'daily_swaps' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $asset->update($validator->validated());
        return response()->json($asset);
    }

    /**
     * Remove the specified asset.
     */
    public function destroy($id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json(['message' => 'Asset not found'], 404);
        }

        $asset->delete();
        return response()->json(['message' => 'Asset deleted successfully']);
    }
}
