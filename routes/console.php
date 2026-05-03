<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily 09:00 — warn users whose trial ends in 3 days
Schedule::command('acs:send-trial-warnings --days=3')
    ->dailyAt('09:00')
    ->timezone('Asia/Kuala_Lumpur')
    ->withoutOverlapping();

// Daily 09:30 — last-day reminder (1 day left)
Schedule::command('acs:send-trial-warnings --days=1')
    ->dailyAt('09:30')
    ->timezone('Asia/Kuala_Lumpur')
    ->withoutOverlapping();
