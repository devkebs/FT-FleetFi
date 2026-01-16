<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayoutDistribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'total_amount',
        'period_start',
        'period_end',
        'distributed_by',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
    ];

    /**
     * Get the asset that received the distribution
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the user who distributed the payout
     */
    public function distributor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'distributed_by');
    }

    /**
     * Get all individual payouts in this distribution
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'distribution_id');
    }
}
