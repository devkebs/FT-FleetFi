<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get notifications for the current user
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->input('per_page', 20);
        $unreadOnly = $request->boolean('unread_only', false);

        $query = Notification::forUser($user->id)
            ->orderBy('created_at', 'desc');

        if ($unreadOnly) {
            $query->unread();
        }

        $notifications = $query->paginate($perPage);

        return response()->json([
            'notifications' => $notifications->items(),
            'total' => $notifications->total(),
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'unread_count' => Notification::forUser($user->id)->unread()->count(),
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($id)
    {
        $user = Auth::user();
        $notification = Notification::forUser($user->id)->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        $count = Notification::forUser($user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'count' => $count,
        ]);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount()
    {
        $user = Auth::user();
        $count = Notification::forUser($user->id)->unread()->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Delete a notification
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $notification = Notification::forUser($user->id)->findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * Delete all read notifications
     */
    public function deleteAllRead()
    {
        $user = Auth::user();
        $count = Notification::forUser($user->id)
            ->where('is_read', true)
            ->delete();

        return response()->json([
            'message' => 'Read notifications deleted',
            'count' => $count,
        ]);
    }

    /**
     * Create a notification (internal/admin use)
     */
    public static function createNotification(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'data' => $data,
            'is_read' => false,
        ]);
    }

    /**
     * Send notification to multiple users
     */
    public static function notifyUsers(
        array $userIds,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        ?array $data = null
    ): int {
        $count = 0;
        foreach ($userIds as $userId) {
            self::createNotification($userId, $type, $title, $message, $actionUrl, $data);
            $count++;
        }
        return $count;
    }

    /**
     * Send notification to users by role
     */
    public static function notifyRole(
        string $role,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        ?array $data = null
    ): int {
        $userIds = \App\Models\User::where('role', $role)->pluck('id')->toArray();
        return self::notifyUsers($userIds, $type, $title, $message, $actionUrl, $data);
    }
}
