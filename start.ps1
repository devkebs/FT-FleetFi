# FleetFi Startup Script
# Run this to start both backend and frontend servers

Write-Host "=== FleetFi Startup ===" -ForegroundColor Green
Write-Host ""

# Check if backend database exists
$dbPath = "backend\database\database.sqlite"
if (!(Test-Path $dbPath)) {
    Write-Host "Database not found. Creating..." -ForegroundColor Yellow
    New-Item -ItemType File -Path $dbPath -Force | Out-Null
    Set-Location backend
    php artisan migrate:fresh --seed
    Set-Location ..
    Write-Host "✓ Database created and seeded" -ForegroundColor Green
} else {
    Write-Host "✓ Database exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan

# Start backend in new window
Write-Host "→ Starting Laravel backend on http://localhost:8000" -ForegroundColor Yellow
Start-Process -FilePath powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command cd '$PWD\backend'; php artisan serve --host=0.0.0.0 --port=8000"

# Wait a moment
Start-Sleep -Seconds 3

# Start frontend in new window  
Write-Host "→ Starting Vite frontend on http://localhost:3000" -ForegroundColor Yellow
Start-Process -FilePath powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command cd '$PWD'; npm run dev"

Write-Host ""
Write-Host "=== Servers Started ===" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Login:" -ForegroundColor Yellow
Write-Host "  Email:    admin@fleetfi.com" -ForegroundColor White
Write-Host "  Password: Fleet@123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open frontend in browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:3000"
