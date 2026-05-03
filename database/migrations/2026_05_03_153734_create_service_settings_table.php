<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_settings', function (Blueprint $table) {
            $table->id();
            $table->string('service', 30)->unique();
            // Stored as encrypted text (NOT json column — see anti-pattern:
            // AsEncryptedArrayObject + json column = MySQL CHECK fails)
            $table->text('settings')->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_settings');
    }
};
