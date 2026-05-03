<?php

namespace App\Models;

use App\Enums\ReminderType;
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
        'type',
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
            'type' => ReminderType::class,
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

    public function isOpen(): bool
    {
        return $this->completed_at === null && $this->dismissed_at === null;
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
