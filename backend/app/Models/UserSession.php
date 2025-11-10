<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'device_type',
        'browser',
        'os',
        'ip_address',
        'country',
        'started_at',
        'ended_at',
        'duration_seconds',
        'page_views',
        'interactions',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
