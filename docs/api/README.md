# API Documentation

## CapLiquify Manufacturing Platform API Reference

### Base URL
- **Development**: `http://localhost:5000/api`
- **Testing**: `https://sentia-manufacturing-testing.onrender.com/api`
- **Production**: `https://sentia-manufacturing-production.onrender.com/api`

### Authentication
All API endpoints require authentication via Clerk JWT tokens.

```javascript
headers: {
  'Authorization': 'Bearer <your-jwt-token>',
  'Content-Type': 'application/json'
}
```

---

## Core API Endpoints

### Dashboard

#### GET /api/dashboard/widgets
Retrieve all dashboard widgets with data

**Response:**
```json
{
  "success": true,
  "data": {
    "kpi": { /* KPI data */ },
    "forecast": { /* Forecast data */ },
    "inventory": { /* Inventory data */ }
  }
}
```

#### PUT /api/dashboard/layout
Save dashboard layout configuration

**Request Body:**
```json
{
  "layout": [
    {
      "i": "kpi-strip",
      "x": 0,
      "y": 0,
      "w": 12,
      "h": 2
    }
  ]
}
```

---

### Manufacturing

#### GET /api/manufacturing/jobs
Get manufacturing jobs list

**Query Parameters:**
- `status`: Filter by status (pending|in_progress|completed)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [],
    "total": 100,
    "hasMore": true
  }
}
```

#### POST /api/manufacturing/jobs
Create new manufacturing job

**Request Body:**
```json
{
  "productId": "PROD-001",
  "quantity": 100,
  "priority": "high",
  "dueDate": "2025-10-01"
}
```

---

### Inventory

#### GET /api/inventory/levels
Get current inventory levels

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "sku": "SKU-001",
        "name": "Product Name",
        "quantity": 150,
        "reorderPoint": 50,
        "status": "in_stock"
      }
    ]
  }
}
```

#### POST /api/inventory/adjustment
Record inventory adjustment

**Request Body:**
```json
{
  "sku": "SKU-001",
  "adjustment": 10,
  "reason": "manual_count",
  "notes": "Physical count correction"
}
```

---

### Forecasting

#### GET /api/forecasting/demand
Get demand forecast

**Query Parameters:**
- `period`: Forecast period (7d|30d|90d|365d)
- `products`: Comma-separated product IDs

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast": [
      {
        "date": "2025-10-01",
        "demand": 150,
        "confidence": 0.85
      }
    ],
    "accuracy": 0.82
  }
}
```

#### POST /api/forecasting/run
Trigger new forecast calculation

**Request Body:**
```json
{
  "models": ["arima", "prophet", "lstm"],
  "horizon": 30,
  "products": ["all"]
}
```

---

### Financial

#### GET /api/financial/working-capital
Get working capital metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWorkingCapital": 500000,
    "inventory": 200000,
    "receivables": 150000,
    "payables": 100000,
    "cashCycle": 45
  }
}
```

#### POST /api/financial/what-if
Run what-if analysis

**Request Body:**
```json
{
  "scenario": {
    "demandChange": 0.2,
    "priceChange": 0.1,
    "costChange": -0.05
  }
}
```

---

### Analytics

#### GET /api/analytics/kpi
Get key performance indicators

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "value": 1500000,
      "change": 0.12,
      "trend": "up"
    },
    "efficiency": {
      "value": 0.85,
      "change": 0.03,
      "trend": "up"
    }
  }
}
```

#### GET /api/analytics/reports
Get analytical reports

**Query Parameters:**
- `type`: Report type (daily|weekly|monthly)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

---

### Integration APIs

#### GET /api/integrations/status
Get status of all integrations

**Response:**
```json
{
  "success": true,
  "data": {
    "xero": {
      "connected": true,
      "lastSync": "2025-09-16T08:00:00Z"
    },
    "shopify": {
      "connected": true,
      "lastSync": "2025-09-16T08:15:00Z"
    },
    "amazon": {
      "connected": false,
      "error": "Invalid credentials"
    }
  }
}
```

#### POST /api/integrations/sync
Trigger data synchronization

**Request Body:**
```json
{
  "service": "xero",
  "type": "full",
  "entities": ["invoices", "products"]
}
```

---

### AI/ML Endpoints

#### POST /api/ai/chat
Chat with AI assistant

**Request Body:**
```json
{
  "message": "What are the top selling products?",
  "context": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on current data...",
    "suggestions": [],
    "charts": []
  }
}
```

#### POST /api/ai/optimize
Get AI optimization recommendations

**Request Body:**
```json
{
  "area": "inventory",
  "constraints": {
    "budget": 100000,
    "space": "limited"
  }
}
```

---

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "quantity",
      "issue": "Must be positive integer"
    }
  }
}
```

### Error Codes
- `AUTH_REQUIRED`: Authentication missing
- `AUTH_INVALID`: Invalid authentication token
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

---

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Analytics endpoints**: 50 requests per minute
- **AI endpoints**: 20 requests per minute
- **Bulk operations**: 10 requests per minute

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1695283200
```

---

## Webhooks

### Configure Webhook
```json
POST /api/webhooks/configure
{
  "url": "https://your-domain.com/webhook",
  "events": ["job.completed", "inventory.low"],
  "secret": "your-secret-key"
}
```

### Webhook Events
- `job.created`: Manufacturing job created
- `job.completed`: Manufacturing job completed
- `inventory.low`: Inventory below reorder point
- `forecast.updated`: Forecast recalculated
- `integration.sync`: Integration sync completed

---

## WebSocket Events

Connect to real-time updates:

```javascript
const ws = new WebSocket('wss://api.sentia.com/realtime');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  // Handle real-time update
});
```

### Event Types
- `dashboard.update`: Dashboard data update
- `job.status`: Job status change
- `alert.new`: New system alert
- `metric.change`: KPI metric change

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { SentiaAPI } from '@sentia/sdk';

const api = new SentiaAPI({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Get dashboard data
const widgets = await api.dashboard.getWidgets();

// Create manufacturing job
const job = await api.manufacturing.createJob({
  productId: 'PROD-001',
  quantity: 100
});
```

### Python
```python
from sentia import SentiaClient

client = SentiaClient(
    api_key="your-api-key",
    environment="production"
)

# Get inventory levels
inventory = client.inventory.get_levels()

# Run forecast
forecast = client.forecasting.run_demand_forecast(
    period="30d",
    products=["PROD-001", "PROD-002"]
)
```

---

## API Versioning

The API uses URL versioning. Current version: `v1`

Future versions will be available at:
- `/api/v2/...`
- `/api/v3/...`

Deprecated endpoints will be supported for 6 months after new version release.

---

## Support

For API support and questions:
- Email: api-support@sentia.com
- Documentation: https://docs.sentia.com/api
- Status Page: https://status.sentia.com