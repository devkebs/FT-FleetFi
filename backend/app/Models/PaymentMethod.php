<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'bank_code',
        'bank_name',
        'account_number',
        'account_name',
        'recipient_code',
        'card_last_four',
        'card_type',
        'card_exp_month',
        'card_exp_year',
        'authorization_code',
        'mobile_number',
        'mobile_provider',
        'is_default',
        'is_verified',
        'verified_at',
        'metadata',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $hidden = [
        'authorization_code',
        'recipient_code',
    ];

    // Type constants
    const TYPE_BANK_ACCOUNT = 'bank_account';
    const TYPE_CARD = 'card';
    const TYPE_MOBILE_MONEY = 'mobile_money';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get masked account number
     */
    public function getMaskedAccountNumberAttribute(): ?string
    {
        if (!$this->account_number) return null;
        return '****' . substr($this->account_number, -4);
    }

    /**
     * Get display name for the payment method
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->type === self::TYPE_BANK_ACCOUNT) {
            return "{$this->bank_name} - {$this->masked_account_number}";
        } elseif ($this->type === self::TYPE_CARD) {
            return ucfirst($this->card_type) . " ****{$this->card_last_four}";
        } elseif ($this->type === self::TYPE_MOBILE_MONEY) {
            return "{$this->mobile_provider} - {$this->mobile_number}";
        }
        return 'Unknown';
    }

    /**
     * Scope for default payment method
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope for verified methods
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Set as default and unset others
     */
    public function setAsDefault(): void
    {
        // Unset other defaults for this user
        self::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }
}
