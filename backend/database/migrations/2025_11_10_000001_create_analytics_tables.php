<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // User sessions tracking
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_id')->unique();
            $table->string('device_type')->nullable(); // mobile, desktop, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->string('country')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->integer('page_views')->default(0);
            $table->integer('interactions')->default(0);
            $table->timestamps();
            
            $table->index(['user_id', 'started_at']);
            $table->index('session_id');
        });

        // User events/actions tracking
        Schema::create('user_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_id')->nullable();
            $table->string('event_type'); // page_view, click, form_submit, investment, etc.
            $table->string('event_category')->nullable(); // navigation, transaction, engagement
            $table->string('event_name'); // invest_clicked, asset_viewed, kyc_started
            $table->json('event_data')->nullable(); // additional context
            $table->string('page_url')->nullable();
            $table->string('referrer')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
            
            $table->index(['user_id', 'event_type', 'occurred_at']);
            $table->index(['event_category', 'event_name']);
            $table->index('session_id');
        });

        // User feedback collection
        Schema::create('user_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_id')->nullable();
            $table->string('feedback_type'); // nps, satisfaction, feature_request, bug_report
            $table->string('trigger_point'); // after_investment, after_kyc, after_payout
            $table->integer('rating')->nullable(); // 1-10 for NPS, 1-5 for satisfaction
            $table->text('comment')->nullable();
            $table->json('metadata')->nullable(); // page, feature, context
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('submitted_at');
            $table->timestamps();
            
            $table->index(['user_id', 'feedback_type']);
            $table->index(['feedback_type', 'trigger_point']);
            $table->index('submitted_at');
        });

        // User sentiment tracking
        Schema::create('user_sentiment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('session_id')->nullable();
            $table->string('sentiment_type'); // positive, neutral, negative, frustrated
            $table->string('context'); // login, investment, kyc, navigation
            $table->text('reason')->nullable();
            $table->json('indicators')->nullable(); // rage_clicks, time_on_page, scroll_depth
            $table->timestamp('detected_at');
            $table->timestamps();
            
            $table->index(['user_id', 'sentiment_type', 'detected_at']);
            $table->index('context');
        });

        // User journey milestones
        Schema::create('user_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('milestone_type'); // first_login, first_investment, kyc_completed
            $table->json('milestone_data')->nullable();
            $table->timestamp('achieved_at');
            $table->timestamps();
            
            $table->unique(['user_id', 'milestone_type']);
            $table->index('milestone_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_milestones');
        Schema::dropIfExists('user_sentiment');
        Schema::dropIfExists('user_feedback');
        Schema::dropIfExists('user_events');
        Schema::dropIfExists('user_sessions');
    }
};
