<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserEvent extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'event_type',
        'event_category',
        'event_name',
        'event_data',
        'page_url',
        'referrer',
        'occurred_at',
    ];

    protected $casts = [
        'event_data' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
