<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'event_type',
        'location',
        'status',
        'created_by',
        'is_all_day',
        'recurrence_pattern',
        'recurrence_end_date',
        'metadata'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'recurrence_end_date' => 'datetime',
        'is_all_day' => 'boolean',
        'metadata' => 'array'
    ];

    /**
     * Get the user who created the event
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the groups this event is shared with
     */
    public function groups()
    {
        return $this->hasMany(EventGroup::class);
    }

    /**
     * Get the participants for this event
     */
    public function participants()
    {
        return $this->hasMany(EventParticipant::class);
    }

    /**
     * Get the users participating in this event
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'event_participants')
                    ->withPivot('status', 'notes', 'is_organizer')
                    ->withTimestamps();
    }

    /**
     * Scope to filter events by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });
    }

    /**
     * Scope to filter events by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    /**
     * Scope to filter events by status
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get upcoming events
     */
    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>=', now())
                     ->orderBy('start_date', 'asc');
    }

    /**
     * Check if user has access to this event
     */
    public function userHasAccess($userId, $userRole)
    {
        // Creator always has access
        if ($this->created_by == $userId) {
            return true;
        }

        // Check if user is a participant
        if ($this->participants()->where('user_id', $userId)->exists()) {
            return true;
        }

        // Check if user's role has access through groups
        return $this->groups()
                    ->where('group_type', 'role')
                    ->where('group_identifier', $userRole)
                    ->exists();
    }

    /**
     * Check if user can edit this event
     */
    public function userCanEdit($userId, $userRole)
    {
        // Creator can always edit
        if ($this->created_by == $userId) {
            return true;
        }

        // Check if user is organizer
        if ($this->participants()->where('user_id', $userId)->where('is_organizer', true)->exists()) {
            return true;
        }

        // Check if user's role has edit permission through groups
        return $this->groups()
                    ->where('group_type', 'role')
                    ->where('group_identifier', $userRole)
                    ->whereIn('permission', ['edit', 'admin'])
                    ->exists();
    }
}
