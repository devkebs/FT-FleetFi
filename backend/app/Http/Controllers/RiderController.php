<?php

namespace App\Http\Controllers;

use App\Models\Rider;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    public function index()
    {
        return response()->json(Rider::orderBy('name')->get());
    }

    public function assign(Request $request)
    {
        $data = $request->validate([
            'rider_id' => 'required|exists:riders,id',
            'asset_id' => 'required|string',
        ]);

        $rider = Rider::findOrFail($data['rider_id']);
        $rider->assigned_asset_id = $data['asset_id'];
        $rider->status = 'active';
        $rider->save();

        return response()->json(['message' => 'Rider assigned', 'rider' => $rider], 200);
    }

    public function unassign(Request $request)
    {
        $data = $request->validate([
            'rider_id' => 'required|exists:riders,id',
        ]);
        $rider = Rider::findOrFail($data['rider_id']);
        $rider->assigned_asset_id = null;
        $rider->status = 'inactive';
        $rider->save();
        return response()->json(['message' => 'Rider unassigned', 'rider' => $rider]);
    }
}
