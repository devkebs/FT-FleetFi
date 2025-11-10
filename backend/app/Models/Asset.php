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
    ];

    protected $casts = [
        'original_value' => 'decimal:2',
        'current_value' => 'decimal:2',
        'is_tokenized' => 'boolean',
    ];

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
}
