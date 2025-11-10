<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // SQLite doesn't support ALTER COLUMN, so we need to work around
        // For SQLite, we'll just allow any string value and validate in the app
        // MySQL would use: ALTER TABLE users MODIFY COLUMN role ENUM(...)

        // No schema change needed - validation happens at app level
        // The role column already exists as nullable string
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // No-op since we didn't change schema
    }
};
