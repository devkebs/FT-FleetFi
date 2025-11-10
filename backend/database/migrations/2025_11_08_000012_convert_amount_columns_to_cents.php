<?php

use Illuminate\Database\Migrations\Migration;

class ConvertAmountColumnsToCents extends Migration
{
	public function up()
	{
		// Intentionally left empty for SQLite local environment.
		// The production migration may require doctrine/dbal to alter columns.
	}

	public function down()
	{
		// No-op
	}
}

