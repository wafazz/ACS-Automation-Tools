<?php

namespace Database\Factories;

use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Template>
 */
class TemplateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'body' => 'Hi {first_name}, ' . fake()->sentence(10),
            'industry' => null,
            'is_default' => false,
            'use_count' => 0,
        ];
    }
}
