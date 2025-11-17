<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds Trovotech KYC level tracking to users table
     * Supports KYC levels 1-4 as per Trovotech API documentation
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // KYC level (1-4) per Trovotech specification
            if (!Schema::hasColumn('users', 'kyc_level')) {
                $table->tinyInteger('kyc_level')->default(0)->after('kyc_status')
                    ->comment('Trovotech KYC level: 0=none, 1=basic, 2=address, 3=liveness, 4=EDD');
            }

            // Store raw KYC data from provider
            if (!Schema::hasColumn('users', 'kyc_data_json')) {
                $table->text('kyc_data_json')->nullable()->after('kyc_level')
                    ->comment('Raw KYC JSON data from provider');
            }

            // Whether user is onboarded to Trovotech
            if (!Schema::hasColumn('users', 'trovotech_onboarded')) {
                $table->boolean('trovotech_onboarded')->default(false)->after('kyc_data_json');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'kyc_level')) {
                $table->dropColumn('kyc_level');
            }
            if (Schema::hasColumn('users', 'kyc_data_json')) {
                $table->dropColumn('kyc_data_json');
            }
            if (Schema::hasColumn('users', 'trovotech_onboarded')) {
                $table->dropColumn('trovotech_onboarded');
            }
        });
    }
};
