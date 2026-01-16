# FleetFi Battery Swap API Reference

Quick reference for all battery swap API endpoints.

---

## Authentication

All endpoints require Bearer token authentication (Laravel Sanctum).

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

Get token by logging in:
```http
POST /api/login
Content-Type: application/json

{
  "email": "driver@fleetfi.com",
  "password": "password"
}
```

---

## Driver Endpoints

### Get Driver Profile
```http
GET /api/drivers/profile
```

**Response:**
```json
{
  "success": true,
  "driver": {
    "id": 1,
    "user_id": 5,
    "license_number": "DL123456",
    "license_expiry": "2028-01-01",
    "vehicle_id": 10,
    "status": "available",
    "total_swaps": 45,
    "total_distance_km": 230.5,
    "current_latitude": 6.5244,
    "current_longitude": 3.3792,
    "user": {...},
    "assigned_vehicle": {...}
  }
}
```

### Get Driver Metrics
```http
GET /api/drivers/metrics
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "driver_id": 1,
    "today_swaps": 3,
    "week_swaps": 15,
    "month_swaps": 45,
    "today_distance_km": 12.5,
    "average_swap_time_minutes": 12.3,
    "vehicle_soh": 87,
    "current_battery_level": 75,
    "efficiency_score": 92
  }
}
```

### Update Driver Profile
```http
PUT /api/drivers/profile
Content-Type: application/json

{
  "license_number": "DL789012",
  "license_expiry": "2028-06-01",
  "vehicle_id": 15
}
```

---

## Fleet Engine - Location Tracking

### Update Driver Location
```http
POST /api/fleet/location
Content-Type: application/json

{
  "driver_id": 1,
  "vehicle_id": 10,
  "latitude": 6.5244,
  "longitude": 3.3792,
  "heading": 90,
  "speed": 45.5,
  "accuracy": 5,
  "timestamp": "2026-01-02T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

---

## Fleet Engine - Driver Status

### Update Driver Status
```http
PUT /api/fleet/drivers/{driverId}/status
Content-Type: application/json

{
  "status": "available",
  "timestamp": "2026-01-02T10:30:00Z"
}
```

**Valid Status Values:**
- `offline` - Driver not available
- `available` - Ready for swap tasks
- `driving` - En route to station
- `at_station` - At swap station
- `on_swap` - Performing battery swap

**Response:**
```json
{
  "success": true,
  "driver": {
    "id": 1,
    "status": "available",
    ...
  }
}
```

---

## Fleet Engine - Shift Management

### Start Shift (Clock In)
```http
POST /api/fleet/drivers/{driverId}/shift/start
Content-Type: application/json

{
  "timestamp": "2026-01-02T08:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shift started successfully",
  "driver": {
    "id": 1,
    "shift_start": "2026-01-02T08:00:00Z",
    "status": "available"
  }
}
```

### End Shift (Clock Out)
```http
POST /api/fleet/drivers/{driverId}/shift/end
Content-Type: application/json

{
  "timestamp": "2026-01-02T17:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shift ended successfully",
  "driver": {
    "id": 1,
    "shift_end": "2026-01-02T17:00:00Z",
    "status": "offline"
  }
}
```

---

## Fleet Engine - Swap Tasks

### Get Active Swap Task
```http
GET /api/fleet/drivers/{driverId}/active-task
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": 42,
    "task_number": "ST-A3F8D2B1",
    "driver_id": 1,
    "swap_station_id": 5,
    "status": "assigned",
    "distance_km": 5.2,
    "battery_level_before": 15,
    "swap_station": {
      "id": 5,
      "name": "Central Station",
      "location": {
        "latitude": 6.5244,
        "longitude": 3.3792
      },
      "address": "123 Main St, Lagos",
      "available_batteries": 15,
      "total_capacity": 20,
      "operating_hours": "24/7",
      "status": "active"
    }
  }
}
```

### Get Swap Task History
```http
GET /api/fleet/drivers/{driverId}/swap-tasks?limit=20
```

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": 41,
      "task_number": "ST-B2C9E5F3",
      "status": "completed",
      "duration_minutes": 12,
      "battery_level_before": 12,
      "battery_level_after": 95,
      "soh_before": 85,
      "soh_after": 90,
      "completed_at": "2026-01-02T09:45:00Z",
      ...
    },
    ...
  ]
}
```

### Start Swap Task
```http
POST /api/fleet/swap-tasks/{taskId}/start
Content-Type: application/json

{
  "driver_id": 1,
  "vehicle_id": 10,
  "station_location": {
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "timestamp": "2026-01-02T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": 42,
    "status": "enroute_to_station",
    "started_at": "2026-01-02T10:00:00Z",
    ...
  }
}
```

### Update Swap Task Status
```http
PUT /api/fleet/swap-tasks/{taskId}/status
Content-Type: application/json

{
  "status": "arrived_at_station",
  "location": {
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "battery_level": 15,
  "driver_id": 1,
  "timestamp": "2026-01-02T10:15:00Z"
}
```

**Valid Status Values:**
- `assigned` - Task assigned to driver
- `enroute_to_station` - Driver heading to station
- `arrived_at_station` - Driver arrived
- `swapping` - Performing swap (records battery_level_before)
- `swap_complete` - Swap finished (records battery_level_after)
- `back_to_base` - Returning to base
- `completed` - Task complete
- `canceled` - Task canceled

**Response:**
```json
{
  "success": true,
  "task": {
    "id": 42,
    "status": "arrived_at_station",
    ...
  }
}
```

---

## Fleet Engine - Swap Stations

### Get Nearby Swap Stations
```http
GET /api/fleet/swap-stations/nearby?latitude=6.5244&longitude=3.3792&radius=10
```

**Query Parameters:**
- `latitude` (required) - Driver's latitude
- `longitude` (required) - Driver's longitude
- `radius` (optional) - Search radius in km (default: 10)

**Response:**
```json
{
  "success": true,
  "stations": [
    {
      "id": 5,
      "name": "Central Station",
      "location": "{\"latitude\":6.5244,\"longitude\":3.3792}",
      "address": "123 Main St, Lagos",
      "available_batteries": 15,
      "total_capacity": 20,
      "operating_hours": "24/7",
      "status": "active",
      "distance": 0.5
    },
    {
      "id": 6,
      "name": "North Station",
      "location": "{\"latitude\":6.5355,\"longitude\":3.3487}",
      "address": "456 North Ave, Lagos",
      "available_batteries": 10,
      "total_capacity": 15,
      "operating_hours": "06:00-22:00",
      "status": "active",
      "distance": 3.2
    }
  ],
  "count": 2
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Driver profile not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "errors": {
    "status": [
      "The selected status is invalid."
    ],
    "latitude": [
      "The latitude field is required."
    ]
  }
}
```

### 500 Server Error
```json
{
  "message": "Server Error",
  "exception": "..."
}
```

---

## Rate Limiting

API requests are limited to **60 requests per minute** per user/IP.

Exceeded rate limit response:
```json
{
  "message": "Too Many Attempts."
}
```

---

## Postman Collection

You can import these endpoints into Postman:

1. Create a new collection called "FleetFi Battery Swap"
2. Set collection variable `base_url` = `http://localhost:8000/api`
3. Set collection variable `token` = Your auth token
4. Add header: `Authorization: Bearer {{token}}`
5. Add the endpoints above

---

## Example Workflow

### Complete Swap Task Lifecycle

```bash
# 1. Login
POST /api/login
{ "email": "driver@fleetfi.com", "password": "password" }

# 2. Clock in
POST /api/fleet/drivers/1/shift/start
{ "timestamp": "2026-01-02T08:00:00Z" }

# 3. Go available
PUT /api/fleet/drivers/1/status
{ "status": "available", "timestamp": "2026-01-02T08:01:00Z" }

# 4. Get active task (assigned by backend)
GET /api/fleet/drivers/1/active-task

# 5. Start task
POST /api/fleet/swap-tasks/42/start
{ "driver_id": 1, "station_location": {...}, "timestamp": "..." }

# 6. Update location (continuous)
POST /api/fleet/location
{ "driver_id": 1, "latitude": 6.52, "longitude": 3.37, ... }

# 7. Arrive at station
PUT /api/fleet/swap-tasks/42/status
{ "status": "arrived_at_station", "driver_id": 1, ... }

# 8. Start swapping
PUT /api/fleet/swap-tasks/42/status
{ "status": "swapping", "battery_level": 15, "driver_id": 1, ... }

# 9. Complete swap
PUT /api/fleet/swap-tasks/42/status
{ "status": "swap_complete", "battery_level": 95, "driver_id": 1, ... }

# 10. Complete task
PUT /api/fleet/swap-tasks/42/status
{ "status": "completed", "driver_id": 1, ... }

# 11. Check metrics
GET /api/drivers/metrics

# 12. Clock out
POST /api/fleet/drivers/1/shift/end
{ "timestamp": "2026-01-02T17:00:00Z" }
```

---

**Quick Tip:** Use the test data creation commands in [BATTERY_SWAP_SETUP.md](BATTERY_SWAP_SETUP.md) to create drivers, stations, and tasks for testing.
