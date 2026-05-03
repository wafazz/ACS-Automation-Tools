<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Fakrul Demo',
            'email' => 'demo@acs.local',
            'phone' => '0123456789',
            'industry' => 'takaful',
            'plan' => 'trial',
            'trial_ends_at' => now()->addDays(7),
        ]);

        Lead::factory()->count(25)->forUser($user)->create();
    }
}
