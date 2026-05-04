<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Replace flat template_map with a richer `schedule` JSON column that
     * holds per-slot config: { enabled, delay_days, hour, minute, template_id }
     *
     * Shape:
     *   {
     *     "auto_day_1": { "enabled": true, "delay_days": 1, "hour": 9, "minute": 0, "template_id": 5 },
     *     "auto_day_3": { ... },
     *     "auto_day_7": { ... }
     *   }
     */
    public function up(): void
    {
        Schema::table('user_automations', function (Blueprint $table) {
            $table->dropColumn('template_map');
            $table->json('schedule')->nullable()->after('autosend_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('user_automations', function (Blueprint $table) {
            $table->dropColumn('schedule');
            $table->json('template_map')->nullable()->after('autosend_enabled');
        });
    }
};
