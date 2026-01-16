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
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->string('trip_id')->unique();
            $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
            $table->foreignId('vehicle_id')->nullable()->constrained('assets')->onDelete('set null');

            // Start location
            $table->decimal('start_latitude', 10, 7)->nullable();
            $table->decimal('start_longitude', 10, 7)->nullable();
            $table->string('start_address')->nullable();

            // End location
            $table->decimal('end_latitude', 10, 7)->nullable();
            $table->decimal('end_longitude', 10, 7)->nullable();
            $table->string('end_address')->nullable();

            // Trip metrics
            $table->decimal('distance_km', 10, 2)->default(0);
            $table->integer('duration_minutes')->default(0);
            $table->integer('battery_start')->nullable(); // SOC percentage
            $table->integer('battery_end')->nullable();

            // Timestamps
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();

            // Status: pending, active, completed, cancelled
            $table->string('status')->default('pending');

            // Earnings
            $table->decimal('base_fare', 12, 2)->default(0);
            $table->decimal('distance_fare', 12, 2)->default(0);
            $table->decimal('bonus', 12, 2)->default(0);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->decimal('total_earnings', 12, 2)->default(0);

            // Additional info
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['driver_id', 'status']);
            $table->index(['driver_id', 'started_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
