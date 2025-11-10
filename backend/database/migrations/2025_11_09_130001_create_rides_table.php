<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('rides')) {
            Schema::create('rides', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('vehicle_id')->nullable();
                $table->decimal('distance_km', 8, 2)->default(0); // Distance covered in the ride
                $table->integer('battery_start')->nullable(); // Battery % at start
                $table->integer('battery_end')->nullable();   // Battery % at end
                $table->integer('swaps_before')->nullable();  // Swap count before ride
                $table->integer('swaps_after')->nullable();   // Swap count after ride
                $table->decimal('revenue_amount', 12, 2)->default(0); // Gross revenue for the ride
                $table->timestamp('started_at')->nullable();
                $table->timestamp('ended_at')->nullable();
                $table->timestamps();

                $table->index('vehicle_id');
                $table->index('started_at');
                $table->index('ended_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rides');
    }
};
