<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('wallets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'token_purchase', 'payout_received']);
            $table->decimal('amount', 16, 2);
            $table->string('currency', 10)->default('NGN');
            $table->string('status')->default('pending'); // pending, completed, failed
            $table->string('tx_hash')->nullable();
            $table->string('from_address')->nullable();
            $table->string('to_address')->nullable();
            $table->foreignId('related_token_id')->nullable()->constrained('tokens')->onDelete('set null');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['wallet_id', 'created_at']);
            $table->index('tx_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
