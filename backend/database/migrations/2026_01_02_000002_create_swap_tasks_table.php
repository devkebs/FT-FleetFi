<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('swap_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_number')->unique();
            $table->foreignId('driver_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('vehicle_id')->nullable()->constrained('assets')->onDelete('set null');
            $table->foreignId('asset_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('swap_station_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('old_battery_id')->nullable();
            $table->unsignedBigInteger('new_battery_id')->nullable();
            $table->enum('status', [
                'pending',
                'assigned',
                'enroute_to_station',
                'arrived_at_station',
                'swapping',
                'swap_complete',
                'back_to_base',
                'completed',
                'canceled'
            ])->default('pending');
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->tinyInteger('battery_level_before')->nullable();
            $table->tinyInteger('battery_level_after')->nullable();
            $table->tinyInteger('soh_before')->nullable(); // State of Health
            $table->tinyInteger('soh_after')->nullable();  // State of Health
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('driver_id');
            $table->index('vehicle_id');
            $table->index('swap_station_id');
            $table->index('status');
            $table->index('started_at');
            $table->index('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('swap_tasks');
    }
};
