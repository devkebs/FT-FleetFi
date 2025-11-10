<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleCapability extends Model
{
    protected $fillable = [
        'role',
        'capability',
        'description',
        'is_enabled'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
