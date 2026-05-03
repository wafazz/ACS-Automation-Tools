<?php

namespace App\Models;

use App\Enums\ReminderType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAutomation extends Model
{
    protected $fillable = [
        'user_id',
        'autosend_enabled',
        'template_map',
    ];

    protected function casts(): array
    {
        return [
            'autosend_enabled' => 'boolean',
            'template_map' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function templateIdFor(ReminderType $type): ?int
    {
        $map = $this->template_map ?? [];
        $value = $map[$type->value] ?? null;
        return $value === null ? null : (int) $value;
    }

    public function isAutosendActiveFor(ReminderType $type): bool
    {
        return $this->autosend_enabled && $this->templateIdFor($type) !== null;
    }
}
