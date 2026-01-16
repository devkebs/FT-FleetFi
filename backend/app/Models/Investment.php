<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Investment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'asset_id',
        'amount',
        'ownership_percentage',
        'token_id',
        'tx_hash',
        'purchase_price',
        'current_value',
        'total_earnings',
        'last_payout_at',
        'status'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'ownership_percentage' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'current_value' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'last_payout_at' => 'datetime',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_SOLD = 'sold';
    const STATUS_CANCELLED = 'cancelled';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    // Calculate ROI percentage
    public function getRoiAttribute()
    {
        if ($this->amount <= 0) return 0;
        return (($this->total_earnings / $this->amount) * 100);
    }

    // Calculate unrealized gains
    public function getUnrealizedGainAttribute()
    {
        return $this->current_value - $this->purchase_price;
    }

    // Scope for active investments
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    // Scope for user's investments
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
