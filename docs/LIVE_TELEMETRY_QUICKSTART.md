# Live OEM Telemetry - Quick Start Guide

## 🚀 What's New

FleetFi now supports **real-time telemetry ingestion** from OEM systems (Qoura, vehicle manufacturers, IoT devices). Monitor your fleet's battery levels, location, speed, temperature, and more—live!

---

## ✨ Features Implemented

✅ **Secure OEM Webhook** - POST `/api/telemetry` with API key authentication  
✅ **Live Dashboard Panel** - Auto-refreshing telemetry cards (5s intervals)  
✅ **Enhanced Data Fields** - Temperature, voltage, current, OEM source  
✅ **Encrypted API Keys** - Stored securely at rest  
✅ **Admin Configuration** - Manage OEM API keys via Settings tab  
✅ **Test Simulator** - PowerShell script to simulate live data  

---

## 🧪 Quick Test (5 minutes)

### 1. Configure OEM API Key
```
1. Login as admin
2. Go to Admin Dashboard → Settings tab
3. Find oem_telemetry_api_key
4. Enter: test-oem-key-123
5. Click Save
```

### 2. Create Sample Assets
```
1. Go to Admin Dashboard → Assets tab
2. Create 3-4 assets with IDs: VEH001, VEH002, BAT001
   - Type: vehicle or battery
   - Status: active
```

### 3. Send Test Telemetry
```powershell
# Open PowerShell in project root
.\simulate-telemetry.ps1
```

You should see:
```
========================================
   OEM Telemetry Simulator for FleetFi
========================================

Sending 4 telemetry updates...

[14:30:00] Sending telemetry for VEH001... SUCCESS
   └─ Battery: 75% | Speed: 45 km/h | Status: in_transit
...
```

### 4. View Live Dashboard
```
1. Login as operator
2. Go to Operator Dashboard
3. Scroll to "Live Fleet Telemetry" section
4. See real-time asset cards with:
   - Battery levels with color-coded bars
   - Speed, temperature, voltage, current
   - GPS coordinates
   - Data age indicator
```

---

## 📡 Integration for OEM Partners

### Webhook Configuration
```http
POST https://your-fleetfi-domain.com/api/telemetry
Content-Type: application/json
X-OEM-API-Key: your-configured-api-key

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

### cURL Example
```bash
curl -X POST http://127.0.0.1:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -H "X-OEM-API-Key: test-oem-key-123" \
  -d '{
    "asset_id": "VEH001",
    "battery_level": 80,
    "recorded_at": "2025-11-09T10:00:00Z",
    "oem_source": "qoura"
  }'
```

---

## 📁 Files Modified/Created

### Backend
- ✏️ `app/Http/Controllers/TelemetryController.php` - Enhanced with OEM auth, live endpoint
- ✏️ `app/Models/Telemetry.php` - Added temp/voltage/current/oem_source fields
- ✏️ `app/Http/Controllers/AdminController.php` - Added oem_telemetry_api_key config
- ✏️ `app/Models/ConfigSetting.php` - Added oem_telemetry_api_key to encrypted keys
- ✏️ `routes/api.php` - Added GET `/api/telemetry/live` route
- ✏️ `database/migrations/..._create_telemetries_table.php` - Added new columns

### Frontend
- ✨ `src/components/LiveTelemetryPanel.tsx` - New live telemetry dashboard component
- ✏️ `src/pages/OperatorDashboard.tsx` - Integrated LiveTelemetryPanel

### Testing & Documentation
- ✨ `simulate-telemetry.ps1` - OEM telemetry simulator script
- ✨ `docs/OEM_TELEMETRY_INTEGRATION.md` - Full integration guide
- ✨ `docs/LIVE_TELEMETRY_QUICKSTART.md` - This file

---

## 🎯 Next Steps

1. **Database Migration**
   ```bash
   cd backend
   php artisan migrate:fresh --seed
   ```
   (Note: Will reset database - create backup first if needed)

2. **Test the Integration**
   - Run the simulator script
   - Verify data in live dashboard
   - Check audit logs in Admin → Logs tab

3. **Production Setup**
   - Generate secure OEM API key
   - Configure webhook URL with OEM partner
   - Set up monitoring/alerts

---

## 🔒 Security Notes

- OEM API key encrypted at rest (uses Laravel's `encrypt()`)
- Constant-time comparison prevents timing attacks
- All webhook attempts logged (success & failure)
- No key configured = allow all (backward compatibility)

---

## 📊 Dashboard Features

### Auto-Refresh
- Toggle on/off (default: on)
- Refreshes every 5 seconds
- Manual refresh button

### Asset Cards
Each card shows:
- 🔋 Battery level (color-coded: green >60%, yellow 30-60%, red <30%)
- 🚗 Speed, distance, GPS location
- 🌡️ Temperature, voltage, current
- 📡 OEM source identifier
- ⏱️ Data age (green <60s, yellow >60s)
- 🏷️ Status badge (in_transit, charging, idle, swapping)

---

## ❓ Troubleshooting

**Issue**: "Unauthorized" error  
**Fix**: Verify OEM API key matches in both Admin Settings and webhook request

**Issue**: Telemetry not showing  
**Fix**: Ensure asset_id exists in system; check data is <5 minutes old

**Issue**: Dashboard not refreshing  
**Fix**: Enable auto-refresh toggle; check browser console for errors

---

## 📚 Full Documentation

See `docs/OEM_TELEMETRY_INTEGRATION.md` for:
- Complete API reference
- Security best practices
- Monitoring & debugging
- Future enhancements roadmap

---

## 🎉 Success Criteria

You'll know it's working when:
✅ Simulator shows all "SUCCESS" messages  
✅ Live dashboard displays asset cards  
✅ Battery bars animate and update  
✅ Data age shows "Xs ago" and increments  
✅ Auto-refresh fetches new data every 5s  

---

**Questions?** Check `docs/OEM_TELEMETRY_INTEGRATION.md` or contact support.
