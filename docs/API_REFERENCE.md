# FleetFi API Reference

Date: 2025-11-09

**Base URL:** [`http://127.0.0.1:8000/api`](http://127.0.0.1:8000/api)

**Authentication:** Bearer tokens via Laravel Sanctum

Headers (protected endpoints):

```http
Authorization: Bearer TOKEN
Accept: application/json
Content-Type: application/json
```

Obtain token via `POST /login` or `POST /register`.

**Roles:** `investor`, `operator`, `driver`, `admin` (enforced via middleware `role:<roles>`).

All request/response bodies are JSON unless stated otherwise.

---

## 1. Authentication

### POST /register
Create a user and return auth token + wallet.

Request body:

```json
{
	"name": "John Doe",
	"email": "john@example.com",
	"password": "secret123",
	"role": "investor",
	"phone": "+1234567890"
}
```

Response 201:

```json
{
	"user": { "id": 7, "email": "john@example.com", "role": "investor" },
	"wallet": { "wallet_address": "0xabc...", "status": "active" },
	"token": "1|SANCTUM_TOKEN_STRING"
}
```

### POST /login
Authenticate and return token. Optional `role` must match stored user role if provided.

```json
{
	"email": "admin@fleetfi.com",
	"password": "Fleet@123",
	"role": "admin"
}
```

Response 200:

```json
{
	"user": { "id": 1, "email": "admin@fleetfi.com", "role": "admin" },
	"token": "1|SANCTUM_TOKEN_STRING"
}
```

Errors:
- 401 Invalid credentials
- 403 Selected role does not match your account

### POST /logout (auth)
Revokes current token.

### POST /forgot-password
```json
{ "email": "user@example.com" }
```

### POST /reset-password
```json
{ "token": "RESET_TOKEN", "email": "user@example.com", "password": "NewPass123", "password_confirmation": "NewPass123" }
```

### GET /user (auth)
Returns authenticated user profile.

---

## 2. KYC

User KYC fields: `kyc_status` (`pending`|`submitted`|`verified`|`rejected`), timestamps, document info.

Lifecycle:
`pending` -> `submitted` (user submits) -> `verified` or `rejected` (review action).

### GET /kyc/status (auth)
Returns current user's KYC metadata.

Example Response:
```json
{
	"kyc_status": "submitted",
	"kyc_submitted_at": "2025-11-09T20:41:00Z",
	"kyc_verified_at": null,
	"kyc_document_type": "passport"
}
```

### POST /kyc/submit (auth: investor,operator)
```json
{
	"document_type": "passport",
	"document_number": "A1234567",
	"full_name": "Jane Investor",
	"address": "123 Electric Ave"
}
```
Responses:
- 200 KYC submitted
- 422 Validation errors
- 400 Already verified

### POST /kyc/review (auth: operator,admin)
Approve or reject.
```json
{
	"user_id": 25,
	"action": "approve",
	"note": "Docs clear"
}
```
Returns updated user and audit log entry created.

### GET /kyc/pending (auth: operator,admin)
List users with `submitted` status.

---

## 3. Vehicles

### GET /vehicles (public)
List vehicles (basic marketing / display).

### /vehicles CRUD (auth: operator)
Standard REST: `POST /vehicles`, `GET /vehicles/{id}`, `PUT/PATCH /vehicles/{id}`, `DELETE /vehicles/{id}`.

---

## 4. Assets

### /assets CRUD (auth: operator)
Operator creates and manages assets.

### /admin/assets CRUD (auth: admin)
Admin mirror for oversight.

---

## 5. Telemetry

### POST /telemetry (public webhook)
OEM ingestion; secured by `X-OEM-API-Key` header when configured.

Headers:
```http
X-OEM-API-Key: OEM_KEY_VALUE
Content-Type: application/json
```

Example payload:
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

### GET /telemetry/live (auth: operator,admin)
Latest point per asset within last 5 minutes.

### GET /telemetry/{assetId} (auth: operator)
Recent history (limit 100).

### GET /telemetry/{assetId}/latest (auth: operator)
Single most recent telemetry record.

---

## 6. Wallets & Tokens

### POST /wallet/create (auth: investor,operator,driver)
Create wallet if absent.

### GET /wallet/{userId}
Show wallet.

### GET /wallet/{userId}/balance
Return numeric balance.

### GET /token/{id} (auth: investor,operator)
Show token details.

### POST /token/{id}/transfer (auth: investor,operator)
Transfer ownership.

### GET /user/{userId}/tokens (auth: investor,operator,driver)
List user tokens.

### GET /tokens/portfolio (auth: investor,operator)
Portfolio summary for authenticated user aggregated by chain with overall ROI.

**Response:**
```json
{
	"overall": {
		"total_tokens": 5,
		"total_investment": 12500.00,
		"total_current_value": 13200.00,
		"total_returns": 850.00,
		"roi_percent": 6.80
	},
	"by_chain": [
		{
			"chain": "polygon",
			"count": 3,
			"total_investment": 7500.00,
			"total_current_value": 7900.00,
			"total_returns": 520.00,
			"roi_percent": 6.93
		},
		{
			"chain": "bsc",
			"count": 2,
			"total_investment": 5000.00,
			"total_current_value": 5300.00,
			"total_returns": 330.00,
			"roi_percent": 6.60
		}
	],
	"tokens": [ /* array of token objects with detailed fields */ ]
}
```

#### Token Object Schema

```json
{
	"id": 42,
	"asset_id": 15,            // Internal asset DB id
	"user_id": 7,              // Owner user id
	"token_id": "POLYGON-VEH005-1", // On-chain token identifier pattern <CHAIN>-<ASSET>-<INDEX>
	"shares": 33.33,           // Percentage claim (legacy field)
	"fraction_owned": 33.33,   // Normalized ownership percent (0-100)
	"investment_amount": 2500.00,
	"current_value": 2700.50,
	"total_returns": 180.25,   // Cumulative realized returns
	"status": "active",       // active | sold | liquidated
	"purchase_date": "2025-08-14T12:30:00Z",
	"minted_at": "2025-08-14T13:00:15Z", // Timestamp when token was minted on-chain
	"chain": "polygon",       // Blockchain network (polygon, bsc, eth-sepolia, etc.)
	"metadata_hash": "QmXyz...", // IPFS / metadata reference
	"trustee_ref": "TRUST-AB12CD34", // Custodian or trustee reference
	"tx_hash": "0xabc123...",  // Blockchain mint transaction hash
	"created_at": "2025-11-09T21:05:12Z",
	"updated_at": "2025-11-09T21:05:12Z"
}
```

Notes:
- `shares` kept for backward compatibility; `fraction_owned` is authoritative.
- `token_id` chain prefix examples: `POLYGON`, `BSC`, `ETH-SEPOLIA`.
- `tx_hash` simulated for demo data; in production sourced from actual chain event.
- All monetary fields are decimal(12,2) in fiat currency unless on-chain valuation implemented.
- `chain` explicitly stores blockchain network name; used for portfolio aggregation.
- `minted_at` tracks on-chain mint event timestamp (may differ from `purchase_date` if pre-purchase recorded).

---

## 7. Payouts

### GET /payout/{id} (auth: investor,operator)
Single payout record.

### GET /user/{userId}/payouts (auth: investor,operator)
List payouts for user.

---

## 8. Operations & Riders (auth: operator)

| Endpoint | Purpose |
|----------|---------|
| POST /riders/assign | Assign rider to asset/vehicle |
| POST /riders/unassign | Remove rider assignment |
| GET /riders | List riders |
| GET /operations/schedules | List schedules |
| POST /operations/schedule/swap | Schedule battery swap |
| POST /operations/schedule/charge | Schedule charge |
| PATCH /operations/schedules/{id}/status | Update status |

---

## 9. Admin (prefix /admin, auth: admin)

Key endpoints:
| Endpoint | Description |
|----------|-------------|
| GET /admin/overview | Dashboard metrics |
| GET /admin/users | List users |
| POST /admin/users | Create user |
| PATCH /admin/users/{userId}/role | Change role |
| PATCH /admin/users/{userId}/toggle-status | Activate/deactivate |
| GET /admin/revenue-stats | Revenue metrics |
| GET /admin/activity-logs | Audit logs |
| GET /admin/config | View config settings |
| PATCH /admin/config | Update config (encrypted secrets) |
| POST /admin/trovotech/test-connection | Connectivity test |
| /admin/assets CRUD | Asset management mirror |

---

## 10. TrovoTech Integration

| Endpoint | Auth Roles | Purpose |
|----------|-----------|---------|
| POST /trovotech/payout/initiate | operator | Initiate payout |
| POST /trovotech/telemetry/sync | operator | Sync telemetry (future expansion) |
| POST /trovotech/token/mint | operator | Mint blockchain token |
| GET /trovotech/wallet | investor,operator,driver | View TrovoTech wallet |
| GET /trovotech/tokens/my | investor,operator,driver | List own tokens |
| GET /trovotech/asset/{assetId}/metadata | investor,operator,driver | Asset metadata |

---

## 11. Security & Headers

- All protected routes require `Authorization: Bearer TOKEN`.
- OEM webhook secured by `X-OEM-API-Key` (constant-time comparison).
- Sensitive configuration values (API keys) encrypted at rest.

---

## 12. Error Format

Generic error examples:

```json
{ "message": "Forbidden: role not permitted" }
```

Validation error example:

```json
{ "errors": { "email": ["The email field is required."] } }
```

---

## 13. Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| 401 Invalid credentials | Wrong email/password | Ensure seeded admin (`php artisan db:seed`) or reset password |
| 403 Selected role mismatch | Provided `role` doesn't match stored user role | Omit `role` or correct it |
| 401 Unauthenticated webhook | Missing/invalid OEM key header | Set `X-OEM-API-Key` matching admin config |
| Telemetry empty | No recent data (<5m) or asset not created | Create asset and post telemetry payload |
| Token missing after login | Sanctum migration not run | Run `php artisan migrate` |

---

## 14. Notes

- Times are ISO‑8601 UTC.
- Rate limiting for `/telemetry` recommended (future enhancement).
- WebSocket/SSE live push planned; currently polling.


