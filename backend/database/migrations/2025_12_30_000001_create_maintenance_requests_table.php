<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('maintenance_requests')) {
            Schema::create('maintenance_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('asset_id');
                $table->unsignedBigInteger('reported_by'); // user_id
                $table->unsignedBigInteger('rider_id')->nullable();
                $table->enum('issue_type', ['mechanical', 'electrical', 'battery', 'body', 'other']);
                $table->enum('severity', ['low', 'medium', 'high', 'critical']);
                $table->text('description');
                $table->string('photo_url')->nullable();
                $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->timestamp('reported_at');
                $table->timestamp('resolved_at')->nullable();
                $table->text('resolution_notes')->nullable();
                $table->timestamps();
                
                $table->index('asset_id');
                $table->index('reported_by');
                $table->index('status');
                
                $table->foreign('asset_id')->references('id')->on('assets')->onDelete('cascade');
                $table->foreign('reported_by')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('rider_id')->references('id')->on('riders')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_requests');
    }
};
