<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_capabilities', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['investor', 'operator', 'driver', 'admin']);
            $table->string('capability');
            $table->text('description')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['role', 'capability']);
            $table->index('role');
        });

        // Seed default capabilities
        DB::table('role_capabilities')->insert([
            // Admin capabilities
            ['role' => 'admin', 'capability' => 'manage_users', 'description' => 'Create, update, and delete users', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'admin', 'capability' => 'manage_assets', 'description' => 'Full control over all assets', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'admin', 'capability' => 'view_analytics', 'description' => 'Access analytics and reports', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'admin', 'capability' => 'manage_settings', 'description' => 'Configure system settings', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'admin', 'capability' => 'review_kyc', 'description' => 'Review and approve KYC submissions', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'admin', 'capability' => 'manage_revenue', 'description' => 'View and manage revenue distribution', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],

            // Operator capabilities
            ['role' => 'operator', 'capability' => 'manage_fleet', 'description' => 'Manage fleet vehicles and batteries', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'operator', 'capability' => 'assign_riders', 'description' => 'Assign riders to assets', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'operator', 'capability' => 'schedule_operations', 'description' => 'Schedule swaps and charging', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'operator', 'capability' => 'view_revenue', 'description' => 'View operator revenue share', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'operator', 'capability' => 'export_reports', 'description' => 'Export operational reports', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],

            // Investor capabilities
            ['role' => 'investor', 'capability' => 'invest_in_assets', 'description' => 'Purchase fractional ownership', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'investor', 'capability' => 'view_portfolio', 'description' => 'View investment portfolio', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'investor', 'capability' => 'receive_payouts', 'description' => 'Receive revenue payouts', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'investor', 'capability' => 'trade_tokens', 'description' => 'Trade tokens on SLX marketplace', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'investor', 'capability' => 'view_esg_impact', 'description' => 'View ESG impact metrics', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],

            // Driver capabilities
            ['role' => 'driver', 'capability' => 'view_assigned_assets', 'description' => 'View assigned vehicles', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'driver', 'capability' => 'request_battery_swap', 'description' => 'Request battery swap', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'driver', 'capability' => 'view_earnings', 'description' => 'View driver earnings', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
            ['role' => 'driver', 'capability' => 'update_availability', 'description' => 'Update driver availability status', 'is_enabled' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('role_capabilities');
    }
};
