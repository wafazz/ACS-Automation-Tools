<?php

namespace App\Enums;

enum Plan: string
{
    case Trial = 'trial';
    case Starter = 'starter';
    case Pro = 'pro';
    case Team = 'team';
    case FounderLifetime = 'founder_ltd';

    public function label(): string
    {
        return match ($this) {
            self::Trial => 'Trial',
            self::Starter => 'Starter',
            self::Pro => 'Pro',
            self::Team => 'Team',
            self::FounderLifetime => 'Founder Lifetime Deal',
        };
    }

    public function tagline(): string
    {
        return match ($this) {
            self::Trial => '7-day free trial',
            self::Starter => 'For solo agents getting started',
            self::Pro => 'For active full-time agents',
            self::Team => 'For small agencies',
            self::FounderLifetime => 'One-time payment, lifetime access',
        };
    }

    /** Price in MYR cents (sen). 0 for trial. */
    public function priceCents(): int
    {
        return match ($this) {
            self::Trial => 0,
            self::Starter => 1900,
            self::Pro => 4900,
            self::Team => 14900,
            self::FounderLifetime => 14900,
        };
    }

    public function priceMyr(): float
    {
        return $this->priceCents() / 100;
    }

    public function billingCadence(): string
    {
        return match ($this) {
            self::Trial => 'free for 7 days',
            self::Starter, self::Pro, self::Team => 'per month',
            self::FounderLifetime => 'one time',
        };
    }

    /** Subscription duration in days. null = lifetime. */
    public function durationDays(): ?int
    {
        return match ($this) {
            self::Trial => 7,
            self::Starter, self::Pro, self::Team => 30,
            self::FounderLifetime => null,
        };
    }

    /** Lead count limit. null = unlimited. */
    public function maxLeads(): ?int
    {
        return match ($this) {
            self::Trial, self::Starter => 100,
            self::Pro, self::Team, self::FounderLifetime => null,
        };
    }

    /** Template count limit. null = unlimited. */
    public function maxTemplates(): ?int
    {
        return match ($this) {
            self::Trial, self::Starter => 3,
            self::Pro, self::Team, self::FounderLifetime => null,
        };
    }

    public function maxSeats(): int
    {
        return match ($this) {
            self::Team => 5,
            default => 1,
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::Trial => 'bg-secondary',
            self::Starter => 'bg-primary',
            self::Pro => 'bg-success',
            self::Team => 'bg-info text-dark',
            self::FounderLifetime => 'bg-warning text-dark',
        };
    }

    /** Plans available to purchase on the public pricing page. */
    public static function purchasable(): array
    {
        return [self::Starter, self::Pro, self::Team, self::FounderLifetime];
    }

    /**
     * @return array<string, mixed>
     */
    public function toCardArray(): array
    {
        return [
            'value' => $this->value,
            'label' => $this->label(),
            'tagline' => $this->tagline(),
            'price_myr' => $this->priceMyr(),
            'price_cents' => $this->priceCents(),
            'cadence' => $this->billingCadence(),
            'max_leads' => $this->maxLeads(),
            'max_templates' => $this->maxTemplates(),
            'max_seats' => $this->maxSeats(),
            'badge' => $this->badgeClass(),
            'features' => $this->features(),
            'is_lifetime' => $this->durationDays() === null,
        ];
    }

    /**
     * @return array<int, string>
     */
    public function features(): array
    {
        $leadsLine = $this->maxLeads() === null ? 'Unlimited leads' : "Up to {$this->maxLeads()} leads";
        $tplLine = $this->maxTemplates() === null ? 'Unlimited templates' : "{$this->maxTemplates()} templates";

        return match ($this) {
            self::Starter => [
                $leadsLine,
                $tplLine,
                'WhatsApp quick send',
                'Day 1/3/7 reminders',
                'Single user',
            ],
            self::Pro => [
                $leadsLine,
                $tplLine,
                'WhatsApp quick send',
                'Day 1/3/7 reminders',
                'Full analytics & goal tracking',
                'Single user',
            ],
            self::Team => [
                $leadsLine,
                $tplLine,
                'WhatsApp quick send',
                'Day 1/3/7 reminders',
                'Full analytics & goal tracking',
                'Up to 5 team seats',
            ],
            self::FounderLifetime => [
                'All Pro features',
                'Lifetime access — never pay again',
                'Founding Member badge',
                'Early access to new features',
                'Limited to 50 seats',
            ],
            self::Trial => [
                'Up to 100 leads',
                '3 templates',
                'All Pro features for 7 days',
            ],
        };
    }
}
