# FleetFi - Quick Start Guide

## Current Status
✅ Database configured (SQLite)  
✅ Migrations run  
✅ Demo data seeded  
✅ Admin user created  
✅ Frontend dependencies installed

## Starting the Application

### Option 1: Automated Startup (Recommended)
```powershell
.\start.ps1
```

This will:
- Check database exists
- Start Laravel backend on http://localhost:8000
- Start Vite frontend on http://localhost:3000
- Display login credentials

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```powershell
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

## Login Credentials

### Admin
- URL: http://localhost:3000 → Admin Login
- Email: `admin@fleetfi.com`
- Password: `Fleet@123`

### Test Users
- **Operators**: operator1@fleetfi.local (Password123!)
- **Investors**: investor1@fleetfi.local (Password123!)
- **Drivers**: driver1@fleetfi.local (Password123!)

See `LOGIN_CREDENTIALS.md` for full list.

## Troubleshooting

### "Failed to fetch" error on login

**Cause**: Backend server not running or not accessible

**Solution**:
1. Check backend is running: `netstat -an | Select-String ":8000"`
2. If not listening, restart: `cd backend; php artisan serve --host=0.0.0.0 --port=8000`
3. Verify in browser: http://localhost:8000/api/user (should return 401 Unauthenticated)

### Frontend shows "Backend offline" banner

**Cause**: Cannot connect to http://localhost:8000

**Solution**:
1. Ensure Laravel server running on port 8000
2. Check Windows Firewall isn't blocking localhost
3. Try accessing http://127.0.0.1:8000/api/user directly

### Database errors

**Reset database**:
```powershell
cd backend
php artisan migrate:fresh --seed
```

This will:
- Drop all tables
- Re-run migrations
- Seed with admin + demo users

## Architecture

- **Frontend**: React + TypeScript + Vite (port 3000)
- **Backend**: Laravel 10 + Sanctum (port 8000)
- **Database**: SQLite (`backend/database/database.sqlite`)

## API Endpoints

Test with:
```powershell
# Login
$body = @{email='admin@fleetfi.com'; password='Fleet@123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8000/api/login' -Method Post -Body $body -ContentType 'application/json'

# Capabilities (requires token from login)
Invoke-RestMethod -Uri 'http://localhost:8000/api/capabilities' -Headers @{Authorization="Bearer YOUR_TOKEN"}
```

## Testing

```powershell
cd backend

# Test all role capabilities
php artisan smoke:capabilities

# Test admin login
php scripts/test_admin_login.php

# Test investor assets access
php scripts/test_investor_assets.php
```

## Next Steps

1. Start servers with `.\start.ps1`
2. Open http://localhost:3000
3. Login as admin (admin@fleetfi.com / Fleet@123)
4. Explore dashboards, create assets, manage users

---

**Need help?** Check the full documentation in `/docs` folder.
