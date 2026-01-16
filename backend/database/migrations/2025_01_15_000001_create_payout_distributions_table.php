<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payout_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained()->onDelete('cascade');
            $table->decimal('total_amount', 15, 2);
            $table->date('period_start');
            $table->date('period_end');
            $table->foreignId('distributed_by')->constrained('users');
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['asset_id', 'created_at']);
            $table->index('status');
        });

        // Add columns to existing payouts table
        Schema::table('payouts', function (Blueprint $table) {
            $table->foreignId('distribution_id')->nullable()->after('investor_id')->constrained('payout_distributions')->onDelete('cascade');
            $table->date('period_start')->after('amount');
            $table->date('period_end')->after('period_start');
            $table->string('blockchain_hash', 100)->nullable()->after('status');
            $table->timestamp('processed_at')->nullable()->after('blockchain_hash');
            $table->text('failure_reason')->nullable()->after('processed_at');
        });
    }

    public function down(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropForeign(['distribution_id']);
            $table->dropColumn([
                'distribution_id',
                'period_start',
                'period_end',
                'blockchain_hash',
                'processed_at',
                'failure_reason'
            ]);
        });

        Schema::dropIfExists('payout_distributions');
    }
};
