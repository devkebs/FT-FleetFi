# FleetFi Investor Guide

## 1. Overview
FleetFi lets individual or institutional investors purchase fractional ownership (tokenized shares) in EV fleet assets, earn returns from operational revenue, and monitor performance in real time.

### Key Concepts
- Token: Represents fractional ownership of a specific asset (vehicle/station) minted on TrovoTech chain (sandbox/prod).
- Asset: A physical fleet component (EV, swap station) producing revenue and telemetry.
- Portfolio: Collection of tokens you own, with aggregated KPIs (ROI, earnings, utilization).
- Wallet: Internal accounting balance (NGN) for deposits, transfers, and payouts.
- KYC: Identity verification required before investing or initiating large transfers.

## 2. Onboarding Flow
1. Register account (email & password) via the Registration form.
2. Verify email (if enabled) and login.
3. Complete KYC (Government ID + selfie) using IdentityPass flow.
4. Wait for KYC status: `pending` → `approved` (visible in Notification Center).
5. Fund wallet (manual admin credit or on-ramp integration TBD).
6. Access Investor Dashboard.

## 3. Investment Flow (Token Minting)
1. Open Investment Wizard.
2. Select available asset (filter by type, health, expected ROI).
3. Set investment amount (validation: not exceeding remaining fractional ownership).
4. Review ROI projection (uses expected revenue & utilization).
5. Confirm investment → Token minted (sandbox hash recorded: `tx_hash`, `chain`).
6. Notification generated (type: `investment_completed`).

### Ownership Constraints
- Each asset has 100% fractional ownership split among tokens: `sum(fraction_owned) <= 1.0`.
- Validation prevents exceeding remaining fraction.
- Partial multiple investors allowed until full fraction allocated.

## 4. Portfolio Monitoring
Dashboard Widgets:
- Portfolio Summary: Aggregated `investment_amount`, `current_value`, `total_returns`.
- Revenue Breakdown: Daily/weekly asset earnings allocated proportionally.
- Telemetry Panel: Real-time location & status (SOH, active rides, swaps).
- Sentiment / Feedback (if enabled): Qualitative asset performance signals.

## 5. Wallet & Transactions
- Balance shown in Wallet Widget.
- Transaction History lists deposits, transfers, payouts.
- P2P Transfers: Initiate to other user wallet IDs.
- Payouts: Admin-triggered or scheduled; investor sees disbursement transactions.

## 6. Notifications
Types relevant to investors:
- `kyc_approved`, `investment_completed`, `payout_processed`, `telemetry_alert`.
- Unread count badge on bell icon; mark read individually or bulk.

## 7. Telemetry Consumption
- Live Telemetry Panel streams simulated or real TrovoTech data.
- KPIs: utilization %, active rides, swap events.
- Use telemetry trends to inform future reinvestment decisions.

## 8. Security & Compliance
- KYC required for token mint & large transfers.
- Request tracing via `X-Request-Id` for audit trail.
- Sensitive operations logged in `audit_logs` table.

## 9. Troubleshooting
| Issue | Cause | Resolution |
|-------|-------|-----------|
| Cannot invest (ownership error) | Asset fully allocated | Choose different asset or await new issuance |
| KYC stuck pending | Provider delay | Contact support; verify documents clear |
| Wallet shows zero after funding | Seed/demo mode not re-run | Admin: `php artisan migrate:fresh --seed` |
| Telemetry panel empty | No live stream | Run telemetry simulator script or confirm integration |
| Duplicate token display | Cache stale | Force refresh / clear browser cache |

## 10. Glossary (Quick)
- SOH: State of Health of battery/vehicle.
- Token: Blockchain representation of fractional asset ownership.
- ROI: Return on investment (percentage gain).
- Minted: Token creation recorded with `tx_hash`.
- Swap Event: Battery swap recorded against station/vehicle.

## 11. Future Enhancements
- Secondary market trading of tokens.
- Automated yield reinvestment.
- ESG impact scoring per asset.

## 12. Support
Contact administrator via in-app feedback modal or support email configured in `fleetfi.php`.
