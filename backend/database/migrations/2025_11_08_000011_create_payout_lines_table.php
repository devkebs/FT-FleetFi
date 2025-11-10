<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePayoutLinesTable extends Migration
{
	public function up()
	{
		if (!Schema::hasTable('payout_lines')) {
			Schema::create('payout_lines', function (Blueprint $table) {
				$table->id();
				$table->unsignedBigInteger('payout_id')->nullable();
				$table->decimal('amount', 12, 2)->default(0);
				$table->timestamps();
			});
		}
	}

	public function down()
	{
		Schema::dropIfExists('payout_lines');
	}
}

