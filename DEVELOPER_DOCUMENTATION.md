# FleetFi Developer Documentation

**Version**: 1.0 (MVP)
**Last Updated**: January 17, 2026
**Platform**: Tokenized EV Fleet Finance Platform

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Backend (Laravel)](#5-backend-laravel)
6. [Frontend (React)](#6-frontend-react)
7. [API Reference](#7-api-reference)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Database Schema](#9-database-schema)
10. [External Integrations](#10-external-integrations)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)
13. [Environment Variables](#13-environment-variables)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Project Overview

FleetFi is a tokenized electric vehicle (EV) fleet finance platform that enables:
- **Investors** to purchase tokenized shares in EV fleet assets
- **Operators** to manage fleet operations, vehicles, and revenue distribution
- **Drivers** to track earnings, trips, and vehicle assignments
- **Admins** to oversee the entire platform, users, and system settings

### Key Features
- Tokenized asset investment with blockchain integration (Stellar/TrovoTech)
- Real-time vehicle telemetry and fleet operations monitoring
- KYC verification with IdentityPass
- Payment processing via Paystack and Flutterwave
- Multi-role dashboard system
- Battery swap station management
- Revenue distribution and payout system

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 6.4 | Build Tool & Dev Server |
| React Router | 7.9 | Client-side Routing |
| TailwindCSS | 4.1 | Utility-first CSS |
| Bootstrap | 5.3 | UI Components |
| Recharts | 3.4 | Data Visualization |
| Leaflet | 1.9 | Maps |
| Zod | 4.1 | Schema Validation |
| Stellar SDK | 13.1 | Blockchain Integration |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Laravel | 9.19 | PHP Framework |
| PHP | 8.0.2+ | Server Language |
| Sanctum | 3.3 | API Authentication |
| SQLite | - | Development Database |
| Guzzle | 7.2 | HTTP Client |
| Doctrine DBAL | 3.10 | Database Abstraction |

---

## 3. Project Structure

```
FT-FleetFi-1/
├── backend/                     # Laravel API Server
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/     # API Controllers (30+)
│   │   │   └── Middleware/      # Auth & Rate Limiting
│   │   ├── Models/              # Eloquent Models (40+)
│   │   └── Services/            # Business Logic Services
│   ├── config/                  # Configuration Files
│   ├── database/
│   │   ├── migrations/          # Database Migrations (54)
│   │   ├── seeders/             # Data Seeders (22)
│   │   └── factories/           # Model Factories
│   ├── routes/
│   │   ├── api.php              # Main API Routes
│   │   └── fleet.php            # Fleet-specific Routes
│   └── resources/views/emails/  # Email Templates
│
├── src/                         # React Frontend
│   ├── components/              # React Components (49)
│   ├── pages/                   # Page Components (19)
│   ├── services/                # API Services (12)
│   ├── contexts/                # React Contexts
│   ├── utils/                   # Utility Functions
│   └── types.ts                 # TypeScript Interfaces
│
├── docs/                        # Documentation
├── package.json                 # Frontend Dependencies
├── vite.config.ts               # Vite Configuration
└── docker-compose.yml           # Docker Setup
```

---

## 4. Getting Started

### Prerequisites
- Node.js 18+ and npm
- PHP 8.0.2+
- Composer 2.x
- SQLite (or MySQL/PostgreSQL for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FT-FleetFi-1
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   composer install
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Run Migrations & Seeders**
   ```bash
   php artisan migrate
   php artisan db:seed --class=MVPDemoSeeder
   ```

6. **Start Development Servers**

   **Option A: PowerShell Script**
   ```powershell
   ./start-all.ps1
   ```

   **Option B: Manual Start**
   ```bash
   # Terminal 1 - Backend (port 8000)
   cd backend
   php artisan serve --host=127.0.0.1 --port=8000

   # Terminal 2 - Frontend (port 3000)
   npm run dev
   ```

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fleetfi.com | FleetFi@2025! |
| Operator | operator1@fleetfi.com | FleetFi@2025! |
| Investor | john.investor@example.com | FleetFi@2025! |
| Driver | tom.driver@fleetfi.com | FleetFi@2025! |

---

## 5. Backend (Laravel)

### Directory Structure

```
backend/app/
├── Http/Controllers/
│   ├── AuthController.php          # Authentication
│   ├── InvestmentController.php    # Investment operations
│   ├── WalletController.php        # Wallet management
│   ├── PaymentController.php       # Payment processing
│   ├── VehicleController.php       # Vehicle management
│   ├── TelemetryController.php     # Real-time telemetry
│   ├── KycController.php           # KYC verification
│   ├── AdminDashboardController.php # Admin operations
│   ├── ContactController.php       # Contact form
│   └── ... (30+ controllers)
│
├── Models/
│   ├── User.php                    # User model with roles
│   ├── Vehicle.php                 # Fleet vehicles
│   ├── Investment.php              # Investment records
│   ├── Wallet.php                  # User wallets
│   ├── WalletTransaction.php       # Wallet transactions
│   ├── Asset.php                   # Tokenized assets
│   ├── Token.php                   # Blockchain tokens
│   ├── Payout.php                  # Revenue payouts
│   └── ... (40+ models)
│
├── Services/
│   ├── TrovotechClient.php         # Blockchain API client
│   ├── EmailNotificationService.php # Email notifications
│   ├── PaymentService.php          # Payment processing
│   ├── StellarWalletHelper.php     # Stellar blockchain
│   └── Kyc/
│       ├── KycService.php          # KYC orchestration
│       └── IdentityPassProvider.php # IdentityPass integration
```

### Key Controllers

#### AuthController
Handles user authentication, registration, and password reset.

```php
// Routes
POST /api/register     # User registration (creates wallet)
POST /api/login        # User login (returns Sanctum token)
POST /api/logout       # Logout (revokes token)
POST /api/forgot-password
POST /api/reset-password
```

#### InvestmentController
Manages investment operations and portfolio.

```php
// Routes (Protected)
GET  /api/invest/portfolio     # User's investment portfolio
GET  /api/invest/performance   # Performance analytics
GET  /api/invest/history       # Transaction history
GET  /api/invest/assets        # Available assets
POST /api/invest/purchase      # Purchase investment
POST /api/invest/simulate-payout # Simulate payout distribution
```

#### WalletController
Handles wallet operations and transactions.

```php
// Routes (Protected)
GET  /api/wallet/me            # User's wallet
GET  /api/wallet/me/stats      # Wallet statistics
POST /api/wallet/transfer      # Transfer funds
POST /api/wallet/deposit       # Deposit to wallet
POST /api/wallet/withdraw      # Withdraw from wallet
```

### Services

#### TrovotechClient
Client for TrovoTech blockchain API integration.

```php
// Key Methods
$client->isConfigured()              // Check if API configured
$client->testConnection()            // Test API connectivity
$client->onboardUser($userData)      // Onboard user to blockchain
$client->initTokenMint(...)          // Initialize token minting
$client->commitTokenMint(...)        // Commit signed transaction
```

#### EmailNotificationService
Sends transactional emails.

```php
// Key Methods
$service->sendWelcomeEmail($user)
$service->sendKYCVerificationEmail($user, $status)
$service->sendInvestmentConfirmation($user, $investment, $token)
$service->sendPayoutNotification($user, $payout)
$service->sendWithdrawalStatusNotification($user, $status, $amount)
$service->sendContactResponse($email, $name, $message, $response)
```

---

## 6. Frontend (React)

### Directory Structure

```
src/
├── components/
│   ├── Header.tsx              # Navigation header
│   ├── Dashboard.tsx           # Dashboard layout
│   ├── Login.tsx               # Login form
│   ├── Register.tsx            # Registration form
│   ├── WalletWidget.tsx        # Wallet display
│   ├── InvestmentWizard.tsx    # Investment flow
│   ├── InvestmentModal.tsx     # Investment modal
│   ├── KycModal.tsx            # KYC verification
│   ├── TelemetryWidget.tsx     # Real-time telemetry
│   ├── PortfolioSummary.tsx    # Portfolio overview
│   ├── ContactManagement.tsx   # Admin contact management
│   └── ... (49 components)
│
├── pages/
│   ├── LandingPage.tsx         # Public landing page
│   ├── InvestorDashboard.tsx   # Investor dashboard
│   ├── OperatorDashboard.tsx   # Operator dashboard
│   ├── DriverDashboard.tsx     # Driver dashboard
│   ├── AdminDashboardPage.tsx  # Admin dashboard
│   ├── InvestmentPortfolioPage.tsx
│   ├── ESGImpactPage.tsx
│   ├── ContactPage.tsx
│   └── ... (19 pages)
│
├── services/
│   ├── api.ts                  # Main API client
│   ├── analytics.ts            # Event tracking
│   ├── kyc.ts                  # KYC operations
│   ├── admin.ts                # Admin operations
│   ├── stellarWallet.ts        # Stellar blockchain
│   ├── trovotech.ts            # TrovoTech integration
│   └── notifications.ts        # Notification management
│
├── contexts/
│   └── AuthContext.tsx         # Global auth state
│
├── utils/
│   ├── apiCache.ts             # Response caching
│   └── validationSchemas.ts    # Zod schemas
│
└── types.ts                    # TypeScript interfaces
```

### API Service (src/services/api.ts)

The main API client handles authentication and all HTTP requests.

```typescript
// Authentication
AuthAPI.register(data)    // Register new user
AuthAPI.login(credentials) // Login user
AuthAPI.logout()          // Logout user
AuthAPI.forgotPassword(email)
AuthAPI.resetPassword(data)

// Investments
InvestmentAPI.getPortfolio()
InvestmentAPI.getAssets()
InvestmentAPI.purchaseInvestment(data)
InvestmentAPI.getPerformance()

// Wallet
WalletAPI.getMyWallet()
WalletAPI.getWalletStats()
WalletAPI.transfer(data)
WalletAPI.withdraw(data)

// Payments
PaymentAPI.initializePayment(data)
PaymentAPI.verifyPayment(reference)
PaymentAPI.fundWallet(data)

// Admin
AdminAPI.getUsers()
AdminAPI.updateUser(id, data)
AdminAPI.getAnalytics()
AdminAPI.getAuditLogs()
```

### Authentication Context

```typescript
// Usage in components
import { useAuth } from '../contexts/AuthContext';

function Component() {
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard user={user} />;
}
```

### Routing (App.tsx)

```typescript
// Route structure
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/investor/*" element={<InvestorDashboard />} />
  <Route path="/operator/*" element={<OperatorDashboard />} />
  <Route path="/driver/*" element={<DriverDashboard />} />
  <Route path="/admin/*" element={<AdminDashboardPage />} />
  <Route path="/portfolio" element={<InvestmentPortfolioPage />} />
  <Route path="/esg" element={<ESGImpactPage />} />
  <Route path="/contact" element={<ContactPage />} />
</Routes>
```

---

## 7. API Reference

### Base URL
- Development: `http://127.0.0.1:8000/api`
- Production: Configure via `VITE_API_URL`

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {sanctum_token}
```

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ping` | Health check |
| GET | `/health` | Detailed health status |
| POST | `/register` | User registration |
| POST | `/login` | User login |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |
| POST | `/contact` | Submit contact form |

### Protected Endpoints

#### User & Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logout` | Logout user |
| GET | `/user` | Get current user |
| GET | `/capabilities` | Get user capabilities |

#### Investment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invest/portfolio` | Get user portfolio |
| GET | `/invest/assets` | List available assets |
| GET | `/invest/assets/{id}` | Get asset details |
| POST | `/invest/purchase` | Purchase investment |
| GET | `/invest/performance` | Portfolio performance |
| GET | `/invest/history` | Transaction history |

#### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet/me` | Get user wallet |
| GET | `/wallet/me/stats` | Wallet statistics |
| POST | `/wallet/transfer` | Transfer funds |
| POST | `/wallet/deposit` | Deposit funds |
| POST | `/wallet/withdraw` | Withdraw funds |

#### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/initialize` | Initialize payment |
| POST | `/payments/verify` | Verify payment |
| POST | `/payments/fund-wallet` | Fund wallet |
| GET | `/payments/history` | Payment history |

#### KYC
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kyc/initiate` | Start KYC verification |
| GET | `/kyc/status` | Check KYC status |
| POST | `/kyc/poll` | Poll KYC provider |

#### Admin (Admin role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/{id}` | Update user |
| GET | `/admin/analytics` | Platform analytics |
| GET | `/admin/contacts` | List contact messages |
| PUT | `/admin/contacts/{id}/status` | Update contact status |

### Request/Response Examples

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@fleetfi.com",
  "password": "FleetFi@2025!"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@fleetfi.com",
    "role": "admin"
  },
  "token": "1|abc123..."
}
```

#### Purchase Investment
```http
POST /api/invest/purchase
Authorization: Bearer {token}
Content-Type: application/json

{
  "asset_id": 1,
  "amount": 1000.00,
  "payment_method": "wallet"
}
```

Response:
```json
{
  "success": true,
  "investment": {
    "id": 123,
    "asset_id": 1,
    "amount": 1000.00,
    "tokens_received": 100,
    "status": "active"
  },
  "token": {
    "id": 456,
    "blockchain_tx_hash": "0x..."
  }
}
```

---

## 8. Authentication & Authorization

### Authentication Flow

1. **Registration**: User registers with email/password, wallet is auto-created
2. **Login**: User logs in, receives Sanctum token
3. **API Requests**: Token sent in Authorization header
4. **Logout**: Token revoked

### Role-Based Access Control

| Role | Access Level |
|------|--------------|
| `admin` | Full system access |
| `operator` | Fleet operations, vehicles, revenue |
| `investor` | Investments, portfolio, wallet |
| `driver` | Trips, earnings, vehicle assignments |

### Middleware

```php
// In routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    // Protected routes
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Admin-only routes
});
```

---

## 9. Database Schema

### Core Tables

#### users
```sql
- id, name, email, password, role
- kyc_status, kyc_verified_at, kyc_provider, kyc_provider_ref
- phone, address, created_at, updated_at
```

#### wallets
```sql
- id, user_id, wallet_address, trovotech_wallet_id
- balance, pending_balance, status
- created_at, updated_at
```

#### investments
```sql
- id, user_id, asset_id, amount, tokens_received
- purchase_price, current_value, status
- purchased_at, created_at, updated_at
```

#### assets
```sql
- id, name, description, type, symbol
- total_supply, available_supply, price_per_token
- min_investment, status, metadata
- created_at, updated_at
```

#### tokens
```sql
- id, user_id, asset_id, investment_id
- amount, blockchain_address, blockchain_tx_hash
- minting_status, status
- created_at, updated_at
```

#### vehicles
```sql
- id, registration_number, make, model, year
- battery_capacity, current_charge, status
- operator_id, driver_id, location_lat, location_lng
- created_at, updated_at
```

### Migrations

Run all migrations:
```bash
php artisan migrate
```

Run specific migration:
```bash
php artisan migrate --path=database/migrations/2026_01_17_create_table.php
```

Rollback:
```bash
php artisan migrate:rollback
```

### Seeders

Available seeders:
- `MVPDemoSeeder` - Minimal demo data
- `MegaDemoSeeder` - Full demo data
- `ProductionUsersSeeder` - Production user accounts
- `TestDataSeeder` - Testing data

Run seeder:
```bash
php artisan db:seed --class=MVPDemoSeeder
```

---

## 10. External Integrations

### TrovoTech (Blockchain)

Configuration in `backend/.env`:
```env
TROVOTECH_BASE_URL=https://api.trovotech.com
TROVOTECH_API_KEY=your_api_key
TROVOTECH_SANDBOX_ENABLED=true
TROVOTECH_TIMEOUT_MS=10000
```

Key endpoints:
- `/v1/trovo-api/users/onboard` - User onboarding
- `/v1/trovo-api/users/update-kyc` - KYC status update
- `/v1/trovo-api/tokens/mint` - Token minting

### IdentityPass (KYC)

Configuration:
```env
KYC_PROVIDER=identitypass
IDENTITYPASS_API_KEY=your_api_key
IDENTITYPASS_BASE_URL=https://api.theidentitypass.com
IDENTITYPASS_WEBHOOK_SECRET=your_webhook_secret
```

Supported document types:
- NIN (National ID)
- BVN (Bank Verification)
- Driver's License
- Passport

### Payment Gateways

**Paystack**:
```env
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_WEBHOOK_SECRET=xxx
```

**Flutterwave**:
```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
FLUTTERWAVE_ENCRYPTION_KEY=xxx
```

### Email (SMTP)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_FROM_ADDRESS=noreply@fleetfi.com
MAIL_FROM_NAME="FleetFi"
```

---

## 11. Testing

### Frontend Tests (Vitest)

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Test files: `src/test/*.test.tsx`

### Backend Tests (PHPUnit)

```bash
cd backend

# Run all tests
php artisan test

# Run specific test
php artisan test --filter=AuthControllerTest

# With coverage
php artisan test --coverage
```

---

## 12. Deployment

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Deployment

1. **Build Frontend**
   ```bash
   npm run build
   ```

2. **Configure Backend**
   ```bash
   cd backend
   composer install --optimize-autoloader --no-dev
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Run Migrations**
   ```bash
   php artisan migrate --force
   ```

### Environment-Specific Configuration

Update `.env` for production:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=fleetfi
DB_USERNAME=your-user
DB_PASSWORD=your-password
```

---

## 13. Environment Variables

### Backend (.env)

```env
# Application
APP_NAME=FleetFi
APP_ENV=local
APP_KEY=base64:xxx
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:3000

# Database
DB_CONNECTION=sqlite
DB_DATABASE=/path/to/database.sqlite

# Authentication
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Mail
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@fleetfi.com

# KYC
KYC_PROVIDER=identitypass
IDENTITYPASS_API_KEY=your_key
IDENTITYPASS_BASE_URL=https://api.theidentitypass.com

# Blockchain
TROVOTECH_BASE_URL=https://api.trovotech.com
TROVOTECH_API_KEY=your_key
TROVOTECH_SANDBOX_ENABLED=true

# Payments
PAYSTACK_SECRET_KEY=sk_test_xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
```

### Frontend (.env)

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_APP_NAME=FleetFi
```

---

## 14. Troubleshooting

### Common Issues

#### CORS Errors
**Problem**: Frontend cannot connect to backend
**Solution**:
1. Check `backend/config/cors.php` includes your frontend port
2. Clear config cache: `php artisan config:clear`
3. Restart backend server

#### "Cannot connect to backend server"
**Problem**: API requests failing
**Solutions**:
1. Verify backend is running: `curl http://127.0.0.1:8000/api/ping`
2. Check if port 8000 is available
3. Verify CORS configuration

#### Database Migration Errors
**Problem**: Migration fails with enum type error
**Solution**: Run specific migration:
```bash
php artisan migrate --path=database/migrations/specific_migration.php
```

#### Authentication Issues
**Problem**: 401 Unauthorized errors
**Solutions**:
1. Verify token is being sent in Authorization header
2. Check token hasn't expired
3. Verify user exists in database

#### Email Not Sending
**Problem**: Emails not being sent
**Solutions**:
1. Check `MAIL_MAILER` is not set to `log`
2. Verify SMTP credentials
3. Check Laravel logs: `storage/logs/laravel.log`

### Debug Commands

```bash
# Check Laravel logs
tail -f backend/storage/logs/laravel.log

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Check routes
php artisan route:list

# Check database
php artisan tinker
>>> User::count()
>>> Wallet::first()

# Test API
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetfi.com","password":"FleetFi@2025!"}'
```

### Logs Location

- Laravel logs: `backend/storage/logs/laravel.log`
- Frontend console: Browser DevTools
- Vite logs: Terminal running `npm run dev`

---

## Contact & Support

For questions or issues:
- Create an issue in the repository
- Contact the development team

---

*Documentation generated for FleetFi MVP - January 2026*
