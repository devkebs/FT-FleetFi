<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('asset_id');
            $table->enum('type', ['swap','charge']);
            $table->timestamp('scheduled_at');
            $table->enum('status', ['pending','completed','cancelled'])->default('pending');
            $table->unsignedBigInteger('rider_id')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
