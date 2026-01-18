# FleetFi Handover Notes

**Date**: January 17, 2026
**Status**: MVP Complete

---

## Quick Start

```bash
# Start both servers
cd backend && php artisan serve --host=127.0.0.1 --port=8000
# In another terminal
npm run dev
```

**Frontend**: http://localhost:3000 (or 3001/3002 if port occupied)
**Backend**: http://127.0.0.1:8000

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@fleetfi.com | FleetFi@2025! |
| **Operator** | operator1@fleetfi.com | FleetFi@2025! |
| **Investor** | john.investor@example.com | FleetFi@2025! |
| **Driver** | tom.driver@fleetfi.com | FleetFi@2025! |

---

## Recent Sprint 1-2 Implementations

### 1. Contact Form System
- **Backend**: `ContactController.php`, `ContactMessage.php` model
- **Frontend**: `ContactPage.tsx`, `ContactManagement.tsx`
- **Routes**: `POST /api/contact` (public), `/api/admin/contacts/*` (admin)
- Rate limited: 5 submissions per hour per IP

### 2. Email Notification System
- **Service**: `EmailNotificationService.php`
- **Templates**: `resources/views/emails/*.blade.php`
- **Emails**: Welcome, KYC Status, Investment Confirmation, Payout, Withdrawal, Contact Response
- Configure SMTP in `.env` for production

### 3. KYC Integration
- **Provider**: IdentityPass
- **Service**: `KycService.php`, `IdentityPassProvider.php`
- **Config**: `config/kyc.php`, `.env` variables
- Supports: NIN, BVN, Driver's License, Passport

### 4. Blockchain Token Minting
- **Client**: `TrovotechClient.php`
- **Integration**: `InvestmentController.php` - `attemptBlockchainMint()`
- Sandbox mode enabled by default
- Set `TROVOTECH_SANDBOX_ENABLED=false` for production

---

## Key Files to Know

### Backend
```
backend/
├── app/Http/Controllers/
│   ├── AuthController.php        # Login, Register, Password Reset
│   ├── InvestmentController.php  # Investment + Token minting
│   ├── WalletController.php      # Wallet operations
│   ├── PaymentController.php     # Paystack/Flutterwave
│   ├── AdminDashboardController.php # Admin operations
│   └── ContactController.php     # Contact form
├── app/Services/
│   ├── TrovotechClient.php       # Blockchain API
│   ├── EmailNotificationService.php # All emails
│   └── Kyc/KycService.php        # KYC verification
├── config/
│   ├── cors.php                  # CORS settings (ports 3000-3002)
│   ├── kyc.php                   # KYC provider config
│   └── sanctum.php               # API auth config
└── routes/api.php                # All API routes
```

### Frontend
```
src/
├── services/api.ts               # API client (AuthAPI, InvestmentAPI, etc.)
├── contexts/AuthContext.tsx      # Global auth state
├── pages/
│   ├── InvestorDashboard.tsx
│   ├── OperatorDashboard.tsx
│   ├── AdminDashboardPage.tsx
│   └── ContactPage.tsx
└── components/
    ├── InvestmentWizard.tsx      # Investment flow
    ├── KycModal.tsx              # KYC verification UI
    └── ContactManagement.tsx     # Admin contact management
```

---

## Environment Variables

### Backend (.env) - Key Settings
```env
# Must configure for production:
APP_ENV=production
APP_DEBUG=false

# Database
DB_CONNECTION=mysql  # Switch from sqlite

# CORS - Add production frontend URL
CORS_ALLOWED_ORIGINS=https://your-frontend.com

# Email - Configure real SMTP
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-key

# KYC
KYC_PROVIDER=identitypass
IDENTITYPASS_API_KEY=your-production-key

# Blockchain
TROVOTECH_SANDBOX_ENABLED=false
TROVOTECH_API_KEY=your-production-key

# Payments
PAYSTACK_SECRET_KEY=sk_live_xxx
```

---

## Common Tasks

### Add a New API Endpoint
1. Create/update controller in `app/Http/Controllers/`
2. Add route in `routes/api.php`
3. Add method to `src/services/api.ts`

### Add a New Email Template
1. Create Mailable in `app/Mail/`
2. Create view in `resources/views/emails/`
3. Add method to `EmailNotificationService.php`

### Add a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `Header.tsx`

### Reset Test Data
```bash
cd backend
php artisan migrate:fresh
php artisan db:seed --class=MVPDemoSeeder
```

---

## Troubleshooting Quick Fixes

### CORS Error
```bash
# Update cors.php to include frontend port, then:
php artisan config:clear
# Restart backend
```

### 401 Unauthorized
- Check token in localStorage
- Verify user exists: `php artisan tinker` → `User::where('email', '...')`

### Database Issues
```bash
php artisan migrate:status
php artisan migrate --force
```

### Clear All Caches
```bash
php artisan cache:clear && php artisan config:clear && php artisan route:clear
```

---

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│  React Frontend │ ◄─────► │  Laravel API    │
│  (Vite + TS)    │  HTTP   │  (Sanctum Auth) │
└─────────────────┘         └────────┬────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   IdentityPass  │       │    TrovoTech    │       │ Paystack/Flutter│
│      (KYC)      │       │   (Blockchain)  │       │    (Payments)   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## New Features Added (January 2026)

### Data Export APIs
All endpoints return CSV files for download:
- `GET /api/export/portfolio.csv` - Investment portfolio export (investors)
- `GET /api/export/transactions.csv` - Wallet transactions (all users)
- `GET /api/export/earnings.csv` - Driver earnings (drivers)
- `GET /api/export/fleet.csv` - Fleet report (operators/admin)
- `GET /api/export/payouts.csv` - Payout history (investors)

### Telemetry API
Real-time vehicle telemetry endpoints:
- `GET /api/telemetry/live` - Live vehicle telemetry
- `GET /api/telemetry/alerts` - Active alerts
- `GET /api/telemetry/{assetId}/statistics` - Historical stats

### Payout Distribution API
Revenue distribution to investors:
- `GET /api/payouts/my` - Investor's payout history
- `GET /api/payouts/assets` - Assets ready for distribution
- `POST /api/payouts/distribute` - Distribute revenue
- `GET /api/payouts/history` - Distribution history

### Battery Swap Enhancement
Enhanced driver swap workflow:
- `POST /api/fleet/swap-tasks` - Create new swap task
- `GET /api/fleet/drivers/me/active-task` - Current active task
- `GET /api/fleet/drivers/me/swap-tasks` - Swap history
- `GET /api/fleet/drivers/me/swap-stats` - Swap statistics

### Notification System

Backend notification with database persistence:

- `GET /api/notifications` - User notifications
- `GET /api/notifications/unread-count` - Unread count
- `POST /api/notifications/{id}/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read
- `DELETE /api/notifications/{id}` - Delete notification

### User Profile & Settings

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password
- Frontend page: `UserProfilePage.tsx`

### New Frontend Components

- `QuickStatsWidget.tsx` - Role-based quick stats display
- `NotificationBell.tsx` - Header notification dropdown
- `LiveStatusIndicator.tsx` - Live update status indicator
- `useLiveUpdates.ts` - Polling hooks for real-time data

---

## Known Limitations / TODO

1. **Email**: Currently using `log` mailer in dev - configure SMTP for production
2. **Blockchain**: Sandbox mode enabled - disable for real token minting
3. **KYC**: Using test API keys - update for production
4. **Payments**: Test keys configured - update for live payments
5. **Database**: SQLite for dev - migrate to MySQL/PostgreSQL for production

---

## Support

- **Full Documentation**: See `DEVELOPER_DOCUMENTATION.md`
- **API Routes**: Run `php artisan route:list`
- **Logs**: `backend/storage/logs/laravel.log`

Good luck with the project!
