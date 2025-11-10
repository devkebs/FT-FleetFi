<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwapStation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location'
    ];
}
