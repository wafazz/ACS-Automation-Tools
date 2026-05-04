<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tag a reminder with the campaign that spawned it (nullable for the
     * legacy per-lead-creation reminders that are not part of any campaign).
     * Lets us cancel a campaign by deleting its un-sent reminders.
     */
    public function up(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->foreignId('campaign_id')
                ->nullable()
                ->after('lead_id')
                ->constrained('lead_campaigns')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('campaign_id');
        });
    }
};
