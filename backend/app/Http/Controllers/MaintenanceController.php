<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRequest;
use App\Models\Asset;
use App\Models\User;
use App\Notifications\MaintenanceApprovedNotification;
use App\Notifications\MaintenanceRejectedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MaintenanceController extends Controller
{
    /**
     * Get maintenance requests for operator
     */
    public function getOperatorMaintenanceRequests(Request $request)
    {
        $status = $request->query('status', 'all');

        $query = MaintenanceRequest::with(['asset', 'driver'])
            ->select([
                'maintenance_requests.*',
                'assets.name as asset_name',
                'assets.registration_number',
                DB::raw('CONCAT(users.first_name, " ", users.last_name) as driver_name')
            ])
            ->join('assets', 'maintenance_requests.asset_id', '=', 'assets.id')
            ->join('users', 'maintenance_requests.driver_id', '=', 'users.id')
            ->orderBy('maintenance_requests.created_at', 'desc');

        if ($status !== 'all') {
            $query->where('maintenance_requests.status', $status);
        }

        $requests = $query->get();

        return response()->json($requests);
    }

    /**
     * Approve maintenance request
     */
    public function approveMaintenanceRequest(Request $request, $id)
    {
        $request->validate([
            'estimated_cost' => 'required|numeric|min:0',
            'operator_notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $maintenanceRequest = MaintenanceRequest::findOrFail($id);

            if ($maintenanceRequest->status !== 'pending') {
                return response()->json(['message' => 'This request has already been processed'], 400);
            }

            // Update maintenance request
            $maintenanceRequest->update([
                'status' => 'approved',
                'estimated_cost' => $request->estimated_cost,
                'operator_notes' => $request->operator_notes,
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);

            // Update asset status if severity is high or critical
            if (in_array($maintenanceRequest->severity, ['high', 'critical'])) {
                $maintenanceRequest->asset->update([
                    'status' => 'maintenance',
                ]);
            }

            // Send notification to driver
            $driver = $maintenanceRequest->driver;
            $driver->notify(new MaintenanceApprovedNotification($maintenanceRequest));

            DB::commit();

            return response()->json([
                'message' => 'Maintenance request approved successfully',
                'request' => $maintenanceRequest->load(['asset', 'driver']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Maintenance approval error: ' . $e->getMessage());
            return response()->json(['message' => 'Error approving request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject maintenance request
     */
    public function rejectMaintenanceRequest(Request $request, $id)
    {
        $request->validate([
            'operator_notes' => 'required|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $maintenanceRequest = MaintenanceRequest::findOrFail($id);

            if ($maintenanceRequest->status !== 'pending') {
                return response()->json(['message' => 'This request has already been processed'], 400);
            }

            // Update maintenance request
            $maintenanceRequest->update([
                'status' => 'rejected',
                'operator_notes' => $request->operator_notes,
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);

            // Send notification to driver
            $driver = $maintenanceRequest->driver;
            $driver->notify(new MaintenanceRejectedNotification($maintenanceRequest));

            DB::commit();

            return response()->json([
                'message' => 'Maintenance request rejected',
                'request' => $maintenanceRequest->load(['asset', 'driver']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Maintenance rejection error: ' . $e->getMessage());
            return response()->json(['message' => 'Error rejecting request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mark maintenance as completed
     */
    public function completeMaintenanceRequest(Request $request, $id)
    {
        $request->validate([
            'actual_cost' => 'required|numeric|min:0',
            'completion_notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $maintenanceRequest = MaintenanceRequest::findOrFail($id);

            if ($maintenanceRequest->status !== 'approved') {
                return response()->json(['message' => 'Only approved requests can be marked as completed'], 400);
            }

            // Update maintenance request
            $maintenanceRequest->update([
                'status' => 'completed',
                'actual_cost' => $request->actual_cost,
                'completion_notes' => $request->completion_notes,
                'completed_at' => now(),
            ]);

            // Update asset status back to active
            $maintenanceRequest->asset->update([
                'status' => 'active',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Maintenance marked as completed',
                'request' => $maintenanceRequest->load(['asset', 'driver']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Maintenance completion error: ' . $e->getMessage());
            return response()->json(['message' => 'Error completing request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get maintenance statistics for operator dashboard
     */
    public function getMaintenanceStats()
    {
        $stats = [
            'pending' => MaintenanceRequest::where('status', 'pending')->count(),
            'approved' => MaintenanceRequest::where('status', 'approved')->count(),
            'in_progress' => MaintenanceRequest::where('status', 'approved')
                ->whereNull('completed_at')
                ->count(),
            'completed_this_month' => MaintenanceRequest::where('status', 'completed')
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->count(),
            'total_cost_this_month' => MaintenanceRequest::where('status', 'completed')
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->sum('actual_cost'),
            'critical_pending' => MaintenanceRequest::where('status', 'pending')
                ->where('severity', 'critical')
                ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get maintenance report
     */
    public function getMaintenanceReport(Request $request)
    {
        $startDate = $request->query('start_date', now()->subMonth());
        $endDate = $request->query('end_date', now());

        $report = MaintenanceRequest::whereBetween('created_at', [$startDate, $endDate])
            ->select([
                DB::raw('COUNT(*) as total_requests'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved'),
                DB::raw('SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as rejected'),
                DB::raw('AVG(actual_cost) as avg_cost'),
                DB::raw('SUM(actual_cost) as total_cost'),
                DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_completion_hours'),
            ])
            ->first();

        $byAsset = MaintenanceRequest::whereBetween('created_at', [$startDate, $endDate])
            ->select([
                'assets.name as asset_name',
                DB::raw('COUNT(*) as request_count'),
                DB::raw('SUM(actual_cost) as total_cost'),
            ])
            ->join('assets', 'maintenance_requests.asset_id', '=', 'assets.id')
            ->groupBy('assets.id', 'assets.name')
            ->orderByDesc('request_count')
            ->get();

        $bySeverity = MaintenanceRequest::whereBetween('created_at', [$startDate, $endDate])
            ->select([
                'severity',
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy('severity')
            ->get();

        return response()->json([
            'summary' => $report,
            'by_asset' => $byAsset,
            'by_severity' => $bySeverity,
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ]);
    }
}
