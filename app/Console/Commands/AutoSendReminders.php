<?php

namespace App\Console\Commands;

use App\Enums\LeadStatus;
use App\Models\Reminder;
use App\Services\OnsendService;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Throwable;

class AutoSendReminders extends Command
{
    protected $signature = 'acs:autosend-reminders {--dry-run : Show what would send without actually sending}';

    protected $description = 'Send due auto reminders via subscriber Onsend (one per opted-in slot per lead).';

    public function handle(WhatsAppService $whatsapp): int
    {
        $dry = (bool) $this->option('dry-run');
        $now = now();

        // Eligible reminders (each one is self-contained — has its own
        // template_id and slot_label denormalized at creation time):
        //   - is_auto = true (subscriber opted this slot in at lead-create time)
        //   - lead-tied
        //   - open (not completed/dismissed)
        //   - due in the past or now
        //   - not yet auto_sent (idempotency guard)
        //   - has a template_id (might be null if user removed the template after creating)
        $reminders = Reminder::query()
            ->where('is_auto', true)
            ->whereNotNull('lead_id')
            ->whereNotNull('template_id')
            ->whereNull('completed_at')
            ->whereNull('dismissed_at')
            ->whereNull('auto_sent_at')
            ->where('due_at', '<=', $now)
            ->with([
                'lead:id,user_id,name,phone,email,source,status,amount',
                'user:id,name,phone',
                'template:id,user_id,title,body',
            ])
            ->orderBy('due_at')
            ->limit(500) // safety cap per run
            ->get();

        $this->info("Found {$reminders->count()} due auto-reminder(s).");

        $sent = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($reminders as $reminder) {
            try {
                $lead = $reminder->lead;
                $user = $reminder->user;
                $template = $reminder->template;

                if (! $lead || ! $user || ! $template) {
                    // Underlying record vanished — mark as sent so we stop checking
                    $reminder->update(['auto_sent_at' => $now]);
                    $skipped++;
                    continue;
                }

                // Don't pester closed leads — but mark as sent so we stop checking
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

                $rendered = $whatsapp->render($template->body, $lead, $user);

                if ($dry) {
                    $this->line(sprintf(
                        '[DRY] would send "%s" to %s (%s) via Onsend [user=%s, slot=%s]',
                        $template->title,
                        $lead->name,
                        $lead->phone,
                        $user->name,
                        $reminder->slot_label ?? $reminder->type,
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
                    'note' => 'Auto-sent via Onsend (' . ($reminder->slot_label ?? 'auto') . '): ' . $template->title,
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
