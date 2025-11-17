<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds Trovotech-specific fields to wallets table
     * to support the official Trovotech API integration
     *
     * @return void
     */
    public function up()
    {
        Schema::table('wallets', function (Blueprint $table) {
            // Trovotech username (from user onboarding response)
            $table->string('trovotech_username')->nullable()->after('wallet_address');

            // Primary signer public key (for transaction signing)
            $table->string('primary_signer', 56)->nullable()->after('trovotech_username');

            // Wallet type: 'trovotech', 'local', 'external'
            $table->string('wallet_type')->default('local')->after('primary_signer');

            // Trustee reference (from Trovotech custody setup)
            $table->string('trustee_ref')->nullable()->after('trovotech_wallet_id');

            // Add index for faster lookups
            $table->index('trovotech_username');
            $table->index('wallet_type');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropIndex(['trovotech_username']);
            $table->dropIndex(['wallet_type']);
            $table->dropColumn([
                'trovotech_username',
                'primary_signer',
                'wallet_type',
                'trustee_ref',
            ]);
        });
    }
};
