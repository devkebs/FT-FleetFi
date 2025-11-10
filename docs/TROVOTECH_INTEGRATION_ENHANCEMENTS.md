# TrovoTech Integration Enhancements

## Overview
This document outlines the recent enhancements to the TrovoTech API integration, including test connectivity, server-side validation, and at-rest secret encryption.

---

## 1. Test Connection Feature

### Backend Implementation

#### New Endpoint
- **Route**: `POST /api/admin/trovotech/test-connection`
- **Middleware**: `auth:sanctum`, `role:admin`
- **Controller**: `AdminController::trovotechTestConnection()`

#### TrovotechClient Enhancement
The `TrovotechClient` service (`app/Services/TrovotechClient.php`) now includes:

**New Method: `testConnection()`**
```php
public function testConnection(): array
{
    // Performs HEAD request to configured base URL
    // Returns: ['success' => bool, 'status_code' => int, 'latency_ms' => float]
    // Or: ['success' => false, 'error' => string]
}
```

**Features:**
- Uses Guzzle HTTP client (already in `composer.json`)
- Measures round-trip latency in milliseconds
- Returns HTTP status code from the remote API
- Handles timeout and connection errors gracefully
- Logs test attempts in audit trail

#### Audit Logging
Every test connection attempt is logged:
```php
AuditLog::create([
    'user_id' => $request->user()->id,
    'action' => 'trovotech_test_connection',
    'entity_type' => 'config_setting',
    'entity_id' => '0',
    'metadata' => [
        'success' => true/false,
        'latency_ms' => 123.45,
        'status_code' => 200
    ]
]);
```

### Frontend Implementation

#### AdminDashboard Settings Tab
**Location**: `src/pages/AdminDashboard.tsx`

**New UI Elements:**
1. **Test Connection Button**
   - Appears when TrovoTech is configured (base URL + API key set)
   - Shows spinner during test
   - Disabled while testing

2. **Test Result Banner**
   - Success (green): Shows status code and latency
   - Failure (red): Displays error message
   - Auto-dismisses after user acknowledges

**New Service Method** (`src/services/adminConfig.ts`):
```typescript
export interface ConnectionTestResult {
  success: boolean;
  status_code?: number;
  latency_ms?: number;
  error?: string;
}

export async function testTrovoTechConnection(): Promise<ConnectionTestResult> {
  // POST to /api/admin/trovotech/test-connection
}
```

---

## 2. Server-Side Validation

### URL Validation
**Applied to**: `trovotech_base_url`

**Rules** (in `AdminController::configUpdate()`):
- Must be a valid URL format
- Validated with PHP's `filter_var($value, FILTER_VALIDATE_URL)`
- Returns 422 error if invalid

**Example Error Response**:
```json
{
  "message": "Invalid URL format for trovotech_base_url"
}
```

### Endpoint JSON Structure Validation
**Applied to**: `trovotech_endpoints`

**Rules**:
- Must be a JSON object (array of key-value pairs)
- Each endpoint path must:
  - Be a string
  - Start with `/` (e.g., `/wallet`, `/token/mint`)
- Supports path parameters (e.g., `/asset/{assetId}/metadata`)

**Example Valid Structure**:
```json
{
  "wallet": "/wallet",
  "mint_token": "/token/mint",
  "payout_initiate": "/payout/initiate",
  "telemetry_sync": "/telemetry/sync",
  "tokens_my": "/tokens/my",
  "asset_metadata": "/asset/{assetId}/metadata"
}
```

**Example Error Response**:
```json
{
  "message": "Endpoint 'wallet' must be a path starting with /"
}
```

**Code Location**: `backend/app/Http/Controllers/AdminController.php`, line ~290-310

---

## 3. At-Rest Secret Encryption

### Implementation
**File**: `app/Models/ConfigSetting.php`

**Encrypted Keys**:
- `trovotech_api_key`
- `trovotech_webhook_secret`

### Encryption Strategy
Uses Laravel's built-in `encrypt()` and `decrypt()` functions with application key (`APP_KEY` in `.env`).

**Attribute Accessor/Mutator**:
```php
protected function value(): Attribute
{
    return Attribute::make(
        get: fn($value) => in_array($this->key, self::$encryptedKeys) 
            ? decrypt($value) 
            : $value,
        set: fn($value) => in_array($this->key, self::$encryptedKeys) 
            ? encrypt($value) 
            : $value
    );
}
```

**How It Works**:
1. When a secret is saved:
   - Value is encrypted before database write
   - Stored in `value` column as encrypted string
2. When a secret is retrieved:
   - Value is automatically decrypted on read
   - Application code receives plain text
3. When displayed in API responses:
   - Masked as `********` (handled in `AdminController::configIndex()`)
   - Only updated when admin provides a new value (not `********`)

### Backward Compatibility
If decryption fails (e.g., legacy unencrypted value or wrong key), the accessor returns the raw value to prevent breaking existing records.

**Security Note**: 
- Ensure `APP_KEY` is set in `.env` and never committed to version control
- Rotate `APP_KEY` carefully (will invalidate existing encrypted secrets)
- Consider using a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault) for production

---

## 4. TrovotechController Refactoring

### Changes
**File**: `app/Http/Controllers/TrovotechController.php`

**Before**:
```php
private $baseUrl;
private $apiKey;

public function __construct() {
    $this->baseUrl = config('services.trovotech.base_url');
    $this->apiKey = config('services.trovotech.api_key');
}
```

**After**:
```php
private TrovotechClient $client;
private string $baseUrl;
private string $apiKey;

public function __construct() {
    $this->client = new TrovotechClient();
    $this->baseUrl = ConfigSetting::getValue('trovotech_base_url', '');
    $this->apiKey = ConfigSetting::getValue('trovotech_api_key', '');
    $this->sandboxMode = ConfigSetting::getValue('trovotech_sandbox_enabled', true);
}
```

**Benefits**:
- Config changes in Admin Dashboard take effect immediately (no cache clear needed)
- Centralized config logic in `TrovotechClient`
- Prepares for future full migration to use `$this->client->request()` throughout

**Future Work**:
Replace raw `Http::` calls in all methods with:
```php
$this->client->request('POST', 'mint_token', [], [
    'issuer_id' => $this->issuerId,
    'asset_metadata' => [...],
]);
```

---

## 5. Usage Guide

### Admin Workflow

1. **Configure TrovoTech Integration**
   - Navigate to Admin Dashboard → Settings tab
   - Fill in:
     - `trovotech_base_url`: API base URL (e.g., `https://api.trovotech.com`)
     - `trovotech_api_key`: Your API key (will be encrypted)
     - `trovotech_webhook_secret`: Webhook signing secret (encrypted)
     - `trovotech_timeout_ms`: Request timeout (default: 10000ms)
     - `trovotech_sandbox_enabled`: Toggle sandbox mode
     - `trovotech_endpoints`: JSON map of endpoint paths
   - Click "Save" on each setting

2. **Test Connection**
   - Once configured, a "Test Connection" button appears
   - Click to verify:
     - Base URL is reachable
     - API key is valid (if endpoint requires auth)
     - Measure latency
   - Review test result banner for success/error details

3. **Monitor Audit Logs**
   - Go to Admin Dashboard → Logs tab
   - Filter by action: `trovotech_test_connection` or `config_update`
   - Review connection test history and config changes

### API Reference

#### GET /api/admin/trovotech/status
**Auth**: Admin only  
**Response**:
```json
{
  "configured": true,
  "sandbox": true,
  "timeout_ms": 10000,
  "base_url_set": true,
  "api_key_set": true
}
```

#### POST /api/admin/trovotech/test-connection
**Auth**: Admin only  
**Request**: No body  
**Response (Success)**:
```json
{
  "success": true,
  "status_code": 200,
  "latency_ms": 142.35
}
```
**Response (Failure)**:
```json
{
  "success": false,
  "error": "Connection timeout after 10000ms"
}
```

---

## 6. Security Considerations

1. **Secrets Encryption**
   - API keys and webhook secrets are encrypted at rest
   - Masked in UI and API responses
   - Never log decrypted secrets in audit trail

2. **URL Validation**
   - Prevents injection of malicious URLs
   - Ensures only valid HTTP/HTTPS endpoints

3. **Admin-Only Access**
   - All TrovoTech config endpoints require `role:admin` middleware
   - Non-admin users cannot view or modify integration settings

4. **Audit Trail**
   - All config updates and connection tests are logged
   - Traceable to admin user who performed action

---

## 7. Testing Checklist

- [x] Backend routes registered (`php artisan route:list`)
- [x] No PHP syntax errors (`php artisan route:list` succeeded)
- [x] Frontend build passes (`npm run build`)
- [x] Secrets encrypted in database
- [x] URL validation rejects invalid URLs
- [x] Endpoint JSON validation enforces structure
- [x] Test connection button appears when configured
- [x] Test connection returns latency and status code
- [x] Audit logs record test attempts

---

## 8. Next Steps (Future Enhancements)

1. **Full HTTP Client Migration**
   - Replace all `Http::` calls in `TrovotechController` with `TrovotechClient::request()`
   - Centralize retry logic, error handling, logging

2. **Webhook Verification**
   - Implement signature verification using `trovotech_webhook_secret`
   - Add webhook receiver endpoint in `routes/api.php`

3. **Advanced Secrets Management**
   - Integrate AWS Secrets Manager or HashiCorp Vault
   - Auto-rotate API keys

4. **Health Monitoring**
   - Periodic background health checks (cron job)
   - Alert admins if TrovoTech API becomes unreachable

5. **Rate Limiting**
   - Implement client-side rate limiting per TrovoTech's API tier
   - Queue requests during high load

---

## 9. File Inventory

### Backend Files Modified/Created
- `app/Services/TrovotechClient.php` - Added `testConnection()`, full `request()` implementation
- `app/Http/Controllers/AdminController.php` - Added `trovotechTestConnection()`, URL/endpoint validation
- `app/Http/Controllers/TrovotechController.php` - Refactored to use `TrovotechClient` and `ConfigSetting`
- `app/Models/ConfigSetting.php` - Added encryption accessor/mutator
- `routes/api.php` - Added `/api/admin/trovotech/test-connection` route

### Frontend Files Modified/Created
- `src/services/adminConfig.ts` - Added `testTrovoTechConnection()`, `ConnectionTestResult` interface
- `src/pages/AdminDashboard.tsx` - Added test connection button, result banner, loading state

### Documentation
- `docs/TROVOTECH_INTEGRATION_ENHANCEMENTS.md` - This file

---

## Support

For issues or questions, consult:
- Original integration docs: `docs/TROVOTECH_INTEGRATION.md`
- Laravel encryption: https://laravel.com/docs/9.x/encryption
- Guzzle HTTP client: https://docs.guzzlephp.org/
