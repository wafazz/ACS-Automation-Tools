<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_pack_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_pack_id')->constrained()->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('body');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['template_pack_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_pack_items');
    }
};
