<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'notes',
        'is_organizer'
    ];

    protected $casts = [
        'is_organizer' => 'boolean'
    ];

    /**
     * Get the event this participant belongs to
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the user participating
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
