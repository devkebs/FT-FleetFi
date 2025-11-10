<?php

namespace App\Http\Controllers;

use App\Models\UserSession;
use App\Models\UserEvent;
use App\Models\UserFeedback;
use App\Models\UserSentiment;
use App\Models\UserMilestone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Track a new user session
     */
    public function trackSession(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string',
            'device_type' => 'nullable|string',
            'browser' => 'nullable|string',
            'os' => 'nullable|string',
        ]);

        $session = UserSession::updateOrCreate(
            ['session_id' => $validated['session_id']],
            [
                'user_id' => auth()->id(),
                'device_type' => $validated['device_type'] ?? null,
                'browser' => $validated['browser'] ?? null,
                'os' => $validated['os'] ?? null,
                'ip_address' => $request->ip(),
                'started_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'session_id' => $session->session_id,
        ]);
    }

    /**
     * End a user session
     */
    public function endSession(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string',
            'page_views' => 'nullable|integer',
            'interactions' => 'nullable|integer',
        ]);

        $session = UserSession::where('session_id', $validated['session_id'])->first();
        
        if ($session) {
            $session->update([
                'ended_at' => now(),
                'duration_seconds' => now()->diffInSeconds($session->started_at),
                'page_views' => $validated['page_views'] ?? $session->page_views,
                'interactions' => $validated['interactions'] ?? $session->interactions,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Track a user event
     */
    public function trackEvent(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'nullable|string',
            'event_type' => 'required|string',
            'event_category' => 'nullable|string',
            'event_name' => 'required|string',
            'event_data' => 'nullable|array',
            'page_url' => 'nullable|string',
            'referrer' => 'nullable|string',
        ]);

        $event = UserEvent::create([
            'user_id' => auth()->id(),
            'session_id' => $validated['session_id'] ?? null,
            'event_type' => $validated['event_type'],
            'event_category' => $validated['event_category'] ?? null,
            'event_name' => $validated['event_name'],
            'event_data' => $validated['event_data'] ?? null,
            'page_url' => $validated['page_url'] ?? null,
            'referrer' => $validated['referrer'] ?? null,
            'occurred_at' => now(),
        ]);

        // Check for milestone achievements
        $this->checkMilestones($validated['event_name'], $validated['event_data'] ?? []);

        return response()->json([
            'success' => true,
            'event_id' => $event->id,
        ]);
    }

    /**
     * Submit user feedback
     */
    public function submitFeedback(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'nullable|string',
            'feedback_type' => 'required|string|in:nps,satisfaction,feature_request,bug_report',
            'trigger_point' => 'required|string',
            'rating' => 'nullable|integer|min:1|max:10',
            'comment' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $feedback = UserFeedback::create([
            'user_id' => auth()->id(),
            'session_id' => $validated['session_id'] ?? null,
            'feedback_type' => $validated['feedback_type'],
            'trigger_point' => $validated['trigger_point'],
            'rating' => $validated['rating'] ?? null,
            'comment' => $validated['comment'] ?? null,
            'metadata' => $validated['metadata'] ?? null,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'feedback_id' => $feedback->id,
            'message' => 'Thank you for your feedback!',
        ]);
    }

    /**
     * Track user sentiment
     */
    public function trackSentiment(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'nullable|string',
            'sentiment_type' => 'required|string|in:positive,neutral,negative,frustrated',
            'context' => 'required|string',
            'reason' => 'nullable|string',
            'indicators' => 'nullable|array',
        ]);

        $sentiment = UserSentiment::create([
            'user_id' => auth()->id(),
            'session_id' => $validated['session_id'] ?? null,
            'sentiment_type' => $validated['sentiment_type'],
            'context' => $validated['context'],
            'reason' => $validated['reason'] ?? null,
            'indicators' => $validated['indicators'] ?? null,
            'detected_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'sentiment_id' => $sentiment->id,
        ]);
    }

    /**
     * Get analytics dashboard data (admin only)
     */
    public function getDashboard(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        $data = [
            // User engagement metrics
            'total_sessions' => UserSession::where('started_at', '>=', $startDate)->count(),
            'total_users' => UserSession::where('started_at', '>=', $startDate)
                ->distinct('user_id')->count('user_id'),
            'avg_session_duration' => UserSession::where('started_at', '>=', $startDate)
                ->avg('duration_seconds'),
            'total_page_views' => UserSession::where('started_at', '>=', $startDate)
                ->sum('page_views'),

            // Event statistics
            'top_events' => UserEvent::where('occurred_at', '>=', $startDate)
                ->select('event_name', DB::raw('count(*) as count'))
                ->groupBy('event_name')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),

            'events_by_category' => UserEvent::where('occurred_at', '>=', $startDate)
                ->select('event_category', DB::raw('count(*) as count'))
                ->groupBy('event_category')
                ->get(),

            // Feedback metrics
            'nps_score' => $this->calculateNPS($startDate),
            'avg_satisfaction' => UserFeedback::where('feedback_type', 'satisfaction')
                ->where('submitted_at', '>=', $startDate)
                ->avg('rating'),
            'total_feedback' => UserFeedback::where('submitted_at', '>=', $startDate)->count(),
            'feedback_by_type' => UserFeedback::where('submitted_at', '>=', $startDate)
                ->select('feedback_type', DB::raw('count(*) as count'))
                ->groupBy('feedback_type')
                ->get(),

            // Sentiment analysis
            'sentiment_distribution' => UserSentiment::where('detected_at', '>=', $startDate)
                ->select('sentiment_type', DB::raw('count(*) as count'))
                ->groupBy('sentiment_type')
                ->get(),

            // User journey milestones
            'milestones_achieved' => UserMilestone::where('achieved_at', '>=', $startDate)
                ->select('milestone_type', DB::raw('count(*) as count'))
                ->groupBy('milestone_type')
                ->get(),

            // Conversion funnel
            'conversion_funnel' => $this->getConversionFunnel($startDate),

            // User retention
            'daily_active_users' => $this->getDailyActiveUsers($days),
        ];

        return response()->json($data);
    }

    /**
     * Get user behavior insights (admin only)
     */
    public function getUserInsights(Request $request, $userId)
    {
        $user = \App\Models\User::findOrFail($userId);

        $insights = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ],
            'session_stats' => [
                'total_sessions' => UserSession::where('user_id', $userId)->count(),
                'avg_duration' => UserSession::where('user_id', $userId)->avg('duration_seconds'),
                'total_page_views' => UserSession::where('user_id', $userId)->sum('page_views'),
                'last_session' => UserSession::where('user_id', $userId)
                    ->latest('started_at')->first(),
            ],
            'event_history' => UserEvent::where('user_id', $userId)
                ->latest('occurred_at')
                ->limit(50)
                ->get(),
            'milestones' => UserMilestone::where('user_id', $userId)->get(),
            'feedback_summary' => [
                'total_feedback' => UserFeedback::where('user_id', $userId)->count(),
                'avg_rating' => UserFeedback::where('user_id', $userId)->avg('rating'),
                'recent_feedback' => UserFeedback::where('user_id', $userId)
                    ->latest('submitted_at')->limit(10)->get(),
            ],
            'sentiment_trends' => UserSentiment::where('user_id', $userId)
                ->select('sentiment_type', DB::raw('count(*) as count'))
                ->groupBy('sentiment_type')
                ->get(),
        ];

        return response()->json($insights);
    }

    /**
     * Helper: Calculate NPS score
     */
    private function calculateNPS($startDate)
    {
        $npsResponses = UserFeedback::where('feedback_type', 'nps')
            ->where('submitted_at', '>=', $startDate)
            ->whereNotNull('rating')
            ->pluck('rating');

        if ($npsResponses->isEmpty()) {
            return null;
        }

        $total = $npsResponses->count();
        $promoters = $npsResponses->filter(fn($r) => $r >= 9)->count();
        $detractors = $npsResponses->filter(fn($r) => $r <= 6)->count();

        $nps = (($promoters - $detractors) / $total) * 100;

        return round($nps, 2);
    }

    /**
     * Helper: Get conversion funnel data
     */
    private function getConversionFunnel($startDate)
    {
        return [
            'registered' => UserEvent::where('event_name', 'registration_completed')
                ->where('occurred_at', '>=', $startDate)->distinct('user_id')->count('user_id'),
            'kyc_started' => UserEvent::where('event_name', 'kyc_started')
                ->where('occurred_at', '>=', $startDate)->distinct('user_id')->count('user_id'),
            'kyc_completed' => UserEvent::where('event_name', 'kyc_completed')
                ->where('occurred_at', '>=', $startDate)->distinct('user_id')->count('user_id'),
            'first_investment' => UserEvent::where('event_name', 'investment_completed')
                ->where('occurred_at', '>=', $startDate)->distinct('user_id')->count('user_id'),
        ];
    }

    /**
     * Helper: Get daily active users
     */
    private function getDailyActiveUsers($days)
    {
        $data = [];
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::now()->subDays($i)->toDateString();
            $count = UserSession::whereDate('started_at', $date)
                ->distinct('user_id')->count('user_id');
            $data[] = ['date' => $date, 'users' => $count];
        }
        return array_reverse($data);
    }

    /**
     * Helper: Check and record milestone achievements
     */
    private function checkMilestones($eventName, $eventData)
    {
        $milestoneMap = [
            'registration_completed' => 'first_login',
            'investment_completed' => 'first_investment',
            'kyc_completed' => 'kyc_verified',
            'payout_received' => 'first_payout',
        ];

        if (isset($milestoneMap[$eventName])) {
            UserMilestone::firstOrCreate(
                [
                    'user_id' => auth()->id(),
                    'milestone_type' => $milestoneMap[$eventName],
                ],
                [
                    'milestone_data' => $eventData,
                    'achieved_at' => now(),
                ]
            );
        }
    }
}
