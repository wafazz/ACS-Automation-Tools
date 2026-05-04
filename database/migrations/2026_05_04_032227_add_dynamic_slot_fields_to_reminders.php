<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add columns so each reminder is self-contained for the autosend cron:
     *   - is_auto: should this be auto-sent when due?
     *   - template_id: which template to render (denormalized at creation time
     *     so changing the user's automation later doesn't break existing reminders)
     *   - slot_label: human label like "Welcome", "Quote follow-up"
     *
     * Together these let subscribers define ANY number of automation slots
     * (not just the legacy 3) and each spawned reminder carries its own intent.
     */
    public function up(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->boolean('is_auto')->default(false)->after('type');
            $table->foreignId('template_id')->nullable()->after('is_auto')->constrained()->nullOnDelete();
            $table->string('slot_label', 60)->nullable()->after('template_id');

            $table->index(['is_auto', 'auto_sent_at', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->dropIndex(['is_auto', 'auto_sent_at', 'due_at']);
            $table->dropConstrainedForeignId('template_id');
            $table->dropColumn(['is_auto', 'slot_label']);
        });
    }
};
