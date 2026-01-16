# FleetFi - Ready to Use! 
 
Installation completed successfully! 
 
========================================== 
QUICK START 
========================================== 
 
Option 1: Start Both Servers at Once 
   Double-click: start-fleetfi.bat 
 
Option 2: Start Manually 
   1. Double-click: start-backend.bat 
   2. Double-click: start-frontend.bat 
 
========================================== 
ACCESS THE APPLICATION 
========================================== 
 
Frontend: http://localhost:3000 
Backend:  http://127.0.0.1:8000 
 
========================================== 
TEST CREDENTIALS 
========================================== 
 
Admin: 
  Email: admin@fleetfi.local 
  Password: admin123 
 
Investor: 
  Email: investor@fleetfi.local 
  Password: investor123 
 
Operator: 
  Email: operator@fleetfi.local 
  Password: operator123 
 
Driver: 
  Email: driver@fleetfi.local 
  Password: driver123 
 
========================================== 
TROUBLESHOOTING 
========================================== 
 
Port 8000 in use? 
  netstat -ano | findstr :8000 
  taskkill /F /PID [PID] 
 
Database errors? 
  cd backend 
  del database\database.sqlite 
  php artisan migrate:fresh 
 
Frontend errors? 
  cd frontend 
  npm install --legacy-peer-deps 
