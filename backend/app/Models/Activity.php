<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $table = 'activities';

    protected $fillable = [
        'user_id',
        'vehicle_id',
        'asset_id',
        'action',
        'status',
        'description',
        'data',
        'metadata',
    ];

    protected $casts = [
        'data' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the user that owns the activity.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the vehicle associated with the activity.
     */
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * Get the asset associated with the activity.
     */
    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
