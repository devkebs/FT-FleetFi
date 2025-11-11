# API Test Data Sample Responses

## Overview Endpoint
**GET** `/api/admin/dashboard/overview`

```json
{
  "success": true,
  "overview": {
    "users": {
      "total": 35,
      "active": 32,
      "new_this_month": 8,
      "by_role": {
        "admin": 3,
        "operator": 5,
        "investor": 12,
        "driver": 15
      },
      "pending_kyc": 4
    },
    "revenue": {
      "total": 567890,
      "this_month": 125430,
      "last_month": 98250,
      "growth_rate": 27.6
    },
    "assets": {
      "total": 50,
      "active": 45,
      "maintenance": 3,
      "inactive": 2
    },
    "investments": {
      "total_invested": 2450000,
      "active_investors": 12,
      "avg_investment": 204166,
      "this_month": 350000
    },
    "operations": {
      "total_rides": 10234,
      "active_drivers": 13,
      "revenue_per_ride": 55.5,
      "rides_this_week": 456
    }
  },
  "timestamp": "2025-11-11T06:30:00.000000Z"
}
```

## Users List
**GET** `/api/admin/users`

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "System Administrator",
      "email": "admin@fleetfi.com",
      "role": "admin",
      "kyc_status": "verified",
      "wallet_balance": 1000000,
      "wallet_address": "0x1a2b3c4d5e6f7g8h9i0j",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": 9,
      "name": "John Investor",
      "email": "john.investor@example.com",
      "role": "investor",
      "kyc_status": "verified",
      "wallet_balance": 125000,
      "wallet_address": "0x9i8h7g6f5e4d3c2b1a0j",
      "created_at": "2025-03-20T14:15:00Z"
    }
  ],
  "total": 35
}
```

## KYC Management
**GET** `/api/admin/dashboard/kyc-management`

```json
{
  "success": true,
  "kyc_submissions": [
    {
      "id": 19,
      "name": "Michael Brown",
      "email": "michael.brown@example.com",
      "role": "investor",
      "kyc_status": "pending",
      "document_type": "Passport",
      "submitted_at": "2025-11-07T09:15:00Z"
    },
    {
      "id": 8,
      "name": "James Logistics",
      "email": "james.logistics@fleetfi.com",
      "role": "operator",
      "kyc_status": "pending",
      "document_type": "Business Registration",
      "submitted_at": "2025-11-08T14:30:00Z"
    }
  ],
  "stats": {
    "pending": 4,
    "verified": 29,
    "rejected": 2,
    "total": 35
  }
}
```

## Transactions
**GET** `/api/admin/transactions?type=all`

```json
{
  "success": true,
  "transactions": {
    "data": [
      {
        "id": 1,
        "transaction_id": "TXN-2025-00001",
        "user": {
          "id": 9,
          "name": "John Investor",
          "email": "john.investor@example.com"
        },
        "type": "investment",
        "amount": 50000,
        "status": "completed",
        "description": "Investment in EV fleet tokenization",
        "created_at": "2025-11-11T10:30:00Z"
      },
      {
        "id": 2,
        "transaction_id": "TXN-2025-00002",
        "user": {
          "id": 4,
          "name": "Fleet Operator One",
          "email": "operator1@fleetfi.com"
        },
        "type": "payout",
        "amount": -5000,
        "status": "completed",
        "description": "Operator revenue share",
        "created_at": "2025-11-10T14:15:00Z"
      },
      {
        "id": 3,
        "transaction_id": "TXN-2025-00003",
        "user": {
          "id": 21,
          "name": "Tom Driver",
          "email": "tom.driver@fleetfi.com"
        },
        "type": "ride",
        "amount": 250,
        "status": "completed",
        "description": "Ride earnings deposit",
        "created_at": "2025-11-10T09:45:00Z"
      }
    ],
    "total": 150,
    "per_page": 50,
    "current_page": 1
  },
  "statistics": {
    "total_volume_24h": 165250,
    "total_count_24h": 1234,
    "pending_count": 12,
    "success_rate": 98.5
  },
  "timestamp": "2025-11-11T06:30:00.000000Z"
}
```

## System Health
**GET** `/api/admin/system-health`

```json
{
  "success": true,
  "system_health": {
    "server": {
      "cpu_usage": 45,
      "memory_usage": 72,
      "disk_usage": 38,
      "api_response_time": "125ms"
    },
    "database": {
      "status": "healthy",
      "connection": "active",
      "size": "15.2 MB",
      "tables": 38
    },
    "services": {
      "laravel_backend": {
        "status": "online",
        "url": "http://127.0.0.1:8000"
      },
      "database": {
        "status": "connected",
        "type": "sqlite"
      },
      "trovotech_api": {
        "status": "not_configured",
        "configured": false
      },
      "kyc_provider": {
        "status": "not_configured",
        "configured": false
      },
      "oem_telemetry": {
        "status": "not_configured",
        "configured": false
      }
    },
    "system_info": {
      "laravel_version": "11.x",
      "php_version": "8.3.0",
      "database_type": "sqlite",
      "environment": "local",
      "uptime": "2h 45m"
    },
    "logs": [
      {
        "level": "INFO",
        "message": "Database seeded successfully - 35 users created",
        "timestamp": "2025-11-11T03:45:00.000000Z"
      },
      {
        "level": "INFO",
        "message": "Admin logged in: admin@fleetfi.com",
        "timestamp": "2025-11-11T04:30:00.000000Z"
      },
      {
        "level": "WARN",
        "message": "API keys not configured in settings",
        "timestamp": "2025-11-11T05:15:00.000000Z"
      }
    ]
  },
  "timestamp": "2025-11-11T06:30:00.000000Z"
}
```

## Fleet Analytics
**GET** `/api/admin/dashboard/fleet-analytics`

```json
{
  "success": true,
  "fleet": [
    {
      "id": 1,
      "asset_id": "ASSET-00001",
      "model": "E-Bike Pro 2024",
      "type": "E-Bike",
      "status": "active",
      "battery_health": 94,
      "location": "Lagos, Nigeria",
      "operator": "Fleet Operator One",
      "last_ride": "2025-11-10T18:30:00Z"
    },
    {
      "id": 2,
      "asset_id": "ASSET-00002",
      "model": "Tesla Model 3",
      "type": "E-Car",
      "status": "charging",
      "battery_health": 89,
      "location": "Abuja, Nigeria",
      "operator": "Sarah Operations",
      "last_ride": "2025-11-11T05:15:00Z"
    }
  ],
  "stats": {
    "total_assets": 50,
    "active": 45,
    "maintenance": 3,
    "inactive": 2,
    "avg_battery_health": 91.2,
    "utilization_rate": 90
  }
}
```

## KYC Actions

### Approve KYC
**POST** `/api/admin/kyc/approve/19`

```json
{
  "success": true,
  "message": "KYC approved successfully",
  "user": {
    "id": 19,
    "name": "Michael Brown",
    "email": "michael.brown@example.com",
    "kyc_status": "verified",
    "kyc_verified_at": "2025-11-11T06:30:00.000000Z"
  }
}
```

### Reject KYC
**POST** `/api/admin/kyc/reject/33`
```json
{
  "reason": "Invalid document format"
}
```

Response:
```json
{
  "success": true,
  "message": "KYC rejected successfully",
  "user": {
    "id": 33,
    "name": "Leo Garcia",
    "email": "leo.garcia@fleetfi.com",
    "kyc_status": "rejected",
    "kyc_rejected_reason": "Invalid document format"
  }
}
```

## API Configuration Update
**POST** `/api/admin/api-config`

Request:
```json
{
  "trovotech_api_key": "trovo_live_abc123xyz789",
  "trovotech_api_url": "https://api.trovotech.com/v1",
  "kyc_api_key": "idp_live_def456uvw012",
  "kyc_api_url": "https://api.myidentitypass.com/api/v2",
  "oem_api_key": "oem_live_ghi789rst345",
  "oem_api_url": "https://telemetry.trovotech.com/api"
}
```

Response:
```json
{
  "success": true,
  "message": "API configuration updated successfully"
}
```
