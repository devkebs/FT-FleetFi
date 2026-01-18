<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['bank_account', 'card', 'mobile_money'])->default('bank_account');
            $table->string('bank_code')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('recipient_code')->nullable(); // Paystack transfer recipient code
            $table->string('card_last_four')->nullable();
            $table->string('card_type')->nullable(); // visa, mastercard, verve
            $table->string('card_exp_month')->nullable();
            $table->string('card_exp_year')->nullable();
            $table->string('authorization_code')->nullable(); // For recurring charges
            $table->string('mobile_number')->nullable();
            $table->string('mobile_provider')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'is_default']);
        });

        // Payment history for detailed tracking
        Schema::create('payment_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('wallet_transaction_id')->nullable()->constrained('wallet_transactions')->onDelete('set null');
            $table->string('reference')->unique();
            $table->enum('gateway', ['paystack', 'flutterwave', 'bank_transfer', 'manual']);
            $table->enum('type', ['funding', 'withdrawal', 'investment', 'refund', 'payout']);
            $table->decimal('amount', 15, 2);
            $table->decimal('fee', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2);
            $table->string('currency', 3)->default('NGN');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])->default('pending');
            $table->string('failure_reason')->nullable();
            $table->string('gateway_reference')->nullable();
            $table->string('authorization_url')->nullable();
            $table->json('gateway_response')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['gateway', 'reference']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_records');
        Schema::dropIfExists('payment_methods');
    }
};
