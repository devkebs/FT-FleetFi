<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public function create(User $user, string $type, string $title, string $message, ?array $data = null, ?string $actionUrl = null): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'action_url' => $actionUrl,
        ]);
    }

    /**
     * Notify user of KYC approval
     */
    public function notifyKycApproved(User $user): Notification
    {
        return $this->create(
            $user,
            'kyc_approved',
            'KYC Verification Approved',
            'Your KYC verification has been approved. You can now start investing in assets.',
            ['kyc_status' => 'verified'],
            '/investor/dashboard'
        );
    }

    /**
     * Notify user of KYC rejection
     */
    public function notifyKycRejected(User $user, string $reason): Notification
    {
        return $this->create(
            $user,
            'kyc_rejected',
            'KYC Verification Rejected',
            "Your KYC verification was rejected. Reason: {$reason}",
            ['kyc_status' => 'rejected', 'reason' => $reason],
            '/investor/dashboard'
        );
    }

    /**
     * Notify user of successful investment
     */
    public function notifyInvestmentCompleted(User $user, array $investmentData): Notification
    {
        $assetId = $investmentData['asset_id'] ?? 'N/A';
        $amount = $investmentData['amount'] ?? 0;
        $ownership = $investmentData['ownership'] ?? 0;

        return $this->create(
            $user,
            'investment_completed',
            'Investment Successful',
            "Your investment of ₦{$amount} for {$ownership}% ownership in asset #{$assetId} is complete.",
            $investmentData,
            '/investor/dashboard'
        );
    }

    /**
     * Notify user of revenue payout received
     */
    public function notifyPayoutReceived(User $user, array $payoutData): Notification
    {
        $amount = $payoutData['amount'] ?? 0;
        $assetId = $payoutData['asset_id'] ?? 'N/A';

        return $this->create(
            $user,
            'payout_received',
            'Revenue Payout Received',
            "You received ₦{$amount} from asset #{$assetId}. Check your wallet for details.",
            $payoutData,
            '/investor/dashboard'
        );
    }

    /**
     * Send system alert to user(s)
     */
    public function notifySystemAlert(User $user, string $title, string $message, ?array $data = null): Notification
    {
        return $this->create(
            $user,
            'system_alert',
            $title,
            $message,
            $data
        );
    }

    /**
     * Broadcast system alert to all users
     */
    public function broadcastSystemAlert(string $title, string $message, ?array $data = null): int
    {
        $users = User::all();
        $count = 0;

        foreach ($users as $user) {
            $this->notifySystemAlert($user, $title, $message, $data);
            $count++;
        }

        return $count;
    }

    /**
     * Get unread notification count for user
     */
    public function getUnreadCount(User $user): int
    {
        return Notification::forUser($user->id)->unread()->count();
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead(User $user): int
    {
        return Notification::forUser($user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Delete old read notifications (cleanup)
     */
    public function cleanupOldNotifications(int $daysOld = 30): int
    {
        return Notification::where('is_read', true)
            ->where('read_at', '<', now()->subDays($daysOld))
            ->delete();
    }
}
