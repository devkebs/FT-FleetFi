# FleetFi Admin Guide

## 1. Overview

Admins oversee platform configuration, user lifecycle, KYC approvals, role assignments, system health, and payout orchestration.

## 2. Responsibilities

- User & Role Management (investor, operator, admin).
- KYC Review (approve/deny IdentityPass results, handle edge cases).
- Configuration: thresholds (SOH alerts, telemetry polling interval), feature toggles.
- System Monitoring: health endpoints, log review, request tracing.
- Financial Operations: payout scheduling & verification.

## 3. User & Role Management

- View users with current roles & KYC status.
- Assign capabilities (RBAC via `role_capabilities` table).
- Escalate privileges (operator → admin) with audit logging.

## 4. KYC Workflow

1. IdentityPass webhook updates user fields (external ref, status).
2. Admin reviews pending cases flagged for manual inspection.
3. Approve → triggers `kyc_approved` notification.
4. Deny → optional reason stored; user cannot invest.

## 5. System Health

- Check `/api/ping` (quick liveness) and `/api/health` (deep diagnostics: DB, cache, git hash, memory/disk).
- Investigate latency spikes via `X-Request-Id` in logs.
- Rotate logs if size threshold exceeded.

## 6. Security & Audit

- Sensitive changes (role updates, payouts) recorded in `audit_logs`.
- Enforce minimum KYC level before large transfers.
- Monitor failed auth attempts for brute-force patterns.

## 7. Payout Operations

- Review revenue ledger & allocation formulas.
- Trigger bulk payout → generates wallet transactions and investor notifications.
- Validate post-run totals match expected disbursement sum.

## 8. Configuration Management

- `config/fleetfi.php` and environment variables define integration keys & feature flags.
- After changes: clear config cache (`php artisan config:clear`) and verify health.

## 9. Notifications Oversight

- Monitor system alert types (telemetry critical, payout processed, KYC events).
- Bulk mark resolved after action completed.

## 10. Maintenance Tasks

| Task | Frequency | Command/Action |
|------|-----------|----------------|
| DB backup | Daily | scheduled job / external backup tool |
| Log rotation | Weekly | archive & compress logs |
| Security review | Monthly | check dependencies (npm/composer audit) |
| Seeder refresh (demo) | On demand | `php artisan migrate:fresh --seed` |

## 11. Troubleshooting

| Symptom | Possible Cause | Admin Action |
|---------|----------------|--------------|
| Health endpoint fails DB check | DB down / credentials mismatch | Verify .env, restart DB service |
| Token mint foreign key error | Migration order issue | Run fresh migrations, confirm asset exists |
| Notifications not flowing | Queue worker stopped or polling misconfigured | Restart worker / check polling interval |
| KYC results missing | Webhook not configured or failed | Re-send event from provider dashboard |
| High response times | Slow queries | Enable query log, add indexes |

## 12. Index Suggestions (Performance)

- Add composite index on telemetry (asset_id, created_at).
- Index revenue (asset_id, period).
- Index notifications (user_id, is_read).

## 13. Governance & Compliance

- Store KYC documents securely (external provider, not locally).
- Respect data retention policies (anonymize after lawful period).
- Provide export capability for audit.

## 14. Future Enhancements

- Role-based UI management panel.
- Automated anomaly detection (ML) for telemetry.
- Multi-chain support beyond TrovoTech sandbox.

## 15. Admin Quick Commands

```bash
# Deep health snapshot
curl -s https://your-domain/api/health | jq

# Find slow requests by ID
grep request_id= backend/storage/logs/laravel.log | sort -k duration_ms

# Rebuild demo data (non-production)
php artisan migrate:fresh --seed
```

## 16. Contacts

Eng Lead: internal email; Blockchain Ops: internal channel; KYC Escalation: provider support.
