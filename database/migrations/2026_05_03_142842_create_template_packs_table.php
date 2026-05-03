<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_packs', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 60)->unique();
            $table->string('name', 100);
            $table->string('industry', 50)->nullable();
            $table->unsignedInteger('price_cents');
            $table->text('description')->nullable();
            $table->string('icon', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('purchase_count')->default(0);
            $table->timestamps();

            $table->index('industry');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_packs');
    }
};
