<?php

namespace Database\Factories;

use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sources = ['WhatsApp', 'Facebook', 'Instagram', 'Referral', 'Walk-in', 'TikTok'];
        $statuses = LeadStatus::cases();

        return [
            'user_id' => User::factory(),
            'name' => fake()->name(),
            'phone' => '01' . fake()->numerify('########'),
            'email' => fake()->optional(0.6)->safeEmail(),
            'source' => fake()->randomElement($sources),
            'status' => fake()->randomElement($statuses),
            'amount' => fake()->optional(0.4)->randomFloat(2, 100, 50000),
            'notes' => fake()->optional(0.5)->sentence(10),
            'last_contacted_at' => fake()->optional(0.7)->dateTimeBetween('-30 days', 'now'),
            'created_at' => fake()->dateTimeBetween('-60 days', 'now'),
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(fn () => ['user_id' => $user->id]);
    }
}
