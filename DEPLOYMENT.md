# FleetFi Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Security Checklist](#security-checklist)
7. [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites

### Server Requirements
- **PHP:** 8.1 or higher
- **Composer:** Latest stable version
- **Node.js:** 18.x or higher
- **NPM/Yarn:** Latest stable
- **Database:** MySQL 8.0+ or PostgreSQL 13+ (production) / SQLite 3.x (local dev)
- **Web Server:** Nginx or Apache with SSL/TLS
- **Memory:** Minimum 2GB RAM
- **Storage:** 20GB+ available

### Required Extensions (PHP)
```bash
php -m | grep -E "pdo|mbstring|tokenizer|xml|ctype|json|bcmath|fileinfo|openssl"
```

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url> fleetfi
cd fleetfi
```

### 2. Backend Environment
```bash
cd backend
cp .env.example .env
```

### 3. Configure `.env` (Production)
```bash
# Application
APP_NAME=FleetFi
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database (MySQL/PostgreSQL for production)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fleetfi_production
DB_USERNAME=fleetfi_user
DB_PASSWORD=<strong-password>

# Session & Cache
SESSION_DRIVER=database
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# JWT/Sanctum
SANCTUM_STATEFUL_DOMAINS=your-domain.com,www.your-domain.com

# FleetFi Configuration
FLEETFI_BASE_RATE_PER_KM=0.50
FLEETFI_INVESTOR_SPLIT_PERCENT=50
FLEETFI_RIDER_SPLIT_PERCENT=30
FLEETFI_MANAGEMENT_SPLIT_PERCENT=15
FLEETFI_MAINTENANCE_SPLIT_PERCENT=5

# TrovoTech Integration (Blockchain)
TROVOTECH_API_URL=https://api.trovotech.com
TROVOTECH_API_KEY=<your-api-key>
TROVOTECH_CUSTODY_WALLET=<custody-wallet-address>
TROVOTECH_NETWORK=bantu-mainnet

# Bantu Blockchain
BANTU_NETWORK=mainnet
BANTU_RPC_URL=https://rpc.bantu.network

# Email (for notifications)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=<username>
MAIL_PASSWORD=<password>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@fleetfi.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 4. Frontend Environment
Create `frontend/.env` (if needed):
```bash
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=FleetFi
```

---

## Database Configuration

### 1. Create Production Database
```sql
CREATE DATABASE fleetfi_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fleetfi_user'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON fleetfi_production.* TO 'fleetfi_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Run Migrations
```bash
cd backend
php artisan migrate --force
```

### 3. Seed Production Data
```bash
# Seed production users (10 users)
php artisan db:seed --class=ProductionUsersSeeder

# Optional: Seed demo assets and rides
php artisan db:seed --class=MegaDemoSeeder
```

---

## Backend Deployment

### 1. Install Dependencies
```bash
cd backend
composer install --no-dev --optimize-autoloader
```

### 2. Generate Application Key
```bash
php artisan key:generate
```

### 3. Cache Configuration
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 4. Create Storage Symlink
```bash
php artisan storage:link
```

### 5. Set Permissions
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 6. Configure Web Server

#### Nginx Example
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    root /var/www/fleetfi/backend/public;
    index index.php index.html;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 7. Setup Supervisor (Queue Workers)
Create `/etc/supervisor/conf.d/fleetfi.conf`:
```ini
[program:fleetfi-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/fleetfi/backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/fleetfi/backend/storage/logs/worker.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start fleetfi-worker:*
```

---

## Frontend Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for Production
```bash
npm run build
```

### 3. Deploy Build
Option A - Serve from Nginx:
```nginx
server {
    listen 443 ssl http2;
    server_name app.your-domain.com;

    root /var/www/fleetfi/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://your-domain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Option B - Deploy to CDN (Vercel, Netlify):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Security Checklist

### Pre-Deployment
- [ ] All `.env` files excluded from git (check `.gitignore`)
- [ ] Strong database passwords set
- [ ] JWT secrets rotated from defaults
- [ ] API keys for TrovoTech configured
- [ ] CORS origins restricted to production domains
- [ ] `APP_DEBUG=false` in production
- [ ] SSL/TLS certificates installed and valid
- [ ] Firewall rules configured (only 80/443 open)
- [ ] Database accessible only from localhost
- [ ] Redis password set (if using)

### Post-Deployment
- [ ] Change all default passwords in `LOGIN_CREDENTIALS.md`
- [ ] Enable 2FA for admin accounts
- [ ] Set up automated backups (database + storage)
- [ ] Configure log rotation
- [ ] Set up monitoring (Sentry, New Relic, etc.)
- [ ] Test all API endpoints with production credentials
- [ ] Verify HTTPS redirects working
- [ ] Test file upload limits and permissions
- [ ] Review Laravel logs for errors
- [ ] Set up automated security updates

### Ongoing
- [ ] Regular database backups (daily recommended)
- [ ] Monitor failed login attempts
- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Audit user permissions quarterly

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

Expected Response:
```json
{
  "status": "ok",
  "database": "connected",
  "cache": "working"
}
```

### 2. Test Authentication
```bash
curl -X POST https://your-domain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleetfi.com",
    "password": "Fleet@Admin2025!"
  }'
```

Expected: Bearer token in response

### 3. Test Protected Endpoints
```bash
TOKEN="<your-token>"

# Get rides
curl https://your-domain.com/api/rides \
  -H "Authorization: Bearer $TOKEN"

# Get revenue summary
curl https://your-domain.com/api/revenue/summary \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Frontend Verification
- [ ] Visit app URL and verify loading
- [ ] Login with admin credentials
- [ ] Check all dashboard components render
- [ ] Verify API calls complete (check Network tab)
- [ ] Test revenue breakdown display
- [ ] Test ride simulation (if applicable)

### 5. Database Verification
```bash
cd backend
php artisan tinker
```

```php
// Check user count
User::count(); // Should be 10

// Check rides
Ride::count(); // Should match seeded data

// Check revenue
Revenue::sum('amount'); // Should show total revenue
```

---

## Rollback Procedure

### If Deployment Fails

1. **Restore Database Backup:**
```bash
mysql -u fleetfi_user -p fleetfi_production < backup_YYYYMMDD.sql
```

2. **Revert Code:**
```bash
git checkout <previous-stable-commit>
composer install --no-dev
php artisan config:cache
```

3. **Clear All Caches:**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## Maintenance Mode

### Enable Maintenance
```bash
php artisan down --message="Scheduled maintenance" --retry=60
```

### Disable Maintenance
```bash
php artisan up
```

---

## Support & Monitoring

### Logs Location
- **Laravel:** `backend/storage/logs/laravel.log`
- **Nginx Access:** `/var/log/nginx/access.log`
- **Nginx Error:** `/var/log/nginx/error.log`
- **Queue Workers:** `backend/storage/logs/worker.log`

### Monitoring Commands
```bash
# Check queue status
php artisan queue:monitor

# Check failed jobs
php artisan queue:failed

# Tail logs
tail -f backend/storage/logs/laravel.log
```

---

**Last Updated:** November 9, 2025  
**Support:** admin@fleetfi.com  
**Documentation:** `/docs` directory
