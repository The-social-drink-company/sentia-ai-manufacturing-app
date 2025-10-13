# Analytics API Reference

## Overview

Quick reference for the Advanced Analytics & Reporting API endpoints. For complete documentation, see [ADVANCED_ANALYTICS_REPORTING.md](ADVANCED_ANALYTICS_REPORTING.md).

**Base URL**: `/api/dashboard/analytics`  
**Authentication**: JWT Bearer token required for all endpoints  
**Content-Type**: `application/json`

## Authentication

All analytics endpoints require JWT authentication:

```bash
curl -H "Authorization: Bearer <jwt-token>" \
     -H "Content-Type: application/json" \
     https://your-server.com/api/dashboard/analytics/performance
```

## Endpoints Summary

### 1. Analytics Analysis
**POST** `/analytics/analyze`

Run comprehensive data analysis with ML capabilities.

```json
{
  "dataSource": "manufacturing|financial|customer",
  "analysisType": "comprehensive|financial|operational|customer",
  "timeframe": "7d|30d|90d|365d",
  "filters": { "region": "US", "productLine": "A" },
  "options": {
    "includeAnomalies": true,
    "includeTrends": true,
    "includeForecasts": true
  }
}
```

### 2. Visualization Generation
**POST** `/analytics/visualize`

Generate interactive charts and visualizations.

```json
{
  "chartType": "line|bar|pie|scatter|heatmap|area",
  "data": [{"timestamp": "2024-01-01", "value": 1000}],
  "options": {
    "title": "Chart Title",
    "theme": "sentia|dark|light",
    "interactive": true
  }
}
```

### 3. Insights & Recommendations
**GET** `/analytics/insights`

Get AI-generated insights and recommendations.

**Query Parameters:**
- `category`: `all|financial|operational|customer`
- `timeframe`: `7d|30d|90d|365d`
- `priority`: `all|high|medium|low`

### 4. Predictive Forecasting
**POST** `/analytics/forecast`

Generate predictive forecasts using ML models.

```json
{
  "metric": "revenue|production|sales",
  "historicalData": [{"timestamp": "2024-01-01", "value": 1000}],
  "forecastHorizon": 12,
  "modelType": "arima|lstm|prophet|linear",
  "includeConfidenceIntervals": true
}
```

### 5. Alert Management
**GET** `/analytics/alerts` - List alerts  
**POST** `/analytics/alerts` - Create alert

**List Alerts Query Parameters:**
- `status`: `active|resolved|acknowledged`
- `priority`: `critical|high|medium|low`
- `category`: `financial|operational|customer`
- `limit`: `1-100` (default: 50)
- `offset`: `0+` (default: 0)

**Create Alert Body:**
```json
{
  "name": "Alert Name",
  "description": "Alert description",
  "metric": "revenue|production|efficiency",
  "condition": "greater_than|less_than|equals",
  "threshold": 50000,
  "priority": "critical|high|medium|low",
  "enabled": true,
  "notifications": ["email", "slack", "sms"]
}
```

### 6. Performance Metrics
**GET** `/analytics/performance`

Get analytics system performance metrics.

**Query Parameters:**
- `timeframe`: `1h|24h|7d|30d`

### 7. Data Export
**POST** `/analytics/export`

Export analytics data in various formats.

```json
{
  "dataType": "revenue|production|customers|comprehensive",
  "format": "json|csv|excel",
  "timeframe": "7d|30d|90d|365d",
  "filters": { "region": "US" },
  "includeVisualizations": false
}
```

## Response Format

All endpoints return JSON responses with consistent structure:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "status": "success|error",
  "data": { /* endpoint-specific data */ },
  "metadata": {
    "executionTime": 850,
    "recordCount": 1000,
    "confidence": 0.85
  },
  "errors": [ /* any errors */ ],
  "warnings": [ /* any warnings */ ]
}
```

## Error Handling

Standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

Error response format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Rate Limits

- **Default**: 100 requests per 15 minutes per user
- **Analytics Analysis**: 10 requests per hour for heavy computations
- **Visualizations**: 50 requests per hour
- **Alerts**: 20 requests per hour

## Examples

### Complete Analysis Workflow

```bash
# 1. Run comprehensive analysis
curl -X POST "https://your-server.com/api/dashboard/analytics/analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dataSource": "manufacturing",
    "analysisType": "comprehensive",
    "timeframe": "30d",
    "options": {
      "includeAnomalies": true,
      "includeTrends": true,
      "includeForecasts": true
    }
  }'

# 2. Generate visualization
curl -X POST "https://your-server.com/api/dashboard/analytics/visualize" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chartType": "line",
    "data": [
      {"timestamp": "2024-01-01", "value": 1000},
      {"timestamp": "2024-01-02", "value": 1200}
    ],
    "options": {
      "title": "Production Trend",
      "theme": "sentia",
      "interactive": true
    }
  }'

# 3. Get insights
curl "https://your-server.com/api/dashboard/analytics/insights?category=operational&priority=high" \
  -H "Authorization: Bearer <token>"

# 4. Create alert
curl -X POST "https://your-server.com/api/dashboard/analytics/alerts" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Low Production Alert",
    "metric": "production",
    "condition": "less_than",
    "threshold": 800,
    "priority": "high",
    "notifications": ["email", "slack"]
  }'
```

### Financial Analytics Example

```bash
# Analyze financial performance
curl -X POST "https://your-server.com/api/dashboard/analytics/analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dataSource": "financial",
    "analysisType": "financial",
    "timeframe": "90d",
    "options": {
      "includeForecasting": true,
      "includeProfitability": true,
      "includeKPIs": true
    }
  }'

# Generate revenue forecast
curl -X POST "https://your-server.com/api/dashboard/analytics/forecast" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "revenue",
    "historicalData": [
      {"timestamp": "2024-01-01", "value": 50000},
      {"timestamp": "2024-02-01", "value": 52000}
    ],
    "forecastHorizon": 6,
    "modelType": "arima",
    "includeConfidenceIntervals": true
  }'
```

### Customer Analytics Example

```bash
# Analyze customer data
curl -X POST "https://your-server.com/api/dashboard/analytics/analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dataSource": "customers",
    "analysisType": "customer",
    "timeframe": "180d",
    "options": {
      "includeSegmentation": true,
      "includeCLV": true,
      "includeChurn": true
    }
  }'

# Export customer segmentation report
curl -X POST "https://your-server.com/api/dashboard/analytics/export" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "customers",
    "format": "excel",
    "timeframe": "180d",
    "includeVisualizations": true
  }'
```

## SDK Usage (JavaScript)

```javascript
import { AnalyticsAPIClient } from './analytics-sdk.js';

const client = new AnalyticsAPIClient({
  baseURL: 'https://your-server.com',
  token: 'your-jwt-token'
});

// Run analysis
const analysis = await client.analyze({
  dataSource: 'manufacturing',
  analysisType: 'comprehensive',
  timeframe: '30d'
});

// Generate chart
const chart = await client.visualize({
  chartType: 'line',
  data: analysisData,
  options: { title: 'Production Trend', theme: 'sentia' }
});

// Get insights
const insights = await client.getInsights({
  category: 'operational',
  priority: 'high'
});
```

## Environment Configuration

Key environment variables for analytics API:

```bash
# Core Analytics
ANALYTICS_ENABLED=true
ADVANCED_ANALYTICS_ENABLED=true
FINANCIAL_ANALYTICS_ENABLED=true
OPERATIONAL_ANALYTICS_ENABLED=true
CUSTOMER_ANALYTICS_ENABLED=true
VISUALIZATION_ENABLED=true

# Performance
ANALYTICS_TIMEOUT=30000
ANALYTICS_MAX_WORKERS=4
VIZ_MAX_DATA_POINTS=10000

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Caching
ANALYTICS_CACHING_ENABLED=true
MEMORY_CACHE_MAX_SIZE=256mb
ANALYSIS_CACHE_TTL=1800000
```

---

For detailed documentation, configuration options, and implementation examples, see the complete [Advanced Analytics & Reporting Documentation](ADVANCED_ANALYTICS_REPORTING.md).