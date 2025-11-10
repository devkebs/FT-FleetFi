# FleetFi System Test Script
# Tests login, registration, and analytics tracking

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "FleetFi System Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000/api"
$frontendUrl = "http://localhost:3000"

# Test 1: Check Backend Health
Write-Host "[1/5] Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/../" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is running on port 8000" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check Frontend Health
Write-Host "[2/5] Testing Frontend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is running on port 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Test User Registration
Write-Host "[3/5] Testing User Registration..." -ForegroundColor Yellow
$registerData = @{
    name = "Test User"
    email = "test@fleetfi.com"
    password = "password123"
    role = "investor"
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $registerData -Headers $headers
    if ($response.token) {
        Write-Host "✓ User registration successful" -ForegroundColor Green
        Write-Host "  Token: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
        $token = $response.token
    }
} catch {
    if ($_.Exception.Message -like "*already*") {
        Write-Host "⚠ User already exists (expected if running multiple times)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Registration failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Test Login
Write-Host "[4/5] Testing User Login..." -ForegroundColor Yellow
$loginData = @{
    email = "test@fleetfi.com"
    password = "password123"
    role = "investor"
    rememberMe = $true
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginData -Headers $headers
    if ($response.token) {
        Write-Host "✓ Login successful" -ForegroundColor Green
        Write-Host "  User: $($response.user.name) ($($response.user.email))" -ForegroundColor Gray
        Write-Host "  Role: $($response.user.role)" -ForegroundColor Gray
        $token = $response.token
    }
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Test Analytics Session Start
Write-Host "[5/5] Testing Analytics Tracking..." -ForegroundColor Yellow
if ($token) {
    $sessionId = "test-session-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $analyticsData = @{
        session_id = $sessionId
        user_agent = "PowerShell-Test-Script"
        ip_address = "127.0.0.1"
        started_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    } | ConvertTo-Json

    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Accept" = "application/json"
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/analytics/session/start" -Method POST -Body $analyticsData -Headers $headers
        Write-Host "✓ Analytics session started" -ForegroundColor Green
        Write-Host "  Session ID: $sessionId" -ForegroundColor Gray
        
        # Test event tracking
        $eventData = @{
            session_id = $sessionId
            event_type = "test_event"
            event_data = @{
                test = "data"
                timestamp = (Get-Date).ToString()
            } | ConvertTo-Json
        } | ConvertTo-Json

        $eventResponse = Invoke-RestMethod -Uri "$baseUrl/analytics/event" -Method POST -Body $eventData -Headers $headers
        Write-Host "✓ Analytics event tracked" -ForegroundColor Green
        
    } catch {
        Write-Host "✗ Analytics tracking failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Skipping analytics test (no auth token)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Backend URL: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor White
Write-Host "  Email: test@fleetfi.com" -ForegroundColor Gray
Write-Host "  Password: password123" -ForegroundColor Gray
Write-Host "  Role: investor" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ All systems tested!" -ForegroundColor Green
Write-Host "You can now open http://localhost:3000 in your browser" -ForegroundColor Cyan
Write-Host ""
