<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DriverEarning extends Model
{
    use HasFactory;

    const SOURCE_TRIP = 'trip';
    const SOURCE_SWAP = 'swap';
    const SOURCE_BONUS = 'bonus';
    const SOURCE_PENALTY = 'penalty';
    const SOURCE_ADJUSTMENT = 'adjustment';

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSED = 'processed';
    const STATUS_PAID = 'paid';
    const STATUS_FAILED = 'failed';

    protected $fillable = [
        'earning_id',
        'driver_id',
        'trip_id',
        'swap_task_id',
        'source_type',
        'description',
        'gross_amount',
        'commission',
        'deductions',
        'net_amount',
        'currency',
        'earned_at',
        'paid_at',
        'payment_status',
        'payout_id',
        'metadata',
    ];

    protected $casts = [
        'gross_amount' => 'decimal:2',
        'commission' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'earned_at' => 'datetime',
        'paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Boot function to auto-generate earning_id
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($earning) {
            if (empty($earning->earning_id)) {
                $earning->earning_id = 'ERN-' . strtoupper(Str::random(12));
            }

            // Auto-calculate net amount if not set
            if (empty($earning->net_amount)) {
                $earning->net_amount = $earning->gross_amount - $earning->commission - $earning->deductions;
            }
        });
    }

    // Relationships
    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }

    public function swapTask()
    {
        return $this->belongsTo(SwapTask::class);
    }

    // Scopes
    public function scopeByDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    public function scopePending($query)
    {
        return $query->where('payment_status', self::STATUS_PENDING);
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', self::STATUS_PAID);
    }

    public function scopeBySourceType($query, $type)
    {
        return $query->where('source_type', $type);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('earned_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('earned_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('earned_at', now()->month)
                     ->whereYear('earned_at', now()->year);
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->payment_status === self::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::STATUS_PAID;
    }

    public function markAsPaid($payoutId = null): self
    {
        $this->payment_status = self::STATUS_PAID;
        $this->paid_at = now();

        if ($payoutId) {
            $this->payout_id = $payoutId;
        }

        $this->save();
        return $this;
    }

    public function getSourceLabel(): string
    {
        $labels = [
            self::SOURCE_TRIP => 'Trip Earning',
            self::SOURCE_SWAP => 'Swap Bonus',
            self::SOURCE_BONUS => 'Bonus',
            self::SOURCE_PENALTY => 'Penalty',
            self::SOURCE_ADJUSTMENT => 'Adjustment',
        ];

        return $labels[$this->source_type] ?? ucfirst($this->source_type);
    }

    /**
     * Create a trip earning
     */
    public static function createFromTrip(Trip $trip, float $commissionRate = 0.15): self
    {
        $grossAmount = $trip->total_earnings;
        $commission = $grossAmount * $commissionRate;

        return self::create([
            'driver_id' => $trip->driver_id,
            'trip_id' => $trip->id,
            'source_type' => self::SOURCE_TRIP,
            'description' => "Earnings from trip {$trip->trip_id}",
            'gross_amount' => $grossAmount,
            'commission' => $commission,
            'deductions' => 0,
            'net_amount' => $grossAmount - $commission,
            'earned_at' => $trip->ended_at ?? now(),
        ]);
    }

    /**
     * Create a swap bonus earning
     */
    public static function createSwapBonus(int $driverId, int $swapTaskId, float $amount, string $description = null): self
    {
        return self::create([
            'driver_id' => $driverId,
            'swap_task_id' => $swapTaskId,
            'source_type' => self::SOURCE_SWAP,
            'description' => $description ?? 'Swap completion bonus',
            'gross_amount' => $amount,
            'commission' => 0,
            'deductions' => 0,
            'net_amount' => $amount,
            'earned_at' => now(),
        ]);
    }

    /**
     * Get total pending amount for a driver
     */
    public static function getPendingBalance(int $driverId): float
    {
        return self::byDriver($driverId)
            ->pending()
            ->sum('net_amount');
    }

    /**
     * Get monthly earnings for a driver
     */
    public static function getMonthlyEarnings(int $driverId, int $month = null, int $year = null): float
    {
        $month = $month ?? now()->month;
        $year = $year ?? now()->year;

        return self::byDriver($driverId)
            ->whereMonth('earned_at', $month)
            ->whereYear('earned_at', $year)
            ->sum('net_amount');
    }
}
