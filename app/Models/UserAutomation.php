<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Per-user automation rules. The `schedule` column stores a free-form
 * array of slots:
 *   [
 *     {"id":"abc1","label":"Welcome","enabled":true,"delay_days":0,"hour":14,"minute":30,"template_id":5},
 *     {"id":"abc2","label":"Day-2 nudge","enabled":true,"delay_days":2,"hour":9,"minute":0,"template_id":8},
 *     ... (any number, capped server-side at MAX_SLOTS)
 *   ]
 *
 * The `id` is a stable client-side key (used for React lists and to support
 * reorder/remove). It's NOT a DB id.
 */
class UserAutomation extends Model
{
    public const MAX_SLOTS = 10;

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
     * Default slot set for users who haven't customized — matches the legacy
     * Day 1/3/7 at 09:00 behaviour, all disabled (safe default).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function defaultSlots(): array
    {
        return [
            ['id' => 'd1', 'label' => 'Day 1 follow-up', 'enabled' => false, 'delay_days' => 1, 'hour' => 9, 'minute' => 0, 'template_id' => null],
            ['id' => 'd3', 'label' => 'Day 3 follow-up', 'enabled' => false, 'delay_days' => 3, 'hour' => 9, 'minute' => 0, 'template_id' => null],
            ['id' => 'd7', 'label' => 'Day 7 follow-up', 'enabled' => false, 'delay_days' => 7, 'hour' => 9, 'minute' => 0, 'template_id' => null],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function slots(): array
    {
        $stored = $this->schedule;
        if (! is_array($stored) || empty($stored)) {
            return self::defaultSlots();
        }
        return array_values($stored);
    }

    /**
     * Slots eligible for autosend (master switch on + slot enabled + has template).
     *
     * @return array<int, array<string, mixed>>
     */
    public function activeSlots(): array
    {
        if (! $this->autosend_enabled) {
            return [];
        }
        return array_values(array_filter(
            $this->slots(),
            fn ($s) => ($s['enabled'] ?? false) && ! empty($s['template_id']),
        ));
    }
}
