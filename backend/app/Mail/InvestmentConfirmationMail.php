<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Investment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvestmentConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public Investment $investment;

    public function __construct(User $user, Investment $investment)
    {
        $this->user = $user;
        $this->investment = $investment;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Investment Confirmed - FleetFi',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.investment-confirmation',
            with: [
                'userName' => $this->user->name,
                'assetName' => $this->investment->asset->name ?? 'EV Asset',
                'amount' => number_format($this->investment->amount / 100, 2),
                'tokens' => $this->investment->tokens_purchased ?? 0,
                'expectedReturn' => $this->investment->projected_annual_return ?? '12-18%',
                'portfolioUrl' => config('app.frontend_url') . '/portfolio',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
