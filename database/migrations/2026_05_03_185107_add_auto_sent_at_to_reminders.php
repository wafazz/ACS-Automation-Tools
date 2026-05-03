<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            // Set when the autosend command has dispatched this reminder via Onsend.
            // Used as an idempotency guard so the cron can't double-send if it runs
            // twice or if a reminder rolls into a new "due" window.
            $table->timestamp('auto_sent_at')->nullable()->after('snooze_count');
        });
    }

    public function down(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->dropColumn('auto_sent_at');
        });
    }
};
