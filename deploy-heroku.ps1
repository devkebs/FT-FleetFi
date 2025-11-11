# FleetFi Heroku Deployment Script
# Run this from the root directory: .\deploy-heroku.ps1

Write-Host "🚀 FleetFi Heroku Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Heroku CLI is installed
Write-Host "Checking Heroku CLI installation..." -ForegroundColor Yellow
if (-not (Get-Command heroku -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Heroku CLI not found!" -ForegroundColor Red
    Write-Host "Please install from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Heroku CLI found" -ForegroundColor Green

# Prompt for Heroku login
Write-Host ""
Write-Host "Please log in to Heroku..." -ForegroundColor Yellow
heroku login

# Backend Deployment
Write-Host ""
Write-Host "📦 Deploying Backend (Laravel API)..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Ask for backend app name
$backendAppName = Read-Host "Enter Heroku app name for backend (e.g., fleetfi-api)"
if ([string]::IsNullOrWhiteSpace($backendAppName)) {
    $backendAppName = "fleetfi-api-$((Get-Random -Minimum 1000 -Maximum 9999))"
    Write-Host "Using auto-generated name: $backendAppName" -ForegroundColor Yellow
}

# Navigate to backend directory
Set-Location backend

# Check if Heroku app exists
$appExists = heroku apps:info --app $backendAppName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new Heroku app: $backendAppName..." -ForegroundColor Yellow
    heroku create $backendAppName
} else {
    Write-Host "App $backendAppName already exists" -ForegroundColor Green
}

# Add MySQL database (ClearDB - free tier)
Write-Host "Adding ClearDB MySQL database..." -ForegroundColor Yellow
heroku addons:create cleardb:ignite --app $backendAppName 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database added" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database might already exist or free tier limit reached" -ForegroundColor Yellow
}

# Get database URL
Write-Host "Retrieving database credentials..." -ForegroundColor Yellow
$cleardbUrl = heroku config:get CLEARDB_DATABASE_URL --app $backendAppName

if ($cleardbUrl -match "mysql://([^:]+):([^@]+)@([^/]+)/(.+)") {
    $dbUsername = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbName = $matches[4]
    
    Write-Host "✅ Database credentials retrieved" -ForegroundColor Green
    Write-Host "   Host: $dbHost" -ForegroundColor Gray
    Write-Host "   Database: $dbName" -ForegroundColor Gray
} else {
    Write-Host "❌ Could not parse database URL" -ForegroundColor Red
    Write-Host "Please configure manually: heroku config --app $backendAppName" -ForegroundColor Red
}

# Generate Laravel app key
Write-Host "Generating Laravel app key..." -ForegroundColor Yellow
Set-Location ..
if (Test-Path "backend/.env") {
    $appKey = php backend/artisan key:generate --show
    Write-Host "✅ App key generated: $appKey" -ForegroundColor Green
} else {
    Copy-Item "backend/.env.example" "backend/.env"
    $appKey = php backend/artisan key:generate --show
    Write-Host "✅ App key generated: $appKey" -ForegroundColor Green
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
heroku config:set APP_NAME=FleetFi --app $backendAppName | Out-Null
heroku config:set APP_ENV=production --app $backendAppName | Out-Null
heroku config:set APP_KEY="$appKey" --app $backendAppName | Out-Null
heroku config:set APP_DEBUG=false --app $backendAppName | Out-Null
heroku config:set APP_URL="https://$backendAppName.herokuapp.com" --app $backendAppName | Out-Null
heroku config:set DB_CONNECTION=mysql --app $backendAppName | Out-Null
heroku config:set DB_HOST="$dbHost" --app $backendAppName | Out-Null
heroku config:set DB_PORT=3306 --app $backendAppName | Out-Null
heroku config:set DB_DATABASE="$dbName" --app $backendAppName | Out-Null
heroku config:set DB_USERNAME="$dbUsername" --app $backendAppName | Out-Null
heroku config:set DB_PASSWORD="$dbPassword" --app $backendAppName | Out-Null
heroku config:set SESSION_DRIVER=cookie --app $backendAppName | Out-Null
heroku config:set CACHE_DRIVER=array --app $backendAppName | Out-Null
heroku config:set QUEUE_CONNECTION=database --app $backendAppName | Out-Null
Write-Host "✅ Environment variables set" -ForegroundColor Green

# Initialize git if not already
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
}

# Create Heroku remote
Write-Host "Setting up Heroku git remote..." -ForegroundColor Yellow
Set-Location backend
$remoteExists = git remote | Where-Object { $_ -eq "heroku" }
if ($remoteExists) {
    git remote remove heroku
}
heroku git:remote --app $backendAppName
Set-Location ..

# Deploy to Heroku
Write-Host ""
Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Cyan
Write-Host "This may take several minutes..." -ForegroundColor Yellow

Set-Location backend
git push heroku main 2>&1
if ($LASTEXITCODE -ne 0) {
    # Try master branch if main doesn't exist
    Write-Host "Trying master branch..." -ForegroundColor Yellow
    git push heroku master 2>&1
}
Set-Location ..

# Run migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
heroku run php artisan migrate --force --app $backendAppName
Write-Host "✅ Migrations completed" -ForegroundColor Green

# Seed production users
Write-Host "Seeding production users..." -ForegroundColor Yellow
heroku run php artisan db:seed --class=ProductionUsersSeeder --force --app $backendAppName
Write-Host "✅ Production users seeded" -ForegroundColor Green

# Test backend
Write-Host ""
Write-Host "🧪 Testing backend deployment..." -ForegroundColor Cyan
$backendUrl = "https://$backendAppName.herokuapp.com/api/health"
Write-Host "Testing: $backendUrl" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri $backendUrl -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is responding!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend test failed - check logs: heroku logs --tail --app $backendAppName" -ForegroundColor Yellow
}

# Frontend Deployment Options
Write-Host ""
Write-Host "📱 Frontend Deployment Options:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Deploy to Vercel (Recommended)" -ForegroundColor Yellow
Write-Host "   1. Install Vercel CLI: npm i -g vercel" -ForegroundColor Gray
Write-Host "   2. Run: vercel" -ForegroundColor Gray
Write-Host "   3. Set environment: VITE_API_URL=https://$backendAppName.herokuapp.com" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Deploy to Netlify" -ForegroundColor Yellow
Write-Host "   1. Install Netlify CLI: npm i -g netlify-cli" -ForegroundColor Gray
Write-Host "   2. Run: netlify deploy --prod" -ForegroundColor Gray
Write-Host "   3. Build directory: dist" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Deploy to Heroku" -ForegroundColor Yellow
Write-Host "   (Less optimal for React apps)" -ForegroundColor Gray
Write-Host ""

$deployFrontend = Read-Host "Deploy frontend to Vercel now? (y/n)"
if ($deployFrontend -eq 'y' -or $deployFrontend -eq 'Y') {
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        Write-Host "Deploying frontend to Vercel..." -ForegroundColor Yellow
        
        # Create .env.production
        @"
VITE_API_URL=https://$backendAppName.herokuapp.com
"@ | Out-File -FilePath ".env.production" -Encoding utf8
        
        vercel --prod
        Write-Host "✅ Frontend deployed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: https://$backendAppName.herokuapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View logs:     heroku logs --tail --app $backendAppName" -ForegroundColor Gray
Write-Host "  Run artisan:   heroku run php artisan tinker --app $backendAppName" -ForegroundColor Gray
Write-Host "  SSH into app:  heroku run bash --app $backendAppName" -ForegroundColor Gray
Write-Host "  Restart:       heroku restart --app $backendAppName" -ForegroundColor Gray
Write-Host ""
Write-Host "Login Credentials (from ProductionUsersSeeder):" -ForegroundColor Yellow
Write-Host "  Admin:    admin@fleetfi.com / Admin@123" -ForegroundColor Gray
Write-Host "  Operator: operator1@fleetfi.com / Operator@123" -ForegroundColor Gray
Write-Host "  Investor: investor1@fleetfi.com / Investor@123" -ForegroundColor Gray
Write-Host "  Driver:   driver1@fleetfi.com / Driver@123" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Your FleetFi MVP is now live!" -ForegroundColor Green
