<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadCampaign extends Model
{
    protected $fillable = [
        'user_id',
        'template_id',
        'name',
        'scheduled_at',
        'status',
        'target_kind',
        'target_criteria',
        'target_count',
        'sent_count',
        'failed_count',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'target_criteria' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class, 'campaign_id');
    }

    public function isCancellable(): bool
    {
        return \in_array($this->status, ['scheduled', 'sending'], true);
    }

    public function progressPct(): int
    {
        if ($this->target_count === 0) {
            return 0;
        }
        return (int) round((($this->sent_count + $this->failed_count) / $this->target_count) * 100);
    }
}
