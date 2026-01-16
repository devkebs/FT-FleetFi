<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->decimal('estimated_cost', 10, 2)->nullable()->after('description');
            $table->decimal('actual_cost', 10, 2)->nullable()->after('estimated_cost');
            $table->text('operator_notes')->nullable()->after('description');
            $table->text('completion_notes')->nullable()->after('operator_notes');
            $table->foreignId('reviewed_by')->nullable()->after('driver_id')->constrained('users');
            $table->timestamp('reviewed_at')->nullable()->after('reported_at');
            $table->timestamp('completed_at')->nullable()->after('reviewed_at');
            
            // Update status enum to include 'rejected' and 'completed'
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending')->change();
            
            $table->index('status');
            $table->index('reviewed_at');
            $table->index('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn([
                'estimated_cost',
                'actual_cost',
                'operator_notes',
                'completion_notes',
                'reviewed_by',
                'reviewed_at',
                'completed_at'
            ]);
            
            // Revert status enum
            $table->enum('status', ['pending', 'approved'])->default('pending')->change();
        });
    }
};
