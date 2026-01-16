<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
// in a real app, we would use the DB facade or a Notification model
// use Illuminate\Support\Facades\DB; 

class NotificationController extends Controller
{
    /**
     * Get unread notifications for the current user
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Simulating notifications for demo purposes
        // In production, this would be: $user->unreadNotifications
        
        $notifications = [];
        
        // Simulate a welcome notification for everyone
        $notifications[] = [
            'id' => 'note_001',
            'type' => 'App\Notifications\WelcomeNotification',
            'data' => [
                'title' => 'Welcome to FleetFi!',
                'message' => 'Your account is fully active. Start by configuring your profile.',
                'action_url' => '/settings'
            ],
            'read_at' => null,
            'created_at' => now()->subDays(1)
        ];

        // Simulate role-specific notifications
        if ($user->role === 'driver') {
            $notifications[] = [
                'id' => 'note_d_001',
                'type' => 'App\Notifications\VehicleAssignment',
                'data' => [
                    'title' => 'New Vehicle Assigned',
                    'message' => 'You have been assigned to Toyota Corolla (EV-123).',
                    'action_url' => '/driver/assignments'
                ],
                'read_at' => null,
                'created_at' => now()->subHours(2)
            ];
        }

        if ($user->role === 'investor') {
            $notifications[] = [
                'id' => 'note_i_001',
                'type' => 'App\Notifications\DividendPayout',
                'data' => [
                    'title' => 'Dividend Payment Received',
                    'message' => 'You received ₦5,200 from Asset VEH001.',
                    'action_url' => '/investor/payouts'
                ],
                'read_at' => null,
                'created_at' => now()->subHours(5)
            ];
        }

        if ($user->role === 'operator') {
            $notifications[] = [
                'id' => 'note_o_001',
                'type' => 'App\Notifications\MaintenanceAlert',
                'data' => [
                    'title' => 'Critical Maintenance Request',
                    'message' => 'Driver John reported a critical battery issue on EV-456.',
                    'action_url' => '/operator/maintenance',
                    'severity' => 'critical'
                ],
                'read_at' => null,
                'created_at' => now()->subMinutes(30)
            ];
        }

        return response()->json(['notifications' => $notifications]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($id)
    {
        // In production: 
        // Auth::user()->notifications()->where('id', $id)->first()->markAsRead();
        
        return response()->json(['message' => 'Notification marked as read']);
    }

    /**
     * Mark all as read
     */
    public function markAllAsRead()
    {
        // In production:
        // Auth::user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount()
    {
        $user = Auth::user();

        // Simulating unread count for demo
        // In production: return $user->unreadNotifications()->count();
        $count = 1; // Welcome notification

        if ($user->role === 'driver') {
            $count += 1; // Vehicle assignment
        } elseif ($user->role === 'investor') {
            $count += 1; // Dividend payout
        } elseif ($user->role === 'operator') {
            $count += 1; // Maintenance alert
        }

        return response()->json(['count' => $count]);
    }
}
