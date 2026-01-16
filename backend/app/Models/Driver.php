<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'license_number',
        'license_expiry',
        'vehicle_id',
        'status',
        'shift_start',
        'shift_end',
        'total_swaps',
        'total_distance_km',
        'current_latitude',
        'current_longitude',
        'last_location_update',
    ];

    protected $casts = [
        'license_expiry' => 'date',
        'shift_start' => 'datetime',
        'shift_end' => 'datetime',
        'total_swaps' => 'integer',
        'total_distance_km' => 'float',
        'current_latitude' => 'float',
        'current_longitude' => 'float',
        'last_location_update' => 'datetime',
    ];

    /**
     * Get the user associated with the driver
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the assigned vehicle (asset)
     */
    public function assignedVehicle()
    {
        return $this->belongsTo(Asset::class, 'vehicle_id');
    }

    /**
     * Get swap tasks for this driver
     */
    public function swapTasks()
    {
        return $this->hasMany(SwapTask::class);
    }

    /**
     * Get active swap task
     */
    public function activeSwapTask()
    {
        return $this->hasOne(SwapTask::class)
            ->whereNotIn('status', ['completed', 'canceled'])
            ->latest();
    }

    /**
     * Get current location
     */
    public function getCurrentLocation()
    {
        if ($this->current_latitude && $this->current_longitude) {
            return [
                'latitude' => $this->current_latitude,
                'longitude' => $this->current_longitude,
                'updated_at' => $this->last_location_update,
            ];
        }
        return null;
    }

    /**
     * Update driver location
     */
    public function updateLocation($latitude, $longitude)
    {
        $this->update([
            'current_latitude' => $latitude,
            'current_longitude' => $longitude,
            'last_location_update' => now(),
        ]);
    }

    /**
     * Clock in (start shift)
     */
    public function clockIn()
    {
        $this->update([
            'shift_start' => now(),
            'status' => 'available',
        ]);
    }

    /**
     * Clock out (end shift)
     */
    public function clockOut()
    {
        $this->update([
            'shift_end' => now(),
            'status' => 'offline',
        ]);
    }
}
