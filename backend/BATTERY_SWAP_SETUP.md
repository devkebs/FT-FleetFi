# Battery Swap API Setup Guide

## Overview

This guide explains how to set up the battery swap API endpoints in your Laravel backend to work with the FleetFi Mobile app.

---

## Files Created

### 1. Models
- ✅ `app/Models/Driver.php` - Driver model with location tracking
- ✅ `app/Models/SwapTask.php` - Battery swap task model
- ✅ `app/Models/SwapStation.php` - Updated with battery inventory (migration needed)

### 2. Migrations
- ✅ `database/migrations/2026_01_02_000001_create_drivers_table.php`
- ✅ `database/migrations/2026_01_02_000002_create_swap_tasks_table.php`
- ✅ `database/migrations/2026_01_02_000003_update_swap_stations_table.php`

### 3. Controllers
- ✅ `app/Http/Controllers/DriverController.php` - Driver profile & metrics
- ✅ `app/Http/Controllers/FleetController.php` - Fleet Engine operations

### 4. Routes
- ✅ `routes/fleet.php` - Battery swap API routes

---

## Step-by-Step Setup

### Step 1: Register Fleet Routes

Add the fleet routes to your `app/Providers/RouteServiceProvider.php`:

```php
public function boot()
{
    $this->configureRateLimiting();

    $this->routes(function () {
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        // ADD THIS:
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/fleet.php'));

        Route::middleware('web')
            ->group(base_path('routes/web.php'));
    });
}
```

### Step 2: Run Migrations

Run the migrations to create the database tables:

```bash
cd C:/Users/ADMIN/Fleetfi/FT-FleetFi-1/backend
php artisan migrate
```

This will create:
- `drivers` table
- `swap_tasks` table
- Update `swap_stations` table with new columns

### Step 3: Create a Test Driver

Create a driver user and profile for testing:

```bash
php artisan tinker
```

Then in the tinker console:

```php
// Create a driver user
$user = App\Models\User::create([
    'name' => 'Test Driver',
    'email' => 'driver@fleetfi.com',
    'password' => bcrypt('password'),
    'role' => 'driver'
]);

// Create driver profile
$driver = App\Models\Driver::create([
    'user_id' => $user->id,
    'license_number' => 'DL123456',
    'license_expiry' => now()->addYears(2),
    'status' => 'offline',
    'total_swaps' => 0,
    'total_distance_km' => 0
]);

echo "Driver created with ID: " . $driver->id;
```

### Step 4: Create Test Swap Stations

Create some swap stations for testing:

```php
// In tinker:
App\Models\SwapStation::create([
    'name' => 'Central Station',
    'location' => json_encode(['latitude' => 6.5244, 'longitude' => 3.3792]), // Lagos coordinates
    'address' => '123 Main Street, Lagos, Nigeria',
    'available_batteries' => 15,
    'total_capacity' => 20,
    'operating_hours' => '24/7',
    'status' => 'active'
]);

App\Models\SwapStation::create([
    'name' => 'North Station',
    'location' => json_encode(['latitude' => 6.5355, 'longitude' => 3.3487]),
    'address' => '456 North Avenue, Lagos, Nigeria',
    'available_batteries' => 10,
    'total_capacity' => 15,
    'operating_hours' => '06:00-22:00',
    'status' => 'active'
]);
```

### Step 5: Create a Test Swap Task

```php
// In tinker:
$swapTask = App\Models\SwapTask::create([
    'driver_id' => 1, // Use the driver ID from Step 3
    'swap_station_id' => 1, // Use station ID from Step 4
    'status' => 'assigned',
    'battery_level_before' => 15,
]);

echo "Swap task created: " . $swapTask->task_number;
```

---

## API Endpoints

### Driver Profile & Metrics

```
GET /api/drivers/profile
GET /api/drivers/metrics
GET /api/drivers/earnings
PUT /api/drivers/profile
```

### Fleet Engine Operations

```
POST /api/fleet/location
PUT  /api/fleet/drivers/{driverId}/status
POST /api/fleet/drivers/{driverId}/shift/start
POST /api/fleet/drivers/{driverId}/shift/end
GET  /api/fleet/drivers/{driverId}/active-task
GET  /api/fleet/drivers/{driverId}/swap-tasks
POST /api/fleet/swap-tasks/{taskId}/start
PUT  /api/fleet/swap-tasks/{taskId}/status
GET  /api/fleet/swap-stations/nearby
```

---

## Testing the API

### 1. Login as Driver

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@fleetfi.com",
    "password": "password"
  }'
```

Copy the `token` from the response.

### 2. Get Driver Profile

```bash
curl -X GET http://localhost:8000/api/drivers/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Driver Metrics

```bash
curl -X GET http://localhost:8000/api/drivers/metrics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Update Driver Location

```bash
curl -X POST http://localhost:8000/api/fleet/location \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": 1,
    "latitude": 6.5244,
    "longitude": 3.3792,
    "heading": 90,
    "speed": 45.5,
    "accuracy": 5,
    "timestamp": "2026-01-02T10:30:00Z"
  }'
```

### 5. Update Driver Status

```bash
curl -X PUT http://localhost:8000/api/fleet/drivers/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "available",
    "timestamp": "2026-01-02T10:30:00Z"
  }'
```

### 6. Get Active Swap Task

```bash
curl -X GET http://localhost:8000/api/fleet/drivers/1/active-task \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Get Nearby Swap Stations

```bash
curl -X GET "http://localhost:8000/api/fleet/swap-stations/nearby?latitude=6.5244&longitude=3.3792&radius=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Start Swap Task

```bash
curl -X POST http://localhost:8000/api/fleet/swap-tasks/1/start \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": 1,
    "vehicle_id": null,
    "station_location": {
      "latitude": 6.5244,
      "longitude": 3.3792
    },
    "timestamp": "2026-01-02T10:30:00Z"
  }'
```

### 9. Update Swap Task Status

```bash
curl -X PUT http://localhost:8000/api/fleet/swap-tasks/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "arrived_at_station",
    "driver_id": 1,
    "timestamp": "2026-01-02T10:45:00Z"
  }'
```

---

## Mobile App Configuration

Update the API configuration in your mobile app to point to your backend:

```typescript
// FleetFi-Mobile/src/constants/config.ts
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:8000', // Your computer's IP
  API_PATH: '/api',
  TIMEOUT: 30000,
};
```

**Important:** Replace `192.168.1.100` with your actual local IP address.

Find your IP:
- Windows: Run `ipconfig` in Command Prompt
- Mac/Linux: Run `ifconfig` in Terminal

---

## Troubleshooting

### Migration Errors

If you get foreign key errors, ensure migrations run in order:

```bash
php artisan migrate:rollback
php artisan migrate
```

### 404 Not Found Errors

Ensure the fleet routes are registered in `RouteServiceProvider.php` (Step 1).

Clear route cache:

```bash
php artisan route:clear
php artisan route:cache
```

### CORS Errors

If you get CORS errors from the mobile app, update `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['*'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

### Database Connection

Start your Laravel server with host binding for network access:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

This allows the mobile app to connect from other devices on your network.

---

## Next Steps

1. ✅ Run migrations
2. ✅ Create test driver and swap stations
3. ✅ Test API endpoints with curl/Postman
4. ✅ Update mobile app API configuration
5. ✅ Test mobile app with backend
6. Add more features:
   - Battery inventory management
   - Driver shift reports
   - Swap task analytics
   - Real-time notifications

---

## Database Schema

### drivers
```sql
- id
- user_id (FK to users)
- license_number (unique)
- license_expiry
- vehicle_id (FK to assets, nullable)
- status (enum: offline, available, driving, at_station, on_swap)
- shift_start
- shift_end
- total_swaps
- total_distance_km
- current_latitude
- current_longitude
- last_location_update
- created_at, updated_at
```

### swap_tasks
```sql
- id
- task_number (unique, auto-generated)
- driver_id (FK to drivers, nullable)
- vehicle_id (FK to assets, nullable)
- asset_id (FK to assets, nullable)
- swap_station_id (FK to swap_stations)
- old_battery_id
- new_battery_id
- status (enum: pending, assigned, enroute_to_station, arrived_at_station, swapping, swap_complete, back_to_base, completed, canceled)
- distance_km
- duration_minutes
- battery_level_before
- battery_level_after
- soh_before (State of Health)
- soh_after
- started_at
- completed_at
- created_at, updated_at
```

### swap_stations (updated)
```sql
- id
- name
- location (JSON: {latitude, longitude})
- address (NEW)
- available_batteries (NEW)
- total_capacity (NEW)
- operating_hours (NEW)
- status (NEW: active, inactive, maintenance)
- created_at, updated_at
```

---

**Setup is complete! Your Laravel backend now supports battery swap operations for the FleetFi Mobile app.** 🔋⚡
