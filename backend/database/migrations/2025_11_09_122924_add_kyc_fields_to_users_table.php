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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'kyc_status')) {
                $table->enum('kyc_status', ['pending', 'submitted', 'verified', 'rejected'])->default('pending')->after('role');
            }
            if (!Schema::hasColumn('users', 'kyc_submitted_at')) {
                $table->timestamp('kyc_submitted_at')->nullable()->after('kyc_status');
            }
            if (!Schema::hasColumn('users', 'kyc_verified_at')) {
                $table->timestamp('kyc_verified_at')->nullable()->after('kyc_submitted_at');
            }
            if (!Schema::hasColumn('users', 'kyc_document_type')) {
                $table->string('kyc_document_type')->nullable()->after('kyc_verified_at')->comment('ID type: passport, drivers_license, national_id');
            }
            if (!Schema::hasColumn('users', 'kyc_document_number')) {
                $table->string('kyc_document_number')->nullable()->after('kyc_document_type');
            }
            if (!Schema::hasColumn('users', 'kyc_verified_by')) {
                $table->unsignedBigInteger('kyc_verified_by')->nullable()->after('kyc_document_number')->comment('Operator/Admin user ID who verified');
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
            if (Schema::hasColumn('users', 'kyc_status')) {
                $table->dropColumn('kyc_status');
            }
            if (Schema::hasColumn('users', 'kyc_submitted_at')) {
                $table->dropColumn('kyc_submitted_at');
            }
            if (Schema::hasColumn('users', 'kyc_verified_at')) {
                $table->dropColumn('kyc_verified_at');
            }
            if (Schema::hasColumn('users', 'kyc_document_type')) {
                $table->dropColumn('kyc_document_type');
            }
            if (Schema::hasColumn('users', 'kyc_document_number')) {
                $table->dropColumn('kyc_document_number');
            }
            if (Schema::hasColumn('users', 'kyc_verified_by')) {
                $table->dropColumn('kyc_verified_by');
            }
        });
    }
};
