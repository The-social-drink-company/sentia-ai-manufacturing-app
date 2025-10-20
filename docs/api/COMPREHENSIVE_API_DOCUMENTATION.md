# 🏭 SENTIA MANUFACTURING DASHBOARD - COMPREHENSIVE API DOCUMENTATION

## Overview

The CapLiquify Manufacturing Platform provides a comprehensive RESTful API for managing manufacturing operations, financial data, AI analytics, and enterprise integrations. This documentation covers all endpoints, authentication, request/response formats, and integration examples.

**Base URL**: `https://web-production-1f10.up.railway.app/api`
**API Version**: v1.0
**Authentication**: Bearer Token (Clerk JWT) + Role-Based Access Control

---

## 🔐 Authentication

### Bearer Token Authentication
All API requests require a valid JWT token from Clerk authentication.

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     -H "Content-Type: application/json" \
     https://web-production-1f10.up.railway.app/api/health
```

### Role-Based Access Control (RBAC)
- **admin**: Full system access
- **manager**: Operations and reporting access
- **operator**: Production and quality control access  
- **viewer**: Read-only access

---

## 📋 Core API Endpoints

### 🏥 Health Check & System Status

#### GET /api/health
**Description**: System health check
**Authentication**: Required
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy", 
    "mcp_server": "healthy",
    "xero_api": "healthy",
    "shopify_api": "healthy"
  }
}
```

#### GET /api/system/stats
**Description**: System statistics and performance metrics
**Authentication**: Admin required
**Response**:
```json
{
  "uptime": "72h 15m",
  "memory_usage": "512MB",
  "cpu_usage": "15%",
  "active_users": 23,
  "api_requests_24h": 15420,
  "database_connections": 8
}
```

---

## 🏭 Manufacturing Operations API

### Production Tracking

#### GET /api/production/status
**Description**: Real-time production status
**Authentication**: Operator+ required
**Response**:
```json
{
  "lines": [
    {
      "line_id": "A1", 
      "status": "running",
      "efficiency": 94.2,
      "current_job": "BATCH-001",
      "output_rate": 150,
      "target_rate": 160,
      "next_maintenance": "2025-01-10T14:00:00Z"
    }
  ],
  "overall_efficiency": 91.8,
  "active_jobs": 12,
  "completed_today": 8
}
```

#### POST /api/production/jobs
**Description**: Create new production job
**Authentication**: Manager+ required
**Request Body**:
```json
{
  "job_number": "JOB-2025-001",
  "customer_name": "Acme Corp",
  "product_type": "GABA Red 500g",
  "quantity": 1000,
  "priority": 1,
  "due_date": "2025-01-15T00:00:00Z",
  "estimated_hours": 24.5
}
```

#### PUT /api/production/jobs/{jobId}/status
**Description**: Update job status
**Authentication**: Operator+ required
**Request Body**:
```json
{
  "status": "in_progress",
  "actual_hours": 12.5,
  "completion_percentage": 50,
  "notes": "Running ahead of schedule"
}
```

### Quality Control

#### GET /api/quality/dashboard
**Description**: Quality control dashboard data
**Authentication**: Operator+ required
**Response**:
```json
{
  "metrics": {
    "pass_rate": 98.7,
    "defect_rate": 1.3,
    "tests_completed": 150,
    "tests_pending": 8
  },
  "recent_tests": [
    {
      "batch_id": "BATCH-001",
      "test_type": "chemical_analysis",
      "result": "pass",
      "score": 95.2,
      "tested_at": "2025-01-09T09:30:00Z"
    }
  ]
}
```

#### POST /api/quality/tests/submit
**Description**: Submit quality test results
**Authentication**: Operator+ required
**Request Body**:
```json
{
  "batch_id": "BATCH-001", 
  "test_type": "chemical_analysis",
  "parameters": {
    "ph_level": 7.2,
    "purity": 99.1,
    "moisture_content": 2.1
  },
  "result": "pass",
  "notes": "All parameters within specification"
}
```

### Inventory Management

#### GET /api/inventory/dashboard
**Description**: Inventory dashboard overview
**Authentication**: Viewer+ required
**Response**:
```json
{
  "summary": {
    "total_products": 156,
    "low_stock_alerts": 3,
    "reorder_required": 5,
    "total_value": 245000.50
  },
  "low_stock_items": [
    {
      "sku": "GABA-RED-500",
      "current_stock": 45,
      "reorder_point": 100,
      "status": "low_stock"
    }
  ]
}
```

#### POST /api/inventory/stock/update
**Description**: Update inventory levels
**Authentication**: Operator+ required
**Request Body**:
```json
{
  "sku": "GABA-RED-500",
  "location": "WAREHOUSE-A",
  "quantity_change": -50,
  "reason": "production_consumption",
  "reference": "JOB-2025-001"
}
```

---

## 💰 Financial Management API

### Working Capital

#### GET /api/working-capital/dashboard
**Description**: Working capital dashboard with KPIs
**Authentication**: Manager+ required
**Response**:
```json
{
  "kpis": {
    "current_ratio": 2.1,
    "cash_conversion_cycle": 45,
    "days_sales_outstanding": 32,
    "days_payable_outstanding": 28,
    "inventory_turnover": 8.5
  },
  "cash_flow": {
    "current_month": 125430.50,
    "projected_next_month": 142000.00,
    "trend": "improving"
  },
  "recommendations": [
    {
      "type": "payment_terms", 
      "description": "Consider extending payment terms for supplier XYZ",
      "impact": 15000.00
    }
  ]
}
```

#### POST /api/working-capital/projections
**Description**: Generate working capital projections
**Authentication**: Manager+ required
**Request Body**:
```json
{
  "projection_period": "quarterly",
  "scenarios": ["baseline", "optimistic", "pessimistic"],
  "include_seasonality": true,
  "currency": "GBP"
}
```

### Financial Forecasting

#### GET /api/forecasting/demand/{productId}
**Description**: Get demand forecasts for specific product
**Authentication**: Viewer+ required
**Parameters**:
- `productId`: Product UUID
- `horizon`: Forecast horizon in days (default: 90)
- `confidence_level`: Confidence level percentage (default: 95)

**Response**:
```json
{
  "product_id": "prod-uuid-123",
  "forecast_horizon": 90,
  "predictions": [
    {
      "date": "2025-01-10",
      "predicted_demand": 150,
      "confidence_lower": 120,
      "confidence_upper": 180,
      "confidence_score": 0.87
    }
  ],
  "model_info": {
    "model_type": "ARIMA",
    "accuracy": 0.92,
    "last_trained": "2025-01-08T10:00:00Z"
  }
}
```

---

## 🤖 AI & Analytics API

### AI Forecasting Engine

#### POST /api/ai/forecast/generate
**Description**: Generate AI-powered forecasts using GPT-4
**Authentication**: Manager+ required
**Request Body**:
```json
{
  "data_source": "historical_sales",
  "forecast_type": "demand",
  "time_horizon": "quarterly", 
  "include_external_factors": true,
  "products": ["prod-uuid-1", "prod-uuid-2"],
  "confidence_level": 95
}
```

#### GET /api/ai/insights/manufacturing
**Description**: Get AI-generated manufacturing insights
**Authentication**: Viewer+ required
**Response**:
```json
{
  "insights": [
    {
      "type": "efficiency_optimization",
      "description": "Production Line A could increase efficiency by 8% with schedule adjustment",
      "confidence": 0.89,
      "potential_impact": "£12,000/month savings",
      "recommendation": "Implement 15-minute break optimization"
    }
  ],
  "generated_at": "2025-01-09T10:00:00Z"
}
```

### Predictive Maintenance

#### GET /api/ai/maintenance/predictions
**Description**: Equipment maintenance predictions
**Authentication**: Operator+ required
**Response**:
```json
{
  "predictions": [
    {
      "equipment_id": "MIXER-001",
      "predicted_failure_date": "2025-01-20",
      "confidence": 0.78,
      "maintenance_type": "bearing_replacement",
      "estimated_cost": 2500.00,
      "downtime_hours": 6
    }
  ]
}
```

---

## 🔗 External Integrations API

### Shopify Multi-Store

#### GET /api/shopify/stores
**Description**: List configured Shopify stores
**Authentication**: Manager+ required
**Response**:
```json
{
  "stores": [
    {
      "store_id": "uk_store",
      "name": "UK Store", 
      "url": "sentia-uk.myshopify.com",
      "currency": "GBP",
      "status": "active",
      "last_sync": "2025-01-09T09:45:00Z"
    },
    {
      "store_id": "us_store", 
      "name": "US Store",
      "url": "sentia-us.myshopify.com", 
      "currency": "USD",
      "status": "active",
      "last_sync": "2025-01-09T09:43:00Z"
    }
  ]
}
```

#### GET /api/shopify/dashboard-data
**Description**: Consolidated Shopify dashboard data
**Authentication**: Viewer+ required
**Response**:
```json
{
  "revenue": {
    "value": 125430,
    "change": 12,
    "trend": "up",
    "currency": "GBP"
  },
  "orders": {
    "value": 1329, 
    "change": 5,
    "trend": "up"
  },
  "customers": {
    "value": 892,
    "change": 18, 
    "trend": "up"
  }
}
```

### Xero Accounting Integration

#### GET /api/xero/balance-sheet
**Description**: Get balance sheet data from Xero
**Authentication**: Manager+ required
**Response**:
```json
{
  "date": "2025-01-09",
  "assets": {
    "current_assets": 458730.50,
    "fixed_assets": 892340.00,
    "total_assets": 1351070.50
  },
  "liabilities": {
    "current_liabilities": 234567.80,
    "long_term_liabilities": 456789.00,
    "total_liabilities": 691356.80
  },
  "equity": 659713.70,
  "currency": "GBP"
}
```

#### GET /api/xero/profit-loss
**Description**: Get profit & loss statement from Xero
**Authentication**: Manager+ required
**Parameters**:
- `period`: reporting period (month, quarter, year)
- `start_date`: start date (YYYY-MM-DD)
- `end_date`: end date (YYYY-MM-DD)

### Amazon SP-API

#### GET /api/amazon/orders
**Description**: Get Amazon orders
**Authentication**: Manager+ required
**Response**:
```json
{
  "orders": [
    {
      "amazon_order_id": "123-4567890-1234567",
      "purchase_date": "2025-01-09T08:30:00Z",
      "order_status": "Shipped",
      "fulfillment_channel": "MFN",
      "number_of_items_shipped": 2,
      "order_total": {
        "currency_code": "GBP",
        "amount": "47.99"
      }
    }
  ]
}
```

### Unleashed ERP

#### GET /api/unleashed/inventory
**Description**: Get inventory data from Unleashed ERP
**Authentication**: Operator+ required
**Response**:
```json
{
  "products": [
    {
      "product_code": "GABA-RED-500",
      "product_description": "GABA Red 500g Powder",
      "available_qty": 245,
      "on_hand_qty": 300,
      "allocated_qty": 55,
      "unit_cost": 12.50,
      "currency": "GBP"
    }
  ]
}
```

---

## 🔧 MCP Server Integration API

### MCP Status & Health

#### GET /api/mcp/status
**Description**: Get MCP server status and health
**Authentication**: Admin required
**Response**:
```json
{
  "status": "connected",
  "servers": [
    {
      "name": "xero-integration",
      "status": "active",
      "last_ping": "2025-01-09T10:00:00Z",
      "tools_available": 12
    },
    {
      "name": "manufacturing-tools", 
      "status": "active",
      "last_ping": "2025-01-09T10:00:00Z",
      "tools_available": 8
    }
  ]
}
```

#### POST /api/mcp/execute-tool
**Description**: Execute MCP tool
**Authentication**: Manager+ required
**Request Body**:
```json
{
  "server": "xero-integration",
  "tool": "get_balance_sheet",
  "parameters": {
    "date": "2025-01-09",
    "format": "json"
  }
}
```

---

## 📊 Data Import/Export API

### File Upload & Processing

#### POST /api/data-import/upload
**Description**: Upload data files for processing
**Authentication**: Operator+ required
**Content-Type**: multipart/form-data
**Request**: File upload with metadata
**Response**:
```json
{
  "import_id": "import-uuid-123",
  "filename": "sales_data_jan2025.csv",
  "status": "uploaded",
  "file_size": 2048576,
  "estimated_rows": 15000,
  "processing_started": "2025-01-09T10:00:00Z"
}
```

#### GET /api/data-import/status/{importId}
**Description**: Check import status
**Authentication**: Operator+ required
**Response**:
```json
{
  "import_id": "import-uuid-123",
  "status": "completed",
  "progress": 100,
  "total_rows": 14892,
  "processed_rows": 14892,
  "successful_rows": 14651,
  "failed_rows": 241,
  "data_quality_score": 0.98,
  "completed_at": "2025-01-09T10:15:32Z"
}
```

### Data Export

#### GET /api/export/manufacturing-data
**Description**: Export manufacturing data
**Authentication**: Manager+ required
**Parameters**:
- `format`: export format (csv, xlsx, json)
- `start_date`: start date for data range
- `end_date`: end date for data range
- `include_fields`: comma-separated list of fields

**Response**: File download or JSON with download URL

---

## 👥 User Management API

### User Operations

#### GET /api/users/profile
**Description**: Get current user profile
**Authentication**: Required
**Response**:
```json
{
  "user_id": "user-uuid-123",
  "email": "john.doe@company.com",
  "first_name": "John",
  "last_name": "Doe", 
  "role": "manager",
  "permissions": ["production_read", "quality_write", "inventory_read"],
  "last_login": "2025-01-09T09:00:00Z",
  "preferences": {
    "timezone": "Europe/London",
    "currency": "GBP",
    "notifications": true
  }
}
```

#### PUT /api/users/preferences
**Description**: Update user preferences
**Authentication**: Required
**Request Body**:
```json
{
  "timezone": "America/New_York",
  "currency": "USD",
  "notifications": false,
  "dashboard_layout": "compact"
}
```

---

## 🚨 Alerts & Notifications API

### Manufacturing Alerts

#### GET /api/alerts/active
**Description**: Get active system alerts
**Authentication**: Viewer+ required
**Response**:
```json
{
  "alerts": [
    {
      "alert_id": "alert-123",
      "type": "quality_failure",
      "severity": "high", 
      "message": "Batch BATCH-001 failed quality test",
      "created_at": "2025-01-09T09:30:00Z",
      "acknowledged": false,
      "assignee": "john.doe@company.com"
    }
  ],
  "total_active": 3,
  "high_severity": 1,
  "medium_severity": 2
}
```

#### POST /api/alerts/acknowledge
**Description**: Acknowledge alert
**Authentication**: Operator+ required
**Request Body**:
```json
{
  "alert_id": "alert-123",
  "notes": "Investigating root cause"
}
```

---

## 📈 Real-time Events (SSE)

### Server-Sent Events Stream

#### GET /api/events/stream
**Description**: Real-time event stream
**Authentication**: Required
**Content-Type**: text/event-stream

**Event Types**:
- `production_update`: Production line status changes
- `quality_alert`: Quality control alerts
- `inventory_low`: Low stock alerts
- `system_status`: System status changes
- `user_activity`: User activity events

**Example Events**:
```
event: production_update
data: {"line_id": "A1", "efficiency": 95.2, "timestamp": "2025-01-09T10:00:00Z"}

event: quality_alert
data: {"batch_id": "BATCH-001", "alert_type": "parameter_deviation", "severity": "medium"}
```

---

## 🔧 Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "quantity",
      "issue": "must be a positive integer"
    },
    "request_id": "req-uuid-123",
    "timestamp": "2025-01-09T10:00:00Z"
  }
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict
- `422`: Validation Error
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
- `502`: Bad Gateway (external service error)
- `503`: Service Unavailable

### Common Error Codes
- `INVALID_TOKEN`: Authentication token invalid or expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `EXTERNAL_SERVICE_ERROR`: External service integration error
- `DATABASE_ERROR`: Database operation failed
- `MCP_CONNECTION_ERROR`: MCP server connection failed

---

## 🔄 Rate Limiting

### Rate Limits by Role
- **Admin**: 1000 requests/hour
- **Manager**: 500 requests/hour  
- **Operator**: 300 requests/hour
- **Viewer**: 100 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1641751200
```

---

## 🧪 Testing & Examples

### Authentication Example (cURL)
```bash
# Get auth token from Clerk, then use in subsequent requests
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -H "Content-Type: application/json" \
     https://web-production-1f10.up.railway.app/api/production/status
```

### Production Job Creation Example
```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "job_number": "JOB-2025-001",
    "customer_name": "Acme Corp",
    "product_type": "GABA Red 500g",
    "quantity": 1000,
    "priority": 1,
    "due_date": "2025-01-15T00:00:00Z"
  }' \
  https://web-production-1f10.up.railway.app/api/production/jobs
```

### Working Capital Dashboard Example
```bash
curl -H "Authorization: Bearer <your-token>" \
     https://web-production-1f10.up.railway.app/api/working-capital/dashboard
```

---

## 📚 Additional Resources

- **Postman Collection**: Available at `/docs/api/sentia-postman-collection.json`
- **OpenAPI Specification**: Available at `/docs/api/openapi.yaml`
- **SDK Libraries**: TypeScript/JavaScript SDK available
- **Rate Limiting**: Implement exponential backoff for 429 responses
- **Caching**: ETags supported for cacheable endpoints
- **Webhooks**: Available for real-time notifications (contact admin)

---

## 🆘 Support

For API support and integration assistance:
- **Email**: api-support@sentia.com
- **Documentation**: https://docs.sentia.com/api
- **Status Page**: https://status.sentia.com
- **GitHub Issues**: https://github.com/sentia/manufacturing-dashboard/issues

---

**API Version**: 1.0
**Last Updated**: January 9, 2025
**Environment**: Production
**Base URL**: https://web-production-1f10.up.railway.app/api