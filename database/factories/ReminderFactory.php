<?php

namespace Database\Factories;

use App\Enums\ReminderType;
use App\Models\Reminder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reminder>
 */
class ReminderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => ReminderType::Manual,
            'due_at' => fake()->dateTimeBetween('-3 days', '+7 days'),
            'snooze_count' => 0,
            'note' => fake()->optional(0.4)->sentence(8),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => ['completed_at' => now()]);
    }

    public function dismissed(): static
    {
        return $this->state(fn () => ['dismissed_at' => now()]);
    }

    public function dueToday(): static
    {
        return $this->state(fn () => ['due_at' => now()]);
    }

    public function overdue(): static
    {
        return $this->state(fn () => ['due_at' => now()->subDays(2)]);
    }
}
