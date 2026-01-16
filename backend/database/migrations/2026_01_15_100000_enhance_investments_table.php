<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('investments', function (Blueprint $table) {
            // Add asset relationship
            if (!Schema::hasColumn('investments', 'asset_id')) {
                $table->unsignedBigInteger('asset_id')->nullable()->after('user_id');
            }

            // Add ownership percentage
            if (!Schema::hasColumn('investments', 'ownership_percentage')) {
                $table->decimal('ownership_percentage', 5, 2)->default(0)->after('amount');
            }

            // Add token reference
            if (!Schema::hasColumn('investments', 'token_id')) {
                $table->string('token_id')->nullable()->after('ownership_percentage');
            }

            // Add transaction hash
            if (!Schema::hasColumn('investments', 'tx_hash')) {
                $table->string('tx_hash')->nullable()->after('token_id');
            }

            // Add purchase price at time of investment
            if (!Schema::hasColumn('investments', 'purchase_price')) {
                $table->decimal('purchase_price', 12, 2)->default(0)->after('amount');
            }

            // Add current value for tracking gains/losses
            if (!Schema::hasColumn('investments', 'current_value')) {
                $table->decimal('current_value', 12, 2)->default(0)->after('purchase_price');
            }

            // Add total earnings from this investment
            if (!Schema::hasColumn('investments', 'total_earnings')) {
                $table->decimal('total_earnings', 12, 2)->default(0)->after('current_value');
            }

            // Add last payout date
            if (!Schema::hasColumn('investments', 'last_payout_at')) {
                $table->timestamp('last_payout_at')->nullable()->after('total_earnings');
            }

            // Update status to be more descriptive
            // Status: pending, active, sold, cancelled
        });

        // Add ownership tracking to assets table
        Schema::table('assets', function (Blueprint $table) {
            if (!Schema::hasColumn('assets', 'total_ownership_sold')) {
                $table->decimal('total_ownership_sold', 5, 2)->default(0)->after('is_tokenized');
            }

            if (!Schema::hasColumn('assets', 'min_investment')) {
                $table->decimal('min_investment', 12, 2)->default(10000)->after('total_ownership_sold');
            }

            if (!Schema::hasColumn('assets', 'expected_roi')) {
                $table->decimal('expected_roi', 5, 2)->default(25)->after('min_investment');
            }

            if (!Schema::hasColumn('assets', 'risk_level')) {
                $table->string('risk_level')->default('medium')->after('expected_roi');
            }
        });
    }

    public function down()
    {
        Schema::table('investments', function (Blueprint $table) {
            $columns = ['asset_id', 'ownership_percentage', 'token_id', 'tx_hash',
                       'purchase_price', 'current_value', 'total_earnings', 'last_payout_at'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('investments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('assets', function (Blueprint $table) {
            $columns = ['total_ownership_sold', 'min_investment', 'expected_roi', 'risk_level'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('assets', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
