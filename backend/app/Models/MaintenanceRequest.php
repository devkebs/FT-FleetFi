<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'reported_by',
        'rider_id',
        'issue_type',
        'severity',
        'description',
        'photo_url',
        'status',
        'reported_at',
        'resolved_at',
        'resolution_notes'
    ];

    protected $casts = [
        'reported_at' => 'datetime',
        'resolved_at' => 'datetime'
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }
}
