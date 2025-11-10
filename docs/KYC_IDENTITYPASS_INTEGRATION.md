# KYC IdentityPass Integration Guide

## Overview
FleetFi now integrates with **IdentityPass** (Nigerian KYC provider) to verify investor and operator identities using NIN, BVN, Driver's License, or Passport numbers.

## Architecture

### Provider Adapter Pattern
- **Interface**: `App\Services\Kyc\KycProviderInterface`
- **Implementation**: `App\Services\Kyc\IdentityPassProvider`
- **Service Layer**: `App\Services\Kyc\KycService` orchestrates verification flow

### Database Schema
New fields in `users` table:
- `kyc_provider`: Provider name (e.g., 'identitypass')
- `kyc_provider_ref`: Provider's reference/session ID
- `kyc_provider_status`: Provider-specific status (in_progress, verified, failed)
- `kyc_last_checked_at`: Last status check timestamp
- `kyc_failure_reason`: Error message if verification failed

Migration: `2025_11_10_120000_add_external_kyc_fields_to_users.php`

## Configuration

### Environment Variables
Add to `.env`:
```env
KYC_PROVIDER=identitypass
IDENTITYPASS_API_KEY=your_api_key_here
IDENTITYPASS_BASE_URL=https://api.theidentitypass.com
IDENTITYPASS_WEBHOOK_SECRET=your_webhook_secret_here
```

### Config File
`config/kyc.php` defines provider settings and status mappings.

## API Endpoints

### User Endpoints
- **POST /api/kyc/submit** - Submit verification (investor/operator only)
  - Body: `{ document_type: 'nin'|'bvn'|'drivers_license'|'passport', document_number: string }`
  - Returns: `{ provider_status, provider_ref, internal_status, message }`
  
- **POST /api/kyc/poll** - Poll current user's verification status
  - Returns: `{ provider_status, internal_status, ref }`

### Admin Endpoints
- **GET /api/kyc/pending** - List pending KYC submissions
- **POST /api/kyc/review** - Approve/reject manually
- **POST /api/kyc/admin/poll/{userId}** - Poll specific user's status

### Webhook (Public)
- **POST /api/kyc/webhook/identitypass** - Receive provider callbacks
  - Secured by HMAC signature verification

## User Flow

### Investor/Operator Registration
1. User registers and logs in
2. KYC modal prompts for document type and number
3. Frontend calls `/api/kyc/submit`
4. Backend:
   - Stores document info locally
   - Calls IdentityPass API
   - Saves provider reference
5. Modal shows status and polls every 15s
6. User sees "verified", "in_progress", or "failed"

### Admin Review
1. Admin navigates to KYC tab in dashboard
2. Sees pending verifications with provider status
3. Can manually poll provider or approve/reject
4. Provider status updates trigger status changes

## Frontend Integration

### Components
- **KycModal** (`src/components/KycModal.tsx`)
  - Document type selector (NIN, BVN, License, Passport)
  - Auto-polling for status updates
  - Provider status display

- **AdminDashboard KYC Tab** (`src/pages/AdminDashboard.tsx`)
  - Provider status column
  - Manual poll button
  - Failure reason tooltips

### Services
- **kyc.ts** (`src/services/kyc.ts`)
  - `submitKyc()` - Start verification
  - `pollKyc()` - Check status
  - Uses 127.0.0.1:8000 API base

## Status Mapping

Provider statuses map to internal statuses:
- `in_progress`, `processing` → `submitted`
- `verified`, `success` → `verified`
- `failed`, `error` → `rejected`

## Testing Checklist

### Backend
- [ ] Run migration: `php artisan migrate`
- [ ] Test initiation: Submit KYC via API
- [ ] Test polling: Call `/api/kyc/poll`
- [ ] Test webhook: Send mock POST to webhook endpoint
- [ ] Verify audit logs created

### Frontend
- [ ] KYC modal shows on investor/operator login
- [ ] Document types include NIN/BVN
- [ ] Status updates after submission
- [ ] Polling interval works (15s)
- [ ] Admin can see provider status in table

### Integration
- [ ] Real IdentityPass API key configured
- [ ] Webhook signature verification works
- [ ] Status transitions update internal state
- [ ] Failure reasons logged and displayed

## Security Considerations

1. **Webhook Signature**: Always verify HMAC signature before processing
2. **PII Storage**: Only store reference ID, not raw personal data
3. **Rate Limiting**: Add rate limits to prevent abuse
4. **Audit Logging**: All KYC actions logged to `audit_logs` table
5. **Access Control**: KYC endpoints restricted by role middleware

## Troubleshooting

### Common Issues
1. **Webhook not received**: Check firewall, ngrok tunnel, or webhook URL configuration
2. **Signature mismatch**: Verify `IDENTITYPASS_WEBHOOK_SECRET` matches provider settings
3. **Status stuck in 'submitted'**: Manual poll or check provider dashboard
4. **API errors**: Check `IDENTITYPASS_API_KEY` validity and network connectivity

### Logs
- Webhook events: Check `storage/logs/laravel.log` for warnings
- Audit trail: Query `audit_logs` table for `kyc_initiated`, `kyc_webhook_update` actions

## Future Enhancements
- [ ] Add face liveness check (IdentityPass supports this)
- [ ] Batch polling via Laravel scheduler for stale verifications
- [ ] SMS/Email notifications on status change
- [ ] Retry mechanism for failed verifications
- [ ] Multi-provider support (add Dojah, VerifyMe adapters)

## References
- IdentityPass API Docs: https://docs.myidentitypass.com
- Laravel HTTP Client: https://laravel.com/docs/http-client
- Webhook Security: https://webhooks.fyi/security/hmac

---
**Last Updated**: November 10, 2025  
**Status**: ✅ Core integration complete, pending real API credentials
