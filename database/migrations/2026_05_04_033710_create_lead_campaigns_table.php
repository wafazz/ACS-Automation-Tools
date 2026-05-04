<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->constrained()->restrictOnDelete();
            $table->string('name', 100);
            $table->timestamp('scheduled_at');
            $table->string('status', 20)->default('scheduled'); // scheduled | sending | completed | cancelled
            // How leads were targeted — for the audit/show page only
            $table->string('target_kind', 20); // all | by_status | by_source | specific
            $table->json('target_criteria')->nullable(); // {status:"..."} or {source:"..."} or {ids:[1,2,3]}
            $table->unsignedInteger('target_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_campaigns');
    }
};
