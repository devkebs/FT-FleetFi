<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Revenue extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'ride_id',
        'source',
        'amount',
        'investor_roi_amount',
        'rider_wage_amount',
        'management_reserve_amount',
        'maintenance_reserve_amount',
        'date',
        'type',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
        'investor_roi_amount' => 'decimal:2',
        'rider_wage_amount' => 'decimal:2',
        'management_reserve_amount' => 'decimal:2',
        'maintenance_reserve_amount' => 'decimal:2',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}

