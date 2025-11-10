<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('telemetries', function (Blueprint $table) {
            $table->id();
            $table->string('asset_id'); // References asset_id from assets table
            $table->integer('battery_level')->nullable(); // Battery percentage (0-100)
            $table->decimal('km', 10, 2)->default(0); // Kilometers traveled
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('speed')->nullable(); // km/h
            $table->string('status')->nullable(); // 'idle', 'in_transit', 'charging', 'swapping'
            $table->decimal('temperature', 5, 2)->nullable(); // Battery temperature in Celsius
            $table->decimal('voltage', 6, 2)->nullable(); // Battery voltage
            $table->decimal('current', 6, 2)->nullable(); // Current draw/charge in Amps
            $table->string('oem_source', 50)->nullable(); // Source OEM: 'qoura', 'manufacturer_x', etc.
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index('asset_id');
            $table->index('recorded_at');
            $table->index('oem_source');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('telemetries');
    }
};
