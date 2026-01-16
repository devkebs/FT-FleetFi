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
        Schema::create('event_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->string('group_type'); // role-based: admin, operator, driver, investor, or custom group
            $table->string('group_identifier'); // role name or custom group ID
            $table->string('permission')->default('view'); // view, edit, admin
            $table->timestamps();

            $table->index('event_id');
            $table->index(['group_type', 'group_identifier']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_groups');
    }
};
