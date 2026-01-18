<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WithdrawalStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public string $status;
    public float $amount;
    public ?string $reason;

    public function __construct(User $user, string $status, float $amount, ?string $reason = null)
    {
        $this->user = $user;
        $this->status = $status;
        $this->amount = $amount;
        $this->reason = $reason;
    }

    public function envelope(): Envelope
    {
        $subject = match($this->status) {
            'approved', 'completed' => 'Withdrawal Approved - FleetFi',
            'rejected' => 'Withdrawal Request Update - FleetFi',
            'pending' => 'Withdrawal Request Received - FleetFi',
            default => 'Withdrawal Status Update - FleetFi',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.withdrawal-status',
            with: [
                'userName' => $this->user->name,
                'status' => $this->status,
                'amount' => number_format($this->amount, 2),
                'reason' => $this->reason,
                'walletUrl' => config('app.frontend_url') . '/wallet',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
