# OEM Telemetry Simulator Script
# Simulates OEM (Qoura, vehicle manufacturers) sending telemetry data to FleetFi

# Configuration
$API_ENDPOINT = "http://127.0.0.1:8000/api/telemetry"
$OEM_API_KEY = "test-oem-key-123"  # Set this in Admin Dashboard Settings -> oem_telemetry_api_key

# Sample telemetry payloads for different asset types
$telemetryDataSamples = @(
    @{
        asset_id = "VEH001"
        battery_level = 75
        km = 125.5
        latitude = 6.5244
        longitude = 3.3792
        speed = 45
        status = "in_transit"
        temperature = 32.5
        voltage = 48.2
        current = 15.3
        recorded_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        oem_source = "qoura"
    },
    @{
        asset_id = "VEH002"
        battery_level = 22
        km = 87.3
        latitude = 6.4541
        longitude = 3.3947
        speed = 0
        status = "charging"
        temperature = 38.1
        voltage = 52.1
        current = -25.5
        recorded_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        oem_source = "qoura"
    },
    @{
        asset_id = "BAT001"
        battery_level = 95
        km = 0
        latitude = 6.5955
        longitude = 3.3087
        speed = 0
        status = "idle"
        temperature = 28.3
        voltage = 51.8
        current = 0.5
        recorded_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        oem_source = "manufacturer_x"
    },
    @{
        asset_id = "VEH003"
        battery_level = 58
        km = 203.7
        latitude = 6.4698
        longitude = 3.5852
        speed = 35
        status = "in_transit"
        temperature = 35.2
        voltage = 49.7
        current = 18.2
        recorded_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        oem_source = "qoura"
    }
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   OEM Telemetry Simulator for FleetFi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: $API_ENDPOINT" -ForegroundColor Yellow
Write-Host "API Key: $OEM_API_KEY" -ForegroundColor Yellow
Write-Host ""
Write-Host "Sending $($telemetryDataSamples.Count) telemetry updates..." -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($data in $telemetryDataSamples) {
    try {
        $jsonBody = $data | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
            "X-OEM-API-Key" = $OEM_API_KEY
            "Accept" = "application/json"
        }
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Sending telemetry for $($data.asset_id)..." -NoNewline
        
        $response = Invoke-RestMethod -Uri $API_ENDPOINT -Method POST -Headers $headers -Body $jsonBody -ErrorAction Stop
        
        Write-Host " SUCCESS" -ForegroundColor Green
        Write-Host "   └─ Battery: $($data.battery_level)% | Speed: $($data.speed) km/h | Status: $($data.status)" -ForegroundColor Gray
        $successCount++
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "   └─ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    # Small delay between requests
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Results: $successCount succeeded, $failCount failed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open the Operator Dashboard in your browser" -ForegroundColor White
Write-Host "2. Navigate to the Live Telemetry section" -ForegroundColor White
Write-Host "3. You should see real-time updates from these assets" -ForegroundColor White
Write-Host ""
Write-Host "To send continuous updates, run this script repeatedly or in a loop." -ForegroundColor Yellow
