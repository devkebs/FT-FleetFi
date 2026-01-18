<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactResponseMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public ContactMessage $contactMessage;
    public string $responseText;

    public function __construct(ContactMessage $contactMessage, string $responseText)
    {
        $this->contactMessage = $contactMessage;
        $this->responseText = $responseText;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Re: Your FleetFi Inquiry - ' . ucfirst($this->contactMessage->subject),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-response',
            with: [
                'userName' => $this->contactMessage->name,
                'originalMessage' => $this->contactMessage->message,
                'responseText' => $this->responseText,
                'websiteUrl' => config('app.frontend_url'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
