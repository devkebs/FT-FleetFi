<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Token extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'user_id',
        'token_id',
        'shares',
        'investment_amount',
        'current_value',
        'total_returns',
        'status',
        'purchase_date',
        'minted_at',
        'metadata_hash',
        'trustee_ref',
        'tx_hash',
        'chain',
        'chain',
        'minted_at',
    ];

    protected $casts = [
        'shares' => 'decimal:4',
        'investment_amount' => 'decimal:2',
        'current_value' => 'decimal:2',
        'total_returns' => 'decimal:2',
        'purchase_date' => 'datetime',
        'minted_at' => 'datetime',
        'minted_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
