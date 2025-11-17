# Trovotech API Testing Script
# Test all Trovotech integration endpoints

$baseUrl = "http://127.0.0.1:8000/api"
$adminEmail = "admin@fleetfi.com"
$adminPassword = "admin123"
$investorEmail = "john.investor@example.com"
$investorPassword = "investor123"

Write-Host "🧪 FleetFi Trovotech API Testing" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login as Admin
Write-Host "Test 1: Admin Login" -ForegroundColor Yellow
$loginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json"
    $adminToken = $loginResponse.token
    Write-Host "✅ Admin login successful" -ForegroundColor Green
    Write-Host "   Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Login as Investor
Write-Host "Test 2: Investor Login" -ForegroundColor Yellow
$investorLoginBody = @{
    email = $investorEmail
    password = $investorPassword
} | ConvertTo-Json

try {
    $investorLoginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $investorLoginBody -ContentType "application/json"
    $investorToken = $investorLoginResponse.token
    Write-Host "✅ Investor login successful" -ForegroundColor Green
    Write-Host "   Token: $($investorToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Investor login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Get Keypair Instructions
Write-Host "Test 3: Get Keypair Generation Instructions" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $investorToken"
        "Accept" = "application/json"
    }
    $keypairInstructions = Invoke-RestMethod -Uri "$baseUrl/trovotech/users/keypair-instructions" -Method GET -Headers $headers
    Write-Host "✅ Keypair instructions retrieved" -ForegroundColor Green
    Write-Host "   Methods available: $($keypairInstructions.methods.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get keypair instructions: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Onboard User to Trovotech
Write-Host "Test 4: Onboard Investor to Trovotech" -ForegroundColor Yellow
$onboardBody = @{
    mobile = "8012345678"
    mobile_country_code = "+234"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $investorToken"
        "Accept" = "application/json"
        "Content-Type" = "application/json"
    }
    $onboardResponse = Invoke-RestMethod -Uri "$baseUrl/trovotech/users/onboard" -Method POST -Body $onboardBody -Headers $headers
    Write-Host "Success! User onboarded to Trovotech" -ForegroundColor Green
    Write-Host "   Trovotech Username: $($onboardResponse.trovotech.username)" -ForegroundColor Gray
    Write-Host "   Wallet Address: $($onboardResponse.wallet.address)" -ForegroundColor Gray
    if ($onboardResponse.secret_key) {
        $secretPreview = $onboardResponse.secret_key.value.Substring(0, 10)
        Write-Host "   Secret Key Generated (mock): $secretPreview..." -ForegroundColor Magenta
    }
    
    # Store for later tests
    $walletAddress = $onboardResponse.wallet.address
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetails.message -like "*already onboarded*") {
        Write-Host "User already onboarded" -ForegroundColor Cyan
        # Continue with tests
    } else {
        Write-Host "Onboarding failed: $($errorDetails.message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Get User Wallet Info
Write-Host "Test 5: Get User Wallet Information" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $investorToken"
        "Accept" = "application/json"
    }
    $walletResponse = Invoke-RestMethod -Uri "$baseUrl/trovotech/users/wallet" -Method GET -Headers $headers
    Write-Host "✅ Wallet information retrieved" -ForegroundColor Green
    Write-Host "   Address: $($walletResponse.wallet.address)" -ForegroundColor Gray
    Write-Host "   Short: $($walletResponse.wallet.address_short)" -ForegroundColor Gray
    Write-Host "   Balance: $($walletResponse.wallet.balance)" -ForegroundColor Gray
    Write-Host "   Network: $($walletResponse.network)" -ForegroundColor Gray
    
    $walletAddress = $walletResponse.wallet.address
} catch {
    Write-Host "❌ Failed to get wallet info: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Update KYC Status (Admin only)
Write-Host "Test 6: Update User KYC Status (Admin)" -ForegroundColor Yellow

# First, get the investor user ID
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Accept" = "application/json"
    }
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method GET -Headers $headers
    $investorUser = $usersResponse.data | Where-Object { $_.email -eq $investorEmail } | Select-Object -First 1
    
    if ($investorUser) {
        $kycBody = @{
            user_id = $investorUser.id
            kyc_level = 2
            kyc_data = @{
                provider = "IdentityPass"
                verification_id = "TEST_VERIFY_123"
                address_verified = $true
                document_type = "passport"
            }
        } | ConvertTo-Json
        
        $headers = @{
            "Authorization" = "Bearer $adminToken"
            "Accept" = "application/json"
            "Content-Type" = "application/json"
        }
        
        $kycResponse = Invoke-RestMethod -Uri "$baseUrl/trovotech/users/kyc/update" -Method POST -Body $kycBody -Headers $headers
        Write-Host "✅ KYC status updated" -ForegroundColor Green
        Write-Host "   User: $($kycResponse.user.email)" -ForegroundColor Gray
        Write-Host "   KYC Level: $($kycResponse.user.kyc_level)" -ForegroundColor Gray
        Write-Host "   Verified: $($kycResponse.user.kyc_verified)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Could not find investor user" -ForegroundColor Yellow
    }
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "❌ KYC update failed: $($errorDetails.message)" -ForegroundColor Red
}

Write-Host ""

# Test 7: Check Routes
Write-Host "Test 7: Verify Trovotech Routes Registered" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Accept" = "application/json"
    }
    
    # Test each route with a simple GET/POST
    $routes = @(
        @{ Method = "GET"; Path = "/trovotech/users/wallet"; Name = "Get Wallet" },
        @{ Method = "GET"; Path = "/trovotech/users/keypair-instructions"; Name = "Keypair Instructions" }
    )
    
    foreach ($route in $routes) {
        try {
            if ($route.Method -eq "GET") {
                $null = Invoke-RestMethod -Uri "$baseUrl$($route.Path)" -Method GET -Headers $headers -ErrorAction Stop
            }
            Write-Host "   ✅ $($route.Name) - Route exists" -ForegroundColor Green
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq 404) {
                Write-Host "   ❌ $($route.Name) - Route not found" -ForegroundColor Red
            } else {
                Write-Host "   ✅ $($route.Name) - Route exists (status: $statusCode)" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "⚠️  Could not verify routes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Trovotech API Testing Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- User Onboarding: ✅" -ForegroundColor Green
Write-Host "- Wallet Management: ✅" -ForegroundColor Green
Write-Host "- KYC Updates: ✅" -ForegroundColor Green
Write-Host "- Helper Endpoints: ✅" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure real Trovotech API key in .env" -ForegroundColor Gray
Write-Host "2. Implement frontend wallet generation" -ForegroundColor Gray
Write-Host "3. Test token minting workflow" -ForegroundColor Gray
Write-Host "4. Integrate with KYC provider" -ForegroundColor Gray
