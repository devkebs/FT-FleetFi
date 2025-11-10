#!/usr/bin/env pwsh
# Quick health check for FleetFi servers

Write-Host "=== FleetFi Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Check backend
Write-Host "Checking backend (http://localhost:8000)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/user" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 401) {
        Write-Host " [OK] Online (401 expected)" -ForegroundColor Green
        $backendOk = $true
    } else {
        Write-Host " [WARN] Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
        $backendOk = $false
    }
} catch {
    Write-Host " [FAIL] Offline" -ForegroundColor Red
    $backendOk = $false
}

# Check frontend
Write-Host "Checking frontend (http://localhost:3000)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host " [OK] Online" -ForegroundColor Green
    $frontendOk = $true
} catch {
    Write-Host " [FAIL] Offline" -ForegroundColor Red
    $frontendOk = $false
}

# Check database
Write-Host "Checking database..." -NoNewline
if (Test-Path "backend\database\database.sqlite") {
    $size = (Get-Item "backend\database\database.sqlite").Length
    $sizeKB = [math]::Round($size/1KB, 2)
    Write-Host " [OK] Exists ($sizeKB KB)" -ForegroundColor Green
    $dbOk = $true
} else {
    Write-Host " [FAIL] Not found" -ForegroundColor Red
    $dbOk = $false
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan

if ($backendOk -and $frontendOk -and $dbOk) {
    Write-Host "[SUCCESS] All systems operational" -ForegroundColor Green
    Write-Host ""
    Write-Host "Open: http://localhost:3000" -ForegroundColor White
    Write-Host "Login: admin@fleetfi.com / Fleet@123" -ForegroundColor White
} else {
    Write-Host "[ERROR] Some systems offline" -ForegroundColor Red
    Write-Host ""
    if (-not $backendOk) {
        Write-Host "-> Start backend:  cd backend; php artisan serve --host=0.0.0.0 --port=8000" -ForegroundColor Yellow
    }
    if (-not $frontendOk) {
        Write-Host "-> Start frontend: npm run dev" -ForegroundColor Yellow
    }
    if (-not $dbOk) {
        Write-Host "-> Setup database: cd backend; New-Item database\database.sqlite -Force; php artisan migrate:fresh --seed" -ForegroundColor Yellow
    }
}
