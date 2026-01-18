<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PayoutNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public float $amount;
    public string $period;

    public function __construct(User $user, float $amount, string $period)
    {
        $this->user = $user;
        $this->amount = $amount;
        $this->period = $period;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Dividend Payout Received - FleetFi',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payout-notification',
            with: [
                'userName' => $this->user->name,
                'amount' => number_format($this->amount, 2),
                'period' => $this->period,
                'walletUrl' => config('app.frontend_url') . '/wallet',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
