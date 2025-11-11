# Portfolio & Telemetry API Documentation

## Overview
This document covers the new API endpoints for Investment Portfolio management, Live Telemetry tracking, and Payment Gateway integration.

---

## 🔐 Authentication
All endpoints require Bearer token authentication unless marked as **Public**.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📊 Portfolio Endpoints

### 1. Get Investment Portfolio
**GET** `/api/portfolio`  
**Auth Required:** Yes (Investor, Operator)  
**Description:** Get complete investment portfolio with summary statistics

**Response:**
```json
{
  "success": true,
  "investments": [
    {
      "id": 1,
      "asset_id": 5,
      "asset_name": "Electric Keke - Fleet A",
      "vehicle_registration": "EV-001-LAG",
      "amount": 50000,
      "tokens": 100,
      "token_price": 500,
      "purchase_date": "2025-10-01T10:00:00Z",
      "current_value": 52000,
      "total_revenue": 7500,
      "roi_percentage": 19.0,
      "status": "active",
      "transaction_id": "TXN-12345",
      "projected_roi": 18.5,
      "estimated_monthly_revenue": 750,
      "estimated_annual_revenue": 9000
    }
  ],
  "summary": {
    "total_invested": 150000,
    "total_value": 156000,
    "total_revenue": 22500,
    "total_roi": 18.7,
    "active_investments": 3
  }
}
```

---

### 2. Get Investment Details
**GET** `/api/portfolio/{id}`  
**Auth Required:** Yes (Investor, Operator)  
**Description:** Get detailed information about a specific investment

**Response:**
```json
{
  "success": true,
  "investment": {
    "id": 1,
    "asset": {
      "id": 5,
      "name": "Electric Keke - Fleet A",
      "type": "electric_vehicle",
      "value": 500000
    },
    "vehicle": {
      "id": 10,
      "registration": "EV-001-LAG",
      "model": "Keke NAPEP Electric",
      "status": "active"
    },
    "amount_invested": 50000,
    "tokens_owned": 100,
    "purchase_date": "2025-10-01T10:00:00Z",
    "status": "active"
  },
  "revenue_history": [
    {
      "date": "2025-11-10",
      "total_revenue": 5000,
      "investor_share": 500
    }
  ],
  "payouts": [
    {
      "id": 1,
      "amount": 500,
      "date": "2025-11-10T00:00:00Z",
      "status": "completed",
      "reference": "PAYOUT-001"
    }
  ],
  "performance": {
    "total_revenue": 7500,
    "roi": 15.7,
    "best_month": 2340.50,
    "average_monthly": 1875.25
  }
}
```

---

### 3. Get Portfolio Performance
**GET** `/api/portfolio/performance`  
**Auth Required:** Yes (Investor, Operator)  
**Description:** Get monthly performance metrics for the last 12 months

**Response:**
```json
{
  "success": true,
  "monthly_performance": [
    {
      "month": "Dec 2024",
      "revenue": 5000,
      "investments": 3
    },
    {
      "month": "Jan 2025",
      "revenue": 6500,
      "investments": 3
    }
  ],
  "total_lifetime_revenue": 75000
}
```

---

### 4. Get Revenue Breakdown
**GET** `/api/portfolio/revenue-breakdown`  
**Auth Required:** Yes (Investor, Operator)  
**Description:** Get revenue breakdown by asset

**Response:**
```json
{
  "success": true,
  "breakdown": [
    {
      "asset_name": "Electric Keke - Fleet A",
      "asset_id": 5,
      "revenue": 22500,
      "percentage": 45.0
    },
    {
      "asset_name": "Electric Bus - Route B",
      "asset_id": 8,
      "revenue": 27500,
      "percentage": 55.0
    }
  ],
  "total_revenue": 50000
}
```

---

### 5. Export Portfolio to CSV
**GET** `/api/portfolio/export`  
**Auth Required:** Yes (Investor, Operator)  
**Description:** Download portfolio as CSV file

**Response:** CSV file download

---

## 🚗 Live Telemetry Endpoints

### 1. Get Live Telemetry
**GET** `/api/telemetry/live`  
**Auth Required:** Yes (Operator, Admin)  
**Description:** Get real-time telemetry for all active vehicles

**Query Parameters:**
- `vehicle_id` (optional): Filter by specific vehicle
- `operator_id` (optional): Filter by operator's vehicles

**Response:**
```json
{
  "success": true,
  "vehicles": [
    {
      "vehicle_id": 10,
      "vehicle_registration": "EV-001-LAG",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "speed": 45,
      "battery_level": 75,
      "battery_temperature": 28,
      "odometer": 12450,
      "status": "active",
      "driver_id": 15,
      "driver_name": "John Doe",
      "last_updated": "2025-11-11T14:30:00Z",
      "route_history": [
        { "lat": 6.5200, "lng": 3.3750 },
        { "lat": 6.5220, "lng": 3.3770 },
        { "lat": 6.5244, "lng": 3.3792 }
      ]
    }
  ],
  "count": 15,
  "timestamp": "2025-11-11T14:30:05Z"
}
```

**Status Values:**
- `active` - Vehicle is moving (speed > 5 km/h)
- `idle` - Vehicle is stationary but online
- `charging` - Vehicle is charging
- `offline` - No data received in last 10 minutes

---

### 2. Get Telemetry Alerts
**GET** `/api/telemetry/alerts`  
**Auth Required:** Yes (Operator, Admin)  
**Description:** Get active alerts (low battery, high temperature, offline vehicles)

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "type": "low_battery",
      "severity": "warning",
      "asset_id": "EV-001",
      "vehicle": "EV-001-LAG",
      "message": "Battery level at 15%",
      "value": 15,
      "timestamp": "2025-11-11T14:25:00Z"
    },
    {
      "type": "high_temperature",
      "severity": "critical",
      "asset_id": "EV-003",
      "vehicle": "EV-003-LAG",
      "message": "Battery temperature at 52°C",
      "value": 52,
      "timestamp": "2025-11-11T14:28:00Z"
    }
  ],
  "count": 2
}
```

**Alert Types:**
- `low_battery` - Battery < 20% (critical if < 10%)
- `high_temperature` - Temperature > 45°C (critical if > 50°C)
- `offline` - No data in last 15 minutes

---

### 3. Get Telemetry Statistics
**GET** `/api/telemetry/{assetId}/statistics`  
**Auth Required:** Yes (Operator, Admin)  
**Description:** Get statistical analysis for a specific asset

**Query Parameters:**
- `days` (optional, default: 7): Number of days to analyze

**Response:**
```json
{
  "success": true,
  "asset_id": "EV-001",
  "statistics": {
    "total_distance": 450.5,
    "average_speed": 35.2,
    "max_speed": 65,
    "average_battery": 68.5,
    "min_battery": 12,
    "max_battery": 100,
    "average_temperature": 32.4,
    "max_temperature": 48,
    "data_points": 1250,
    "period_days": 7
  }
}
```

---

## 💳 Payment Endpoints

### 1. Initialize Payment
**POST** `/api/payments/initialize`  
**Auth Required:** Yes  
**Description:** Initialize a payment transaction

**Request Body:**
```json
{
  "amount": 50000,
  "gateway": "paystack",
  "purpose": "wallet_funding"
}
```

**Purpose Values:**
- `investment` - Investing in an asset
- `wallet_funding` - Adding funds to wallet
- `subscription` - Platform subscription

**Response:**
```json
{
  "success": true,
  "authorization_url": "https://checkout.paystack.com/abc123xyz",
  "access_code": "abc123xyz",
  "reference": "FLEET-1699876543-123456"
}
```

---

### 2. Verify Payment
**POST** `/api/payments/verify`  
**Auth Required:** Yes  
**Description:** Verify a completed payment

**Request Body:**
```json
{
  "reference": "FLEET-1699876543-123456",
  "gateway": "paystack"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "amount": 50000,
  "reference": "FLEET-1699876543-123456"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Payment verification failed",
  "error": "Transaction not found"
}
```

---

### 3. Paystack Webhook (Public)
**POST** `/api/webhooks/paystack`  
**Auth Required:** No (signature verified)  
**Description:** Receive payment notifications from Paystack

**Headers:**
```
X-Paystack-Signature: HMAC-SHA512-SIGNATURE
```

---

### 4. Flutterwave Webhook (Public)
**POST** `/api/webhooks/flutterwave`  
**Auth Required:** No (signature verified)  
**Description:** Receive payment notifications from Flutterwave

**Headers:**
```
verif-hash: SECRET-HASH
```

---

## 🔑 Environment Variables

Add these to your `.env` file:

```env
# Payment Gateways
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PAYMENT_URL=https://api.paystack.co
PAYSTACK_MERCHANT_EMAIL=merchant@fleetfi.com

FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxxxxxxxxxx
FLUTTERWAVE_WEBHOOK_SECRET=your-webhook-secret

# Frontend URL (for payment callbacks)
FRONTEND_URL=https://your-frontend-url.com
```

---

## 📝 Usage Examples

### JavaScript/TypeScript Example

```typescript
// Get portfolio
const portfolio = await fetch('/api/portfolio', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const data = await portfolio.json();

// Get live telemetry
const telemetry = await fetch('/api/telemetry/live?operator_id=5', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const vehicles = await telemetry.json();

// Verify payment
const verification = await fetch('/api/payments/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reference: 'FLEET-1699876543-123456',
    gateway: 'paystack',
  }),
});
```

### cURL Examples

```bash
# Get portfolio
curl -X GET https://api.fleetfi.com/api/portfolio \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get live telemetry
curl -X GET "https://api.fleetfi.com/api/telemetry/live?operator_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify payment
curl -X POST https://api.fleetfi.com/api/payments/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reference":"FLEET-123","gateway":"paystack"}'
```

---

## ⚡ Rate Limits

- Portfolio endpoints: 100 requests/minute
- Telemetry endpoints: 200 requests/minute (live data)
- Payment endpoints: 50 requests/minute

---

## 🛡️ Security Notes

1. **Payment Verification**: Always verify payments on the backend
2. **Webhook Security**: Webhooks validate signatures before processing
3. **API Keys**: Never expose secret keys in frontend code
4. **CORS**: Configure allowed origins in production
5. **HTTPS**: All production endpoints must use HTTPS

---

## 📊 Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

---

## 🆘 Support

For API support, contact:
- Email: developers@fleetfi.com
- Slack: #api-support
- Documentation: https://docs.fleetfi.com/api

---

**Last Updated:** November 11, 2025  
**API Version:** v1.0  
**Base URL:** https://api.fleetfi.com/api
