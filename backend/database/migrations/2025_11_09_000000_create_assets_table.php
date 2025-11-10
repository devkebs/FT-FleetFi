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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_id')->unique();
            $table->string('type'); // 'vehicle', 'battery', 'charging_cabinet'
            $table->string('model')->nullable();
            $table->string('status')->default('active'); // 'active', 'maintenance', 'retired'
            $table->integer('soh')->default(100); // State of Health (0-100)
            $table->integer('swaps')->default(0); // Total battery swaps
            $table->string('location')->nullable();
            $table->decimal('original_value', 12, 2)->default(0);
            $table->decimal('current_value', 12, 2)->default(0);
            $table->integer('daily_swaps')->default(0);
            $table->boolean('is_tokenized')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('assets');
    }
};
