<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_settings', function (Blueprint $table) {
            // Drop the global-only unique on service
            $table->dropUnique(['service']);

            // user_id null = global (admin-managed), non-null = per-subscriber
            $table->foreignId('user_id')
                ->nullable()
                ->after('service')
                ->constrained()
                ->cascadeOnDelete();

            // (service, user_id) unique — MySQL treats nulls as distinct so
            // one global + many per-user rows for the same service all coexist.
            $table->unique(['service', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('service_settings', function (Blueprint $table) {
            $table->dropUnique(['service', 'user_id']);
            $table->dropConstrainedForeignId('user_id');
            $table->unique('service');
        });
    }
};
