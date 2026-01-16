<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'type',
        'model',
        'status',
        'soh',
        'swaps',
        'location',
        'original_value',
        'current_value',
        'daily_swaps',
        'is_tokenized',
        'token_id',
        'metadata_hash',
        'trustee_ref',
        'telemetry_uri',
        'total_ownership_sold',
        'min_investment',
        'expected_roi',
        'risk_level',
    ];

    protected $casts = [
        'original_value' => 'decimal:2',
        'current_value' => 'decimal:2',
        'min_investment' => 'decimal:2',
        'expected_roi' => 'decimal:2',
        'total_ownership_sold' => 'decimal:2',
        'is_tokenized' => 'boolean',
    ];

    // Asset types
    const TYPE_VEHICLE = 'vehicle';
    const TYPE_BATTERY = 'battery';
    const TYPE_CABINET = 'charging_cabinet';

    // Status types
    const STATUS_ACTIVE = 'active';
    const STATUS_MAINTENANCE = 'maintenance';
    const STATUS_RETIRED = 'retired';

    // Risk levels
    const RISK_LOW = 'low';
    const RISK_MEDIUM = 'medium';
    const RISK_HIGH = 'high';

    public function tokens()
    {
        return $this->hasMany(Token::class);
    }

    public function telemetries()
    {
        return $this->hasMany(Telemetry::class, 'asset_id', 'asset_id');
    }

    public function revenues()
    {
        return $this->hasMany(Revenue::class, 'vehicle_id');
    }

    public function investments()
    {
        return $this->hasMany(Investment::class);
    }

    // Get remaining ownership available for investment
    public function getOwnershipRemainingAttribute()
    {
        return 100 - ($this->total_ownership_sold ?? 0);
    }

    // Check if asset is available for investment
    public function getIsAvailableForInvestmentAttribute()
    {
        return $this->status === self::STATUS_ACTIVE &&
               $this->ownership_remaining > 0;
    }

    // Scope for available assets
    public function scopeAvailableForInvestment($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
                     ->where('total_ownership_sold', '<', 100);
    }

    // Calculate monthly revenue estimate based on swaps
    public function getEstimatedMonthlyRevenueAttribute()
    {
        // Average revenue per swap (NGN)
        $revenuePerSwap = 500;
        return $this->daily_swaps * 30 * $revenuePerSwap;
    }
}
