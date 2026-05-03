<?php

namespace Database\Seeders;

use App\Enums\ReminderType;
use App\Models\Lead;
use App\Models\Reminder;
use App\Models\User;
use App\Services\DefaultTemplateSeeder;
use Illuminate\Support\Carbon;
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

        DefaultTemplateSeeder::seedFor($user);

        $leads = Lead::factory()->count(25)->forUser($user)->create();

        // Spawn auto Day 1/3/7 reminders for each lead, anchored to lead created_at
        foreach ($leads as $lead) {
            $createdAt = Carbon::parse($lead->created_at);
            foreach (ReminderType::autoTypes() as $type) {
                Reminder::create([
                    'user_id' => $user->id,
                    'lead_id' => $lead->id,
                    'type' => $type->value,
                    'due_at' => $createdAt->copy()->addDays($type->defaultDelayDays())->setTime(9, 0),
                ]);
            }
        }
    }
}
