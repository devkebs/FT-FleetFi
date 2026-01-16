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
        Schema::table('swap_stations', function (Blueprint $table) {
            $table->string('address')->nullable()->after('location');
            $table->integer('available_batteries')->default(0)->after('address');
            $table->integer('total_capacity')->default(20)->after('available_batteries');
            $table->string('operating_hours')->default('24/7')->after('total_capacity');
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active')->after('operating_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('swap_stations', function (Blueprint $table) {
            $table->dropColumn([
                'address',
                'available_batteries',
                'total_capacity',
                'operating_hours',
                'status'
            ]);
        });
    }
};
