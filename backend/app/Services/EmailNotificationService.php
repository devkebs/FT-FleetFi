<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailNotificationService
{
    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail(User $user): bool
    {
        try {
            Mail::send('emails.welcome', ['user' => $user], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Welcome to FleetFi - Your Journey Starts Here!');
            });

            Log::info("Welcome email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send welcome email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send KYC verification email
     */
    public function sendKYCVerificationEmail(User $user, string $status, ?string $reason = null): bool
    {
        try {
            Mail::send('emails.kyc_status', [
                'user' => $user,
                'status' => $status,
                'reason' => $reason
            ], function ($message) use ($user, $status) {
                $message->to($user->email, $user->name)
                    ->subject("KYC Verification " . ucfirst($status));
            });

            Log::info("KYC {$status} email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send KYC email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send investment confirmation email
     */
    public function sendInvestmentConfirmation(User $user, array $investmentData): bool
    {
        try {
            Mail::send('emails.investment_confirmation', [
                'user' => $user,
                'investment' => $investmentData
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Investment Confirmation - FleetFi');
            });

            Log::info("Investment confirmation email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send investment email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send payout notification email
     */
    public function sendPayoutNotification(User $user, array $payoutData): bool
    {
        try {
            Mail::send('emails.payout_notification', [
                'user' => $user,
                'payout' => $payoutData
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Payout Processed - FleetFi');
            });

            Log::info("Payout notification email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send payout email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send monthly revenue report
     */
    public function sendMonthlyRevenueReport(User $user, array $reportData): bool
    {
        try {
            Mail::send('emails.monthly_report', [
                'user' => $user,
                'report' => $reportData
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Your Monthly Revenue Report - FleetFi');
            });

            Log::info("Monthly report email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send monthly report to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(User $user, string $resetToken): bool
    {
        try {
            $resetUrl = config('app.frontend_url') . "/reset-password?token={$resetToken}";

            Mail::send('emails.password_reset', [
                'user' => $user,
                'resetUrl' => $resetUrl
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Password Reset Request - FleetFi');
            });

            Log::info("Password reset email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send password reset email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send asset tokenization notification
     */
    public function sendAssetTokenizationNotification(User $user, array $assetData): bool
    {
        try {
            Mail::send('emails.asset_tokenized', [
                'user' => $user,
                'asset' => $assetData
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Asset Successfully Tokenized - FleetFi');
            });

            Log::info("Asset tokenization email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send tokenization email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send wallet transaction notification
     */
    public function sendWalletTransactionNotification(User $user, array $transactionData): bool
    {
        try {
            Mail::send('emails.wallet_transaction', [
                'user' => $user,
                'transaction' => $transactionData
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Wallet Transaction Notification - FleetFi');
            });

            Log::info("Wallet transaction email sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send wallet transaction email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send low wallet balance alert
     */
    public function sendLowBalanceAlert(User $user, float $balance): bool
    {
        try {
            Mail::send('emails.low_balance_alert', [
                'user' => $user,
                'balance' => $balance
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Low Wallet Balance Alert - FleetFi');
            });

            Log::info("Low balance alert sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send low balance alert to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send vehicle maintenance alert
     */
    public function sendMaintenanceAlert(User $user, array $vehicleData): bool
    {
        try {
            Mail::send('emails.maintenance_alert', [
                'user' => $user,
                'vehicle' => $vehicleData
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Vehicle Maintenance Required - FleetFi');
            });

            Log::info("Maintenance alert sent to {$user->email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send maintenance alert to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send bulk email to multiple users
     */
    public function sendBulkEmail(array $users, string $subject, string $view, array $data = []): int
    {
        $sentCount = 0;

        foreach ($users as $user) {
            try {
                Mail::send($view, array_merge(['user' => $user], $data), function ($message) use ($user, $subject) {
                    $message->to($user->email, $user->name)
                        ->subject($subject);
                });

                $sentCount++;
            } catch (\Exception $e) {
                Log::error("Failed to send bulk email to {$user->email}: {$e->getMessage()}");
            }
        }

        Log::info("Bulk email sent to {$sentCount} users");
        return $sentCount;
    }

    /**
     * Send withdrawal status notification
     */
    public function sendWithdrawalStatusNotification(User $user, string $status, float $amount, ?string $reason = null): bool
    {
        try {
            Mail::send('emails.withdrawal-status', [
                'userName' => $user->name,
                'status' => $status,
                'amount' => number_format($amount, 2),
                'reason' => $reason,
                'walletUrl' => config('app.frontend_url') . '/wallet',
            ], function ($message) use ($user, $status) {
                $subject = match($status) {
                    'approved', 'completed' => 'Withdrawal Approved - FleetFi',
                    'rejected' => 'Withdrawal Request Update - FleetFi',
                    'pending' => 'Withdrawal Request Received - FleetFi',
                    default => 'Withdrawal Status Update - FleetFi',
                };
                $message->to($user->email, $user->name)->subject($subject);
            });

            Log::info("Withdrawal status email sent to {$user->email}", [
                'status' => $status,
                'amount' => $amount,
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send withdrawal status email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send contact form response email
     */
    public function sendContactResponse(string $email, string $name, string $originalMessage, string $responseText): bool
    {
        try {
            Mail::send('emails.contact-response', [
                'userName' => $name,
                'originalMessage' => $originalMessage,
                'responseText' => $responseText,
                'websiteUrl' => config('app.frontend_url'),
            ], function ($message) use ($email, $name) {
                $message->to($email, $name)
                    ->subject('Re: Your FleetFi Inquiry');
            });

            Log::info("Contact response email sent to {$email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send contact response email to {$email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Check if email is properly configured
     */
    public static function isConfigured(): bool
    {
        $mailer = config('mail.mailer', config('mail.default'));
        return $mailer && $mailer !== 'log' && $mailer !== 'array';
    }
}
