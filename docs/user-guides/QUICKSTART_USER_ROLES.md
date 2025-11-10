# FleetFi User Roles Quickstart

## Roles

| Role | Primary Goals | Key Screens | Must Complete KYC? |
|------|---------------|-------------|--------------------|
| Investor | Allocate capital, track returns | Investor Dashboard, Investment Wizard, Wallet | Yes |
| Operator | Maintain fleet performance & uptime | Operator Dashboard, Telemetry Panel | No (unless handling payouts) |
| Admin | Govern system, approve KYC, configure platform | Admin Dashboard, KYC Review, Health | Yes (implicit) |

## Workflow Summary

1. Investor registers → completes KYC → funds wallet → invests → monitors portfolio.
2. Operator monitors telemetry → schedules maintenance → optimizes revenue.
3. Admin configures thresholds → approves KYC → triggers payouts → audits logs.

## Essential Commands

```bash
# Backend serve (dev)
php artisan serve --port=8000

# Frontend dev
npm run dev

# Health check
curl -s http://localhost:8000/api/health | jq
```

## Common Paths

| Action | Endpoint / UI |
|--------|---------------|
| Login | /api/login (API) / Login component (UI) |
| KYC Status | /api/user (API) / Notification Center (UI) |
| Mint Token | /api/investments/mint (internal) via Wizard |
| Wallet Balance | /api/wallet (API) / Wallet Widget (UI) |
| Telemetry Feed | /api/telemetry/stream (future) / Telemetry Panel (UI) |

## Error Handling Cheatsheet

| Symptom | Quick Fix |
|---------|-----------|
| 403 on invest | Complete KYC or insufficient role |
| FK error on token | Migrations out of order → run migrate:fresh |
| Missing telemetry | Start simulator script or verify integration |
| Stale notifications | Clear browser cache / confirm polling interval |

## Next Steps

- Read full role guide for details.
- Setup CI to run test suites.
- Plan production DB backup schedule.
