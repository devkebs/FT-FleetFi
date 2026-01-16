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
        Schema::create('driver_earnings', function (Blueprint $table) {
            $table->id();
            $table->string('earning_id')->unique();
            $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
            $table->foreignId('trip_id')->nullable()->constrained('trips')->onDelete('set null');
            $table->foreignId('swap_task_id')->nullable();

            // Earning type: trip, swap, bonus, penalty, adjustment
            $table->string('source_type');
            $table->string('description')->nullable();

            // Amounts
            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->decimal('commission', 12, 2)->default(0); // Platform fee
            $table->decimal('deductions', 12, 2)->default(0); // Other deductions
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->string('currency')->default('NGN');

            // Timing
            $table->timestamp('earned_at');
            $table->timestamp('paid_at')->nullable();

            // Status: pending, processed, paid, failed
            $table->string('payment_status')->default('pending');

            // Reference to payout if paid
            $table->foreignId('payout_id')->nullable();

            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['driver_id', 'payment_status']);
            $table->index(['driver_id', 'earned_at']);
            $table->index('payment_status');
            $table->index('source_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_earnings');
    }
};
