<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserFeedback extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'feedback_type',
        'trigger_point',
        'rating',
        'comment',
        'metadata',
        'is_resolved',
        'submitted_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_resolved' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
