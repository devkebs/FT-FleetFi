<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Telemetry extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'battery_level',
        'km',
        'latitude',
        'longitude',
        'speed',
        'status',
        'temperature',
        'voltage',
        'current',
        'recorded_at',
        'oem_source',
    ];

    protected $casts = [
        'km' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'temperature' => 'decimal:2',
        'voltage' => 'decimal:2',
        'current' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id', 'asset_id');
    }
}
