<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class ContactController extends Controller
{
    /**
     * Store a new contact message (public endpoint)
     */
    public function store(Request $request)
    {
        // Rate limiting: 5 submissions per IP per hour
        $key = 'contact-form:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => 'Too many submissions. Please try again in ' . ceil($seconds / 60) . ' minutes.',
            ], 429);
        }

        RateLimiter::hit($key, 3600); // 1 hour decay

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'required|string|in:investment,operator,driver,support,other',
            'message' => 'required|string|max:2000',
        ]);

        try {
            $contactMessage = ContactMessage::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'subject' => $validated['subject'],
                'message' => $validated['message'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Send notification email to admin (if mail is configured)
            $this->sendAdminNotification($contactMessage);

            Log::info('Contact form submission received', [
                'id' => $contactMessage->id,
                'email' => $contactMessage->email,
                'subject' => $contactMessage->subject,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thank you for your message! We will get back to you soon.',
                'data' => [
                    'id' => $contactMessage->id,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Contact form submission failed', [
                'error' => $e->getMessage(),
                'email' => $validated['email'] ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit your message. Please try again later.',
            ], 500);
        }
    }

    /**
     * Get all contact messages (admin only)
     */
    public function index(Request $request)
    {
        $query = ContactMessage::query();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by subject
        if ($request->has('subject') && $request->subject !== 'all') {
            $query->where('subject', $request->subject);
        }

        // Search by name or email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Date range filter
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $messages = $query->with('responder:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $messages,
            'stats' => [
                'total' => ContactMessage::count(),
                'new' => ContactMessage::where('status', 'new')->count(),
                'read' => ContactMessage::where('status', 'read')->count(),
                'responded' => ContactMessage::where('status', 'responded')->count(),
            ],
        ]);
    }

    /**
     * Get a single contact message (admin only)
     */
    public function show($id)
    {
        $message = ContactMessage::with('responder:id,name')->findOrFail($id);

        // Mark as read if new
        $message->markAsRead();

        return response()->json([
            'success' => true,
            'data' => $message,
        ]);
    }

    /**
     * Update message status (admin only)
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:new,read,responded,archived',
            'response_notes' => 'nullable|string|max:2000',
        ]);

        $message = ContactMessage::findOrFail($id);
        $user = $request->user();

        if ($validated['status'] === 'responded') {
            $message->markAsResponded($user->id, $validated['response_notes'] ?? null);
        } else {
            $message->update([
                'status' => $validated['status'],
                'response_notes' => $validated['response_notes'] ?? $message->response_notes,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => $message->fresh(['responder:id,name']),
        ]);
    }

    /**
     * Delete a contact message (admin only)
     */
    public function destroy($id)
    {
        $message = ContactMessage::findOrFail($id);
        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contact message deleted successfully',
        ]);
    }

    /**
     * Bulk update status (admin only)
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:contact_messages,id',
            'status' => 'required|string|in:read,responded,archived',
        ]);

        $count = ContactMessage::whereIn('id', $validated['ids'])
            ->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => "{$count} messages updated successfully",
        ]);
    }

    /**
     * Send admin notification email
     */
    private function sendAdminNotification(ContactMessage $message)
    {
        try {
            // Check if mail is properly configured
            if (!config('mail.mailer') || config('mail.mailer') === 'log') {
                Log::info('Admin notification skipped - mail not configured', [
                    'contact_id' => $message->id,
                ]);
                return;
            }

            $adminEmail = config('mail.from.address', 'admin@fleetfi.com');

            // This will be enhanced when we implement the email notification system
            Mail::raw(
                "New contact form submission:\n\n" .
                "Name: {$message->name}\n" .
                "Email: {$message->email}\n" .
                "Phone: {$message->phone}\n" .
                "Subject: {$message->subject}\n\n" .
                "Message:\n{$message->message}\n\n" .
                "View in admin panel: " . config('app.frontend_url') . "/admin/contacts/{$message->id}",
                function ($mail) use ($adminEmail, $message) {
                    $mail->to($adminEmail)
                         ->subject("New Contact: {$message->subject} - {$message->name}");
                }
            );

            Log::info('Admin notification sent for contact message', [
                'contact_id' => $message->id,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to send admin notification email', [
                'contact_id' => $message->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
