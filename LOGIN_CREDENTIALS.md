# FleetFi Production Login Credentials

**Last Updated:** November 10, 2025  
**Environment:** Development/Production Ready  
**Database:** SQLite (development)  
**Backend:** http://127.0.0.1:8000  
**Frontend:** http://localhost:3000

---

## ✅ SYSTEM STATUS CHECK

### Server Status
- ✅ Backend running on port 8000
- ✅ Frontend running on port 3000  
- ✅ All migrations applied (34 migrations)
- ✅ .env files configured
- ✅ 59 test users seeded

### Recent Updates (Nov 10, 2025)
- ✅ Enhanced user flow with role pre-selection
- ✅ Analytics tracking system (5 tables)
- ✅ Role capabilities management
- ✅ Real-time telemetry widget
- ✅ Improved API structure with modular design

---

## Quick Access

### Admin Account
- **Email:** `admin@fleetfi.com`
- **Password:** `password` (simple for development)
- **Role:** Admin
- **Access:** Full system administration, analytics dashboard, user management

---

## All User Accounts

### 1. Admin User
- **Email:** `admin@fleetfi.com`
- **Password:** `Fleet@Admin2025!`
- **Role:** Admin
- **KYC Status:** Verified ✓
- **Permissions:** Full system access

### 2. Fleet Operator
- **Email:** `operator@fleetfi.com`
- **Password:** `Operator@2025!`
- **Role:** Operator
- **KYC Status:** Verified ✓
- **Permissions:** Asset management, ride monitoring, revenue distribution

### 3. Operations Manager
- **Email:** `ops.manager@fleetfi.com`
- **Password:** `OpsManager@2025!`
- **Role:** Operator
- **KYC Status:** Verified ✓
- **Permissions:** Fleet operations, scheduling, telemetry monitoring

### 4. Sarah Investor
- **Email:** `sarah.investor@example.com`
- **Password:** `Sarah@Invest2025!`
- **Role:** Investor
- **KYC Status:** Verified ✓
- **Permissions:** View assets, invest in tokenized vehicles, track ROI

### 5. Michael Chen
- **Email:** `michael.chen@example.com`
- **Password:** `Michael@Invest2025!`
- **Role:** Investor
- **KYC Status:** Verified ✓
- **Permissions:** Investment portfolio, revenue tracking

### 6. Amara Okafor
- **Email:** `amara.okafor@example.com`
- **Password:** `Amara@Invest2025!`
- **Role:** Investor
- **KYC Status:** Pending (demo KYC flow)
- **Permissions:** Limited - must complete KYC to invest

### 7. David Thompson
- **Email:** `david.thompson@example.com`
- **Password:** `David@Invest2025!`
- **Role:** Investor
- **KYC Status:** Verified ✓
- **Permissions:** Full investor access

### 8. James Driver
- **Email:** `james.driver@example.com`
- **Password:** `James@Drive2025!`
- **Role:** Driver
- **KYC Status:** Submitted (under review)
- **Permissions:** View assigned vehicles, track earnings

### 9. Chioma Nwankwo
- **Email:** `chioma.driver@example.com`
- **Password:** `Chioma@Drive2025!`
- **Role:** Driver
- **KYC Status:** Verified ✓
- **Permissions:** Full driver access

### 10. Abdul Rahman
- **Email:** `abdul.driver@example.com`
- **Password:** `Abdul@Drive2025!`
- **Role:** Driver
- **KYC Status:** Pending
- **Permissions:** Basic driver access

---

## Role Breakdown

| Role     | Count | KYC Verified | Main Features |
|----------|-------|--------------|---------------|
| Admin    | 1     | 1            | User management, system config, revenue analytics |
| Operator | 2     | 2            | Fleet operations, ride monitoring, payout distribution |
| Investor | 4     | 3            | Asset investment, portfolio tracking, ROI visibility |
| Driver   | 3     | 1            | Vehicle assignment, earnings tracking |

---

## Testing Scenarios

### KYC Flow Testing
- **Verified User:** sarah.investor@example.com (can invest immediately)
- **Pending User:** amara.okafor@example.com (blocked from investing, shows KYC prompt)
- **Submitted User:** james.driver@example.com (under review status)

### Revenue Distribution Testing
- Login as `operator@fleetfi.com`
- Navigate to Revenue Distribution
- Initiate payout to test TrovoTech integration

### Investment Flow Testing
- Login as `michael.chen@example.com`
- Create wallet if needed
- Browse available assets
- Mint token to test investment process

---

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. **Change all passwords** before deploying to production
2. **Enable 2FA** for admin and operator accounts
3. **Use environment-specific credentials** - never commit real passwords to git
4. **Rotate secrets** regularly (JWT, API keys, wallet seeds)
5. **Set up proper SSL/TLS** for all API communication

---

## Database Seeding

To recreate these users in a fresh database:

```bash
# Backend directory
cd backend

# Run production users seeder
php artisan db:seed --class=ProductionUsersSeeder

# Optional: Seed demo data (rides, assets, telemetry)
php artisan db:seed --class=MegaDemoSeeder
```

---

## API Access

All users can authenticate via:

```bash
POST /api/login
Content-Type: application/json

{
  "email": "admin@fleetfi.com",
  "password": "Fleet@Admin2025!"
}
```

Response includes Bearer token for subsequent API calls.

---

**Support:** admin@fleetfi.com  
**Documentation:** `/docs` directory
