<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Revenue extends Model
{
    use HasFactory;

    protected $table = 'revenues';

    protected $fillable = [
        'vehicle_id',
        'ride_id',
        'asset_id',
        'source',
        'amount',
        'investor_roi_amount',
        'rider_wage_amount',
        'management_reserve_amount',
        'maintenance_reserve_amount',
        'date',
        'description',
        'type',
        'total_amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'investor_roi_amount' => 'decimal:2',
        'rider_wage_amount' => 'decimal:2',
        'management_reserve_amount' => 'decimal:2',
        'maintenance_reserve_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Get the vehicle that owns the revenue.
     */
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * Get the asset that owns the revenue.
     */
    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the ride that generated this revenue.
     */
    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}
