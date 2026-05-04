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
        'schedule',
    ];

    protected function casts(): array
    {
        return [
            'autosend_enabled' => 'boolean',
            'schedule' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Default slot config when subscriber hasn't customized — matches the
     * legacy hardcoded behaviour (Day 1/3/7 at 09:00, all disabled).
     *
     * @return array{enabled: bool, delay_days: int, hour: int, minute: int, template_id: int|null}
     */
    public static function defaultSlot(ReminderType $type): array
    {
        return [
            'enabled' => false,
            'delay_days' => $type->defaultDelayDays() ?? 0,
            'hour' => 9,
            'minute' => 0,
            'template_id' => null,
        ];
    }

    /**
     * @return array{enabled: bool, delay_days: int, hour: int, minute: int, template_id: int|null}
     */
    public function slot(ReminderType $type): array
    {
        $stored = $this->schedule[$type->value] ?? null;
        if (! is_array($stored)) {
            return self::defaultSlot($type);
        }

        $defaults = self::defaultSlot($type);
        return [
            'enabled' => (bool) ($stored['enabled'] ?? $defaults['enabled']),
            'delay_days' => (int) ($stored['delay_days'] ?? $defaults['delay_days']),
            'hour' => (int) ($stored['hour'] ?? $defaults['hour']),
            'minute' => (int) ($stored['minute'] ?? $defaults['minute']),
            'template_id' => isset($stored['template_id']) && $stored['template_id'] !== null
                ? (int) $stored['template_id']
                : null,
        ];
    }

    public function templateIdFor(ReminderType $type): ?int
    {
        return $this->slot($type)['template_id'];
    }

    public function isAutosendActiveFor(ReminderType $type): bool
    {
        if (! $this->autosend_enabled) {
            return false;
        }
        $slot = $this->slot($type);
        return $slot['enabled'] && $slot['template_id'] !== null;
    }
}
