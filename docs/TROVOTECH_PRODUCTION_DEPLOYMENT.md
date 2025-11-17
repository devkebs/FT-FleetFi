# TrovoTech Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying FleetFi with production TrovoTech integration.

---

## Prerequisites Checklist

### 1. TrovoTech Account Setup
- [ ] **TrovoTech Account Created** - Sign up at TrovoTech portal
- [ ] **KYC Verification Complete** - Business verification approved
- [ ] **SEC-ARIP Sandbox Access** - Approved for regulated tokenization
- [ ] **Production Environment Access** - Upgraded from sandbox

### 2. Obtain Production Credentials

Contact TrovoTech support to obtain the following credentials:

#### Required Credentials
```bash
✅ TROVOTECH_BASE_URL          # Production API URL
✅ TROVOTECH_API_KEY           # Production API key
✅ TROVOTECH_ISSUER_ID         # Your verified issuer ID
✅ TROVOTECH_WEBHOOK_SECRET    # For webhook signature verification
✅ TROVOTECH_CUSTODY_WALLET    # Trustee custody wallet address
```

#### Additional Information Needed
- Webhook callback URL: `https://yourdomain.com/api/webhooks/trovotech`
- Allowed IP addresses (if applicable)
- Rate limits and quotas
- Support contact details

---

## Deployment Steps

### Step 1: Update Environment Variables

#### Backend (.env)
```bash
# Switch from sandbox to production
TROVOTECH_SANDBOX=false

# Add production credentials
TROVOTECH_BASE_URL=https://api.trovotech.io/v1  # Or production URL provided
TROVOTECH_API_KEY=prod_sk_xxxxxxxxxxxxxxxxxxxx
TROVOTECH_ISSUER_ID=FT_PROD_XXXXXXXX
TROVOTECH_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
TROVOTECH_CUSTODY_WALLET=GBANTUXXXXXXXXXXXXXXXXXXXXXXXXX

# Performance tuning
TROVOTECH_TIMEOUT_MS=15000    # Increase for production
TROVOTECH_MAX_RETRIES=3       # Retry logic enabled
```

#### Database Configuration
Ensure you're using production database (NOT SQLite):
```bash
DB_CONNECTION=mysql          # Or PostgreSQL
DB_HOST=your-db-host.com
DB_PORT=3306
DB_DATABASE=fleetfi_production
DB_USERNAME=fleetfi_user
DB_PASSWORD=strong_secure_password
```

---

### Step 2: Register Webhook with TrovoTech

1. **Webhook Endpoint**: `https://yourdomain.com/api/webhooks/trovotech`
2. **Events to Subscribe**:
   - `token.minted` - Token mint confirmations
   - `payout.completed` - Payout distribution success
   - `payout.failed` - Payout failures
   - `transfer.completed` - Token ownership transfers
   - `wallet.created` - Custodial wallet creation
   - `custody.updated` - Asset custody status changes

3. **Security Settings**:
   - Enable signature verification (HMAC-SHA256)
   - Set webhook secret in `.env`
   - Configure retry policy (recommended: 3 attempts with exponential backoff)

---

### Step 3: Test Connectivity

Run the following tests before going live:

#### A. Test API Connection
```bash
# Via Admin Dashboard
1. Login as admin
2. Navigate to Settings → Integrations → TrovoTech
3. Click "Test Connection"
4. Verify: ✅ Success, Status: 200, Latency: <1000ms
```

#### B. Test Wallet Creation (Testnet First!)
```bash
# Use TrovoTech testnet for initial testing
TROVOTECH_SANDBOX=true
BANTU_NETWORK=testnet

# Create test wallet
POST /api/trovotech/wallet/create
Authorization: Bearer {admin_token}

# Expected: Real wallet created on Bantu testnet
```

#### C. Test Token Minting
```bash
# Mint a test token
POST /api/trovotech/token/mint
{
  "assetId": "test_asset_001",
  "assetType": "EV",
  "fractionOwned": 10,
  "investAmount": 50000,
  "investorWallet": "GBANTU..."
}

# Verify:
# 1. Token created in database
# 2. Transaction recorded on Bantu blockchain
# 3. Webhook received (check webhook_logs table)
```

#### D. Test Webhook Handling
```bash
# Send test webhook (via TrovoTech dashboard or cURL)
curl -X POST https://yourdomain.com/api/webhooks/trovotech \
  -H "Content-Type: application/json" \
  -H "X-TrovoTech-Signature: {generated_signature}" \
  -d '{
    "event_type": "token.minted",
    "data": {
      "token_id": "TEST_TOKEN_001",
      "tx_hash": "BANTU_TX_...",
      "asset_id": 1,
      "investor_wallet": "GBANTU...",
      "minted_at": "2025-11-12T12:00:00Z"
    }
  }'

# Verify: Check webhook_logs table for successful processing
```

---

### Step 4: Production Cutover

#### Pre-Cutover Checklist
- [ ] All testnet tests passed
- [ ] Webhook receiving and processing correctly
- [ ] Database backups configured
- [ ] Monitoring and alerts set up
- [ ] Support team briefed
- [ ] Rollback plan documented

#### Cutover Steps
1. **Schedule maintenance window** (recommended: off-peak hours)
2. **Deploy backend updates**:
   ```bash
   git pull origin main
   composer install --no-dev
   php artisan config:clear
   php artisan cache:clear
   php artisan migrate --force
   ```
3. **Update environment**: Switch `TROVOTECH_SANDBOX=false`
4. **Restart services**:
   ```bash
   php artisan queue:restart
   systemctl restart php-fpm
   systemctl restart nginx
   ```
5. **Smoke test**: Create one production transaction
6. **Monitor**: Watch logs for 1 hour

---

### Step 5: Monitoring & Maintenance

#### Key Metrics to Monitor
```bash
# API Performance
- TrovoTech API latency (target: <500ms)
- API error rate (target: <0.1%)
- Retry attempts (target: <5% of requests)

# Webhook Processing
- Webhook delivery success rate (target: >99%)
- Processing time (target: <2s per webhook)
- Failed webhooks (investigate any failures)

# Transaction Volume
- Daily token mints
- Daily payouts processed
- Custody transfers
```

#### Logs to Review
```bash
# Laravel logs
tail -f storage/logs/laravel.log | grep TrovoTech

# Webhook logs (via database)
SELECT * FROM webhook_logs 
WHERE source = 'trovotech' 
  AND status = 'failed' 
  AND created_at > NOW() - INTERVAL 24 HOUR;

# TrovoTech API logs
SELECT * FROM config_settings 
WHERE key LIKE 'trovotech%';
```

---

## Troubleshooting

### Issue: Webhook Signature Verification Fails
**Symptom**: `401 Invalid signature` errors in webhook_logs

**Solution**:
1. Verify `TROVOTECH_WEBHOOK_SECRET` matches TrovoTech dashboard
2. Check webhook payload is not modified (no proxy alterations)
3. Ensure raw request body is used for signature computation
4. Temporarily enable sandbox mode to bypass verification for testing

### Issue: Token Minting Times Out
**Symptom**: `500 Internal Server Error` after 10+ seconds

**Solution**:
1. Increase `TROVOTECH_TIMEOUT_MS` to 20000 (20 seconds)
2. Check TrovoTech API status page
3. Verify network connectivity (firewall, DNS)
4. Enable retry logic: `TROVOTECH_MAX_RETRIES=5`

### Issue: Payouts Not Reflecting in Wallets
**Symptom**: `payout.completed` webhook received but wallet balance unchanged

**Solution**:
1. Check `webhook_logs` for processing errors
2. Verify `TrovotechWebhookController::handlePayoutCompleted()` logic
3. Ensure token_id mapping is correct
4. Check database transaction rollbacks

---

## Rollback Procedure

If production deployment fails:

1. **Immediate**: Switch back to sandbox
   ```bash
   TROVOTECH_SANDBOX=true
   php artisan config:clear
   ```

2. **Restore database** (if migrations failed):
   ```bash
   php artisan migrate:rollback
   # Or restore from backup
   ```

3. **Revert code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

4. **Notify stakeholders**: Send incident report

---

## Production Credentials Security

### DO NOT:
- ❌ Commit `.env` to git
- ❌ Share credentials in Slack/email
- ❌ Log API keys in application logs
- ❌ Use production credentials in development

### DO:
- ✅ Use environment variables
- ✅ Store in secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)
- ✅ Rotate credentials quarterly
- ✅ Restrict access to production .env file
- ✅ Enable 2FA on TrovoTech account

---

## Support Contacts

### TrovoTech Support
- **Email**: support@trovotech.io
- **Portal**: https://portal.trovotech.io/support
- **Emergency Hotline**: [To be provided by TrovoTech]
- **SLA**: 24/7 for production issues

### Internal Team
- **Backend Lead**: [Your team contact]
- **DevOps**: [Your DevOps contact]
- **On-Call**: [On-call rotation schedule]

---

## Post-Deployment Validation

### 24-Hour Checklist
- [ ] Monitor error logs (zero TrovoTech errors)
- [ ] Verify webhook processing (100% success rate)
- [ ] Check transaction completions
- [ ] Review user reports (zero integration issues)

### 7-Day Checklist
- [ ] Performance metrics within targets
- [ ] No degradation in API latency
- [ ] Wallet balances reconciled
- [ ] Token minting volume as expected

### 30-Day Checklist
- [ ] Conduct security audit
- [ ] Review credential rotation schedule
- [ ] Optimize API usage (reduce unnecessary calls)
- [ ] Update documentation with lessons learned

---

## Appendix: API Endpoint Reference

### Production Endpoints (Example)
```
Base URL: https://api.trovotech.io/v1

POST   /wallet/create              - Create custodial wallet
GET    /wallet/{walletId}          - Get wallet details
POST   /token/mint                 - Mint asset token
POST   /payout/distribute          - Distribute revenue
GET    /tokens/my                  - List investor tokens
POST   /telemetry/sync             - Sync asset telemetry
```

### Sandbox Endpoints
```
Base URL: https://sandbox.trovotech.io/v1
(Credentials and behavior may differ)
```

---

## Changelog

### v1.0 - November 12, 2025
- Initial production deployment guide
- Webhook handling implementation
- Retry logic and error handling
- Environment configuration updates

---

**Document Owner**: FleetFi Engineering Team  
**Last Updated**: November 12, 2025  
**Review Frequency**: Quarterly or after major updates
