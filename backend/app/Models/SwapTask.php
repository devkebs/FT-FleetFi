<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwapTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_number',
        'driver_id',
        'vehicle_id',
        'asset_id',
        'swap_station_id',
        'old_battery_id',
        'new_battery_id',
        'status',
        'distance_km',
        'duration_minutes',
        'battery_level_before',
        'battery_level_after',
        'soh_before',
        'soh_after',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'distance_km' => 'float',
        'duration_minutes' => 'integer',
        'battery_level_before' => 'integer',
        'battery_level_after' => 'integer',
        'soh_before' => 'integer',
        'soh_after' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the driver assigned to this swap task
     */
    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Get the vehicle (asset) for this swap task
     */
    public function vehicle()
    {
        return $this->belongsTo(Asset::class, 'vehicle_id');
    }

    /**
     * Get the asset for this swap task
     */
    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    /**
     * Get the swap station for this task
     */
    public function swapStation()
    {
        return $this->belongsTo(SwapStation::class);
    }

    /**
     * Start the swap task
     */
    public function start()
    {
        $this->update([
            'status' => 'enroute_to_station',
            'started_at' => now(),
        ]);
    }

    /**
     * Complete the swap task
     */
    public function complete()
    {
        $completed_at = now();
        $duration = $this->started_at
            ? $this->started_at->diffInMinutes($completed_at)
            : null;

        $this->update([
            'status' => 'completed',
            'completed_at' => $completed_at,
            'duration_minutes' => $duration,
        ]);

        // Update driver total swaps
        if ($this->driver) {
            $this->driver->increment('total_swaps');
        }
    }

    /**
     * Cancel the swap task
     */
    public function cancel()
    {
        $this->update([
            'status' => 'canceled',
            'completed_at' => now(),
        ]);
    }

    /**
     * Generate unique task number
     */
    public static function generateTaskNumber()
    {
        do {
            $taskNumber = 'ST-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
        } while (self::where('task_number', $taskNumber)->exists());

        return $taskNumber;
    }

    /**
     * Boot method to auto-generate task number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($swapTask) {
            if (empty($swapTask->task_number)) {
                $swapTask->task_number = self::generateTaskNumber();
            }
            if (empty($swapTask->status)) {
                $swapTask->status = 'pending';
            }
        });
    }
}
