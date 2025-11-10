<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvestmentsTable extends Migration
{
	public function up()
	{
		if (!Schema::hasTable('investments')) {
			Schema::create('investments', function (Blueprint $table) {
				$table->id();
				$table->unsignedBigInteger('user_id')->nullable();
				$table->decimal('amount', 12, 2)->default(0);
				$table->string('status')->nullable();
				$table->timestamps();
			});
		}
	}

	public function down()
	{
		Schema::dropIfExists('investments');
	}
}

