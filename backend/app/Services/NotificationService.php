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

    /**
     * Notify driver of vehicle assignment
     */
    public function notifyVehicleAssignment(User $driver, array $vehicleData): Notification
    {
        $vehicleName = $vehicleData['name'] ?? 'Unknown Vehicle';
        $registration = $vehicleData['registration'] ?? 'N/A';

        return $this->create(
            $driver,
            'vehicle_assignment',
            'New Vehicle Assigned',
            "You have been assigned to {$vehicleName} ({$registration}).",
            $vehicleData,
            '/driver/assignments'
        );
    }

    /**
     * Notify driver of trip completion
     */
    public function notifyTripCompleted(User $driver, array $tripData): Notification
    {
        $earnings = $tripData['earnings'] ?? 0;
        $distance = $tripData['distance'] ?? 0;

        return $this->create(
            $driver,
            'trip_completed',
            'Trip Completed',
            "Trip completed! You earned ₦" . number_format($earnings, 2) . " ({$distance} km).",
            $tripData,
            '/driver/trips'
        );
    }

    /**
     * Notify operator of maintenance alert
     */
    public function notifyMaintenanceAlert(User $operator, array $alertData): Notification
    {
        $vehicleName = $alertData['vehicle'] ?? 'Unknown Vehicle';
        $issue = $alertData['issue'] ?? 'Unknown issue';
        $severity = $alertData['severity'] ?? 'medium';

        return $this->create(
            $operator,
            'maintenance_alert',
            ucfirst($severity) . ' Maintenance Alert',
            "Maintenance required on {$vehicleName}: {$issue}",
            $alertData,
            '/operator/maintenance'
        );
    }

    /**
     * Notify user of withdrawal status
     */
    public function notifyWithdrawalStatus(User $user, string $status, float $amount, ?string $reason = null): Notification
    {
        $titles = [
            'pending' => 'Withdrawal Request Received',
            'processing' => 'Withdrawal Processing',
            'completed' => 'Withdrawal Completed',
            'rejected' => 'Withdrawal Request Update',
        ];

        $messages = [
            'pending' => "Your withdrawal request for ₦" . number_format($amount, 2) . " is being reviewed.",
            'processing' => "Your withdrawal of ₦" . number_format($amount, 2) . " is being processed.",
            'completed' => "₦" . number_format($amount, 2) . " has been sent to your bank account.",
            'rejected' => "Your withdrawal request was declined. " . ($reason ?? 'Please contact support.'),
        ];

        return $this->create(
            $user,
            'withdrawal_' . $status,
            $titles[$status] ?? 'Withdrawal Update',
            $messages[$status] ?? "Your withdrawal status has been updated.",
            ['status' => $status, 'amount' => $amount, 'reason' => $reason],
            '/wallet'
        );
    }

    /**
     * Notify driver of swap task update
     */
    public function notifySwapTaskUpdate(User $driver, array $taskData): Notification
    {
        $taskNumber = $taskData['task_number'] ?? 'Unknown';
        $status = $taskData['status'] ?? 'pending';
        $stationName = $taskData['station_name'] ?? 'station';

        $messages = [
            'pending' => "Swap task {$taskNumber} created. Head to {$stationName}.",
            'enroute' => "Navigate to {$stationName} for swap task {$taskNumber}.",
            'arrived' => "You've arrived at {$stationName}. Start your swap when ready.",
            'swapping' => "Swap in progress for task {$taskNumber}.",
            'completed' => "Swap task {$taskNumber} completed successfully!",
            'cancelled' => "Swap task {$taskNumber} has been cancelled.",
        ];

        return $this->create(
            $driver,
            'swap_task_' . $status,
            'Battery Swap Update',
            $messages[$status] ?? "Swap task {$taskNumber} status: {$status}",
            $taskData,
            '/driver/swaps'
        );
    }

    /**
     * Send welcome notification to new user
     */
    public function notifyWelcome(User $user): Notification
    {
        $roleMessages = [
            'investor' => 'Start exploring investment opportunities in EV fleet assets!',
            'driver' => 'Check your vehicle assignments and start earning.',
            'operator' => 'Manage your fleet from the dashboard.',
            'admin' => 'Access the admin panel to manage the platform.',
        ];

        return $this->create(
            $user,
            'welcome',
            'Welcome to FleetFi!',
            "Hello {$user->name}, your account is now active. " . ($roleMessages[$user->role] ?? 'Explore your dashboard.'),
            ['role' => $user->role],
            '/' . ($user->role === 'admin' ? 'admin' : $user->role)
        );
    }

    /**
     * Broadcast notification to users by role
     */
    public function broadcastToRole(string $role, string $type, string $title, string $message, ?array $data = null, ?string $actionUrl = null): int
    {
        $users = User::where('role', $role)->where('status', 'active')->get();
        $count = 0;

        foreach ($users as $user) {
            $this->create($user, $type, $title, $message, $data, $actionUrl);
            $count++;
        }

        return $count;
    }
}
