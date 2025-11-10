<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tokens', function (Blueprint $table) {
            if (!Schema::hasColumn('tokens', 'chain')) {
                $table->string('chain')->nullable()->after('tx_hash')->comment('Blockchain / network name e.g. polygon');
            }
            if (!Schema::hasColumn('tokens', 'minted_at')) {
                $table->timestamp('minted_at')->nullable()->after('purchase_date')->comment('Timestamp the token was minted on-chain');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tokens', function (Blueprint $table) {
            foreach (['chain','minted_at'] as $col) {
                if (Schema::hasColumn('tokens', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
