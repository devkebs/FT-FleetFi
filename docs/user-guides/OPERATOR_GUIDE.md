# FleetFi Operator Guide

## 1. Overview

Operators manage day-to-day fleet operations, monitor vehicle health and telemetry, and ensure revenue generation and uptime.

## 2. Dashboard

- Fleet Overview: Vehicles, stations, active rides, availability.
- Health & Alerts: SOH, fault codes, maintenance flags.
- Telemetry Map: Live locations, geofencing, trip breadcrumbs.
- Revenue Snapshot: Daily/weekly revenue, breakdown per asset.

## 3. Core Workflows

### A. Telemetry Monitoring

- Open Live Telemetry Panel.
- Track utilization %, speed, location, swap events.
- Investigate anomalies via recent telemetry history.

### B. Asset Management

- Vehicles: status changes (active/in_maintenance), assign drivers.
- Stations: capacity, uptime, swap throughput.
- Update config via Admin (if role allows) or raise requests.

### C. Incident Response

- Respond to telemetry alerts (overheat, low SOH, geo-breach).
- Create incident log and set resolution steps.
- Notify investors if revenue impact expected.

## 4. Revenue & Operations

- Revenue Breakdown widget shows drivers/routes contributing most.
- Swap Station metrics track turnaround efficiency.
- Export daily summaries from Operator Dashboard or scripts.

## 5. Notifications

- Receive system alerts and KYC/revenue events.
- Filter unread and mark resolved.

## 6. Best Practices

- Keep assets within recommended SOH % thresholds.
- Schedule maintenance proactively based on telemetry.
- Ensure accurate data capture for payouts.

## 7. Scripts (optional)

- `backend/scripts/revenue_summary.php` — quick revenue rollup.
- `backend/scripts/simulate_ride.php` — demo ride generator.
- `simulate-telemetry.ps1` — Windows simulator for dev demos.

## 8. Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|-----------|
| Telemetry stale | Integration down | Run simulator or check OEM/TrovoTech API health |
| Asset not found | Wrong ID | Verify asset_id in system, check migrations seeded |
| Revenue zero | No rides | Simulate rides or verify driver assignments |

## 9. Contacts

Admin team for roles/config changes; Engineering for integrations.
