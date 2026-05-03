<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payout extends Model
{
    protected $fillable = [
        'affiliate_id',
        'amount_cents',
        'status',
        'method',
        'bank_details',
        'admin_note',
        'requested_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'bank_details' => 'array',
            'requested_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(Affiliate::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function amountMyr(): float
    {
        return $this->amount_cents / 100;
    }
}
