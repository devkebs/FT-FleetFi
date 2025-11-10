<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTrovotechFieldsToTokensTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('tokens', function (Blueprint $table) {
            // TrovoTech blockchain integration fields
            if (!Schema::hasColumn('tokens', 'fraction_owned')) {
                $table->decimal('fraction_owned', 5, 2)->default(0)->after('shares')->comment('Percentage ownership 0-100');
            }
            if (!Schema::hasColumn('tokens', 'metadata_hash')) {
                $table->string('metadata_hash')->nullable()->after('fraction_owned')->comment('IPFS/blockchain metadata hash');
            }
            if (!Schema::hasColumn('tokens', 'trustee_ref')) {
                $table->string('trustee_ref')->nullable()->after('metadata_hash')->comment('Custodian reference ID');
            }
            if (!Schema::hasColumn('tokens', 'tx_hash')) {
                $table->string('tx_hash')->nullable()->after('trustee_ref')->comment('Blockchain transaction hash');
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
        Schema::table('tokens', function (Blueprint $table) {
            $columns = ['fraction_owned', 'metadata_hash', 'trustee_ref', 'tx_hash'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('tokens', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
