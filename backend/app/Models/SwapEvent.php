<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwapEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'swap_station_id',
        'previous_battery_level',
        'new_battery_level',
        'occurred_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id', 'asset_id');
    }

    public function station()
    {
        return $this->belongsTo(SwapStation::class, 'swap_station_id');
    }
}
