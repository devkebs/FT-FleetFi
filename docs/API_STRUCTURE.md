# FleetFi API Structure Documentation

## Overview
The FleetFi API has been restructured for better organization, maintainability, and type safety. The new structure follows modern best practices with:

- **Modular Organization**: APIs grouped by domain (Auth, Assets, Revenue, etc.)
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Token Management**: Improved token lifecycle management
- **Backward Compatibility**: All old function exports still work

---

## Architecture

### Base Configuration
```typescript
const API_BASE_URL = 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api`;
```

### HTTP Client
The new `ApiClient` class provides a centralized HTTP client with:
- Automatic token injection
- Standardized error handling
- Support for JSON and binary responses (CSV, file downloads)
- Type-safe request/response handling

---

## API Modules

### 1. Authentication API (`AuthAPI`)

#### Methods

**Login**
```typescript
AuthAPI.login(data: LoginData): Promise<AuthResponse>

// Example
const response = await AuthAPI.login({
  email: 'user@example.com',
  password: 'password123',
  rememberMe: true,
  role: 'investor'
});
```

**Register**
```typescript
AuthAPI.register(data: RegisterData): Promise<AuthResponse>

// Example
const response = await AuthAPI.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'investor'
});
```

**Logout**
```typescript
AuthAPI.logout(): Promise<void>
```

**Get Current User**
```typescript
AuthAPI.getCurrentUser(): Promise<CurrentUser>
```

**Password Recovery**
```typescript
AuthAPI.forgotPassword(email: string): Promise<void>
AuthAPI.resetPassword(token: string, password: string): Promise<void>
```

---

### 2. Asset & Fleet Management API

#### AssetAPI

**List Assets (Paginated)**
```typescript
AssetAPI.list(page?: number, perPage?: number): Promise<Pagination<Asset>>

// Example
const assets = await AssetAPI.list(1, 20);
```

**Get Single Asset**
```typescript
AssetAPI.get(id: string): Promise<Asset>
```

**Create Asset**
```typescript
AssetAPI.create(data: Partial<Asset>): Promise<Asset>
```

**Update Asset**
```typescript
AssetAPI.update(id: string, data: Partial<Asset>): Promise<Asset>
```

**Delete Asset**
```typescript
AssetAPI.delete(id: string): Promise<void>
```

**Export Assets (CSV)**
```typescript
AssetAPI.exportCsv(): Promise<Blob>

// Example - Download CSV
const blob = await AssetAPI.exportCsv();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'assets.csv';
a.click();
```

#### RiderAPI

**List Riders**
```typescript
RiderAPI.list(): Promise<Rider[]>
```

**Assign Rider to Asset**
```typescript
RiderAPI.assign(riderId: number, assetId: string): Promise<any>
```

**Unassign Rider**
```typescript
RiderAPI.unassign(riderId: number): Promise<any>
```

#### ScheduleAPI

**List Schedules**
```typescript
ScheduleAPI.list(assetId?: string): Promise<OperationSchedule[]>
```

**Schedule Swap**
```typescript
ScheduleAPI.scheduleSwap(
  assetId: string,
  scheduledAt: string,
  riderId?: number,
  note?: string
): Promise<OperationSchedule>
```

**Schedule Charge**
```typescript
ScheduleAPI.scheduleCharge(
  assetId: string,
  scheduledAt: string,
  riderId?: number,
  note?: string
): Promise<OperationSchedule>
```

**Update Schedule Status**
```typescript
ScheduleAPI.updateStatus(
  id: number,
  status: 'pending' | 'completed' | 'cancelled'
): Promise<OperationSchedule>
```

---

### 3. Revenue & Operations API

#### RevenueAPI

**Get Revenue Summary**
```typescript
RevenueAPI.getSummary(): Promise<RevenueBreakdown>

// Example
const summary = await RevenueAPI.getSummary();
console.log(summary.gross_total);
console.log(summary.breakdown.investor_roi);
```

**Get Rides**
```typescript
RevenueAPI.getRides(limit?: number): Promise<{ rides: Ride[] }>

// Example
const { rides } = await RevenueAPI.getRides(50);
```

---

### 4. Capabilities & Permissions API

#### CapabilitiesAPI

**Get Capabilities**
```typescript
CapabilitiesAPI.get(): Promise<CapabilitiesPayload>
```

**Get My Capabilities**
```typescript
CapabilitiesAPI.getMy(): Promise<any>
```

**Check Capability**
```typescript
CapabilitiesAPI.check(capability: string): Promise<boolean>

// Example
const canManageAssets = await CapabilitiesAPI.check('manage_assets');
```

---

## Token Management

### TokenManager Object

**Get Token**
```typescript
TokenManager.get(): string | null
```

**Set Token**
```typescript
TokenManager.set(token: string, rememberMe?: boolean, expiresIn?: number): void
```

**Clear Token**
```typescript
TokenManager.clear(): void
```

**Check if Token is Expired**
```typescript
TokenManager.isExpired(): boolean
```

**Check if Token is Valid**
```typescript
TokenManager.isValid(): boolean
```

### Storage Keys
```typescript
STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REMEMBER_ME: 'remember_me',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
}
```

---

## Generic API Client

For custom API calls not covered by the structured APIs:

```typescript
import { apiClient } from './services/api';

// GET request
const data = await apiClient.get('/custom/endpoint');

// POST request
const result = await apiClient.post('/custom/endpoint', { foo: 'bar' });

// PUT request
const updated = await apiClient.put('/custom/endpoint/123', { foo: 'baz' });

// PATCH request
const patched = await apiClient.patch('/custom/endpoint/123', { status: 'active' });

// DELETE request
await apiClient.delete('/custom/endpoint/123');
```

---

## Error Handling

All API methods throw standardized `ApiError` objects:

```typescript
interface ApiError {
  message: string;
  errors?: Record<string, string[]>;  // Laravel validation errors
  status?: number;                     // HTTP status code
}
```

### Usage Example

```typescript
try {
  const user = await AuthAPI.login({
    email: 'test@example.com',
    password: 'wrongpassword',
  });
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message);      // "Invalid credentials"
  console.error(apiError.status);        // 401
  
  if (apiError.errors) {
    // Laravel validation errors
    console.error(apiError.errors.email); // ["The email field is required."]
  }
}
```

---

## Backward Compatibility

All previous function exports are still available:

### Auth Functions
```typescript
login(data: LoginData)
register(data: RegisterData)
logout()
getCurrentUser()
requestPasswordReset(email: string)
resetPassword(token: string, password: string)

// Token management
getStoredToken()
setStoredToken(token, rememberMe, expiresIn)
clearStoredToken()
isTokenExpired()
```

### Asset Functions
```typescript
fetchAssets(page, perPage)
fetchRiders()
assignRider(riderId, assetId)
unassignRider(riderId)
fetchSchedules(assetId)
scheduleSwap(assetId, scheduledAt, riderId, note)
scheduleCharge(assetId, scheduledAt, riderId, note)
updateScheduleStatus(id, status)
exportAssetsCsv()
```

### Revenue Functions
```typescript
fetchRevenueSummary()
fetchRides(limit)
```

### Capability Functions
```typescript
fetchCapabilities()
```

---

## Migration Guide

### Old Way
```typescript
import { login, fetchAssets } from './services/api';

const response = await login({ email, password });
const assets = await fetchAssets(1, 10);
```

### New Way (Recommended)
```typescript
import { AuthAPI, AssetAPI } from './services/api';

const response = await AuthAPI.login({ email, password });
const assets = await AssetAPI.list(1, 10);
```

### Mixed Approach (Both work!)
```typescript
import { AuthAPI, fetchAssets } from './services/api';

const response = await AuthAPI.login({ email, password });
const assets = await fetchAssets(1, 10);  // Still works!
```

---

## Type Definitions

### Core Types
```typescript
type UserRole = 'investor' | 'operator' | 'driver' | 'admin';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
}

interface AuthResponse {
  token: string;
  user: CurrentUser;
  expiresIn?: number;
}

interface Pagination<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
```

---

## Best Practices

### 1. Use the New Structured APIs
```typescript
// ✅ Good
import { AuthAPI } from './services/api';
await AuthAPI.login(credentials);

// ❌ Avoid (but still works)
import { login } from './services/api';
await login(credentials);
```

### 2. Handle Errors Properly
```typescript
try {
  const assets = await AssetAPI.list();
} catch (error) {
  const apiError = error as ApiError;
  if (apiError.status === 401) {
    // Redirect to login
  } else if (apiError.status === 403) {
    // Show permission error
  } else {
    // Show generic error
    toast.error(apiError.message);
  }
}
```

### 3. Use TokenManager for Token Operations
```typescript
// ✅ Good
import { TokenManager } from './services/api';
if (TokenManager.isValid()) {
  // Proceed
}

// ❌ Avoid
const token = localStorage.getItem('auth_token');
```

### 4. Leverage Type Safety
```typescript
// TypeScript will enforce correct types
const assets: Pagination<Asset> = await AssetAPI.list();
const user: CurrentUser = await AuthAPI.getCurrentUser();
```

---

## Summary of Improvements

1. **Better Organization**: APIs grouped by domain
2. **Type Safety**: Full TypeScript support
3. **Error Handling**: Centralized with proper types
4. **Token Management**: Dedicated TokenManager class
5. **Backward Compatible**: All old exports still work
6. **Modern Patterns**: Uses classes and namespaced exports
7. **Environment Config**: Support for .env variables
8. **Documentation**: Comprehensive inline docs

---

## Next Steps

1. Gradually migrate to new API structure in components
2. Add interceptors for logging/monitoring
3. Implement request caching where appropriate
4. Add retry logic for failed requests
5. Create API mocks for testing
