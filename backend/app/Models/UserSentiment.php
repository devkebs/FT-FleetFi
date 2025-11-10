<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSentiment extends Model
{
    protected $table = 'user_sentiment';
    
    protected $fillable = [
        'user_id',
        'session_id',
        'sentiment_type',
        'context',
        'reason',
        'indicators',
        'detected_at',
    ];

    protected $casts = [
        'indicators' => 'array',
        'detected_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
