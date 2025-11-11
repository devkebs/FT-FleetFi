# FleetFi Deployment Checklist

## 🎯 Pre-Deployment Checklist

### Environment Setup
- [ ] Heroku CLI installed (`heroku --version`)
- [ ] Git repository initialized
- [ ] All changes committed to git
- [ ] Heroku account created (free tier available)
- [ ] Payment method added to Heroku (required even for free tier)

### Backend Preparation
- [ ] `backend/.env.heroku` reviewed and configured
- [ ] `backend/composer.json` has post-install scripts
- [ ] `backend/Procfile` exists with Apache configuration
- [ ] All backend tests passing (`php artisan test`)
- [ ] Database migrations tested locally

### Frontend Preparation
- [ ] `package.json` has `start` script for Heroku
- [ ] Root `Procfile` configured for frontend
- [ ] Build command tested locally (`npm run build`)
- [ ] `.env.production` created with production API URL
- [ ] CORS configured in backend for frontend domain

---

## 🚀 Quick Deployment (Automated)

### Option 1: Use Deployment Script (Recommended)
```powershell
# Run from root directory
.\deploy-heroku.ps1
```

**What it does:**
- ✅ Checks Heroku CLI installation
- ✅ Creates Heroku app for backend
- ✅ Adds ClearDB MySQL database (free tier)
- ✅ Generates and sets Laravel app key
- ✅ Configures environment variables
- ✅ Deploys backend code
- ✅ Runs database migrations
- ✅ Seeds production users
- ✅ Tests backend API health
- ✅ Provides frontend deployment options

---

## 📝 Manual Deployment Steps

### Step 1: Deploy Backend (Laravel API)

#### 1.1 Login to Heroku
```bash
heroku login
```

#### 1.2 Create Backend App
```bash
cd backend
heroku create fleetfi-api
```

#### 1.3 Add MySQL Database
```bash
heroku addons:create cleardb:ignite
```

#### 1.4 Get Database Credentials
```bash
heroku config:get CLEARDB_DATABASE_URL
# Output: mysql://username:password@hostname/database_name
```

#### 1.5 Generate App Key
```bash
php artisan key:generate --show
# Copy the output: base64:xxxxxxxxxxxxx
```

#### 1.6 Set Environment Variables
```bash
heroku config:set APP_NAME=FleetFi
heroku config:set APP_ENV=production
heroku config:set APP_KEY=base64:YOUR_KEY_FROM_ABOVE
heroku config:set APP_DEBUG=false
heroku config:set APP_URL=https://fleetfi-api.herokuapp.com

# Database (extract from CLEARDB_DATABASE_URL)
heroku config:set DB_CONNECTION=mysql
heroku config:set DB_HOST=your_host
heroku config:set DB_PORT=3306
heroku config:set DB_DATABASE=your_db
heroku config:set DB_USERNAME=your_user
heroku config:set DB_PASSWORD=your_pass

# Session
heroku config:set SESSION_DRIVER=cookie
heroku config:set CACHE_DRIVER=array
heroku config:set QUEUE_CONNECTION=database
```

#### 1.7 Deploy Backend
```bash
git init  # if not already initialized
git add .
git commit -m "Deploy backend to Heroku"
heroku git:remote -a fleetfi-api
git push heroku main
```

#### 1.8 Run Migrations
```bash
heroku run php artisan migrate --force
heroku run php artisan db:seed --class=ProductionUsersSeeder --force
```

#### 1.9 Test Backend
```bash
# Visit: https://fleetfi-api.herokuapp.com/api/health
# Or test login:
curl -X POST https://fleetfi-api.herokuapp.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetfi.com","password":"Admin@123"}'
```

✅ **Backend deployed!** API URL: `https://fleetfi-api.herokuapp.com`

---

### Step 2: Deploy Frontend

#### Option A: Vercel (Recommended - Best for React)

**Why Vercel?**
- ✅ Optimized for React/Vite
- ✅ Free SSL and CDN
- ✅ Instant deployments
- ✅ Generous free tier
- ✅ Easy environment variables

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# Project name: fleetfi
# Framework: Vite
# Build command: npm run build
# Output directory: dist
# Install command: npm install

# Set environment variable
vercel env add VITE_API_URL
# Enter: https://fleetfi-api.herokuapp.com

# Deploy to production
vercel --prod
```

✅ **Frontend deployed!** URL: `https://fleetfi-xxxxx.vercel.app`

#### Option B: Netlify (Alternative)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Build directory: dist
# Environment:
#   VITE_API_URL=https://fleetfi-api.herokuapp.com
```

✅ **Frontend deployed!** URL: `https://fleetfi.netlify.app`

#### Option C: Heroku (Frontend)

**Note:** Less optimal for React apps, but works.

```bash
# From root directory
heroku create fleetfi-app
heroku buildpacks:set heroku/nodejs

# Set environment
heroku config:set VITE_API_URL=https://fleetfi-api.herokuapp.com

# Create .env.production
echo "VITE_API_URL=https://fleetfi-api.herokuapp.com" > .env.production

# Deploy
git add .
git commit -m "Deploy frontend"
git push heroku main
```

✅ **Frontend deployed!** URL: `https://fleetfi-app.herokuapp.com`

---

### Step 3: Configure CORS

Update backend CORS to allow frontend domain:

```bash
heroku config:set SANCTUM_STATEFUL_DOMAINS=fleetfi.vercel.app -a fleetfi-api
heroku config:set SESSION_DOMAIN=.vercel.app -a fleetfi-api

# Restart backend
heroku restart -a fleetfi-api
```

---

## ✅ Post-Deployment Verification

### 1. Test Backend API
```bash
# Health check
curl https://fleetfi-api.herokuapp.com/api/health

# Login test
curl -X POST https://fleetfi-api.herokuapp.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetfi.com","password":"Admin@123"}'
```

Expected response:
```json
{
  "success": true,
  "user": {...},
  "token": "xxx",
  "role": "admin"
}
```

### 2. Test Frontend
- [ ] Visit frontend URL
- [ ] Login page loads correctly
- [ ] Try logging in with: `admin@fleetfi.com` / `Admin@123`
- [ ] Dashboard loads after login
- [ ] Check browser console for errors
- [ ] Test navigation between pages

### 3. Test Database
```bash
heroku run php artisan tinker -a fleetfi-api

# In tinker:
User::count()  # Should return 10 (production users)
Asset::count() # Should return count from seeders
exit
```

### 4. Monitor Logs
```bash
# Backend logs
heroku logs --tail -a fleetfi-api

# Check for errors
heroku logs --tail -a fleetfi-api | grep ERROR
```

---

## 🔧 Common Issues & Fixes

### Issue: "Application Error" on backend

**Diagnosis:**
```bash
heroku logs --tail -a fleetfi-api
```

**Common causes:**
1. Missing `APP_KEY`
   ```bash
   heroku config:set APP_KEY=base64:YOUR_KEY
   ```

2. Database connection error
   ```bash
   heroku config:get CLEARDB_DATABASE_URL
   # Verify DB_* variables match
   ```

3. Missing `.env` values
   ```bash
   heroku config -a fleetfi-api
   # Check all required variables are set
   ```

### Issue: CORS errors in browser

**Fix:**
```bash
heroku config:set SANCTUM_STATEFUL_DOMAINS=your-frontend.vercel.app -a fleetfi-api
heroku config:set SESSION_DOMAIN=.vercel.app -a fleetfi-api
heroku restart -a fleetfi-api
```

### Issue: Database migration fails

**Fix:**
```bash
# Clear cache
heroku run php artisan config:clear -a fleetfi-api
heroku run php artisan cache:clear -a fleetfi-api

# Retry migration
heroku run php artisan migrate:fresh --force -a fleetfi-api
heroku run php artisan db:seed --class=ProductionUsersSeeder --force -a fleetfi-api
```

### Issue: Frontend not connecting to backend

**Check:**
1. Environment variable set correctly:
   ```bash
   # Vercel
   vercel env ls
   
   # Heroku
   heroku config -a fleetfi-app
   ```

2. Frontend `.env.production`:
   ```env
   VITE_API_URL=https://fleetfi-api.herokuapp.com
   ```

3. Rebuild frontend:
   ```bash
   npm run build
   vercel --prod  # or netlify deploy --prod
   ```

### Issue: 500 errors on API calls

**Debug:**
```bash
# Enable debug temporarily
heroku config:set APP_DEBUG=true -a fleetfi-api

# Check logs
heroku logs --tail -a fleetfi-api

# Disable debug after fixing
heroku config:set APP_DEBUG=false -a fleetfi-api
```

---

## 💰 Cost Breakdown

### Free Tier (Perfect for MVP)
| Service | Cost | Limits |
|---------|------|--------|
| Heroku Backend | Free | 550 dyno hours/mo |
| ClearDB MySQL | Free | 5MB storage (~1000 users) |
| Vercel Frontend | Free | Unlimited bandwidth |
| **Total** | **$0/month** | Sufficient for MVP testing |

### When to Upgrade

**Backend ($7/mo):**
- Upgrade when: Need 24/7 uptime (free tier sleeps after 30 min)
- Heroku Hobby tier: $7/mo - no sleeping, SSL included

**Database ($9.99/mo):**
- Upgrade when: > 5MB data (approx 1000+ users with transactions)
- ClearDB Punch: $9.99/mo - 1GB storage

**Total for growing MVP:** $16.99/mo

---

## 📊 Monitoring & Maintenance

### Set Up Monitoring

#### 1. Heroku Metrics (Free)
```bash
# View metrics dashboard
heroku dashboard -a fleetfi-api
```

#### 2. UptimeRobot (Free)
- Sign up: https://uptimerobot.com
- Add monitors:
  - Backend: `https://fleetfi-api.herokuapp.com/api/health`
  - Frontend: `https://fleetfi.vercel.app`
- Get alerts if site goes down

#### 3. Sentry Error Tracking (Free)
```bash
# Add Sentry addon
heroku addons:create sentry:f1 -a fleetfi-api

# Or use sentry.io free tier
```

### Database Backups

```bash
# Manual backup
heroku run php artisan db:backup -a fleetfi-api

# For production, upgrade to ClearDB with automated backups
```

### Regular Maintenance

**Weekly:**
- [ ] Check error logs: `heroku logs -a fleetfi-api | grep ERROR`
- [ ] Monitor dyno hours remaining (free tier)
- [ ] Test critical user flows

**Monthly:**
- [ ] Review database size: `heroku run php artisan db:size -a fleetfi-api`
- [ ] Update dependencies: `composer update` → redeploy
- [ ] Backup production database

---

## 🎓 Learning Resources

- **Heroku Laravel Docs:** https://devcenter.heroku.com/articles/getting-started-with-laravel
- **Vercel Vite Guide:** https://vercel.com/guides/deploying-vite-with-vercel
- **Laravel Deployment:** https://laravel.com/docs/deployment
- **Heroku CLI Reference:** https://devcenter.heroku.com/articles/heroku-cli-commands

---

## 🆘 Support

**If deployment fails:**
1. Check logs: `heroku logs --tail -a YOUR_APP`
2. Review this checklist
3. Check Heroku status: https://status.heroku.com
4. Ask for help with specific error messages

**Production Credentials:**
- Admin: `admin@fleetfi.com` / `Admin@123`
- Operator: `operator1@fleetfi.com` / `Operator@123`
- Investor: `investor1@fleetfi.com` / `Investor@123`
- Driver: `driver1@fleetfi.com` / `Driver@123`

⚠️ **Change these passwords immediately after first login!**

---

## ✅ Deployment Success Criteria

- [x] Backend API responds at `/api/health`
- [x] Database contains 10 production users
- [x] Frontend loads without console errors
- [x] Login works with test credentials
- [x] CORS properly configured
- [x] All API endpoints accessible
- [x] SSL/HTTPS enabled (automatic on Heroku/Vercel)
- [x] Environment variables properly set

**When all checked: 🎉 Deployment Complete!**

---

**Estimated Time:**
- Automated (script): 15-20 minutes
- Manual deployment: 30-45 minutes
- First-time setup: 45-60 minutes

**Next Steps After Deployment:**
1. Share URL with beta testers
2. Set up monitoring/alerts
3. Plan feature rollout
4. Gather user feedback
5. Iterate on MVP
