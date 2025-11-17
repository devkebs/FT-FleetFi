# TrovoTech Integration Testing Checklist

## 🎯 Pre-Testing Setup

### 1. Configure Environment Variables
- [ ] Add production `TROVOTECH_API_KEY` to `.env`
- [ ] Add production `TROVOTECH_ISSUER_ID` to `.env`
- [ ] Set `TROVOTECH_SANDBOX=false` (or true if testing in sandbox)
- [ ] Add `TROVOTECH_WEBHOOK_SECRET` to `.env`
- [ ] Update `TROVOTECH_CUSTODY_WALLET` address
- [ ] Verify `TROVOTECH_BASE_URL` points to correct environment

### 2. Import Postman Collection
- [ ] Import `docs/postman_trovotech_collection.json` into Postman
- [ ] Update environment variables in Postman
- [ ] Sync with GitHub repository (already done ✅)

---

## 🧪 API Testing Sequence

### Phase 1: Connectivity & Authentication
- [ ] **Test 1**: Health Check
  - Endpoint: `GET /health`
  - Expected: `200 OK` with status response
  - Record latency: _____ ms

- [ ] **Test 2**: API Authentication
  - Verify Bearer token works
  - Check API key permissions
  - Test rate limits

### Phase 2: Wallet Management
- [ ] **Test 3**: Create Custodial Wallet
  - Endpoint: `POST /wallets`
  - Create test investor wallet
  - Save wallet address: _____________________
  - Verify on Bantu explorer

- [ ] **Test 4**: Get Wallet Details
  - Endpoint: `GET /wallets/{address}`
  - Verify wallet metadata
  - Check balance = 0

### Phase 3: Token Minting (Core Feature)
- [ ] **Test 5**: Mint Test Asset Token
  - Asset: Test vehicle (e.g., ASSET_TEST_001)
  - Total value: ₦5,000,000
  - Fraction: 10% (0.10)
  - Investor wallet: (from Test 3)
  - Expected: Token ID returned
  - Save token ID: _____________________

- [ ] **Test 6**: Verify Token on Blockchain
  - Check Bantu Horizon for transaction
  - Verify token appears in investor wallet
  - Confirm ownership fraction

### Phase 4: Payout Distribution
- [ ] **Test 7**: Create Monthly Payout
  - Token: (from Test 5)
  - Amount: ₦37,500 (monthly ROI)
  - Period: January 2025
  - Expected: Payout ID returned
  - Save payout ID: _____________________

- [ ] **Test 8**: Check Payout Status
  - Endpoint: `GET /payouts/{id}`
  - Status should be: `completed`
  - Verify funds in investor wallet

### Phase 5: Secondary Market Transfer
- [ ] **Test 9**: Create Second Investor Wallet
  - Buyer wallet address: _____________________

- [ ] **Test 10**: Transfer Token Ownership
  - From: Original investor
  - To: New investor
  - Fraction: 5% (0.05)
  - Sale price: ₦250,000
  - Verify transfer on blockchain

### Phase 6: Webhook Integration
- [ ] **Test 11**: Webhook - Token Minted Event
  - Simulate `token.minted` webhook
  - Verify signature validation
  - Check database updated
  - Confirm token status changed

- [ ] **Test 12**: Webhook - Payout Completed
  - Simulate `payout.completed` webhook
  - Verify payout record updated
  - Check investor notification sent

- [ ] **Test 13**: Webhook - Transfer Completed
  - Simulate `transfer.completed` webhook
  - Verify ownership updated in DB
  - Check both investor records

---

## 🔐 Security Testing

### Webhook Security
- [ ] **Test 14**: Invalid Signature Rejection
  - Send webhook with wrong signature
  - Expected: 401 Unauthorized

- [ ] **Test 15**: Replay Attack Prevention
  - Send same webhook twice
  - Expected: Second request rejected

### API Security
- [ ] **Test 16**: Invalid API Key
  - Use wrong/expired API key
  - Expected: 401 Unauthorized

- [ ] **Test 17**: Missing Authorization Header
  - Remove Bearer token
  - Expected: 401 Unauthorized

---

## 🚦 Integration with FleetFi Backend

### Via FleetFi API (not TrovoTech directly)
- [ ] **Test 18**: Create Investment via FleetFi
  - Login as investor
  - POST `/api/investments`
  - Asset: ASSET_001
  - Amount: ₦500,000
  - Verify FleetFi calls TrovoTech
  - Check token minted

- [ ] **Test 19**: View Portfolio
  - GET `/api/portfolio/performance`
  - Verify tokens displayed
  - Check payout history

- [ ] **Test 20**: Monthly Payout Automation
  - Trigger monthly job: `php artisan app:distribute-monthly-payouts`
  - Verify TrovoTech payout API called
  - Check investor balances updated

---

## 📊 Performance Testing

- [ ] **Test 21**: API Response Time
  - Wallet creation: < 2000ms
  - Token minting: < 3000ms
  - Payout: < 2000ms
  - Token transfer: < 3000ms

- [ ] **Test 22**: Concurrent Requests
  - Create 5 wallets simultaneously
  - All should succeed
  - No rate limit errors

---

## 🐛 Error Handling

- [ ] **Test 23**: Network Timeout
  - Simulate slow API (set timeout to 1ms)
  - Verify retry logic works
  - Check error logged

- [ ] **Test 24**: Invalid Asset ID
  - Mint token with fake asset
  - Expected: 400 Bad Request

- [ ] **Test 25**: Insufficient Ownership
  - Transfer 15% when only own 10%
  - Expected: 422 Unprocessable Entity

---

## ✅ Production Readiness

### Pre-Launch Checklist
- [ ] All 25 tests passed
- [ ] Webhook endpoint registered with TrovoTech
- [ ] Production database configured (not SQLite)
- [ ] SSL certificate installed (HTTPS)
- [ ] Monitoring/logging setup
- [ ] Error alerting configured
- [ ] Backup strategy in place
- [ ] TrovoTech support contact saved

### Go-Live Approval
- [ ] Business stakeholder approval
- [ ] Security audit complete
- [ ] Legal/compliance review
- [ ] TrovoTech integration certified

---

## 📝 Test Results Summary

**Date**: _______________  
**Tester**: _______________  
**Environment**: ☐ Sandbox  ☐ Production

| Test # | Name | Status | Notes |
|--------|------|--------|-------|
| 1 | Health Check | ☐ Pass ☐ Fail | |
| 2 | Authentication | ☐ Pass ☐ Fail | |
| 3 | Create Wallet | ☐ Pass ☐ Fail | |
| ... | ... | ... | |

**Overall Status**: ☐ Ready for Production  ☐ Issues Found  

**Issues/Blockers**:
1. 
2. 
3. 

**Next Steps**:
1. 
2. 
3.
