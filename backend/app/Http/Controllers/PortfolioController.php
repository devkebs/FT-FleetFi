<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Token;
use App\Models\Asset;
use App\Models\Revenue;
use App\Models\Payout;

class PortfolioController extends Controller
{
    /**
     * Get complete investment portfolio for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get all user investments (tokens)
        $investments = Token::where('user_id', $user->id)
            ->with(['asset.vehicle'])
            ->get()
            ->map(function ($token) {
                $asset = $token->asset;
                $vehicle = $asset ? $asset->vehicle : null;
                
                // Calculate revenue earned for this token
                $totalRevenue = $this->calculateTokenRevenue($token);
                
                // Calculate current value (simplified - in production, use market pricing)
                $currentValue = $token->amount;
                
                // Calculate ROI
                $roi = $token->amount > 0 
                    ? (($currentValue + $totalRevenue - $token->amount) / $token->amount) * 100
                    : 0;
                
                return [
                    'id' => $token->id,
                    'asset_id' => $token->asset_id,
                    'asset_name' => $asset ? $asset->name : 'Unknown Asset',
                    'vehicle_registration' => $vehicle ? $vehicle->registration_number : 'N/A',
                    'amount' => $token->amount,
                    'tokens' => $token->token_count ?? 1,
                    'token_price' => $token->amount / ($token->token_count ?? 1),
                    'purchase_date' => $token->created_at->toISOString(),
                    'current_value' => $currentValue,
                    'total_revenue' => $totalRevenue,
                    'roi_percentage' => round($roi, 2),
                    'status' => $token->status ?? 'active',
                    'transaction_id' => $token->transaction_hash ?? 'TXN-' . $token->id,
                    'projected_roi' => 18.5, // Mock data - calculate from historical performance
                    'estimated_monthly_revenue' => $token->amount * 0.015, // 1.5% monthly
                    'estimated_annual_revenue' => $token->amount * 0.18, // 18% annually
                ];
            });
        
        // Calculate portfolio summary
        $summary = [
            'total_invested' => $investments->sum('amount'),
            'total_value' => $investments->sum('current_value'),
            'total_revenue' => $investments->sum('total_revenue'),
            'total_roi' => $investments->avg('roi_percentage') ?? 0,
            'active_investments' => $investments->where('status', 'active')->count(),
        ];
        
        return response()->json([
            'success' => true,
            'investments' => $investments,
            'summary' => $summary,
        ]);
    }

    /**
     * Get detailed investment information
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $token = Token::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['asset.vehicle'])
            ->firstOrFail();
        
        $asset = $token->asset;
        $vehicle = $asset->vehicle;
        
        // Get revenue history for this investment
        $revenueHistory = $this->getRevenueHistory($token);
        
        // Get payout history
        $payouts = Payout::where('user_id', $user->id)
            ->where('asset_id', $token->asset_id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($payout) {
                return [
                    'id' => $payout->id,
                    'amount' => $payout->amount,
                    'date' => $payout->created_at->toISOString(),
                    'status' => $payout->status,
                    'reference' => $payout->reference,
                ];
            });
        
        return response()->json([
            'success' => true,
            'investment' => [
                'id' => $token->id,
                'asset' => [
                    'id' => $asset->id,
                    'name' => $asset->name,
                    'type' => $asset->type,
                    'value' => $asset->value,
                ],
                'vehicle' => [
                    'id' => $vehicle->id ?? null,
                    'registration' => $vehicle->registration_number ?? 'N/A',
                    'model' => $vehicle->model ?? 'N/A',
                    'status' => $vehicle->status ?? 'unknown',
                ],
                'amount_invested' => $token->amount,
                'tokens_owned' => $token->token_count ?? 1,
                'purchase_date' => $token->created_at->toISOString(),
                'status' => $token->status ?? 'active',
            ],
            'revenue_history' => $revenueHistory,
            'payouts' => $payouts,
            'performance' => [
                'total_revenue' => $this->calculateTokenRevenue($token),
                'roi' => 15.7, // Calculate from actual data
                'best_month' => 2340.50,
                'average_monthly' => 1875.25,
            ],
        ]);
    }

    /**
     * Get portfolio performance metrics
     */
    public function performance(Request $request)
    {
        $user = $request->user();
        
        $tokens = Token::where('user_id', $user->id)->get();
        
        // Calculate monthly performance for the last 12 months
        $monthlyPerformance = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthlyRevenue = Revenue::whereIn('asset_id', $tokens->pluck('asset_id'))
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('total_amount');
            
            $monthlyPerformance[] = [
                'month' => $month->format('M Y'),
                'revenue' => $monthlyRevenue,
                'investments' => $tokens->count(),
            ];
        }
        
        return response()->json([
            'success' => true,
            'monthly_performance' => $monthlyPerformance,
            'total_lifetime_revenue' => Revenue::whereIn('asset_id', $tokens->pluck('asset_id'))->sum('total_amount'),
        ]);
    }

    /**
     * Get revenue breakdown by asset
     */
    public function revenueBreakdown(Request $request)
    {
        $user = $request->user();
        
        $tokens = Token::where('user_id', $user->id)
            ->with('asset')
            ->get();
        
        $breakdown = $tokens->map(function ($token) {
            $assetRevenue = Revenue::where('asset_id', $token->asset_id)
                ->sum('total_amount');
            
            return [
                'asset_name' => $token->asset->name ?? 'Unknown',
                'asset_id' => $token->asset_id,
                'revenue' => $assetRevenue,
                'percentage' => 0, // Will calculate after getting total
            ];
        });
        
        $totalRevenue = $breakdown->sum('revenue');
        
        $breakdown = $breakdown->map(function ($item) use ($totalRevenue) {
            $item['percentage'] = $totalRevenue > 0 
                ? round(($item['revenue'] / $totalRevenue) * 100, 2)
                : 0;
            return $item;
        });
        
        return response()->json([
            'success' => true,
            'breakdown' => $breakdown,
            'total_revenue' => $totalRevenue,
        ]);
    }

    /**
     * Calculate total revenue earned by a specific token
     */
    private function calculateTokenRevenue(Token $token)
    {
        // Get total revenue generated by the asset
        $assetRevenue = Revenue::where('asset_id', $token->asset_id)
            ->where('created_at', '>=', $token->created_at)
            ->sum('total_amount');
        
        // Calculate investor's share based on token ownership
        $asset = Asset::find($token->asset_id);
        if (!$asset || $asset->total_value <= 0) {
            return 0;
        }
        
        $ownershipPercentage = $token->amount / $asset->total_value;
        $investorShare = $assetRevenue * $ownershipPercentage;
        
        return round($investorShare, 2);
    }

    /**
     * Get revenue history for a token
     */
    private function getRevenueHistory(Token $token)
    {
        $revenues = Revenue::where('asset_id', $token->asset_id)
            ->where('created_at', '>=', $token->created_at)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get()
            ->map(function ($revenue) use ($token) {
                $asset = Asset::find($token->asset_id);
                $ownershipPercentage = $asset && $asset->total_value > 0
                    ? $token->amount / $asset->total_value
                    : 0;
                
                return [
                    'date' => $revenue->created_at->toDateString(),
                    'total_revenue' => $revenue->total_amount,
                    'investor_share' => round($revenue->total_amount * $ownershipPercentage, 2),
                ];
            });
        
        return $revenues;
    }

    /**
     * Export portfolio to CSV
     */
    public function exportCsv(Request $request)
    {
        $user = $request->user();
        
        $investments = Token::where('user_id', $user->id)
            ->with(['asset.vehicle'])
            ->get();
        
        $csv = "Asset Name,Vehicle,Amount Invested,Tokens,Purchase Date,Total Revenue,ROI %,Status\n";
        
        foreach ($investments as $token) {
            $asset = $token->asset;
            $vehicle = $asset ? $asset->vehicle : null;
            $revenue = $this->calculateTokenRevenue($token);
            $roi = $token->amount > 0 
                ? round((($token->amount + $revenue - $token->amount) / $token->amount) * 100, 2)
                : 0;
            
            $csv .= sprintf(
                '"%s","%s",%s,%s,"%s",%s,%s,"%s"' . "\n",
                $asset ? $asset->name : 'Unknown',
                $vehicle ? $vehicle->registration_number : 'N/A',
                $token->amount,
                $token->token_count ?? 1,
                $token->created_at->toDateString(),
                $revenue,
                $roi,
                $token->status ?? 'active'
            );
        }
        
        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="portfolio_' . date('Y-m-d') . '.csv"');
    }
}
