<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Investment;
use App\Models\WalletTransaction;
use App\Models\DriverEarning;
use App\Models\Payout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Export assets to CSV (original method)
     */
    public function assetsCsv(): StreamedResponse
    {
        $callback = function () {
            $handle = fopen('php://output', 'w');
            // Write BOM for Excel UTF-8 compatibility
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Asset ID','Type','Model','Status','SOH','Swaps','Daily Swaps','Location','Original Value','Current Value','Tokenized']);
            $assets = Asset::all();
            foreach ($assets as $a) {
                fputcsv($handle, [
                    $a->asset_id,
                    $a->type,
                    $a->model,
                    $a->status,
                    $a->soh,
                    $a->swaps,
                    $a->daily_swaps,
                    $a->location,
                    $a->original_value,
                    $a->current_value,
                    $a->is_tokenized ? 'Yes' : 'No',
                ]);
            }
            fclose($handle);
        };

        return response()->streamDownload($callback, 'assets.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export user's portfolio to CSV
     */
    public function portfolioCsv(Request $request): StreamedResponse
    {
        $user = Auth::user();

        $callback = function () use ($user) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Asset ID', 'Asset Type', 'Model', 'Amount Invested (NGN)', 'Ownership %', 'Current Value (NGN)', 'Total Earnings (NGN)', 'ROI %', 'Status', 'Purchase Date']);

            $investments = Investment::with('asset')
                ->where('user_id', $user->id)
                ->get();

            foreach ($investments as $inv) {
                $roi = $inv->amount > 0 ? round(($inv->total_earnings / $inv->amount) * 100, 2) : 0;
                fputcsv($handle, [
                    $inv->asset->asset_id ?? 'N/A',
                    $inv->asset->type ?? 'N/A',
                    $inv->asset->model ?? 'N/A',
                    number_format($inv->amount, 2, '.', ''),
                    number_format($inv->ownership_percentage, 2, '.', ''),
                    number_format($inv->current_value, 2, '.', ''),
                    number_format($inv->total_earnings, 2, '.', ''),
                    $roi,
                    ucfirst($inv->status),
                    $inv->created_at->format('Y-m-d'),
                ]);
            }
            fclose($handle);
        };

        return response()->streamDownload($callback, 'portfolio_' . date('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export wallet transactions to CSV
     */
    public function transactionsCsv(Request $request): StreamedResponse
    {
        $user = Auth::user();

        $callback = function () use ($user, $request) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Date', 'Type', 'Amount (NGN)', 'Currency', 'Status', 'TX Hash', 'From', 'To', 'Description']);

            $query = WalletTransaction::where('user_id', $user->id);

            if ($request->has('from_date') && $request->from_date) {
                $query->where('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date') && $request->to_date) {
                $query->where('created_at', '<=', $request->to_date . ' 23:59:59');
            }
            if ($request->has('type') && $request->type && $request->type !== 'all') {
                $query->where('type', $request->type);
            }

            $transactions = $query->orderBy('created_at', 'desc')->get();

            foreach ($transactions as $tx) {
                fputcsv($handle, [
                    $tx->created_at->format('Y-m-d H:i:s'),
                    ucfirst(str_replace('_', ' ', $tx->type)),
                    number_format($tx->amount, 2, '.', ''),
                    $tx->currency ?? 'NGN',
                    ucfirst($tx->status),
                    $tx->tx_hash ?? 'N/A',
                    $tx->from_address ?? 'N/A',
                    $tx->to_address ?? 'N/A',
                    $tx->description ?? '',
                ]);
            }
            fclose($handle);
        };

        return response()->streamDownload($callback, 'transactions_' . date('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export driver earnings to CSV
     */
    public function earningsCsv(Request $request): StreamedResponse
    {
        $user = Auth::user();

        $callback = function () use ($user, $request) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Date', 'Earning ID', 'Type', 'Description', 'Gross Amount (NGN)', 'Commission (NGN)', 'Deductions (NGN)', 'Net Amount (NGN)', 'Status']);

            $query = DriverEarning::where('driver_id', $user->id);

            if ($request->has('from_date') && $request->from_date) {
                $query->where('earned_at', '>=', $request->from_date);
            }
            if ($request->has('to_date') && $request->to_date) {
                $query->where('earned_at', '<=', $request->to_date . ' 23:59:59');
            }

            $earnings = $query->orderBy('earned_at', 'desc')->get();

            foreach ($earnings as $earning) {
                fputcsv($handle, [
                    $earning->earned_at,
                    $earning->earning_id,
                    ucfirst($earning->source_type),
                    $earning->description ?? '',
                    number_format($earning->gross_amount, 2, '.', ''),
                    number_format($earning->commission, 2, '.', ''),
                    number_format($earning->deductions, 2, '.', ''),
                    number_format($earning->net_amount, 2, '.', ''),
                    ucfirst($earning->payment_status),
                ]);
            }
            fclose($handle);
        };

        return response()->streamDownload($callback, 'earnings_' . date('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export fleet report to CSV (for operators)
     */
    public function fleetCsv(Request $request): StreamedResponse
    {
        $user = Auth::user();

        // Only operators and admins can export fleet data
        if (!in_array($user->role, ['operator', 'admin'])) {
            abort(403, 'Unauthorized');
        }

        $callback = function () use ($user) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Asset ID', 'Type', 'Model', 'Status', 'SOH %', 'Total Swaps', 'Daily Swaps', 'Location', 'Original Value (NGN)', 'Current Value (NGN)', 'Ownership Sold %', 'Created']);

            $query = Asset::query();

            // Operators only see their own assets
            if ($user->role === 'operator') {
                $query->where('user_id', $user->id);
            }

            $assets = $query->get();

            foreach ($assets as $asset) {
                fputcsv($handle, [
                    $asset->asset_id,
                    ucfirst($asset->type),
                    $asset->model ?? 'N/A',
                    ucfirst($asset->status),
                    ($asset->soh ?? 100),
                    $asset->swaps ?? 0,
                    $asset->daily_swaps ?? 0,
                    $asset->location ?? 'Unknown',
                    number_format($asset->original_value ?? 0, 2, '.', ''),
                    number_format($asset->current_value ?? 0, 2, '.', ''),
                    ($asset->total_ownership_sold ?? 0),
                    $asset->created_at->format('Y-m-d'),
                ]);
            }
            fclose($handle);
        };

        return response()->streamDownload($callback, 'fleet_report_' . date('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export payouts report to CSV
     */
    public function payoutsCsv(Request $request): StreamedResponse
    {
        $user = Auth::user();

        $callback = function () use ($user, $request) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Date', 'Asset', 'Ownership %', 'Amount (NGN)', 'Period Start', 'Period End', 'Status', 'Blockchain Hash', 'Processed At']);

            $query = Payout::with(['asset', 'investment'])
                ->where('investor_id', $user->id);

            if ($request->has('from_date') && $request->from_date) {
                $query->where('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date') && $request->to_date) {
                $query->where('created_at', '<=', $request->to_date . ' 23:59:59');
            }

            $payouts = $query->orderBy('created_at', 'desc')->get();

            foreach ($payouts as $payout) {
                fputcsv($handle, [
                    $payout->created_at->format('Y-m-d H:i:s'),
                    $payout->asset->name ?? 'N/A',
                    number_format($payout->investment->ownership_percentage ?? 0, 2, '.', ''),
                    number_format($payout->amount, 2, '.', ''),
                    $payout->period_start,
                    $payout->period_end,
                    ucfirst($payout->status),
                    $payout->blockchain_hash ?? 'N/A',
                    $payout->processed_at ?? 'Pending',
                ]);
            }
            fclose($handle);
        };

        return response()->streamDownload($callback, 'payouts_' . date('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
