# Development Scripts Archive

This folder contains archived development and testing scripts that were moved here to keep the main repository clean.

## Archived Files

### PHP Test Scripts
- **test-endpoints.php** - Tests admin dashboard API endpoints (users, KYC, transactions)
- **test-auth.php** - Generates auth tokens for admin users
- **test-data-summary.php** - Displays summary of test data in database
- **test_analytics.php** - Tests analytics dashboard endpoint
- **post_login_test.php** - Simple login endpoint test using cURL
- **live_data_smoke_test.php** - Smoke test for live telemetry and assets endpoints

### HTML Test Tools
- **debug-auth.html** - Browser-based authentication debug tool with localStorage inspection

### PowerShell Test Scripts
- **test-system.ps1** - Full system integration test (login, registration, analytics)

## How to Run

### PHP Scripts
From the `backend` directory:
```bash
php dev-scripts-archived/test-endpoints.php
php dev-scripts-archived/test-auth.php
```

### HTML Debug Tool
Open in browser:
```
file:///path/to/backend/dev-scripts-archived/debug-auth.html
```

### PowerShell Scripts
From the root directory:
```powershell
.\backend\dev-scripts-archived\test-system.ps1
```

## Note
These scripts are kept for reference and debugging purposes. They are not required for the application to run.
