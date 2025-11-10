<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('revenues')) {
            Schema::table('revenues', function (Blueprint $table) {
                if (!Schema::hasColumn('revenues', 'ride_id')) {
                    $table->unsignedBigInteger('ride_id')->nullable()->after('vehicle_id');
                }
                if (!Schema::hasColumn('revenues', 'source')) {
                    $table->string('source')->nullable()->after('ride_id'); // 'ride', 'manual', etc.
                }
                if (!Schema::hasColumn('revenues', 'investor_roi_amount')) {
                    $table->decimal('investor_roi_amount', 12, 2)->default(0)->after('amount');
                }
                if (!Schema::hasColumn('revenues', 'rider_wage_amount')) {
                    $table->decimal('rider_wage_amount', 12, 2)->default(0)->after('investor_roi_amount');
                }
                if (!Schema::hasColumn('revenues', 'management_reserve_amount')) {
                    $table->decimal('management_reserve_amount', 12, 2)->default(0)->after('rider_wage_amount');
                }
                if (!Schema::hasColumn('revenues', 'maintenance_reserve_amount')) {
                    $table->decimal('maintenance_reserve_amount', 12, 2)->default(0)->after('management_reserve_amount');
                }
                $table->index('ride_id');
                $table->index('source');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('revenues')) {
            Schema::table('revenues', function (Blueprint $table) {
                // Safe drops guarded by existence checks
                foreach ([
                    'ride_id', 'source', 'investor_roi_amount', 'rider_wage_amount',
                    'management_reserve_amount', 'maintenance_reserve_amount'
                ] as $col) {
                    if (Schema::hasColumn('revenues', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
