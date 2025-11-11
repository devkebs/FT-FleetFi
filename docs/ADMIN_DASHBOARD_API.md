# Admin Dashboard API Documentation

## Overview

The Admin Dashboard provides comprehensive monitoring and analytics for the FleetFi platform. All endpoints require admin role authentication.

**Base URL**: `/api/admin/dashboard`

**Authentication**: Bearer token (Sanctum) with `admin` role

---

## Endpoints

### 1. Dashboard Overview

Get comprehensive platform overview with all key metrics.

**Endpoint**: `GET /api/admin/dashboard/overview`

**Query Parameters**:
- `period` (optional): Number of days for metrics (default: 30)

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/overview?period=30" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Example Response**:
```json
{
  "success": true,
  "overview": {
    "users": {
      "total": 1250,
      "new": 85,
      "active": 450,
      "by_role": {
        "investor": 800,
        "operator": 15,
        "driver": 400,
        "admin": 5
      },
      "kyc": {
        "pending": 25,
        "approved": 950,
        "rejected": 45
      },
      "growth_rate": 12.5
    },
    "revenue": {
      "total": 125000.00,
      "period": 15000.00,
      "payouts_completed": 80000.00,
      "payouts_pending": 5000.00,
      "by_source": {
        "rides": 12000.00,
        "swap_fees": 2000.00,
        "subscriptions": 1000.00
      },
      "daily": [
        {"date": "2024-11-01", "total": 500.00},
        {"date": "2024-11-02", "total": 650.00}
      ],
      "average_daily": 500.00
    },
    "assets": {
      "total": 150,
      "new": 10,
      "total_value": 5000000.00,
      "by_type": {
        "electric_bike": 100,
        "electric_car": 30,
        "swap_station": 20
      },
      "by_status": {
        "active": 120,
        "idle": 20,
        "maintenance": 10
      },
      "utilization_rate": 80.5,
      "tokenized": 145
    },
    "investments": {
      "total_invested": 3000000.00,
      "period_invested": 250000.00,
      "active_investors": 800,
      "total_tokens": 30000,
      "by_asset": [
        {"asset_name": "Electric Bike #001", "amount": 50000.00},
        {"asset_name": "Electric Bike #002", "amount": 48000.00}
      ],
      "average_investment": 3750.00
    },
    "operations": {
      "total_rides": 25000,
      "period_rides": 2500,
      "active_vehicles": 85,
      "total_distance": 150000.5,
      "period_distance": 15000.5,
      "average_battery": 75.8,
      "swap_events": 1200,
      "rides_per_day": 83.3
    },
    "platform": {
      "wallet_balance": 500000.00,
      "transactions": 5000,
      "health": {
        "api_uptime": 99.9,
        "database_size": 512.5,
        "active_sessions": 120,
        "error_rate": 0.1
      },
      "activity": {
        "login": 3500,
        "investment": 250,
        "payout_request": 150,
        "kyc_submission": 45
      }
    }
  },
  "timestamp": "2024-11-11T10:30:00.000000Z"
}
```

---

### 2. Real-time Metrics

Get real-time platform metrics updated every few seconds.

**Endpoint**: `GET /api/admin/dashboard/realtime`

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/realtime" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "realtime": {
    "active_users": 25,
    "active_vehicles": 15,
    "current_rides": 8,
    "revenue_today": 2500.00,
    "alerts": [
      {
        "type": "low_battery",
        "count": 3,
        "severity": "warning"
      },
      {
        "type": "pending_kyc",
        "count": 12,
        "severity": "info"
      },
      {
        "type": "offline_vehicles",
        "count": 5,
        "severity": "warning"
      }
    ]
  },
  "timestamp": "2024-11-11T10:35:00.000000Z"
}
```

---

### 3. User Analytics

Get detailed user behavior and growth analytics.

**Endpoint**: `GET /api/admin/dashboard/user-analytics`

**Query Parameters**:
- `period` (optional): Number of days (default: 30)

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/user-analytics?period=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "analytics": {
    "growth": [
      {"date": "2024-11-01", "count": 5},
      {"date": "2024-11-02", "count": 8},
      {"date": "2024-11-03", "count": 3}
    ],
    "engagement": [
      {
        "date": "2024-11-01",
        "active_users": 120,
        "transactions": 250
      },
      {
        "date": "2024-11-02",
        "active_users": 135,
        "transactions": 280
      }
    ],
    "retention_rate": 78.5,
    "top_investors": [
      {
        "user_id": 15,
        "name": "John Doe",
        "email": "john@example.com",
        "total_invested": 50000.00
      },
      {
        "user_id": 28,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "total_invested": 45000.00
      }
    ]
  }
}
```

---

### 4. Revenue Analytics

Get detailed revenue breakdowns and trends.

**Endpoint**: `GET /api/admin/dashboard/revenue-analytics`

**Query Parameters**:
- `period` (optional): Number of days (default: 30)

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/revenue-analytics?period=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "analytics": {
    "growth": [
      {
        "date": "2024-11-01",
        "total": 500.00,
        "transactions": 25
      },
      {
        "date": "2024-11-02",
        "total": 650.00,
        "transactions": 32
      }
    ],
    "by_asset": [
      {
        "asset_name": "Electric Bike #001",
        "asset_type": "electric_bike",
        "revenue": 5000.00
      },
      {
        "asset_name": "Electric Bike #002",
        "asset_type": "electric_bike",
        "revenue": 4800.00
      }
    ],
    "payouts": {
      "total_paid": 80000.00,
      "pending": 5000.00,
      "failed": 500.00,
      "count": 150
    },
    "profit_margin": 45.5
  }
}
```

---

### 5. Fleet Analytics

Get fleet performance and utilization metrics.

**Endpoint**: `GET /api/admin/dashboard/fleet-analytics`

**Query Parameters**:
- `period` (optional): Number of days (default: 30)

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/fleet-analytics?period=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "analytics": {
    "utilization": [
      {"date": "2024-11-01", "active_vehicles": 85},
      {"date": "2024-11-02", "active_vehicles": 90}
    ],
    "top_performers": [
      {
        "vehicle": "ABC-123",
        "model": "E-Bike Pro",
        "total_rides": 250,
        "total_revenue": 5000.00,
        "total_distance": 1500.5
      },
      {
        "vehicle": "XYZ-456",
        "model": "E-Bike Plus",
        "total_rides": 230,
        "total_revenue": 4800.00,
        "total_distance": 1400.2
      }
    ],
    "battery_health": {
      "1": {
        "average_level": 78.5,
        "average_temp": 32.5,
        "min_level": 15.0
      },
      "2": {
        "average_level": 82.3,
        "average_temp": 31.8,
        "min_level": 20.0
      }
    },
    "maintenance_alerts": [
      {
        "vehicle": "ABC-123",
        "reason": "High mileage",
        "priority": "medium"
      },
      {
        "vehicle": "DEF-789",
        "reason": "Maintenance overdue",
        "priority": "medium"
      }
    ]
  }
}
```

---

### 6. System Health

Get platform health status for all components.

**Endpoint**: `GET /api/admin/dashboard/system-health`

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/system-health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "overall_status": "healthy",
  "components": {
    "database": {
      "status": "healthy",
      "response_time": 5
    },
    "api": {
      "status": "healthy",
      "uptime": 99.9
    },
    "storage": {
      "status": "healthy",
      "used_percent": 45.5
    },
    "queue": {
      "status": "healthy",
      "failed_jobs": 2
    },
    "cache": {
      "status": "healthy"
    }
  },
  "timestamp": "2024-11-11T10:40:00.000000Z"
}
```

---

### 7. KYC Management

Get KYC submission statistics and pending reviews.

**Endpoint**: `GET /api/admin/dashboard/kyc-management`

**Query Parameters**:
- `status` (optional): Filter by status (pending, approved, rejected) (default: pending)

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/kyc-management?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "submissions": {
    "current_page": 1,
    "data": [
      {
        "id": 15,
        "user": {
          "id": 150,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "status": "pending",
        "provider": "identitypass",
        "created_at": "2024-11-10T14:30:00.000000Z",
        "updated_at": "2024-11-10T14:30:00.000000Z"
      }
    ],
    "per_page": 20,
    "total": 25
  },
  "stats": {
    "total": 1020,
    "pending": 25,
    "approved": 950,
    "rejected": 45,
    "avg_processing_time": 4.5
  }
}
```

---

### 8. Transaction Monitoring

Monitor wallet transactions and detect anomalies.

**Endpoint**: `GET /api/admin/dashboard/transaction-monitoring`

**Query Parameters**:
- `period` (optional): Number of days (default: 30)

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/transaction-monitoring?period=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "transactions": {
    "current_page": 1,
    "data": [
      {
        "id": 5001,
        "user": {
          "id": 150,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "type": "credit",
        "amount": 5000.00,
        "description": "Wallet funding",
        "created_at": "2024-11-11T09:15:00.000000Z"
      }
    ],
    "per_page": 50,
    "total": 5000
  },
  "stats": {
    "total_volume": 500000.00,
    "total_count": 5000,
    "credits": 400000.00,
    "debits": 100000.00,
    "by_type": {
      "credit": 400000.00,
      "debit": 100000.00
    }
  },
  "large_transactions": [
    {
      "id": 5001,
      "user": {
        "id": 150,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 50000.00,
      "type": "credit",
      "created_at": "2024-11-11T09:15:00.000000Z"
    }
  ]
}
```

---

### 9. Audit Logs

Get detailed audit trail of all platform actions.

**Endpoint**: `GET /api/admin/dashboard/audit-logs`

**Query Parameters**:
- `action` (optional): Filter by action type
- `user_id` (optional): Filter by user ID

**Example Request**:
```bash
curl -X GET "https://api.fleetfi.com/api/admin/dashboard/audit-logs?action=login" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:
```json
{
  "success": true,
  "logs": {
    "current_page": 1,
    "data": [
      {
        "id": 10001,
        "user": {
          "id": 150,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "action": "login",
        "description": "User logged in successfully",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-11-11T10:00:00.000000Z"
      }
    ],
    "per_page": 50,
    "total": 15000
  },
  "stats": {
    "total": 15000,
    "today": 250,
    "by_action": {
      "login": 3500,
      "investment": 250,
      "payout_request": 150,
      "kyc_submission": 45,
      "wallet_transaction": 5000
    }
  }
}
```

---

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - User doesn't have admin role |
| 422 | Validation error |
| 500 | Server error |

---

## Frontend Integration Example

```typescript
import api from '@/services/api';

// Get dashboard overview
async function getDashboardOverview(period: number = 30) {
  try {
    const response = await api.get(`/admin/dashboard/overview`, {
      params: { period }
    });
    return response.data.overview;
  } catch (error) {
    console.error('Dashboard overview error:', error);
    throw error;
  }
}

// Get real-time metrics (call every 5-10 seconds)
async function getRealtimeMetrics() {
  try {
    const response = await api.get('/admin/dashboard/realtime');
    return response.data.realtime;
  } catch (error) {
    console.error('Realtime metrics error:', error);
    throw error;
  }
}

// Get user analytics
async function getUserAnalytics(period: number = 30) {
  try {
    const response = await api.get('/admin/dashboard/user-analytics', {
      params: { period }
    });
    return response.data.analytics;
  } catch (error) {
    console.error('User analytics error:', error);
    throw error;
  }
}

// Monitor system health
async function getSystemHealth() {
  try {
    const response = await api.get('/admin/dashboard/system-health');
    return response.data;
  } catch (error) {
    console.error('System health error:', error);
    throw error;
  }
}

// Example usage in React component
function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [realtime, setRealtime] = useState(null);
  
  useEffect(() => {
    // Load initial data
    getDashboardOverview(30).then(setOverview);
    
    // Setup real-time updates
    const interval = setInterval(() => {
      getRealtimeMetrics().then(setRealtime);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Render dashboard components */}
    </div>
  );
}
```

---

## Performance Considerations

1. **Caching**: Dashboard data is cached for 5 minutes by default
2. **Real-time updates**: Poll `/realtime` endpoint every 5-10 seconds
3. **Pagination**: Transaction and audit log endpoints return paginated results
4. **Period parameter**: Limit to reasonable ranges (7, 30, 90 days)
5. **Rate limiting**: 100 requests per minute per admin user

---

## Security Notes

1. All endpoints require valid Sanctum token
2. Only users with `admin` role can access dashboard endpoints
3. Sensitive data (passwords, API keys) are never exposed
4. All requests are logged in audit trail
5. HTTPS required in production

---

## Error Handling

```json
{
  "success": false,
  "message": "Unauthorized access",
  "errors": {
    "role": ["Admin role required"]
  }
}
```

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "period": ["Period must be a number between 1 and 365"]
  }
}
```
