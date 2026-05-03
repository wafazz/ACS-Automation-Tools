<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Affiliate extends Model
{
    protected $fillable = [
        'user_id',
        'code',
        'total_earned_cents',
        'total_paid_cents',
        'balance_cents',
        'opted_in_at',
    ];

    protected function casts(): array
    {
        return [
            'opted_in_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public function balanceMyr(): float
    {
        return $this->balance_cents / 100;
    }

    public function totalEarnedMyr(): float
    {
        return $this->total_earned_cents / 100;
    }

    public function totalPaidMyr(): float
    {
        return $this->total_paid_cents / 100;
    }
}
