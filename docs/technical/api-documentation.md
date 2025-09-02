# Sentia Manufacturing Dashboard - API Documentation

## Overview

The Sentia Manufacturing Dashboard provides a comprehensive RESTful API for managing manufacturing operations, demand forecasting, inventory optimization, and production scheduling. All API endpoints follow REST conventions and return JSON responses.

## Base URL

```
Development: http://localhost:5000/api
Production: https://sentia-manufacturing.railway.app/api
```

## Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "manager"
    }
  },
  "message": "Login successful"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_in": 86400
  }
}
```

#### Logout
```http
POST /api/auth/logout
```
**Headers:** Authorization: Bearer <token>

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Product Management API

### List Products
```http
GET /api/products
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `per_page` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search term for product name/SKU
- `market` (string): Filter by market (UK, EU, USA)
- `product_type` (string): Filter by type (Red, Black, Gold)
- `active` (boolean): Filter by active status

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "GABA Red UK",
        "sku": "GABA-RED-UK",
        "product_type": "Red",
        "market": "UK",
        "cost_price": 15.50,
        "selling_price": 29.99,
        "lead_time_days": 3,
        "profit_margin": 48.3,
        "is_active": true,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 9,
      "pages": 1,
      "has_prev": false,
      "has_next": false
    }
  }
}
```

### Get Product Details
```http
GET /api/products/{id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "GABA Red UK",
    "sku": "GABA-RED-UK",
    "product_type": "Red",
    "market": "UK",
    "cost_price": 15.50,
    "selling_price": 29.99,
    "lead_time_days": 3,
    "profit_margin": 48.3,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "sales_stats": {
      "total_sold_30d": 450,
      "revenue_30d": 13497.50,
      "avg_daily_sales": 15
    },
    "inventory": {
      "total_available": 1250,
      "reserved": 150,
      "locations": [
        {
          "location": "UK_Warehouse",
          "available": 800,
          "reserved": 100
        },
        {
          "location": "Amazon_FBA_UK",
          "available": 450,
          "reserved": 50
        }
      ]
    }
  }
}
```

### Create Product
```http
POST /api/products
```

**Request Body:**
```json
{
  "name": "GABA Gold EU",
  "sku": "GABA-GOLD-EU",
  "product_type": "Gold",
  "market": "EU",
  "cost_price": 22.50,
  "selling_price": 49.99,
  "lead_time_days": 5
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "GABA Gold EU",
    "sku": "GABA-GOLD-EU",
    "product_type": "Gold",
    "market": "EU",
    "cost_price": 22.50,
    "selling_price": 49.99,
    "lead_time_days": 5,
    "profit_margin": 55.0,
    "is_active": true,
    "created_at": "2024-01-15T14:30:00Z"
  },
  "message": "Product created successfully"
}
```

### Update Product
```http
PUT /api/products/{id}
```

**Request Body:**
```json
{
  "selling_price": 54.99,
  "lead_time_days": 4
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "GABA Gold EU",
    "sku": "GABA-GOLD-EU",
    "selling_price": 54.99,
    "lead_time_days": 4,
    "profit_margin": 59.1,
    "updated_at": "2024-01-15T15:00:00Z"
  },
  "message": "Product updated successfully"
}
```

### Delete Product
```http
DELETE /api/products/{id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## Forecasting API

### Generate Forecast
```http
POST /api/forecasts/generate
```

**Request Body:**
```json
{
  "product_ids": [1, 2, 3],
  "method": "exp_smoothing",
  "horizon_days": 90,
  "confidence_level": 0.95,
  "parameters": {
    "alpha": 0.3,
    "beta": 0.1,
    "gamma": 0.2,
    "seasonal_periods": 7
  }
}
```

**Available Methods:**
- `sma`: Simple Moving Average
- `exp_smoothing`: Exponential Smoothing (Holt-Winters)
- `arima`: Auto ARIMA
- `linear_regression`: Linear Regression with trend
- `ensemble`: Ensemble of multiple methods

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "task_id": "forecast-123e4567-e89b-12d3-a456-426614174000",
    "status": "processing",
    "estimated_completion": "2024-01-15T10:35:00Z"
  },
  "message": "Forecast generation started"
}
```

### Get Forecast Status
```http
GET /api/forecasts/tasks/{task_id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "task_id": "forecast-123e4567-e89b-12d3-a456-426614174000",
    "status": "completed",
    "progress": 100,
    "forecast_id": 42,
    "started_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:34:30Z"
  }
}
```

### Get Forecast Results
```http
GET /api/forecasts/{forecast_id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "product_id": 1,
    "method": "exp_smoothing",
    "horizon_days": 90,
    "confidence_level": 0.95,
    "created_at": "2024-01-15T10:34:30Z",
    "accuracy_metrics": {
      "mae": 12.5,
      "mape": 8.3,
      "rmse": 18.7,
      "mase": 0.85
    },
    "predictions": [
      {
        "date": "2024-01-16",
        "predicted_demand": 45,
        "confidence_interval": {
          "lower": 38,
          "upper": 52
        }
      },
      {
        "date": "2024-01-17",
        "predicted_demand": 48,
        "confidence_interval": {
          "lower": 41,
          "upper": 55
        }
      }
    ],
    "seasonal_components": {
      "trend": 1.2,
      "seasonality": [0.9, 1.1, 1.0, 0.8, 0.7, 0.6, 1.3],
      "residuals": [-2.1, 1.5, 0.3, -0.8, 2.2]
    }
  }
}
```

### List Forecasts
```http
GET /api/forecasts
```

**Query Parameters:**
- `product_id` (integer): Filter by product
- `method` (string): Filter by forecasting method
- `start_date` (date): Filter forecasts created after date
- `end_date` (date): Filter forecasts created before date

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "forecasts": [
      {
        "id": 42,
        "product_id": 1,
        "product_name": "GABA Red UK",
        "method": "exp_smoothing",
        "horizon_days": 90,
        "created_at": "2024-01-15T10:34:30Z",
        "accuracy": {
          "mape": 8.3,
          "mae": 12.5
        }
      }
    ]
  }
}
```

### Forecast Accuracy Analysis
```http
GET /api/forecasts/accuracy/{forecast_id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "forecast_id": 42,
    "accuracy_period": {
      "start_date": "2024-01-16",
      "end_date": "2024-02-15"
    },
    "metrics": {
      "mae": 12.5,
      "mape": 8.3,
      "rmse": 18.7,
      "mase": 0.85,
      "accuracy_grade": "A"
    },
    "daily_accuracy": [
      {
        "date": "2024-01-16",
        "predicted": 45,
        "actual": 42,
        "error": -3,
        "percentage_error": -7.1
      }
    ],
    "accuracy_trends": {
      "improving": true,
      "trend_slope": 0.05,
      "consistency_score": 0.89
    }
  }
}
```

## Stock Optimization API

### Run Stock Optimization
```http
POST /api/stock/optimize
```

**Request Body:**
```json
{
  "product_ids": [1, 2, 3],
  "optimization_type": "multi_objective",
  "constraints": {
    "max_investment": 100000,
    "service_level": 0.98,
    "warehouse_capacity": {
      "UK_Warehouse": 5000,
      "EU_Warehouse": 3000,
      "USA_Warehouse": 4000
    }
  },
  "cost_parameters": {
    "holding_cost_rate": 0.25,
    "order_cost": 50,
    "stockout_cost": 100
  },
  "objectives": {
    "minimize_cost": 0.6,
    "maximize_service_level": 0.4
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "task_id": "optimization-456e7890-e12b-34c5-d678-901234567890",
    "status": "processing",
    "estimated_completion": "2024-01-15T11:00:00Z"
  },
  "message": "Stock optimization started"
}
```

### Get Optimization Results
```http
GET /api/stock/optimization/{task_id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "task_id": "optimization-456e7890-e12b-34c5-d678-901234567890",
    "status": "completed",
    "optimization_summary": {
      "total_investment": 87500,
      "expected_service_level": 0.985,
      "annual_savings": 15600,
      "inventory_turnover": 8.2
    },
    "product_recommendations": [
      {
        "product_id": 1,
        "product_name": "GABA Red UK",
        "current_stock": 1250,
        "recommended_stock": 1450,
        "reorder_point": 320,
        "order_quantity": 800,
        "safety_stock": 180,
        "expected_turns": 12.5,
        "cost_impact": {
          "holding_cost": 145.50,
          "ordering_cost": 62.50,
          "total_cost": 208.00
        }
      }
    ],
    "location_allocation": [
      {
        "location": "UK_Warehouse",
        "total_allocation": 4200,
        "utilization": 0.84,
        "products": [
          {
            "product_id": 1,
            "allocated_quantity": 1450
          }
        ]
      }
    ]
  }
}
```

### Get Current Stock Levels
```http
GET /api/stock/levels
```

**Query Parameters:**
- `product_id` (integer): Filter by product
- `location` (string): Filter by location
- `low_stock` (boolean): Show only low stock items
- `alerts_only` (boolean): Show only items with alerts

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stock_levels": [
      {
        "product_id": 1,
        "product_name": "GABA Red UK",
        "sku": "GABA-RED-UK",
        "locations": [
          {
            "location": "UK_Warehouse",
            "available": 800,
            "reserved": 100,
            "total": 900,
            "reorder_point": 320,
            "max_level": 1500,
            "status": "normal",
            "days_of_supply": 18.5
          }
        ],
        "total_available": 1250,
        "total_reserved": 150,
        "alerts": []
      }
    ],
    "summary": {
      "total_value": 125650.50,
      "low_stock_items": 2,
      "stockout_items": 0,
      "overstock_items": 1
    }
  }
}
```

### Generate Reorder Report
```http
POST /api/stock/reorder-report
```

**Request Body:**
```json
{
  "product_ids": [1, 2, 3],
  "lead_time_buffer": 1.2,
  "service_level": 0.98
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report_id": "reorder-789a0123-b456-78c9-d012-345678901234",
    "generated_at": "2024-01-15T11:30:00Z",
    "recommendations": [
      {
        "product_id": 1,
        "product_name": "GABA Red UK",
        "current_stock": 1250,
        "reorder_point": 320,
        "recommended_order": 800,
        "supplier": "Primary Manufacturer",
        "lead_time_days": 3,
        "priority": "medium",
        "reason": "Below reorder point in 5 days",
        "cost_estimate": 12400.00
      }
    ],
    "summary": {
      "total_recommendations": 3,
      "total_investment": 35600.00,
      "high_priority": 1,
      "medium_priority": 2
    }
  }
}
```

## Production Scheduling API

### Create Production Schedule
```http
POST /api/schedules/create
```

**Request Body:**
```json
{
  "name": "Weekly Production Schedule",
  "start_date": "2024-01-16",
  "end_date": "2024-01-22",
  "jobs": [
    {
      "product_id": 1,
      "quantity": 500,
      "due_date": "2024-01-18",
      "priority": 1
    },
    {
      "product_id": 2,
      "quantity": 300,
      "due_date": "2024-01-19",
      "priority": 2
    }
  ],
  "constraints": {
    "max_overtime": 8,
    "setup_time_matrix": {
      "1-2": 30,
      "2-1": 45
    },
    "resource_availability": [
      {
        "resource_id": 1,
        "available_hours": 40
      }
    ]
  },
  "optimization_objectives": {
    "minimize_makespan": 0.5,
    "maximize_utilization": 0.3,
    "minimize_setup_time": 0.2
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "task_id": "schedule-abc1234d-ef56-789a-bcde-f012345678901",
    "status": "processing",
    "estimated_completion": "2024-01-15T11:35:00Z"
  },
  "message": "Schedule optimization started"
}
```

### Get Schedule Results
```http
GET /api/schedules/{schedule_id}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Weekly Production Schedule",
    "start_date": "2024-01-16",
    "end_date": "2024-01-22",
    "status": "optimized",
    "created_at": "2024-01-15T11:35:00Z",
    "performance_metrics": {
      "total_makespan": 156,
      "resource_utilization": 0.87,
      "on_time_delivery": 1.0,
      "total_setup_time": 75
    },
    "schedule_items": [
      {
        "job_id": 1,
        "product_id": 1,
        "product_name": "GABA Red UK",
        "quantity": 500,
        "resource_id": 1,
        "resource_name": "Production Line A",
        "start_time": "2024-01-16T08:00:00Z",
        "end_time": "2024-01-16T16:30:00Z",
        "duration": 510,
        "setup_time": 0,
        "status": "scheduled"
      }
    ],
    "resource_utilization": [
      {
        "resource_id": 1,
        "resource_name": "Production Line A",
        "total_hours": 40,
        "scheduled_hours": 34.8,
        "utilization": 0.87,
        "idle_time": 5.2
      }
    ]
  }
}
```

### Update Schedule
```http
PUT /api/schedules/{schedule_id}
```

**Request Body:**
```json
{
  "status": "approved",
  "modifications": [
    {
      "job_id": 1,
      "new_start_time": "2024-01-16T09:00:00Z",
      "reason": "Resource maintenance delay"
    }
  ]
}
```

### Get Resource Availability
```http
GET /api/resources
```

**Query Parameters:**
- `start_date` (date): Filter availability from date
- `end_date` (date): Filter availability to date
- `resource_type` (string): Filter by resource type

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": 1,
        "name": "Production Line A",
        "type": "manufacturing_line",
        "capacity_per_hour": 60,
        "hourly_cost": 125.00,
        "is_available": true,
        "availability": [
          {
            "date": "2024-01-16",
            "available_hours": 8,
            "scheduled_hours": 7.2,
            "maintenance_hours": 0.8
          }
        ],
        "capabilities": ["GABA_Red", "GABA_Black"],
        "location": "UK_Facility"
      }
    ]
  }
}
```

## Integration Management API

### List Integrations
```http
GET /api/integrations
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "amazon_sp_api",
        "name": "Amazon SP-API",
        "type": "sales_channel",
        "status": "connected",
        "last_sync": "2024-01-15T10:00:00Z",
        "health": "healthy",
        "configuration": {
          "marketplaces": ["A1F83G8C2ARO7P", "ATVPDKIKX0DER"],
          "sync_frequency": "hourly"
        }
      },
      {
        "id": "shopify_multi",
        "name": "Shopify Multi-Store",
        "type": "ecommerce",
        "status": "connected", 
        "last_sync": "2024-01-15T10:15:00Z",
        "health": "healthy",
        "stores": [
          {
            "store_id": "uk_store",
            "url": "sentia-uk.myshopify.com",
            "status": "connected"
          }
        ]
      }
    ]
  }
}
```

### Test Integration Connection
```http
POST /api/integrations/{integration_id}/test
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "connection_status": "success",
    "response_time": 245,
    "api_version": "2024-01",
    "rate_limit": {
      "remaining": 180,
      "reset_at": "2024-01-15T11:00:00Z"
    },
    "test_results": [
      {
        "endpoint": "/orders",
        "status": "success",
        "response_time": 180
      },
      {
        "endpoint": "/products",
        "status": "success", 
        "response_time": 120
      }
    ]
  }
}
```

### Trigger Integration Sync
```http
POST /api/integrations/{integration_id}/sync
```

**Request Body:**
```json
{
  "sync_type": "incremental",
  "date_range": {
    "start_date": "2024-01-10",
    "end_date": "2024-01-15"
  },
  "entities": ["orders", "products", "inventory"]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "sync_id": "sync-def5678e-90ab-cdef-1234-567890abcdef",
    "status": "started",
    "estimated_completion": "2024-01-15T11:45:00Z"
  }
}
```

## System Health API

### Health Check
```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T11:30:00Z",
    "version": "1.2.0",
    "components": {
      "database": {
        "status": "healthy",
        "response_time": 15,
        "connections": {
          "active": 5,
          "idle": 10,
          "max": 20
        }
      },
      "redis": {
        "status": "healthy",
        "response_time": 5,
        "memory_usage": "45MB"
      },
      "external_apis": {
        "amazon_sp": "healthy",
        "shopify": "healthy",
        "xero": "healthy"
      }
    },
    "performance": {
      "cpu_usage": 35.2,
      "memory_usage": 68.5,
      "disk_usage": 42.1
    }
  }
}
```

### System Metrics
```http
GET /api/metrics
```

**Query Parameters:**
- `period` (string): Time period (1h, 24h, 7d, 30d)
- `metrics` (array): Specific metrics to return

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "metrics": {
      "api_requests": {
        "total": 15420,
        "per_hour": 642,
        "success_rate": 0.998
      },
      "response_times": {
        "avg": 145,
        "p95": 320,
        "p99": 580
      },
      "error_rates": {
        "4xx": 0.15,
        "5xx": 0.02
      },
      "database_performance": {
        "avg_query_time": 25,
        "slow_queries": 3,
        "connection_pool_usage": 0.65
      }
    }
  }
}
```

## Error Responses

### Standard Error Format
All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "specific_field",
      "value": "invalid_value",
      "constraint": "validation_rule"
    }
  },
  "timestamp": "2024-01-15T11:30:00Z",
  "request_id": "req_123456789"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| AUTHENTICATION_REQUIRED | 401 | Valid authentication required |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks required permissions |
| RESOURCE_NOT_FOUND | 404 | Requested resource not found |
| RESOURCE_CONFLICT | 409 | Resource conflict (duplicate, etc.) |
| RATE_LIMIT_EXCEEDED | 429 | API rate limit exceeded |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": ["Email format is invalid"],
        "cost_price": ["Must be greater than 0"],
        "sku": ["SKU already exists"]
      }
    }
  }
}
```

## Rate Limiting

API requests are subject to rate limiting:

- **Anonymous requests**: 100 requests per hour
- **Authenticated users**: 1000 requests per hour
- **Premium users**: 5000 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Pagination

List endpoints support pagination using query parameters:

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

Pagination metadata is included in responses:
```json
{
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "pages": 8,
    "has_prev": false,
    "has_next": true,
    "prev_url": null,
    "next_url": "/api/products?page=2&per_page=20"
  }
}
```

## WebSocket API

Real-time updates are available via WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('wss://api.sentia-manufacturing.com/ws');
ws.onopen = function() {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Subscribe to Updates
```javascript
// Subscribe to forecast updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'forecasts',
  product_ids: [1, 2, 3]
}));

// Subscribe to stock alerts
ws.send(JSON.stringify({
  type: 'subscribe', 
  channel: 'stock_alerts'
}));
```

### Message Format
```json
{
  "type": "forecast_completed",
  "data": {
    "forecast_id": 42,
    "product_id": 1,
    "status": "completed"
  },
  "timestamp": "2024-01-15T11:45:00Z"
}
```

This comprehensive API documentation provides developers with all the information needed to integrate with the Sentia Manufacturing Dashboard system.