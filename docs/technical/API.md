# API Documentation

## Overview
Comprehensive documentation for the CapLiquify Manufacturing Platform REST API, including authentication, endpoints, request/response formats, and integration examples.

## Table of Contents
- [Authentication](#authentication)
- [Base URL & Versioning](#base-url--versioning)
- [Common Patterns](#common-patterns)
- [Core Endpoints](#core-endpoints)
- [Dashboard API](#dashboard-api)
- [Working Capital API](#working-capital-api)
- [User Management API](#user-management-api)
- [System API](#system-api)
- [Webhook API](#webhook-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [SDK Examples](#sdk-examples)

---

## Authentication

### Clerk JWT Authentication
All API endpoints require authentication via Clerk JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

### Token Verification
```typescript
// Frontend token retrieval
import { useAuth } from '@clerk/clerk-react';

const { getToken } = useAuth();
const token = await getToken();

// API request with token
const response = await fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### User Context
```json
{
  "userId": "user_2abc123def456",
  "email": "user@example.com",
  "role": "manager",
  "permissions": ["dashboard.view", "dashboard.edit", "reports.view"],
  "orgId": "org_789xyz456"
}
```

---

## Base URL & Versioning

```
Base URL: https://sentia-manufacturing.com/api
Version: v1 (default)
Full URL: https://sentia-manufacturing.com/api/v1
```

### Environment URLs
```yaml
Production: https://sentia-manufacturing.com/api
Staging: https://staging.sentia-manufacturing.com/api
Development: https://dev.sentia-manufacturing.com/api
```

---

## Common Patterns

### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-01-01T12:00:00Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-01T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtering & Sorting
```http
GET /api/orders?status=pending&sort=-createdAt&limit=50&page=1
```

---

## Core Endpoints

### Health Check

#### System Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T12:00:00Z",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "production"
  }
}
```

#### Detailed Health
```http
GET /api/health/detailed
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "checks": {
      "database": "healthy",
      "redis": "healthy",
      "externalAPIs": "degraded"
    },
    "performance": {
      "responseTime": 120,
      "memoryUsage": 0.65,
      "cpuUsage": 0.45
    }
  }
}
```

---

## Dashboard API

### Get Dashboard Layout

```http
GET /api/dashboard/layout
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "layout_123",
    "name": "Default Layout",
    "widgets": [
      {
        "id": "widget_1",
        "type": "kpi-strip",
        "position": { "x": 0, "y": 0, "w": 12, "h": 2 },
        "config": {
          "metrics": ["revenue", "orders", "customers"]
        }
      },
      {
        "id": "widget_2",
        "type": "chart",
        "position": { "x": 0, "y": 2, "w": 6, "h": 4 },
        "config": {
          "chartType": "line",
          "metric": "revenue",
          "period": "30d"
        }
      }
    ]
  }
}
```

### Update Dashboard Layout

```http
PUT /api/dashboard/layout
Content-Type: application/json

{
  "widgets": [
    {
      "id": "widget_1",
      "type": "kpi-strip",
      "position": { "x": 0, "y": 0, "w": 12, "h": 2 },
      "config": {
        "metrics": ["revenue", "orders", "customers", "inventory"]
      }
    }
  ]
}
```

### Get Widget Data

```http
GET /api/dashboard/widgets/{widgetId}/data?period=30d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "kpi-strip",
    "metrics": {
      "revenue": {
        "current": 125000,
        "previous": 118000,
        "change": 5.93,
        "trend": "up"
      },
      "orders": {
        "current": 1250,
        "previous": 1180,
        "change": 5.93,
        "trend": "up"
      }
    },
    "lastUpdated": "2025-01-01T12:00:00Z"
  }
}
```

### Create Widget

```http
POST /api/dashboard/widgets
Content-Type: application/json

{
  "type": "chart",
  "name": "Monthly Revenue",
  "position": { "x": 6, "y": 2, "w": 6, "h": 4 },
  "config": {
    "chartType": "bar",
    "metric": "revenue",
    "period": "12m",
    "groupBy": "month"
  }
}
```

---

## Working Capital API

### Get Working Capital Overview

```http
GET /api/working-capital/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentRatio": 2.5,
    "quickRatio": 1.8,
    "workingCapital": 500000,
    "cashConversionCycle": 45,
    "breakdown": {
      "currentAssets": {
        "cash": 200000,
        "accountsReceivable": 300000,
        "inventory": 400000,
        "total": 900000
      },
      "currentLiabilities": {
        "accountsPayable": 250000,
        "shortTermDebt": 150000,
        "total": 400000
      }
    },
    "trends": {
      "workingCapital": [
        { "date": "2024-12", "value": 480000 },
        { "date": "2025-01", "value": 500000 }
      ]
    }
  }
}
```

### Get Accounts Receivable

```http
GET /api/working-capital/accounts-receivable?aging=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 300000,
    "aging": {
      "current": { "amount": 200000, "percentage": 66.7 },
      "30days": { "amount": 75000, "percentage": 25.0 },
      "60days": { "amount": 20000, "percentage": 6.7 },
      "90days": { "amount": 5000, "percentage": 1.7 }
    },
    "accounts": [
      {
        "id": "ar_123",
        "customerName": "ABC Corp",
        "invoiceNumber": "INV-001",
        "amount": 15000,
        "dueDate": "2025-01-15",
        "daysOverdue": 5,
        "status": "overdue"
      }
    ]
  }
}
```

### Get Accounts Payable

```http
GET /api/working-capital/accounts-payable?upcoming=7
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 250000,
    "upcomingPayments": [
      {
        "id": "ap_456",
        "vendorName": "XYZ Supplies",
        "invoiceNumber": "BILL-789",
        "amount": 8500,
        "dueDate": "2025-01-10",
        "daysUntilDue": 3,
        "priority": "high"
      }
    ],
    "summary": {
      "due7Days": 25000,
      "due30Days": 75000,
      "overdue": 5000
    }
  }
}
```

### Get Cash Flow Forecast

```http
GET /api/working-capital/cash-flow/forecast?period=90d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBalance": 200000,
    "projectedBalance": 180000,
    "forecast": [
      {
        "date": "2025-01-01",
        "receipts": 50000,
        "payments": 40000,
        "netFlow": 10000,
        "balance": 210000
      },
      {
        "date": "2025-01-02",
        "receipts": 25000,
        "payments": 35000,
        "netFlow": -10000,
        "balance": 200000
      }
    ],
    "insights": {
      "cashShortfall": {
        "date": "2025-02-15",
        "amount": -25000,
        "severity": "medium"
      },
      "recommendations": [
        "Accelerate accounts receivable collection",
        "Negotiate extended payment terms with key vendors"
      ]
    }
  }
}
```

---

## User Management API

### Get Current User

```http
GET /api/users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "clerkUserId": "user_2abc123def456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "manager",
    "permissions": ["dashboard.view", "dashboard.edit"],
    "preferences": {
      "theme": "light",
      "timezone": "Europe/London",
      "notifications": {
        "email": true,
        "push": false
      }
    },
    "lastLogin": "2025-01-01T12:00:00Z",
    "createdAt": "2024-06-01T10:00:00Z"
  }
}
```

### Update User Preferences

```http
PUT /api/users/me/preferences
Content-Type: application/json

{
  "theme": "dark",
  "timezone": "America/New_York",
  "notifications": {
    "email": true,
    "push": true,
    "slack": false
  }
}
```

### Get All Users (Admin only)

```http
GET /api/users?role=manager&status=active&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "manager",
      "status": "active",
      "lastLogin": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Update User Role (Admin only)

```http
PUT /api/users/{userId}/role
Content-Type: application/json

{
  "role": "admin"
}
```

---

## System API

### Get System Information

```http
GET /api/system/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "buildId": "abc123def456",
    "environment": "production",
    "uptime": 86400,
    "memory": {
      "used": 512,
      "total": 2048,
      "percentage": 25
    },
    "database": {
      "connections": 15,
      "maxConnections": 100,
      "status": "healthy"
    },
    "features": {
      "newDashboard": true,
      "aiForecasting": true,
      "mobileApp": false
    }
  }
}
```

### Get System Metrics

```http
GET /api/system/metrics?period=1h
```

**Response:**
```json
{
  "success": true,
  "data": {
    "performance": {
      "responseTime": {
        "avg": 250,
        "p95": 500,
        "p99": 800
      },
      "throughput": 150,
      "errorRate": 0.02
    },
    "resources": {
      "cpu": 45,
      "memory": 65,
      "disk": 30
    },
    "business": {
      "activeUsers": 125,
      "apiCalls": 15000,
      "revenue": 12500
    }
  }
}
```

### Update Feature Flags (Admin only)

```http
PUT /api/system/features
Content-Type: application/json

{
  "newDashboard": true,
  "aiForecasting": false,
  "betaFeatures": true
}
```

---

## Webhook API

### Register Webhook

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://external-system.com/webhook",
  "events": ["order.created", "invoice.paid"],
  "secret": "webhook_secret_123",
  "active": true
}
```

### List Webhooks

```http
GET /api/webhooks
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "webhook_123",
      "url": "https://external-system.com/webhook",
      "events": ["order.created", "invoice.paid"],
      "active": true,
      "lastDelivery": "2025-01-01T11:30:00Z",
      "deliveryAttempts": 1,
      "status": "active"
    }
  ]
}
```

### Webhook Event Types

```typescript
interface WebhookEvents {
  // Order events
  'order.created': Order;
  'order.updated': Order;
  'order.cancelled': Order;
  
  // Invoice events
  'invoice.generated': Invoice;
  'invoice.sent': Invoice;
  'invoice.paid': Invoice;
  'invoice.overdue': Invoice;
  
  // Inventory events
  'inventory.low_stock': InventoryAlert;
  'inventory.out_of_stock': InventoryAlert;
  
  // System events
  'system.maintenance': MaintenanceNotification;
  'system.alert': SystemAlert;
}
```

### Webhook Payload Example

```json
{
  "id": "evt_123abc456def",
  "type": "order.created",
  "timestamp": "2025-01-01T12:00:00Z",
  "data": {
    "id": "order_789",
    "orderNumber": "ORD-2025-001",
    "customer": {
      "id": "customer_456",
      "name": "ABC Corp"
    },
    "items": [
      {
        "id": "item_123",
        "productId": "product_789",
        "quantity": 5,
        "price": 100
      }
    ],
    "total": 500,
    "status": "pending"
  },
  "signature": "sha256=abc123def456789..."
}
```

---

## Error Handling

### Error Codes

```typescript
enum APIErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

### HTTP Status Codes

```yaml
200: Success
201: Created
204: No Content
400: Bad Request
401: Unauthorized
403: Forbidden
404: Not Found
409: Conflict
422: Unprocessable Entity
429: Too Many Requests
500: Internal Server Error
503: Service Unavailable
```

### Error Response Examples

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email must be a valid email address"
      },
      {
        "field": "amount",
        "code": "MISSING_REQUIRED_FIELD",
        "message": "Amount is required"
      }
    ]
  }
}
```

**Authorization Error:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this resource",
    "requiredPermission": "users.manage"
  }
}
```

---

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint

```yaml
General API: 1000 requests/hour
Authentication: 50 requests/hour
File Upload: 20 requests/hour
Admin Operations: 200 requests/hour
Webhook Delivery: 100 requests/hour
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "retryAfter": 3600
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
// Installation
npm install @sentia/dashboard-sdk

// Usage
import { SentiaDashboardSDK } from '@sentia/dashboard-sdk';

const sdk = new SentiaDashboardSDK({
  apiKey: 'your-api-key',
  baseURL: 'https://sentia-manufacturing.com/api'
});

// Get dashboard data
const dashboard = await sdk.dashboard.getLayout();

// Update working capital
const workingCapital = await sdk.workingCapital.getOverview();

// Create order
const order = await sdk.orders.create({
  customerId: 'customer_123',
  items: [
    { productId: 'product_456', quantity: 2, price: 50 }
  ]
});
```

### Python SDK

```python
# Installation
pip install sentia-dashboard-sdk

# Usage
from sentia_dashboard import SentiaDashboardSDK

sdk = SentiaDashboardSDK(
    api_key='your-api-key',
    base_url='https://sentia-manufacturing.com/api'
)

# Get dashboard data
dashboard = sdk.dashboard.get_layout()

# Update working capital
working_capital = sdk.working_capital.get_overview()

# Create order
order = sdk.orders.create({
    'customer_id': 'customer_123',
    'items': [
        {'product_id': 'product_456', 'quantity': 2, 'price': 50}
    ]
})
```

### cURL Examples

```bash
# Get dashboard layout
curl -X GET "https://sentia-manufacturing.com/api/dashboard/layout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Create order
curl -X POST "https://sentia-manufacturing.com/api/orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer_123",
    "items": [
      {"productId": "product_456", "quantity": 2, "price": 50}
    ]
  }'

# Get working capital overview
curl -X GET "https://sentia-manufacturing.com/api/working-capital/overview" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## OpenAPI Specification

### Schema Definition

```yaml
openapi: 3.0.0
info:
  title: CapLiquify Manufacturing Platform API
  version: 1.0.0
  description: Comprehensive API for manufacturing dashboard operations
  contact:
    name: API Support
    email: api@sentia-manufacturing.com
    url: https://docs.sentia-manufacturing.com

servers:
  - url: https://sentia-manufacturing.com/api/v1
    description: Production server
  - url: https://staging.sentia-manufacturing.com/api/v1
    description: Staging server

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          example: "user_123"
        email:
          type: string
          format: email
          example: "user@example.com"
        role:
          type: string
          enum: [super_admin, admin, manager, operator, viewer]
        createdAt:
          type: string
          format: date-time
          
    Order:
      type: object
      properties:
        id:
          type: string
          example: "order_456"
        orderNumber:
          type: string
          example: "ORD-2025-001"
        customerId:
          type: string
          example: "customer_789"
        status:
          type: string
          enum: [pending, confirmed, shipped, delivered, cancelled]
        totalAmount:
          type: number
          format: decimal
          example: 1250.00
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'
            
    OrderItem:
      type: object
      properties:
        id:
          type: string
        productId:
          type: string
        quantity:
          type: integer
          minimum: 1
        unitPrice:
          type: number
          format: decimal
        totalPrice:
          type: number
          format: decimal

paths:
  /dashboard/layout:
    get:
      summary: Get dashboard layout
      tags: [Dashboard]
      responses:
        '200':
          description: Dashboard layout retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/DashboardLayout'
```

---

## Postman Collection

### Collection Structure

```json
{
  "info": {
    "name": "CapLiquify Manufacturing Platform API",
    "description": "Complete API collection for dashboard operations",
    "version": "1.0.0"
  },
  "auth": {
    "type": "bearer",
    "bearer": {
      "token": "{{jwt_token}}"
    }
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://sentia-manufacturing.com/api",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/users/me"
          }
        }
      ]
    },
    {
      "name": "Dashboard",
      "item": [
        {
          "name": "Get Layout",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/dashboard/layout"
          }
        }
      ]
    }
  ]
}
```

This comprehensive API documentation provides developers with everything they need to integrate with the CapLiquify Manufacturing Platform API, including detailed endpoint descriptions, request/response examples, error handling, and integration patterns.