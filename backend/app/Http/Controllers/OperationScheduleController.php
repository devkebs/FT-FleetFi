<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;

class OperationScheduleController extends Controller
{
    public function scheduleSwap(Request $request)
    {
        return $this->createSchedule($request, 'swap');
    }

    public function scheduleCharge(Request $request)
    {
        return $this->createSchedule($request, 'charge');
    }

    protected function createSchedule(Request $request, string $type)
    {
        $data = $request->validate([
            'asset_id' => 'required|string',
            'scheduled_at' => 'required|date',
            'note' => 'nullable|string',
            'rider_id' => 'nullable|exists:riders,id',
        ]);

        $schedule = Schedule::create([
            'asset_id' => $data['asset_id'],
            'type' => $type,
            'scheduled_at' => $data['scheduled_at'],
            'status' => 'pending',
            'rider_id' => $data['rider_id'] ?? null,
            'note' => $data['note'] ?? null,
        ]);

        return response()->json(['message' => 'Scheduled', 'schedule' => $schedule], 201);
    }

    public function index(Request $request)
    {
        $query = Schedule::query()->orderBy('scheduled_at');
        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->get('asset_id'));
        }
        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }
        return response()->json($query->limit(100)->get());
    }

    public function updateStatus(Request $request, $id)
    {
        $schedule = Schedule::find($id);
        if (!$schedule) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $data = $request->validate([
            'status' => 'required|in:pending,completed,cancelled'
        ]);
        $schedule->status = $data['status'];
        $schedule->save();
        return response()->json(['message' => 'Updated', 'schedule' => $schedule]);
    }
}
