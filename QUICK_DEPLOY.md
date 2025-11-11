# 🚀 FleetFi - Quick Deployment Guide

Deploy your FleetFi MVP to production in under 30 minutes!

## Prerequisites

✅ **What you need:**
- Heroku account (free tier: https://signup.heroku.com)
- Heroku CLI installed (https://devcenter.heroku.com/articles/heroku-cli)
- Git repository initialized
- Node.js and npm installed

## 🎯 Fastest Path to Production

### Step 1: Install Heroku CLI (5 minutes)

**Windows (PowerShell as Admin):**
```powershell
choco install heroku-cli
# or download installer from: https://devcenter.heroku.com/articles/heroku-cli
```

**Verify installation:**
```powershell
heroku --version
```

### Step 2: Run Automated Deployment (15-20 minutes)

**From your project root directory:**
```powershell
.\deploy-heroku.ps1
```

**What happens automatically:**
1. ✅ Logs you into Heroku
2. ✅ Creates backend app (Laravel API)
3. ✅ Adds free MySQL database (ClearDB)
4. ✅ Generates Laravel encryption key
5. ✅ Sets all environment variables
6. ✅ Deploys backend code
7. ✅ Runs database migrations
8. ✅ Seeds production users (10 accounts)
9. ✅ Tests API health endpoint
10. ✅ Provides frontend deployment options

**Expected output:**
```
🚀 FleetFi Heroku Deployment Script
=====================================
✅ Heroku CLI found
✅ Database added
✅ App key generated
✅ Environment variables set
✅ Migrations completed
✅ Production users seeded
✅ Backend is responding!

Backend API: https://fleetfi-api-xxxx.herokuapp.com

🎉 Your FleetFi MVP is now live!
```

### Step 3: Deploy Frontend (5-10 minutes)

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (run from project root)
vercel

# Follow prompts, then set environment variable:
vercel env add VITE_API_URL
# Enter: https://YOUR-BACKEND-APP.herokuapp.com

# Deploy to production
vercel --prod
```

**Option B: Netlify**
```bash
npm i -g netlify-cli
netlify deploy --prod
# Build directory: dist
# Set VITE_API_URL in Netlify dashboard
```

### Step 4: Update CORS Configuration

**Allow your frontend domain:**
```bash
heroku config:set SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app -a fleetfi-api-xxxx
heroku restart -a fleetfi-api-xxxx
```

### Step 5: Test Your Deployment

**Test backend API:**
```bash
curl https://YOUR-BACKEND-APP.herokuapp.com/api/health
```

**Test login:**
Visit your frontend URL and login with:
- Email: `admin@fleetfi.com`
- Password: `Admin@123`

## 🎉 Success!

Your FleetFi MVP is now live with:
- ✅ Backend API running on Heroku
- ✅ MySQL database (5MB free tier)
- ✅ Frontend on Vercel/Netlify
- ✅ 10 production user accounts ready
- ✅ SSL/HTTPS enabled automatically
- ✅ Free tier = $0/month

## 📱 Access Your App

**Frontend URL:** `https://your-app.vercel.app`
**Backend API:** `https://fleetfi-api-xxxx.herokuapp.com`

**Test Accounts:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fleetfi.com | Admin@123 |
| Operator | operator1@fleetfi.com | Operator@123 |
| Investor | investor1@fleetfi.com | Investor@123 |
| Driver | driver1@fleetfi.com | Driver@123 |

⚠️ **Change these passwords after first login!**

## 🔧 Useful Commands

```bash
# View backend logs
heroku logs --tail -a fleetfi-api-xxxx

# Run Laravel commands
heroku run php artisan tinker -a fleetfi-api-xxxx

# Restart backend
heroku restart -a fleetfi-api-xxxx

# Check database
heroku run php artisan db:show -a fleetfi-api-xxxx
```

## ❓ Troubleshooting

**Problem: Deployment script fails**
- Check Heroku CLI installed: `heroku --version`
- Login manually: `heroku login`
- Re-run script: `.\deploy-heroku.ps1`

**Problem: CORS errors in browser**
```bash
heroku config:set SANCTUM_STATEFUL_DOMAINS=your-frontend-url.com -a fleetfi-api-xxxx
heroku restart -a fleetfi-api-xxxx
```

**Problem: Database connection error**
```bash
# Check database credentials
heroku config:get CLEARDB_DATABASE_URL -a fleetfi-api-xxxx

# Verify DB config
heroku config -a fleetfi-api-xxxx | grep DB_
```

## 📚 Full Documentation

For detailed manual deployment steps, troubleshooting, and advanced configuration:
- **Detailed Guide:** `HEROKU_DEPLOYMENT.md`
- **Complete Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **System Architecture:** `docs/SYSTEM_ARCHITECTURE_AND_MVP_STATUS.md`

## 💰 Free Tier Limits

| Resource | Free Tier | When to Upgrade |
|----------|-----------|-----------------|
| Heroku Dyno | 550 hours/mo | Need 24/7 uptime → $7/mo |
| ClearDB MySQL | 5MB | > 1000 users → $9.99/mo |
| Vercel Frontend | Unlimited | Never (generous free tier) |

**Total Cost:** $0/month for MVP testing!

## 🎯 Next Steps

1. **Test all features** with production users
2. **Set up monitoring** (UptimeRobot free tier)
3. **Share with beta testers**
4. **Gather feedback**
5. **Plan feature rollout**
6. **Consider paid tier** when scaling

## 🆘 Need Help?

- **Heroku Status:** https://status.heroku.com
- **Deployment Logs:** `heroku logs --tail -a YOUR_APP`
- **Laravel Docs:** https://laravel.com/docs/deployment
- **Vercel Docs:** https://vercel.com/docs

---

**Deployment Time:** 30-45 minutes total
**Difficulty:** Beginner-friendly with automated script
**Cost:** $0 (free tier sufficient for MVP)

✨ **Happy Deploying!**
