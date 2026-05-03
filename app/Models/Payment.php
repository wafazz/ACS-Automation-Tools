<?php

namespace App\Models;

use App\Enums\Plan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_id',
        'template_pack_id',
        'plan',
        'amount_cents',
        'currency',
        'status',
        'gateway',
        'gateway_ref',
        'paid_at',
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'plan' => Plan::class,
            'paid_at' => 'datetime',
            'raw_payload' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function templatePack(): BelongsTo
    {
        return $this->belongsTo(TemplatePack::class);
    }

    public function amountMyr(): float
    {
        return $this->amount_cents / 100;
    }
}
