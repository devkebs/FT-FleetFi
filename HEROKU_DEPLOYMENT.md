# FleetFi Heroku Deployment Guide

## 🚀 Quick Deployment to Heroku

### Prerequisites
1. Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli
2. Git repository initialized
3. Heroku account created (free tier available)

---

## Backend Deployment (Laravel API)

### Step 1: Install Heroku CLI
```bash
# Windows (using chocolatey)
choco install heroku-cli

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App (Backend)
```bash
cd backend
heroku create fleetfi-api
```

### Step 4: Add MySQL Database (ClearDB - Free Tier)
```bash
heroku addons:create cleardb:ignite
```

### Step 5: Get Database Credentials
```bash
heroku config:get CLEARDB_DATABASE_URL
# Output: mysql://username:password@hostname/database_name
```

### Step 6: Set Environment Variables
```bash
# Copy the database URL from above and set Laravel env vars
heroku config:set APP_NAME=FleetFi
heroku config:set APP_ENV=production
heroku config:set APP_KEY=base64:YOUR_APP_KEY_HERE
heroku config:set APP_DEBUG=false
heroku config:set APP_URL=https://fleetfi-api.herokuapp.com

# Database (extract from CLEARDB_DATABASE_URL)
heroku config:set DB_CONNECTION=mysql
heroku config:set DB_HOST=your_cleardb_host
heroku config:set DB_PORT=3306
heroku config:set DB_DATABASE=your_database_name
heroku config:set DB_USERNAME=your_username
heroku config:set DB_PASSWORD=your_password

# Session & Cache
heroku config:set SESSION_DRIVER=cookie
heroku config:set CACHE_DRIVER=array
heroku config:set QUEUE_CONNECTION=database

# CORS
heroku config:set SANCTUM_STATEFUL_DOMAINS=fleetfi-app.herokuapp.com
```

### Step 7: Generate App Key
```bash
php artisan key:generate --show
# Copy the generated key and set it
heroku config:set APP_KEY=base64:YOUR_GENERATED_KEY
```

### Step 8: Create composer.json post-deploy script
Add to `composer.json` in the `scripts` section:
```json
"post-install-cmd": [
    "php artisan clear-compiled",
    "php artisan migrate --force",
    "php artisan db:seed --class=ProductionUsersSeeder --force",
    "php artisan config:cache",
    "php artisan route:cache"
]
```

### Step 9: Deploy Backend
```bash
# From backend directory
git init
git add .
git commit -m "Initial Heroku deployment"
heroku git:remote -a fleetfi-api
git push heroku main
```

### Step 10: Run Migrations
```bash
heroku run php artisan migrate --force
heroku run php artisan db:seed --class=ProductionUsersSeeder --force
```

### Step 11: Test Backend API
```bash
# Your backend API will be at:
https://fleetfi-api.herokuapp.com/api/login
```

---

## Frontend Deployment (React App)

### Option 1: Deploy to Heroku

#### Step 1: Create Heroku App (Frontend)
```bash
cd .. # Back to root directory
heroku create fleetfi-app
```

#### Step 2: Add Node.js Buildpack
```bash
heroku buildpacks:set heroku/nodejs -a fleetfi-app
```

#### Step 3: Create package.json in root if needed
```bash
# Ensure your root package.json has:
{
  "scripts": {
    "build": "vite build",
    "start": "vite preview --port $PORT --host 0.0.0.0"
  }
}
```

#### Step 4: Set Environment Variables
Create `.env.production`:
```env
VITE_API_URL=https://fleetfi-api.herokuapp.com
```

Then set Heroku config:
```bash
heroku config:set VITE_API_URL=https://fleetfi-api.herokuapp.com -a fleetfi-app
```

#### Step 5: Deploy Frontend
```bash
git add .
git commit -m "Deploy frontend to Heroku"
heroku git:remote -a fleetfi-app
git push heroku main
```

### Option 2: Deploy to Vercel (Recommended for React)

Vercel is better optimized for React apps and has generous free tier:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# Project name: fleetfi
# Framework: Vite
# Build command: vite build
# Output directory: dist
# Environment variable: VITE_API_URL=https://fleetfi-api.herokuapp.com
```

### Option 3: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Build directory: dist
# Environment: VITE_API_URL=https://fleetfi-api.herokuapp.com
```

---

## Alternative: All-in-One Deployment

### Deploy Both on Railway (Easier Alternative to Heroku)

Railway offers free tier with both frontend and backend:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Deploy frontend
cd ..
railway init
railway up
```

---

## Free Tier Hosting Comparison

| Platform | Backend (Laravel) | Frontend (React) | Database | Free Tier Limits |
|----------|-------------------|------------------|----------|------------------|
| **Heroku** | ✅ Yes | ✅ Yes | ✅ ClearDB MySQL (5MB) | 550 dyno hours/mo |
| **Railway** | ✅ Yes | ✅ Yes | ✅ PostgreSQL/MySQL | $5 credit/mo |
| **Render** | ✅ Yes | ✅ Static | ✅ PostgreSQL | 750 hours/mo |
| **Fly.io** | ✅ Yes | ✅ Yes | ❌ Paid only | 3 small VMs free |
| **Vercel** | ❌ No PHP | ✅ Yes | ❌ No DB | Unlimited static |
| **Netlify** | ❌ No PHP | ✅ Yes | ❌ No DB | 100GB bandwidth |

### Recommended Setup for Free Tier:
1. **Backend:** Heroku (with ClearDB MySQL)
2. **Frontend:** Vercel or Netlify
3. **Database:** ClearDB (Heroku addon) - Free 5MB

---

## Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Configure CORS properly
- [ ] Enable SSL (Heroku provides free SSL)
- [ ] Add rate limiting

### Database
- [ ] Backup strategy in place
- [ ] Migration rollback plan
- [ ] Seed production users only

### Monitoring
- [ ] Heroku logs: `heroku logs --tail -a fleetfi-api`
- [ ] Error tracking (Sentry free tier)
- [ ] Uptime monitoring (UptimeRobot free)

### Performance
- [ ] Enable caching
- [ ] Optimize images
- [ ] CDN for static assets (Cloudflare free)
- [ ] Compress responses

---

## Useful Heroku Commands

```bash
# View logs
heroku logs --tail -a fleetfi-api

# Run artisan commands
heroku run php artisan migrate -a fleetfi-api
heroku run php artisan tinker -a fleetfi-api

# SSH into dyno
heroku run bash -a fleetfi-api

# Restart app
heroku restart -a fleetfi-api

# Scale dynos
heroku ps:scale web=1 -a fleetfi-api

# Database backup
heroku run php artisan db:backup -a fleetfi-api
```

---

## Troubleshooting

### Issue: App crashes on startup
```bash
heroku logs --tail -a fleetfi-api
# Check for missing APP_KEY or database connection errors
```

### Issue: 500 Error
```bash
heroku config:set APP_DEBUG=true -a fleetfi-api
# Check logs, then set back to false
```

### Issue: Database migration fails
```bash
heroku run php artisan migrate:fresh --force -a fleetfi-api
heroku run php artisan db:seed --class=ProductionUsersSeeder --force -a fleetfi-api
```

### Issue: CORS errors
```bash
heroku config:set SANCTUM_STATEFUL_DOMAINS=fleetfi-app.herokuapp.com,fleetfi-app.vercel.app -a fleetfi-api
```

---

## Costs

### Free Tier (Perfect for MVP)
- **Heroku Backend:** Free (550 hours/mo - enough for 1 app)
- **ClearDB MySQL:** Free (5MB storage - ~1000 users)
- **Vercel Frontend:** Free (Unlimited)
- **Total:** $0/month

### When to Upgrade
- **Database > 5MB:** Upgrade ClearDB to $9.99/mo (1GB)
- **Need Redis:** Heroku Redis $15/mo
- **More dyno hours:** Hobby tier $7/mo per dyno
- **Custom domain:** Free on Heroku, just configure DNS

---

## Next Steps After Deployment

1. Test all API endpoints: https://fleetfi-api.herokuapp.com/api/login
2. Verify frontend connects to backend
3. Test user registration and login
4. Verify database is working
5. Set up domain name (optional)
6. Configure email service (SendGrid free tier)
7. Add monitoring (Sentry free tier)
8. Share with beta testers!

---

**Deployment Support:**
- Email: admin@fleetfi.com
- Heroku Docs: https://devcenter.heroku.com/articles/getting-started-with-laravel
- Laravel Deployment: https://laravel.com/docs/deployment

**Estimated Deployment Time:** 30-45 minutes for first-time setup
