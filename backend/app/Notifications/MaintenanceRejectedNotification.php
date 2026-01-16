<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaintenanceRejectedNotification extends Notification implements ShouldQueue
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
            ->subject('Maintenance Request - Update Required - ' . $this->maintenanceRequest->asset->name)
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your maintenance request requires additional information.')
            ->line('**Vehicle:** ' . $this->maintenanceRequest->asset->name . ' (' . $this->maintenanceRequest->asset->registration_number . ')')
            ->line('**Issue:** ' . $this->maintenanceRequest->issue_type)
            ->line('**Operator Notes:** ' . $this->maintenanceRequest->operator_notes)
            ->line('Please review the feedback and submit a new request if necessary.')
            ->action('View Details', url('/driver/maintenance/' . $this->maintenanceRequest->id))
            ->line('If you have questions, please contact your fleet operator.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'maintenance_rejected',
            'maintenance_request_id' => $this->maintenanceRequest->id,
            'asset_name' => $this->maintenanceRequest->asset->name,
            'issue_type' => $this->maintenanceRequest->issue_type,
            'operator_notes' => $this->maintenanceRequest->operator_notes,
        ];
    }
}
