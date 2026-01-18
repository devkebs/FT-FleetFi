<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'wallet_transaction_id',
        'reference',
        'gateway',
        'type',
        'amount',
        'fee',
        'net_amount',
        'currency',
        'status',
        'failure_reason',
        'gateway_reference',
        'authorization_url',
        'gateway_response',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'gateway_response' => 'array',
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];

    // Gateway constants
    const GATEWAY_PAYSTACK = 'paystack';
    const GATEWAY_FLUTTERWAVE = 'flutterwave';
    const GATEWAY_BANK_TRANSFER = 'bank_transfer';
    const GATEWAY_MANUAL = 'manual';

    // Type constants
    const TYPE_FUNDING = 'funding';
    const TYPE_WITHDRAWAL = 'withdrawal';
    const TYPE_INVESTMENT = 'investment';
    const TYPE_REFUND = 'refund';
    const TYPE_PAYOUT = 'payout';

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function walletTransaction()
    {
        return $this->belongsTo(WalletTransaction::class);
    }

    /**
     * Scope for pending payments
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for completed payments
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope by gateway
     */
    public function scopeByGateway($query, string $gateway)
    {
        return $query->where('gateway', $gateway);
    }

    /**
     * Scope by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Mark as completed
     */
    public function markCompleted(string $gatewayReference = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'gateway_reference' => $gatewayReference,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark as failed
     */
    public function markFailed(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'failure_reason' => $reason,
        ]);
    }

    /**
     * Check if payment can be refunded
     */
    public function canBeRefunded(): bool
    {
        return $this->status === self::STATUS_COMPLETED
            && $this->type === self::TYPE_FUNDING
            && $this->created_at->diffInDays(now()) <= 30;
    }
}
