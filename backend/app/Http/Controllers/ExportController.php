<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function assetsCsv(): StreamedResponse
    {
        $callback = function () {
            $handle = fopen('php://output', 'w');
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
            'Content-Type' => 'text/csv',
        ]);
    }
}
