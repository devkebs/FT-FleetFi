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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'kyc_provider')) {
                $table->string('kyc_provider')->nullable()->after('kyc_verified_by');
            }
            if (!Schema::hasColumn('users', 'kyc_provider_ref')) {
                $table->string('kyc_provider_ref')->nullable()->after('kyc_provider');
            }
            if (!Schema::hasColumn('users', 'kyc_provider_status')) {
                $table->string('kyc_provider_status')->nullable()->after('kyc_provider_ref');
            }
            if (!Schema::hasColumn('users', 'kyc_last_checked_at')) {
                $table->timestamp('kyc_last_checked_at')->nullable()->after('kyc_provider_status');
            }
            if (!Schema::hasColumn('users', 'kyc_failure_reason')) {
                $table->text('kyc_failure_reason')->nullable()->after('kyc_last_checked_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'kyc_provider')) {
                $table->dropColumn('kyc_provider');
            }
            if (Schema::hasColumn('users', 'kyc_provider_ref')) {
                $table->dropColumn('kyc_provider_ref');
            }
            if (Schema::hasColumn('users', 'kyc_provider_status')) {
                $table->dropColumn('kyc_provider_status');
            }
            if (Schema::hasColumn('users', 'kyc_last_checked_at')) {
                $table->dropColumn('kyc_last_checked_at');
            }
            if (Schema::hasColumn('users', 'kyc_failure_reason')) {
                $table->dropColumn('kyc_failure_reason');
            }
        });
    }
};
