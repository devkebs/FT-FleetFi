<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class KycStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public string $status;
    public ?string $reason;

    public function __construct(User $user, string $status, ?string $reason = null)
    {
        $this->user = $user;
        $this->status = $status;
        $this->reason = $reason;
    }

    public function envelope(): Envelope
    {
        $subject = match($this->status) {
            'approved', 'verified' => 'KYC Verification Approved - FleetFi',
            'rejected' => 'KYC Verification Update - FleetFi',
            'pending' => 'KYC Verification Submitted - FleetFi',
            default => 'KYC Status Update - FleetFi',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.kyc-status',
            with: [
                'userName' => $this->user->name,
                'status' => $this->status,
                'reason' => $this->reason,
                'dashboardUrl' => config('app.frontend_url') . '/dashboard',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
