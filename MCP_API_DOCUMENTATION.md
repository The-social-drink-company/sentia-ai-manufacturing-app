# MCP Integration API Documentation

## Base URL
- **Development**: `http://localhost:5000/api/mcp`
- **Testing**: `https://sentia-manufacturing-testing.up.railway.app/api/mcp`
- **Production**: `https://sentia-manufacturing-production.up.railway.app/api/mcp`

## Authentication
All MCP API endpoints require authentication via JWT token or Clerk session.

```javascript
// Header authentication
Authorization: Bearer <jwt_token>

// Cookie authentication
cookie: __session=<clerk_session_token>
```

---

## Health & Monitoring Endpoints

### GET /health
Check MCP Server connection health.

**Response:**
```json
{
  "status": "ok",
  "mcp": {
    "connected": true,
    "url": "https://web-production-99691282.up.railway.app",
    "serviceId": "99691282-de66-45b2-98cf-317083dd11ba",
    "timestamp": "2024-12-01T10:00:00Z"
  }
}
```

### GET /status
Get comprehensive MCP integration status.

**Response:**
```json
{
  "status": "operational",
  "mcp": {
    "connected": true,
    "health": "healthy",
    "uptime": "2d 5h 30m"
  },
  "websocket": {
    "connected": true,
    "uptime": "2d 5h 30m",
    "messagesReceived": 15234,
    "reconnections": 2
  },
  "autoSync": {
    "enabled": true,
    "activeJobs": 4,
    "lastSync": "2024-12-01T09:45:00Z"
  },
  "services": {
    "xero": "connected",
    "shopify": "connected",
    "amazon": "connected",
    "database": "connected"
  }
}
```

---

## WebSocket Management

### GET /websocket/stats
Get WebSocket connection statistics.

**Response:**
```json
{
  "connected": true,
  "connectionAttempts": 5,
  "successfulConnections": 5,
  "failedConnections": 0,
  "messagesReceived": 15234,
  "messagesSent": 8421,
  "errors": 0,
  "uptime": 185400,
  "uptimeFormatted": "2d 3h 30m",
  "successRate": 100,
  "averageMessagesPerMinute": 82
}
```

### GET /websocket/history
Get WebSocket connection history.

**Response:**
```json
{
  "connections": [
    {
      "type": "connection",
      "status": "connected",
      "timestamp": "2024-12-01T00:00:00Z",
      "attempt": 1
    }
  ],
  "messages": [
    {
      "type": "ai-response",
      "model": "claude-3.5-sonnet",
      "timestamp": "2024-12-01T10:00:00Z",
      "responseTime": 1250
    }
  ]
}
```

### POST /websocket/reconnect
Force WebSocket reconnection.

**Response:**
```json
{
  "success": true,
  "message": "WebSocket reconnection initiated",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

---

## Synchronization Management

### GET /sync/status
Get synchronization status for all services.

**Response:**
```json
{
  "enabled": true,
  "environment": "production",
  "activeJobs": ["xero", "shopify", "amazon", "database"],
  "syncStatus": {
    "xero": {
      "lastSync": "2024-12-01T09:30:00Z",
      "status": "success",
      "errors": 0
    },
    "shopify": {
      "lastSync": "2024-12-01T09:45:00Z",
      "status": "success",
      "errors": 0
    },
    "amazon": {
      "lastSync": "2024-12-01T09:00:00Z",
      "status": "success",
      "errors": 0
    },
    "database": {
      "lastSync": "2024-12-01T06:00:00Z",
      "status": "success",
      "errors": 0
    }
  }
}
```

### POST /sync/trigger/:service
Trigger manual synchronization for a specific service.

**Parameters:**
- `service` (path): Service name (xero, shopify, amazon, unleashed, database)

**Response:**
```json
{
  "success": true,
  "service": "xero",
  "message": "Sync triggered successfully",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### POST /sync/full
Trigger full synchronization for all services.

**Response:**
```json
{
  "success": 3,
  "failed": 1,
  "timestamp": "2024-12-01T10:00:00Z",
  "reason": "manual",
  "details": {
    "xero": "success",
    "shopify": "success",
    "amazon": "success",
    "database": "failed - connection timeout"
  }
}
```

### POST /sync/enable
Enable automatic synchronization.

**Response:**
```json
{
  "success": true,
  "message": "Auto-sync enabled",
  "activeJobs": 4
}
```

### POST /sync/disable
Disable automatic synchronization.

**Response:**
```json
{
  "success": true,
  "message": "Auto-sync disabled"
}
```

---

## AI Manufacturing Tools

### POST /ai/manufacturing-request
Process manufacturing request using AI.

**Request Body:**
```json
{
  "request": "Analyze production efficiency for last month",
  "context": {
    "timeframe": "30days",
    "products": ["SKU001", "SKU002"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "efficiency": 87.3,
    "bottlenecks": ["Assembly Line 2", "Quality Control"],
    "recommendations": [
      "Increase capacity on Assembly Line 2",
      "Implement automated quality checks"
    ],
    "projectedImprovement": "12-15%"
  },
  "model": "claude-3.5-sonnet",
  "processingTime": 2340
}
```

### POST /ai/optimize-inventory
Get AI-powered inventory optimization recommendations.

**Request Body:**
```json
{
  "products": ["SKU001", "SKU002"],
  "timeframe": "30days",
  "constraints": {
    "maxBudget": 100000,
    "warehouseCapacity": 5000
  }
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": {
    "SKU001": {
      "currentLevel": 500,
      "optimalLevel": 750,
      "reorderPoint": 300,
      "safetyStock": 150
    },
    "SKU002": {
      "currentLevel": 1200,
      "optimalLevel": 1000,
      "reorderPoint": 400,
      "safetyStock": 200
    }
  },
  "estimatedSavings": 15000,
  "implementationPlan": "..."
}
```

### POST /ai/forecast-demand
Generate AI-powered demand forecast.

**Request Body:**
```json
{
  "product": "SKU001",
  "periods": 12,
  "seasonality": true,
  "externalFactors": ["holidays", "promotions"]
}
```

**Response:**
```json
{
  "success": true,
  "forecast": [
    {
      "period": "2024-12",
      "demand": 1500,
      "confidence": 0.85,
      "upperBound": 1650,
      "lowerBound": 1350
    },
    {
      "period": "2025-01",
      "demand": 1800,
      "confidence": 0.82,
      "upperBound": 2000,
      "lowerBound": 1600
    }
  ],
  "model": "gpt-4-turbo",
  "accuracy": 87.5
}
```

### POST /ai/analyze-quality
Analyze quality metrics using AI.

**Request Body:**
```json
{
  "data": {
    "defectRate": 0.023,
    "rejectionRate": 0.015,
    "customerComplaints": 12,
    "period": "30days"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "qualityScore": 94.2,
    "trend": "improving",
    "issues": [
      "Packaging defects increasing",
      "Assembly tolerance variations"
    ],
    "recommendations": [
      "Implement automated packaging inspection",
      "Recalibrate assembly equipment"
    ],
    "riskLevel": "low"
  }
}
```

---

## External API Proxies

### GET /xero/invoices
Get Xero invoices (proxied through MCP).

**Query Parameters:**
- `limit` (optional): Number of invoices to return (default: 10)
- `status` (optional): Invoice status filter (DRAFT, SUBMITTED, AUTHORISED)
- `from` (optional): Start date (ISO 8601)
- `to` (optional): End date (ISO 8601)

**Response:**
```json
{
  "source": "api",
  "cached": false,
  "data": [
    {
      "InvoiceID": "xxx-xxx",
      "InvoiceNumber": "INV-001",
      "Type": "ACCREC",
      "Status": "AUTHORISED",
      "Total": 1500.00,
      "DueDate": "2024-12-15",
      "Contact": {
        "Name": "Customer Name"
      }
    }
  ],
  "count": 10,
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### GET /shopify/orders
Get Shopify orders (proxied through MCP).

**Query Parameters:**
- `limit` (optional): Number of orders (default: 10)
- `status` (optional): Order status (open, closed, cancelled)
- `fulfillment_status` (optional): Fulfillment status
- `created_at_min` (optional): Start date
- `created_at_max` (optional): End date

**Response:**
```json
{
  "source": "api",
  "cached": false,
  "data": [
    {
      "id": 123456,
      "order_number": 1001,
      "total_price": "299.99",
      "currency": "USD",
      "fulfillment_status": "fulfilled",
      "created_at": "2024-12-01T08:00:00Z",
      "customer": {
        "id": 789,
        "email": "customer@example.com"
      }
    }
  ],
  "count": 10,
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### GET /shopify/products
Get Shopify products (proxied through MCP).

**Query Parameters:**
- `limit` (optional): Number of products (default: 50)
- `collection_id` (optional): Filter by collection
- `product_type` (optional): Filter by type
- `vendor` (optional): Filter by vendor

**Response:**
```json
{
  "source": "api",
  "cached": false,
  "data": [
    {
      "id": 987654,
      "title": "Product Name",
      "handle": "product-name",
      "vendor": "Sentia",
      "product_type": "Beverage",
      "variants": [
        {
          "id": 111,
          "sku": "SKU001",
          "inventory_quantity": 500,
          "price": "29.99"
        }
      ]
    }
  ],
  "count": 50,
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### GET /amazon/orders
Get Amazon orders (proxied through MCP).

**Query Parameters:**
- `limit` (optional): Number of orders (default: 10)
- `marketplaceIds` (optional): Marketplace IDs (comma-separated)
- `createdAfter` (optional): Start date
- `createdBefore` (optional): End date

**Response:**
```json
{
  "source": "api",
  "cached": false,
  "data": [
    {
      "AmazonOrderId": "xxx-xxx-xxx",
      "PurchaseDate": "2024-12-01T07:00:00Z",
      "OrderStatus": "Shipped",
      "OrderTotal": {
        "Amount": 149.99,
        "CurrencyCode": "USD"
      },
      "NumberOfItemsShipped": 2,
      "ShipServiceLevel": "Standard"
    }
  ],
  "count": 10,
  "timestamp": "2024-12-01T10:00:00Z"
}
```

---

## Database Operations

### GET /database/status
Check database connection and branch status.

**Response:**
```json
{
  "connected": true,
  "branch": "production",
  "tables": 47,
  "records": {
    "users": 152,
    "products": 1847,
    "orders": 12543
  },
  "lastMigration": "20241201_add_mcp_tables",
  "health": "healthy"
}
```

### POST /database/sync-branches
Synchronize database branches.

**Response:**
```json
{
  "success": true,
  "source": "production",
  "target": "development",
  "tablesSync": 47,
  "recordsSync": 14542,
  "duration": 8500,
  "timestamp": "2024-12-01T10:00:00Z"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "status": "error",
  "code": "MCP001",
  "message": "MCP Server unreachable",
  "details": "Connection timeout after 30 seconds",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| MCP001 | MCP Server unreachable | 503 |
| MCP002 | WebSocket connection failed | 502 |
| MCP003 | Sync timeout | 504 |
| MCP004 | Rate limit exceeded | 429 |
| MCP005 | Authentication expired | 401 |
| MCP006 | Database connection error | 500 |
| MCP007 | External API error | 502 |
| MCP008 | No cached data available | 404 |
| MCP009 | Configuration error | 500 |
| MCP010 | Version mismatch | 400 |

---

## Rate Limiting

API endpoints are subject to rate limiting:

- **Default limit**: 100 requests per minute
- **Sync endpoints**: 10 requests per minute
- **AI endpoints**: 20 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701424800
```

---

## WebSocket Events

The MCP integration supports real-time updates via WebSocket:

### Connection Events
- `connected` - WebSocket connected to MCP Server
- `disconnected` - WebSocket disconnected
- `error` - Connection error occurred
- `reconnecting` - Attempting to reconnect

### Data Events
- `ai-response` - AI processing complete
- `manufacturing-alert` - Manufacturing alert triggered
- `api-update` - External API data updated
- `sync-complete` - Synchronization finished
- `system-status` - System status change

### Example WebSocket Client
```javascript
const ws = new WebSocket('wss://[domain]/api/mcp/websocket');

ws.on('open', () => {
  console.log('Connected to MCP WebSocket');
});

ws.on('message', (data) => {
  const event = JSON.parse(data);

  switch(event.type) {
    case 'ai-response':
      console.log('AI Response:', event.data);
      break;
    case 'manufacturing-alert':
      console.log('Alert:', event.alert);
      break;
    case 'api-update':
      console.log('API Update:', event.service);
      break;
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

## Testing

### cURL Examples

```bash
# Health check
curl -X GET https://[domain]/api/mcp/health \
  -H "Authorization: Bearer [token]"

# Trigger sync
curl -X POST https://[domain]/api/mcp/sync/trigger/xero \
  -H "Authorization: Bearer [token]"

# AI manufacturing request
curl -X POST https://[domain]/api/mcp/ai/manufacturing-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{"request": "Analyze production efficiency"}'

# Get Shopify orders
curl -X GET "https://[domain]/api/mcp/shopify/orders?limit=5" \
  -H "Authorization: Bearer [token]"
```

### Postman Collection

Import the following collection for testing:

```json
{
  "info": {
    "name": "MCP Integration API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/mcp/health"
      }
    },
    {
      "name": "Trigger Sync",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/mcp/sync/trigger/xero"
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    }
  ]
}
```

---

**Last Updated**: December 2024
**API Version**: 1.0.0
**MCP Server**: Service ID 99691282-de66-45b2-98cf-317083dd11ba