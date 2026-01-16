<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Trip extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'trip_id',
        'driver_id',
        'vehicle_id',
        'start_latitude',
        'start_longitude',
        'start_address',
        'end_latitude',
        'end_longitude',
        'end_address',
        'distance_km',
        'duration_minutes',
        'battery_start',
        'battery_end',
        'started_at',
        'ended_at',
        'status',
        'base_fare',
        'distance_fare',
        'bonus',
        'deductions',
        'total_earnings',
        'metadata',
        'notes',
    ];

    protected $casts = [
        'start_latitude' => 'decimal:7',
        'start_longitude' => 'decimal:7',
        'end_latitude' => 'decimal:7',
        'end_longitude' => 'decimal:7',
        'distance_km' => 'decimal:2',
        'base_fare' => 'decimal:2',
        'distance_fare' => 'decimal:2',
        'bonus' => 'decimal:2',
        'deductions' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Boot function to auto-generate trip_id
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($trip) {
            if (empty($trip->trip_id)) {
                $trip->trip_id = 'TRP-' . strtoupper(Str::random(12));
            }
        });
    }

    // Relationships
    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Asset::class, 'vehicle_id');
    }

    public function earnings()
    {
        return $this->hasMany(DriverEarning::class);
    }

    // Scopes
    public function scopeByDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('started_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('started_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('started_at', now()->month)
                     ->whereYear('started_at', now()->year);
    }

    // Helper methods
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function calculateDuration(): int
    {
        if ($this->started_at && $this->ended_at) {
            return $this->started_at->diffInMinutes($this->ended_at);
        }
        return 0;
    }

    public function calculateEarnings(float $ratePerKm = 50.0, float $baseFare = 200.0): float
    {
        $this->base_fare = $baseFare;
        $this->distance_fare = $this->distance_km * $ratePerKm;
        $this->total_earnings = $this->base_fare + $this->distance_fare + $this->bonus - $this->deductions;
        return $this->total_earnings;
    }

    public function start(array $startLocation = []): self
    {
        $this->status = self::STATUS_ACTIVE;
        $this->started_at = now();

        if (!empty($startLocation)) {
            $this->start_latitude = $startLocation['latitude'] ?? null;
            $this->start_longitude = $startLocation['longitude'] ?? null;
            $this->start_address = $startLocation['address'] ?? null;
        }

        $this->save();
        return $this;
    }

    public function complete(array $endLocation = [], float $distanceKm = 0): self
    {
        $this->status = self::STATUS_COMPLETED;
        $this->ended_at = now();
        $this->duration_minutes = $this->calculateDuration();

        if (!empty($endLocation)) {
            $this->end_latitude = $endLocation['latitude'] ?? null;
            $this->end_longitude = $endLocation['longitude'] ?? null;
            $this->end_address = $endLocation['address'] ?? null;
        }

        if ($distanceKm > 0) {
            $this->distance_km = $distanceKm;
        }

        $this->calculateEarnings();
        $this->save();

        return $this;
    }

    public function cancel(string $reason = null): self
    {
        $this->status = self::STATUS_CANCELLED;
        $this->ended_at = now();

        if ($reason) {
            $this->notes = $reason;
        }

        $this->save();
        return $this;
    }

    public function getBatteryUsage(): int
    {
        if ($this->battery_start && $this->battery_end) {
            return $this->battery_start - $this->battery_end;
        }
        return 0;
    }

    public function getStartLocation(): array
    {
        return [
            'latitude' => $this->start_latitude,
            'longitude' => $this->start_longitude,
            'address' => $this->start_address,
        ];
    }

    public function getEndLocation(): array
    {
        return [
            'latitude' => $this->end_latitude,
            'longitude' => $this->end_longitude,
            'address' => $this->end_address,
        ];
    }
}
