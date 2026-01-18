<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'status',
        'responded_at',
        'responded_by',
        'response_notes',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
    ];

    const STATUS_NEW = 'new';
    const STATUS_READ = 'read';
    const STATUS_RESPONDED = 'responded';
    const STATUS_ARCHIVED = 'archived';

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    public function scopeNew($query)
    {
        return $query->where('status', self::STATUS_NEW);
    }

    public function scopeUnread($query)
    {
        return $query->whereIn('status', [self::STATUS_NEW]);
    }

    public function markAsRead()
    {
        if ($this->status === self::STATUS_NEW) {
            $this->update(['status' => self::STATUS_READ]);
        }
    }

    public function markAsResponded($userId, $notes = null)
    {
        $this->update([
            'status' => self::STATUS_RESPONDED,
            'responded_at' => now(),
            'responded_by' => $userId,
            'response_notes' => $notes,
        ]);
    }
}
