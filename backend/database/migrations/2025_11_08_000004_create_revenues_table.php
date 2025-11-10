<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRevenuesTable extends Migration
{
	public function up()
	{
		if (!Schema::hasTable('revenues')) {
			Schema::create('revenues', function (Blueprint $table) {
				$table->id();
				$table->unsignedBigInteger('vehicle_id')->nullable();
				$table->decimal('amount', 12, 2)->default(0);
				$table->timestamps();
			});
		}
	}

	public function down()
	{
		Schema::dropIfExists('revenues');
	}
}

