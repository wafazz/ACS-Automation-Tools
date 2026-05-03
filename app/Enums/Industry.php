<?php

namespace App\Enums;

enum Industry: string
{
    case Takaful = 'takaful';
    case Insurance = 'insurance';
    case Property = 'property';
    case Auto = 'auto';
    case Dropship = 'dropship';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Takaful => 'Takaful',
            self::Insurance => 'Insurance',
            self::Property => 'Property / Real Estate',
            self::Auto => 'Automotive',
            self::Dropship => 'Dropship / Reseller',
            self::Other => 'Other',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $i) => ['value' => $i->value, 'label' => $i->label()],
            self::cases()
        );
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
