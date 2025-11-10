<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('swap_events')) {
            Schema::create('swap_events', function (Blueprint $table) {
                $table->id();
                $table->string('asset_id'); // battery or vehicle asset identifier
                $table->unsignedBigInteger('swap_station_id')->nullable();
                $table->integer('previous_battery_level')->nullable();
                $table->integer('new_battery_level')->nullable();
                $table->timestamp('occurred_at');
                $table->timestamps();

                $table->index('asset_id');
                $table->index('swap_station_id');
                $table->index('occurred_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('swap_events');
    }
};
