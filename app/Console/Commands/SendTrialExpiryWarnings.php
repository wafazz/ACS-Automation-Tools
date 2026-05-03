<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\BrevoService;
use App\Services\OnsendService;
use Illuminate\Console\Command;
use Throwable;

class SendTrialExpiryWarnings extends Command
{
    protected $signature = 'acs:send-trial-warnings {--days=3 : Warn users whose trial ends in N days}';

    protected $description = 'Email + WhatsApp users whose 7-day trial is expiring soon.';

    public function handle(BrevoService $brevo, OnsendService $onsend): int
    {
        $days = (int) $this->option('days');
        $window = now()->addDays($days);

        // Trial users with trial_ends_at falling on the target day
        $users = User::where('plan', 'trial')
            ->whereNotNull('trial_ends_at')
            ->whereBetween('trial_ends_at', [$window->copy()->startOfDay(), $window->copy()->endOfDay()])
            ->get();

        $this->info("Found {$users->count()} user(s) with trial expiring in {$days} day(s).");

        $sent = 0;
        foreach ($users as $user) {
            try {
                if ($brevo->isConfigured()) {
                    $upgradeUrl = config('app.url') . '/pricing';
                    $html = "<h2>Your trial ends soon</h2>"
                        . "<p>Hi {$user->name},</p>"
                        . "<p>Your ACS free trial ends in <strong>{$days} day" . ($days === 1 ? '' : 's') . "</strong>.</p>"
                        . "<p>Upgrade to keep your leads, reminders, and templates flowing — Starter is just RM 19/month, or grab the lifetime deal for a one-time RM 149.</p>"
                        . "<p><a href='{$upgradeUrl}' style='display:inline-block;padding:12px 24px;background:#0d6efd;color:#fff;border-radius:6px;text-decoration:none;'>See plans →</a></p>"
                        . "<p style='color:#888;font-size:12px;margin-top:24px;'>You can also continue without upgrading — your data stays safe but you'll lose access to some features.</p>";

                    $brevo->sendEmail(
                        ['email' => $user->email, 'name' => $user->name],
                        "ACS — Your trial ends in {$days} day" . ($days === 1 ? '' : 's'),
                        $html,
                    );
                }

                if ($onsend->isConfigured() && $user->phone) {
                    $upgradeUrl = config('app.url') . '/pricing';
                    $msg = "Hi {$user->name}! Your ACS trial ends in {$days} day"
                        . ($days === 1 ? '' : 's')
                        . ". Upgrade to keep your leads + reminders going: {$upgradeUrl}";
                    $onsend->sendMessage($user->phone, $msg);
                }

                $sent++;
            } catch (Throwable $e) {
                $this->warn("Failed for user #{$user->id}: " . $e->getMessage());
            }
        }

        $this->info("Sent warnings to {$sent} user(s).");

        return self::SUCCESS;
    }
}
