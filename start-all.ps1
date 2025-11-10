# Starts backend (Laravel) and frontend (Vite) concurrently in PowerShell
# Usage: ./start-all.ps1

Write-Host "Starting FleetFi backend and frontend..." -ForegroundColor Green

$backendPath = "backend"
$frontendPath = "."  # root for vite (adjust if src/)

# Start backend
Start-Process powershell -ArgumentList "-NoExit","-Command","cd $backendPath; php artisan serve --host=127.0.0.1 --port=8000" -WindowStyle Minimized

Start-Sleep -Seconds 2

# Start frontend
Start-Process powershell -ArgumentList "-NoExit","-Command","cd $frontendPath; npm run dev" -WindowStyle Minimized

Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan

# Optional: Tail log style output (requires separate logging strategy)