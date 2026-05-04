<?php

namespace App\Models;

use Database\Factories\ReminderFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    /** @use HasFactory<ReminderFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lead_id',
        'campaign_id',  // nullable — set when this reminder was spawned by a campaign
        'type',         // free-form: 'manual' / 'auto' / 'campaign'
        'is_auto',      // true = autosend cron should pick this up
        'template_id',  // denormalized at creation — used by autosend cron
        'slot_label',   // human label shown in UI ("Welcome", "Day 3 nudge")
        'due_at',
        'completed_at',
        'dismissed_at',
        'snooze_count',
        'auto_sent_at',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'is_auto' => 'boolean',
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
            'dismissed_at' => 'datetime',
            'auto_sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(LeadCampaign::class, 'campaign_id');
    }

    public function isOpen(): bool
    {
        return $this->completed_at === null && $this->dismissed_at === null;
    }

    /**
     * Display label: prefer the denormalized slot_label (e.g. "Welcome"),
     * fall back to a humanized version of the type column.
     */
    public function displayLabel(): string
    {
        if ($this->slot_label) {
            return $this->slot_label;
        }
        return match ($this->type) {
            'manual' => 'Manual',
            'auto' => 'Auto follow-up',
            'auto_day_1' => '1st Follow-up',
            'auto_day_3' => '2nd Follow-up',
            'auto_day_7' => '3rd Follow-up',
            default => ucfirst(str_replace('_', ' ', (string) $this->type)),
        };
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('completed_at')->whereNull('dismissed_at');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->open()->where('due_at', '<', now()->startOfDay());
    }

    public function scopeDueToday(Builder $query): Builder
    {
        return $query->open()
            ->whereBetween('due_at', [now()->startOfDay(), now()->endOfDay()]);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->open()->where('due_at', '>', now()->endOfDay());
    }
}
