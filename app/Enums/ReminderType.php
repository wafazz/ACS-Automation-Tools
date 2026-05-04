<?php

namespace App\Enums;

enum ReminderType: string
{
    case Manual = 'manual';
    case AutoDay1 = 'auto_day_1';
    case AutoDay3 = 'auto_day_3';
    case AutoDay7 = 'auto_day_7';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::AutoDay1 => '1st Follow-up',
            self::AutoDay3 => '2nd Follow-up',
            self::AutoDay7 => '3rd Follow-up',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Manual => 'bi-bookmark-star',
            self::AutoDay1, self::AutoDay3, self::AutoDay7 => 'bi-calendar-check',
        };
    }

    public function defaultDelayDays(): ?int
    {
        return match ($this) {
            self::AutoDay1 => 1,
            self::AutoDay3 => 3,
            self::AutoDay7 => 7,
            self::Manual => null,
        };
    }

    /**
     * @return array<int, self>
     */
    public static function autoTypes(): array
    {
        return [self::AutoDay1, self::AutoDay3, self::AutoDay7];
    }
}
