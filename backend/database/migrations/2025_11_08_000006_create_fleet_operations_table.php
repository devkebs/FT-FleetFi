<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFleetOperationsTable extends Migration
{
	public function up()
	{
		if (!Schema::hasTable('fleet_operations')) {
			Schema::create('fleet_operations', function (Blueprint $table) {
				$table->id();
				$table->unsignedBigInteger('vehicle_id')->nullable();
				$table->string('operation_type')->nullable();
				$table->timestamps();
			});
		}
	}

	public function down()
	{
		Schema::dropIfExists('fleet_operations');
	}
}

