# FleetFi Operations & Revenue Simulation

This document describes the interim simulation layer for rides, revenue generation, and allocation splits until full TrovoTech + Bantu blockchain integration is implemented.

## Data Structures

### rides

Represents a completed vehicle ride capturing:

- `vehicle_id` reference
- Distance (`distance_km`)
- Battery start/end percentages
- Swap counts before/after the ride
- Gross revenue attributed to the ride
- Start/end timestamps

### revenues (extended)

Adds allocation columns:

- `investor_roi_amount`
- `rider_wage_amount`
- `management_reserve_amount`
- `maintenance_reserve_amount`

Linked optionally to a `ride_id` and a `source` (e.g. `ride`).

### swap_events

Captures a battery swap occurrence for an `asset_id` at a station with previous/new battery levels.

## Simulation Command

`php artisan simulate:ride` creates a random ride (or use `--vehicle_id=` to target a specific vehicle) and applies allocation splits defined in `config/fleetfi.php`.

Environment overrides available in `.env`:

```bash
FLEETFI_BASE_RATE_PER_KM=1.25
FLEETFI_INVESTOR_ROI_PCT=0.50
FLEETFI_RIDER_WAGE_PCT=0.30
FLEETFI_MANAGEMENT_RESERVE_PCT=0.15
FLEETFI_MAINTENANCE_RESERVE_PCT=0.05
```

## API Endpoints

| Endpoint | Method | Roles | Description |
|----------|--------|-------|-------------|
| `/api/rides` | GET | operator, admin | List recent rides with revenue breakdown |
| `/api/revenue/summary` | GET | investor, operator, admin | Aggregated revenue allocations |

## Future Blockchain Integration (TrovoTech + Bantu)

The `config/fleetfi.php` includes a placeholder `blockchain` section. Future steps:

1. Mint asset-backed tokens per vehicle/asset via TrovoTech API.
2. Record on-chain transaction hashes (`tx_hash`) and metadata proofs (`metadata_hash`).
3. Automate ROI disbursement triggered by on-chain events instead of local simulation.

## Next Steps

- Add unit tests for `simulate:ride` command.
- Integrate rider assignment to rides for wage validation.
- Move allocation logic into a dedicated service class for easier future replacement by blockchain events.
