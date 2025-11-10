# Continuous Telemetry Simulator

## Overview
The `telemetry:simulate` Artisan command continuously generates simulated telemetry data for active assets in the FleetFi system. This is useful for:
- Testing live telemetry dashboards
- Stress-testing the system with real-time data
- Demonstrating OEM integration without external data sources
- Populating the database with telemetry for development and demo environments

---

## Usage

### Basic Command
Run continuously with default 5-second intervals for all active assets:
```bash
php artisan telemetry:simulate
```

### Options
- `--interval=<seconds>` : Time between telemetry generations (default: 5)
- `--count=<number>` : Total iterations before exit (default: infinite)
- `--assets=<ids>` : Comma-separated asset IDs to simulate (default: all active)

---

## Examples

### 1. Continuous Simulation (Infinite Loop)
Generate telemetry every 5 seconds for all active assets:
```bash
php artisan telemetry:simulate
```

### 2. Custom Interval
Generate telemetry every 10 seconds:
```bash
php artisan telemetry:simulate --interval=10
```

### 3. Limited Iterations
Run for exactly 20 iterations then stop:
```bash
php artisan telemetry:simulate --count=20
```

### 4. Specific Assets
Simulate telemetry only for selected assets:
```bash
php artisan telemetry:simulate --assets=VEH001,VEH002,BAT003
```

### 5. Combined Options
Run every 3 seconds for 50 iterations on specific assets:
```bash
php artisan telemetry:simulate --interval=3 --count=50 --assets=VEH001,BAT001
```

---

## Output Example
```
Starting telemetry simulator...
Interval: 5s | Count: infinite
[Iteration 1] Generated telemetry for 20 assets.
[Iteration 2] Generated telemetry for 20 assets.
[Iteration 3] Generated telemetry for 20 assets.
...
```

---

## Running in Background (Production/Demo)

### Windows (PowerShell)
```powershell
# Start in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\path\to\backend; php artisan telemetry:simulate"
```

### Linux/Mac (screen/tmux)
```bash
# Using screen
screen -S telemetry
php artisan telemetry:simulate
# Press Ctrl+A, D to detach

# Reattach later
screen -r telemetry

# Using tmux
tmux new -s telemetry
php artisan telemetry:simulate
# Press Ctrl+B, D to detach

# Reattach later
tmux attach -t telemetry
```

### Windows Service (Advanced)
Use NSSM or similar tools to run as a Windows service for persistent background execution.

---

## Scheduling (Optional)

To run telemetry generation as a scheduled task (e.g., batch every minute instead of continuous):

### Edit `app/Console/Kernel.php`
```php
protected function schedule(Schedule $schedule)
{
    // Generate telemetry batch every minute (single iteration per run)
    $schedule->command('telemetry:simulate --count=1')->everyMinute();
}
```

### Enable Laravel Scheduler (Linux/Mac cron)
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### Windows Task Scheduler
Create a scheduled task to run:
```
php artisan schedule:run
```
Every minute.

---

## Stop Command
- **Foreground**: Press `Ctrl+C`
- **Background (screen/tmux)**: Reattach to session and press `Ctrl+C`
- **Service**: Stop the service via service manager

---

## Notes
- The command generates random but realistic telemetry values (battery, speed, temperature, voltage, current, status, location).
- Only assets with `status = 'active'` are simulated unless specific asset IDs are provided.
- Generated telemetry is immediately available via `/api/telemetry/live` and stored in the database.
- For OEM integration testing, this replaces the need for the PowerShell `simulate-telemetry.ps1` script (which sends HTTP POST requests).

---

## Troubleshooting

### No assets found
Ensure you have created assets in the system with `status = 'active'` or provide specific asset IDs via `--assets`.

### High CPU/Memory Usage
Increase the `--interval` value to reduce frequency (e.g., `--interval=30` for 30 seconds).

### Database Connection Timeout
For very long-running simulations, ensure your database connection settings allow persistent connections or restart the command periodically.

---

## See Also
- [LIVE_TELEMETRY_QUICKSTART.md](./LIVE_TELEMETRY_QUICKSTART.md) - OEM webhook integration guide
- [OEM_TELEMETRY_INTEGRATION.md](./OEM_TELEMETRY_INTEGRATION.md) - Detailed OEM integration documentation
