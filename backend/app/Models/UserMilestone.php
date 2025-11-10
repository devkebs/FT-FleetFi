<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMilestone extends Model
{
    protected $fillable = [
        'user_id',
        'milestone_type',
        'milestone_data',
        'achieved_at',
    ];

    protected $casts = [
        'milestone_data' => 'array',
        'achieved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
