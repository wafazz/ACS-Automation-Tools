<?php

namespace App\Console\Commands;

use App\Enums\LeadStatus;
use App\Enums\ReminderType;
use App\Models\Reminder;
use App\Models\Template;
use App\Models\UserAutomation;
use App\Services\OnsendService;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Throwable;

class AutoSendReminders extends Command
{
    protected $signature = 'acs:autosend-reminders {--dry-run : Show what would send without actually sending}';

    protected $description = 'For each subscriber with autosend enabled, send due Day-1/3/7 reminders to leads via Onsend.';

    public function handle(WhatsAppService $whatsapp): int
    {
        $dry = (bool) $this->option('dry-run');
        $now = now();

        // Eligible reminders:
        //  - lead-tied (general reminders can't auto-send)
        //  - one of the 3 auto types
        //  - open (not completed/dismissed)
        //  - due in the past or now
        //  - not yet auto_sent (idempotency guard)
        $autoTypes = array_map(fn (ReminderType $t) => $t->value, ReminderType::autoTypes());

        $reminders = Reminder::query()
            ->whereNotNull('lead_id')
            ->whereIn('type', $autoTypes)
            ->whereNull('completed_at')
            ->whereNull('dismissed_at')
            ->whereNull('auto_sent_at')
            ->where('due_at', '<=', $now)
            ->with([
                'lead:id,user_id,name,phone,email,source,status,amount',
                'user:id,name,phone',
            ])
            ->orderBy('due_at')
            ->limit(500) // safety cap per run
            ->get();

        $this->info("Found {$reminders->count()} due auto-reminder(s).");

        // Pre-load automations per user (avoid N+1)
        $userIds = $reminders->pluck('user_id')->unique()->values()->all();
        $automations = UserAutomation::whereIn('user_id', $userIds)->get()->keyBy('user_id');

        $sent = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($reminders as $reminder) {
            try {
                $automation = $automations[$reminder->user_id] ?? null;
                $type = $reminder->type;

                if (! $automation || ! $automation->isAutosendActiveFor($type)) {
                    $skipped++;
                    continue;
                }

                $lead = $reminder->lead;
                $user = $reminder->user;
                if (! $lead || ! $user) {
                    $skipped++;
                    continue;
                }

                // Don't pester closed leads — but mark as sent so we stop
                // checking this row on every cron tick
                if ($lead->status === LeadStatus::Closed) {
                    $reminder->update(['auto_sent_at' => $now]);
                    $skipped++;
                    continue;
                }

                $onsend = OnsendService::for($user->id);
                if (! $onsend->isConfigured()) {
                    $skipped++;
                    continue;
                }

                $template = Template::where('id', $automation->templateIdFor($type))
                    ->where('user_id', $user->id)
                    ->first();
                if (! $template) {
                    // Template was deleted — skip but mark sent so we don't retry forever
                    $reminder->update(['auto_sent_at' => $now]);
                    $skipped++;
                    continue;
                }

                $rendered = $whatsapp->render($template->body, $lead, $user);

                if ($dry) {
                    $this->line(sprintf(
                        '[DRY] would send "%s" to %s (%s) via Onsend [user=%s, type=%s]',
                        $template->title,
                        $lead->name,
                        $lead->phone,
                        $user->name,
                        $type->value,
                    ));
                    $sent++;
                    continue;
                }

                $onsend->sendMessage($lead->phone, $rendered);
                $reminder->update(['auto_sent_at' => $now]);
                $template->increment('use_count');

                // Log into the lead's activity timeline
                $reminder->lead->statusHistory()->create([
                    'changed_by' => $user->id,
                    'from_status' => $lead->status->value,
                    'to_status' => $lead->status->value,
                    'note' => "Auto-sent via Onsend ({$type->label()}): {$template->title}",
                ]);
                $reminder->lead->update(['last_contacted_at' => $now]);

                $sent++;
            } catch (Throwable $e) {
                $failed++;
                $this->warn("Reminder #{$reminder->id} failed: " . $e->getMessage());
            }
        }

        $this->info(sprintf(
            '%s: sent=%d, skipped=%d, failed=%d',
            $dry ? 'Dry run' : 'Done',
            $sent, $skipped, $failed,
        ));

        return self::SUCCESS;
    }
}
