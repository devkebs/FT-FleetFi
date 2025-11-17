# 🚀 TrovoTech Quick Start Guide

## You Have: ✅
- TrovoTech API ready
- GitHub linked to Postman
- FleetFi integration code complete

## Next Steps (In Order):

### **STEP 1: Configure Backend** (5 minutes)

1. Open `backend/.env` and update these values with your actual TrovoTech credentials:

```bash
# Replace these with real values from TrovoTech
TROVOTECH_BASE_URL=https://api.trovotech.io/v1
TROVOTECH_API_KEY=sk_prod_your_actual_key_here
TROVOTECH_ISSUER_ID=FT_your_issuer_id_here
TROVOTECH_SANDBOX=false
TROVOTECH_CUSTODY_WALLET=GBANTU_your_wallet_address_here
TROVOTECH_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

2. Restart Laravel server:
```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan serve
```

---

### **STEP 2: Import Postman Collection** (2 minutes)

1. Open Postman
2. Click **Import** → **File**
3. Select `docs/postman_trovotech_collection.json`
4. Collection will appear in sidebar
5. Click collection → **Variables** tab
6. Update these variables:
   - `TROVOTECH_API_KEY`: Your actual API key
   - `TROVOTECH_ISSUER_ID`: Your issuer ID
   - `TROVOTECH_BASE_URL`: Production URL

---

### **STEP 3: Run Basic Tests** (10 minutes)

**Test in this order:**

#### 3.1 Health Check
- Request: `1. Health Check`
- Click **Send**
- ✅ Expected: Status 200, response shows API is healthy

#### 3.2 Create Test Wallet
- Request: `2. Create Custodial Wallet`
- Update body with real test email
- Click **Send**
- ✅ Expected: Status 201, wallet address returned
- **SAVE THE WALLET ADDRESS!**

#### 3.3 Mint Test Token
- Request: `3. Mint Asset Token (EKT)`
- Update `investor_wallet` with address from 3.2
- Click **Send**
- ✅ Expected: Status 201, token ID returned
- **SAVE THE TOKEN ID!**

---

### **STEP 4: Test FleetFi Integration** (5 minutes)

Now test via your FleetFi backend (not directly to TrovoTech):

1. **Start FleetFi servers**:
```bash
# Backend already running from Step 1
# Frontend
npm run dev
```

2. **Test Investment Flow**:
   - Login as investor (use test credentials)
   - Navigate to Investor Dashboard
   - Click "Invest" on any asset
   - Complete investment wizard
   - **Behind the scenes**: FleetFi will call TrovoTech API to mint token
   - Check database: `tokens` table should have new row

3. **Verify in Postman**:
   - Run request `6. Get Token Details`
   - Use token ID from database
   - Should return token info from blockchain

---

### **STEP 5: Setup Webhooks** (10 minutes)

TrovoTech will send events to your backend. You need to register the endpoint:

1. **Expose local backend** (for testing):
```bash
# Install ngrok if you don't have it
ngrok http 8000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

2. **Register webhook with TrovoTech**:
   - Contact TrovoTech support OR
   - Use their dashboard to add webhook
   - URL: `https://abc123.ngrok.io/api/webhooks/trovotech`
   - Events: Select all (token.minted, payout.completed, etc.)
   - Secret: Use value from your `.env` file

3. **Test webhook locally**:
```bash
# In Postman, run request:
8. Webhook - Token Minted

# Check Laravel logs:
tail -f backend/storage/logs/laravel.log
# Should see webhook received and processed
```

---

### **STEP 6: Run Full Test Suite** (20 minutes)

Follow checklist in `docs/TROVOTECH_TESTING_CHECKLIST.md`:
- [ ] All connectivity tests
- [ ] Wallet creation
- [ ] Token minting
- [ ] Payout distribution
- [ ] Webhook handling

---

## ⚠️ Common Issues & Solutions

### Issue: "401 Unauthorized"
**Solution**: Check API key is correct in `.env` and Postman variables

### Issue: "Wallet creation failed"
**Solution**: Ensure KYC is verified for test users in TrovoTech dashboard

### Issue: "Webhook signature invalid"
**Solution**: 
1. Verify `TROVOTECH_WEBHOOK_SECRET` in `.env` matches TrovoTech
2. Check webhook controller is using correct hash algorithm (HMAC-SHA256)

### Issue: "Token not appearing in database"
**Solution**: 
1. Check webhook endpoint is reachable (use ngrok)
2. Verify webhook handler is saving to database
3. Check Laravel logs for errors

---

## 🎯 Success Criteria

You know integration is working when:

✅ Postman tests all return 200/201 status codes
✅ Can create investor wallet via FleetFi UI
✅ Investment creates token in TrovoTech
✅ Token appears in FleetFi database
✅ Webhook events update database automatically
✅ Investor can view portfolio with real blockchain data

---

## 📞 Need Help?

**TrovoTech Support**: [Add their contact info]
**FleetFi Integration Docs**: `docs/TROVOTECH_PRODUCTION_DEPLOYMENT.md`
**API Reference**: `docs/TROVOTECH_IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Ready for Production?

Once all tests pass:
1. Switch from ngrok to production domain
2. Update webhook URL in TrovoTech dashboard
3. Set `TROVOTECH_SANDBOX=false`
4. Run production deployment checklist
5. **GO LIVE!** 🎉
