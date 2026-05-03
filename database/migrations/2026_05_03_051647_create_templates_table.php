<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('body');
            $table->string('industry', 50)->nullable();
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('use_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'industry']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
