<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ride extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'distance_km',
        'battery_start',
        'battery_end',
        'swaps_before',
        'swaps_after',
        'revenue_amount',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'distance_km' => 'decimal:2',
        'revenue_amount' => 'decimal:2',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function revenue()
    {
        return $this->hasOne(Revenue::class, 'ride_id');
    }
}
