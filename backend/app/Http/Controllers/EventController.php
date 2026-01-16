<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventGroup;
use App\Models\EventParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EventController extends Controller
{
    /**
     * Display a listing of events.
     * Filters by user access permissions
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Event::with(['creator', 'participants.user', 'groups']);

        // Filter by user access
        $query->where(function ($q) use ($user) {
            $q->where('created_by', $user->id)
              ->orWhereHas('participants', function ($q2) use ($user) {
                  $q2->where('user_id', $user->id);
              })
              ->orWhereHas('groups', function ($q3) use ($user) {
                  $q3->where('group_type', 'role')
                     ->where('group_identifier', $user->role);
              });
        });

        // Filter by event type
        if ($request->has('event_type')) {
            $query->ofType($request->event_type);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->withStatus($request->status);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Only upcoming events
        if ($request->has('upcoming') && $request->upcoming == 'true') {
            $query->upcoming();
        }

        $events = $query->orderBy('start_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'events' => $events
        ]);
    }

    /**
     * Get weekly calendar view
     */
    public function weeklyView(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'week_start' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $weekStart = Carbon::parse($request->week_start)->startOfWeek();
        $weekEnd = $weekStart->copy()->endOfWeek();

        $user = $request->user();
        $events = Event::with(['creator', 'participants.user', 'groups'])
            ->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('participants', function ($q2) use ($user) {
                      $q2->where('user_id', $user->id);
                  })
                  ->orWhereHas('groups', function ($q3) use ($user) {
                      $q3->where('group_type', 'role')
                         ->where('group_identifier', $user->role);
                  });
            })
            ->dateRange($weekStart, $weekEnd)
            ->orderBy('start_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'week_start' => $weekStart->toDateString(),
            'week_end' => $weekEnd->toDateString(),
            'events' => $events
        ]);
    }

    /**
     * Get monthly calendar view
     */
    public function monthlyView(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|date_format:Y-m'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $monthStart = Carbon::parse($request->month . '-01')->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $user = $request->user();
        $events = Event::with(['creator', 'participants.user', 'groups'])
            ->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('participants', function ($q2) use ($user) {
                      $q2->where('user_id', $user->id);
                  })
                  ->orWhereHas('groups', function ($q3) use ($user) {
                      $q3->where('group_type', 'role')
                         ->where('group_identifier', $user->role);
                  });
            })
            ->dateRange($monthStart, $monthEnd)
            ->orderBy('start_date', 'asc')
            ->get();

        // Group events by day for easier frontend rendering
        $eventsByDay = $events->groupBy(function ($event) {
            return Carbon::parse($event->start_date)->format('Y-m-d');
        });

        return response()->json([
            'success' => true,
            'month' => $request->month,
            'month_start' => $monthStart->toDateString(),
            'month_end' => $monthEnd->toDateString(),
            'events' => $events,
            'events_by_day' => $eventsByDay
        ]);
    }

    /**
     * Store a newly created event.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'event_type' => 'nullable|string|in:general,meeting,maintenance,training,delivery,inspection,swap,other',
            'location' => 'nullable|string|max:255',
            'is_all_day' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|string|in:none,daily,weekly,monthly',
            'recurrence_end_date' => 'nullable|date|after:start_date',
            'metadata' => 'nullable|array',
            'groups' => 'nullable|array',
            'groups.*.group_type' => 'required_with:groups|string|in:role,custom',
            'groups.*.group_identifier' => 'required_with:groups|string',
            'groups.*.permission' => 'nullable|string|in:view,edit,admin',
            'participants' => 'nullable|array',
            'participants.*' => 'exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $eventData = $validator->validated();
            $eventData['created_by'] = $request->user()->id;
            $eventData['status'] = 'scheduled';

            // Remove groups and participants from event data
            $groups = $eventData['groups'] ?? [];
            $participantIds = $eventData['participants'] ?? [];
            unset($eventData['groups'], $eventData['participants']);

            $event = Event::create($eventData);

            // Add groups
            foreach ($groups as $group) {
                EventGroup::create([
                    'event_id' => $event->id,
                    'group_type' => $group['group_type'],
                    'group_identifier' => $group['group_identifier'],
                    'permission' => $group['permission'] ?? 'view'
                ]);
            }

            // Add participants
            foreach ($participantIds as $participantId) {
                EventParticipant::create([
                    'event_id' => $event->id,
                    'user_id' => $participantId,
                    'status' => 'invited'
                ]);
            }

            // Add creator as organizer
            EventParticipant::updateOrCreate(
                [
                    'event_id' => $event->id,
                    'user_id' => $request->user()->id
                ],
                [
                    'status' => 'accepted',
                    'is_organizer' => true
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Event created successfully',
                'event' => $event->load(['creator', 'participants.user', 'groups'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified event.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::with(['creator', 'participants.user', 'groups'])->find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        // Check access
        if (!$event->userHasAccess($user->id, $user->role)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this event'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'event' => $event
        ]);
    }

    /**
     * Update the specified event.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        // Check edit permission
        if (!$event->userCanEdit($user->id, $user->role)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to edit this event'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'event_type' => 'nullable|string|in:general,meeting,maintenance,training,delivery,inspection,swap,other',
            'location' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:scheduled,ongoing,completed,cancelled',
            'is_all_day' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|string|in:none,daily,weekly,monthly',
            'recurrence_end_date' => 'nullable|date|after:start_date',
            'metadata' => 'nullable|array',
            'groups' => 'nullable|array',
            'groups.*.group_type' => 'required_with:groups|string|in:role,custom',
            'groups.*.group_identifier' => 'required_with:groups|string',
            'groups.*.permission' => 'nullable|string|in:view,edit,admin',
            'participants' => 'nullable|array',
            'participants.*' => 'exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $eventData = $validator->validated();

            // Handle groups and participants separately
            $groups = $eventData['groups'] ?? null;
            $participantIds = $eventData['participants'] ?? null;
            unset($eventData['groups'], $eventData['participants']);

            $event->update($eventData);

            // Update groups if provided
            if ($groups !== null) {
                EventGroup::where('event_id', $event->id)->delete();
                foreach ($groups as $group) {
                    EventGroup::create([
                        'event_id' => $event->id,
                        'group_type' => $group['group_type'],
                        'group_identifier' => $group['group_identifier'],
                        'permission' => $group['permission'] ?? 'view'
                    ]);
                }
            }

            // Update participants if provided
            if ($participantIds !== null) {
                // Keep organizers, remove others
                EventParticipant::where('event_id', $event->id)
                    ->where('is_organizer', false)
                    ->delete();

                foreach ($participantIds as $participantId) {
                    EventParticipant::updateOrCreate(
                        [
                            'event_id' => $event->id,
                            'user_id' => $participantId
                        ],
                        [
                            'status' => 'invited'
                        ]
                    );
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Event updated successfully',
                'event' => $event->load(['creator', 'participants.user', 'groups'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified event.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        // Only creator or admin can delete
        if ($event->created_by !== $user->id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this event'
            ], 403);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event deleted successfully'
        ]);
    }

    /**
     * Update participant RSVP status
     */
    public function updateRsvp(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:accepted,declined,tentative',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $participant = EventParticipant::where('event_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a participant of this event'
            ], 404);
        }

        $participant->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'RSVP updated successfully',
            'participant' => $participant
        ]);
    }

    /**
     * Share event with groups
     */
    public function shareWithGroups(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        // Check edit permission
        if (!$event->userCanEdit($user->id, $user->role)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to share this event'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'groups' => 'required|array',
            'groups.*.group_type' => 'required|string|in:role,custom',
            'groups.*.group_identifier' => 'required|string',
            'groups.*.permission' => 'nullable|string|in:view,edit,admin'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($request->groups as $group) {
                EventGroup::updateOrCreate(
                    [
                        'event_id' => $event->id,
                        'group_type' => $group['group_type'],
                        'group_identifier' => $group['group_identifier']
                    ],
                    [
                        'permission' => $group['permission'] ?? 'view'
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Event shared successfully',
                'event' => $event->load(['creator', 'participants.user', 'groups'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to share event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add participants to event
     */
    public function addParticipants(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        // Check edit permission
        if (!$event->userCanEdit($user->id, $user->role)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to add participants to this event'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($request->user_ids as $userId) {
                EventParticipant::updateOrCreate(
                    [
                        'event_id' => $event->id,
                        'user_id' => $userId
                    ],
                    [
                        'status' => 'invited'
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Participants added successfully',
                'event' => $event->load(['creator', 'participants.user', 'groups'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to add participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
