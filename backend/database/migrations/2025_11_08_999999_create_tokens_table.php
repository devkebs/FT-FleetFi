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
        Schema::create('tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('token_id')->unique(); // Blockchain token ID
            $table->decimal('shares', 10, 4)->default(0); // Percentage ownership (0-100)
            $table->decimal('investment_amount', 12, 2)->default(0);
            $table->decimal('current_value', 12, 2)->default(0);
            $table->decimal('total_returns', 12, 2)->default(0);
            $table->string('status')->default('active'); // 'active', 'sold', 'liquidated'
            $table->timestamp('purchase_date')->nullable();
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
        Schema::dropIfExists('tokens');
    }
};
