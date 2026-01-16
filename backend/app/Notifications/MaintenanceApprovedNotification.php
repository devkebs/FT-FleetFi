<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaintenanceApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $maintenanceRequest;

    public function __construct(MaintenanceRequest $maintenanceRequest)
    {
        $this->maintenanceRequest = $maintenanceRequest;
    }

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Maintenance Request Approved - ' . $this->maintenanceRequest->asset->name)
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your maintenance request has been approved!')
            ->line('**Vehicle:** ' . $this->maintenanceRequest->asset->name . ' (' . $this->maintenanceRequest->asset->registration_number . ')')
            ->line('**Issue:** ' . $this->maintenanceRequest->issue_type)
            ->line('**Estimated Cost:** ₦' . number_format($this->maintenanceRequest->estimated_cost, 2))
            ->when($this->maintenanceRequest->operator_notes, function ($message) {
                return $message->line('**Notes:** ' . $this->maintenanceRequest->operator_notes);
            })
            ->line('Please proceed with the maintenance as approved.')
            ->action('View Details', url('/driver/maintenance/' . $this->maintenanceRequest->id))
            ->line('Thank you for keeping our fleet in great condition!');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'maintenance_approved',
            'maintenance_request_id' => $this->maintenanceRequest->id,
            'asset_name' => $this->maintenanceRequest->asset->name,
            'issue_type' => $this->maintenanceRequest->issue_type,
            'estimated_cost' => $this->maintenanceRequest->estimated_cost,
            'operator_notes' => $this->maintenanceRequest->operator_notes,
        ];
    }
}
