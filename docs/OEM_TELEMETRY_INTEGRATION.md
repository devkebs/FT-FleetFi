# Live OEM Telemetry Integration

## Overview
FleetFi now supports real-time telemetry ingestion from OEM (Original Equipment Manufacturer) systems like Qoura, vehicle manufacturers, and IoT devices. This allows operators to monitor fleet health, location, and performance in real-time.

---

## Features

### 1. **OEM Webhook Endpoint**
- **URL**: `POST /api/telemetry`
- **Authentication**: API key via `X-OEM-API-Key` header or `Authorization: Bearer <key>`
- **Public endpoint** (no session auth required)
- **Accepts** telemetry data from multiple OEM sources

### 2. **Real-Time Dashboard**
- Live telemetry panel in Operator Dashboard
- Auto-refresh every 5 seconds
- Shows active assets from last 5 minutes
- Color-coded status indicators
- Battery level progress bars
- Detailed metrics (speed, temperature, voltage, current)

### 3. **Secure API Key Management**
- OEM API key stored encrypted in database
- Configured via Admin Dashboard → Settings
- Key: `oem_telemetry_api_key`
- Masked as `********` in UI

### 4. **Enhanced Telemetry Data**
New fields supported:
- `temperature` - Battery temperature in Celsius
- `voltage` - Battery voltage
- `current` - Current draw/charge in Amps
- `oem_source` - Source identifier (e.g., 'qoura', 'manufacturer_x')

---

## Setup Instructions

### Step 1: Configure OEM API Key (Admin)

1. Login as **admin**
2. Navigate to **Admin Dashboard** → **Settings** tab
3. Find `oem_telemetry_api_key` setting
4. Enter a strong API key (e.g., `oem-prod-key-abc123xyz`)
5. Click **Save**
6. Optionally toggle `oem_telemetry_enabled` to `true` (default)

The key will be encrypted at rest and used to authenticate incoming webhooks.

### Step 2: Create Sample Assets

Before receiving telemetry, ensure you have assets in the system:

```powershell
# Via Admin Dashboard → Assets tab, create assets with IDs like:
# - VEH001, VEH002, VEH003 (vehicles)
# - BAT001, BAT002 (batteries)
# - CAB001 (charging cabinets)
```

### Step 3: Configure OEM to Send Telemetry

Provide your OEM partner with:
- **Webhook URL**: `https://your-domain.com/api/telemetry`
- **API Key**: The value you set in `oem_telemetry_api_key`
- **Payload format** (see below)

---

## API Reference

### Endpoint: POST /api/telemetry

#### Request Headers
```http
POST /api/telemetry HTTP/1.1
Host: api.fleetfi.com
Content-Type: application/json
X-OEM-API-Key: your-configured-api-key
Accept: application/json
```

#### Request Body
```json
{
  "asset_id": "VEH001",
  "battery_level": 75,
  "km": 125.5,
  "latitude": 6.5244,
  "longitude": 3.3792,
  "speed": 45,
  "status": "in_transit",
  "temperature": 32.5,
  "voltage": 48.2,
  "current": 15.3,
  "recorded_at": "2025-11-09T14:30:00Z",
  "oem_source": "qoura"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset_id` | string | **Yes** | Unique asset identifier (must exist in FleetFi) |
| `battery_level` | integer | No | Battery percentage (0-100) |
| `km` | number | No | Total kilometers traveled |
| `latitude` | number | No | GPS latitude |
| `longitude` | number | No | GPS longitude |
| `speed` | integer | No | Current speed in km/h |
| `status` | string | No | One of: `idle`, `in_transit`, `charging`, `swapping` |
| `temperature` | number | No | Battery temperature in Celsius |
| `voltage` | number | No | Battery voltage |
| `current` | number | No | Current in Amps (positive = draw, negative = charge) |
| `recorded_at` | datetime | **Yes** | Timestamp when data was recorded (ISO 8601) |
| `oem_source` | string | No | OEM identifier (e.g., 'qoura', 'manufacturer_x') |

#### Success Response (201 Created)
```json
{
  "message": "Telemetry data stored successfully",
  "telemetry": {
    "id": 123,
    "asset_id": "VEH001",
    "battery_level": 75,
    "recorded_at": "2025-11-09T14:30:00.000000Z",
    ...
  }
}
```

#### Error Response (401 Unauthorized)
```json
{
  "message": "Unauthorized"
}
```

#### Error Response (422 Validation Error)
```json
{
  "errors": {
    "asset_id": ["The asset id field is required."],
    "recorded_at": ["The recorded at field is required."]
  }
}
```

---

## Testing with Simulator

### Quick Test
Use the included PowerShell script to simulate OEM telemetry:

```powershell
# 1. Set the OEM API key in Admin Dashboard first
# 2. Run the simulator
.\simulate-telemetry.ps1
```

The script sends telemetry for 4 sample assets (VEH001-003, BAT001).

### Manual Test with cURL
```bash
curl -X POST http://127.0.0.1:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -H "X-OEM-API-Key: test-oem-key-123" \
  -d '{
    "asset_id": "VEH001",
    "battery_level": 80,
    "km": 150.5,
    "latitude": 6.5244,
    "longitude": 3.3792,
    "speed": 50,
    "status": "in_transit",
    "temperature": 30.0,
    "voltage": 48.5,
    "current": 12.0,
    "recorded_at": "2025-11-09T10:00:00Z",
    "oem_source": "qoura"
  }'
```

---

## Live Dashboard Usage

### Accessing Live Telemetry

1. Login as **operator**
2. Navigate to **Operator Dashboard**
3. Scroll to **Live Fleet Telemetry** section

### Dashboard Features

**Auto-Refresh**
- Toggle on/off with switch in header
- Refreshes every 5 seconds when enabled
- Manual refresh button available

**Asset Cards**
Each card displays:
- Asset ID and type icon
- Current status badge (in_transit, charging, idle, swapping)
- Battery level with color-coded progress bar
- Metrics: distance, speed, temperature, voltage, current
- GPS coordinates (if available)
- OEM source identifier
- Data age indicator (green = fresh <60s, yellow = older)

**Status Colors**
- 🟢 Charging - Green
- 🔵 In Transit - Blue
- ⚪ Idle - Gray
- 🟡 Swapping - Yellow

**Battery Level Colors**
- 🟢 > 60% - Green (healthy)
- 🟡 30-60% - Yellow (moderate)
- 🔴 < 30% - Red (low)

---

## Backend Implementation Details

### Authentication Flow
1. Incoming POST to `/api/telemetry`
2. Extract API key from `X-OEM-API-Key` header or `Authorization: Bearer` token
3. Compare with encrypted `oem_telemetry_api_key` from ConfigSetting
4. If no key configured, allow (backward compatibility)
5. If key set, require match (constant-time comparison)

### Data Processing
1. Validate payload structure
2. Create Telemetry record
3. Update related Asset (SOH, location)
4. Dispatch event for real-time broadcast (future: WebSocket/SSE)
5. Log success/failure

### Database Schema
```sql
CREATE TABLE telemetries (
  id INTEGER PRIMARY KEY,
  asset_id VARCHAR NOT NULL,
  battery_level INTEGER,
  km DECIMAL(10,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  speed INTEGER,
  status VARCHAR,
  temperature DECIMAL(5,2),  -- NEW
  voltage DECIMAL(6,2),       -- NEW
  current DECIMAL(6,2),       -- NEW
  oem_source VARCHAR(50),     -- NEW
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX(asset_id),
  INDEX(recorded_at),
  INDEX(oem_source)
);
```

---

## Live Telemetry Endpoint

### GET /api/telemetry/live
Fetches latest telemetry for all active assets.

**Auth**: Required (operator or admin)

**Response**:
```json
{
  "telemetry": [
    {
      "asset_id": "VEH001",
      "asset_type": "vehicle",
      "asset_model": "Thunder E-Bike",
      "battery_level": 75,
      "km": 125.5,
      "speed": 45,
      "status": "in_transit",
      "temperature": 32.5,
      "recorded_at": "2025-11-09T14:30:00Z",
      "oem_source": "qoura",
      "age_seconds": 12
    }
  ],
  "count": 1,
  "as_of": "2025-11-09T14:30:12Z"
}
```

**Filters**:
- Only returns telemetry from last 5 minutes
- Groups by asset_id, returns most recent per asset
- Enriches with asset details (type, model)
- Calculates data age in seconds

---

## Security Considerations

1. **API Key Encryption**
   - OEM API key encrypted at rest using Laravel's `encrypt()`
   - Uses application `APP_KEY` from `.env`
   - Never logged in plain text

2. **Timing Attack Prevention**
   - Uses `hash_equals()` for constant-time key comparison
   - Prevents timing-based key discovery

3. **Rate Limiting** (TODO)
   - Implement rate limiting for webhook endpoint
   - Suggested: 1000 requests/hour per OEM

4. **IP Whitelisting** (TODO)
   - Allow restricting webhook to specific IP ranges
   - Store in ConfigSetting: `oem_telemetry_allowed_ips`

---

## Monitoring & Debugging

### Logs
All telemetry submissions are logged:
```php
Log::info('Telemetry stored', [
    'asset_id' => 'VEH001',
    'source' => 'qoura'
]);
```

Check logs:
```bash
tail -f backend/storage/logs/laravel.log
```

### Failed Submissions
Unauthorized attempts logged:
```php
Log::warning('Unauthorized telemetry submission attempt', [
    'ip' => '192.168.1.100',
    'headers' => [...]
]);
```

---

## Future Enhancements

1. **WebSocket Broadcasting**
   - Real-time push to dashboard (no polling)
   - Use Laravel Echo + Pusher/Socket.io

2. **Telemetry Alerts**
   - Low battery warnings
   - Temperature threshold alerts
   - Geofencing notifications

3. **Historical Analytics**
   - Battery degradation trends
   - Usage patterns
   - Route optimization insights

4. **Multi-OEM Support**
   - Multiple API keys per OEM
   - OEM-specific data transformation

5. **Telemetry Replay**
   - Record and replay for testing
   - Debug anomalies

---

## Troubleshooting

### Issue: "Unauthorized" error
- **Cause**: API key mismatch
- **Fix**: Verify `oem_telemetry_api_key` in Admin Settings matches header value

### Issue: Telemetry not showing in dashboard
- **Cause 1**: Asset doesn't exist
- **Fix**: Create asset with matching `asset_id` first
- **Cause 2**: Data older than 5 minutes
- **Fix**: Send fresh telemetry with current `recorded_at`

### Issue: Dashboard not auto-refreshing
- **Cause**: Auto-refresh toggle off
- **Fix**: Enable toggle in Live Telemetry panel header

---

## Support

For integration support, contact:
- Technical: dev@fleetfi.com
- Documentation: https://docs.fleetfi.com/telemetry
