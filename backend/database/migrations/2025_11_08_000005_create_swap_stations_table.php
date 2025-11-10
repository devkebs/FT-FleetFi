<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSwapStationsTable extends Migration
{
	public function up()
	{
		if (!Schema::hasTable('swap_stations')) {
			Schema::create('swap_stations', function (Blueprint $table) {
				$table->id();
				$table->string('name')->nullable();
				$table->string('location')->nullable();
				$table->timestamps();
			});
		}
	}

	public function down()
	{
		Schema::dropIfExists('swap_stations');
	}
}

