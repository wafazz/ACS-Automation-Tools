<?php

namespace App\Enums;

enum LeadStatus: string
{
    case New = 'new';
    case FollowUp = 'follow_up';
    case Interested = 'interested';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::FollowUp => 'Follow-up',
            self::Interested => 'Interested',
            self::Closed => 'Closed',
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::New => 'bg-secondary',
            self::FollowUp => 'bg-warning text-dark',
            self::Interested => 'bg-info text-dark',
            self::Closed => 'bg-success',
        };
    }

    /**
     * @return array<int, array{value: string, label: string, badge: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $s) => [
                'value' => $s->value,
                'label' => $s->label(),
                'badge' => $s->badgeClass(),
            ],
            self::cases()
        );
    }
}
