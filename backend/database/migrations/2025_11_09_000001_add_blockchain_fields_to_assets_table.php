<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBlockchainFieldsToAssetsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('assets', function (Blueprint $table) {
            // TrovoTech blockchain integration fields
            if (!Schema::hasColumn('assets', 'token_id')) {
                $table->string('token_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('assets', 'metadata_hash')) {
                $table->string('metadata_hash')->nullable()->after('token_id');
            }
            if (!Schema::hasColumn('assets', 'trustee_ref')) {
                $table->string('trustee_ref')->nullable()->after('metadata_hash');
            }
            if (!Schema::hasColumn('assets', 'telemetry_uri')) {
                $table->string('telemetry_uri')->nullable()->after('trustee_ref');
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
        Schema::table('assets', function (Blueprint $table) {
            $columns = ['token_id', 'metadata_hash', 'trustee_ref', 'telemetry_uri'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('assets', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
