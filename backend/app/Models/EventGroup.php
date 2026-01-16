<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'group_type',
        'group_identifier',
        'permission'
    ];

    /**
     * Get the event this group belongs to
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
