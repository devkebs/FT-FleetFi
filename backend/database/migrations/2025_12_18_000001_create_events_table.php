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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->string('event_type')->default('general'); // general, meeting, maintenance, training, etc.
            $table->string('location')->nullable();
            $table->string('status')->default('scheduled'); // scheduled, ongoing, completed, cancelled
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->boolean('is_all_day')->default(false);
            $table->string('recurrence_pattern')->nullable(); // none, daily, weekly, monthly
            $table->dateTime('recurrence_end_date')->nullable();
            $table->json('metadata')->nullable(); // Additional flexible data
            $table->timestamps();
            $table->softDeletes();

            $table->index(['start_date', 'end_date']);
            $table->index('event_type');
            $table->index('status');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
