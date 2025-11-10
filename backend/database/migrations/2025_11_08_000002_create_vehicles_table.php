<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVehiclesTable extends Migration
{
	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		if (!Schema::hasTable('vehicles')) {
			Schema::create('vehicles', function (Blueprint $table) {
				$table->id();
				$table->string('name');
				$table->string('status')->default('active');
				$table->string('type');
				$table->string('plate_number')->unique();
				$table->string('make')->nullable();
				$table->string('model')->nullable();
				$table->string('year')->nullable();
				$table->timestamps();
			});
		}
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::dropIfExists('vehicles');
	}
}

