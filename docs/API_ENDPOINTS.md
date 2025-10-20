# CapLiquify Manufacturing Platform API Endpoints

**CRITICAL: NO MOCK DATA POLICY**
This API **NEVER** generates mock or fake data. All endpoints either:
1. Return real data from external APIs (Xero, Shopify, Unleashed) or database
2. Return detailed error responses explaining why data could not be retrieved

The example JSON structures below show response formats only - all actual values come from real data sources.

## Overview

The API follows a strict real-data-only strategy:
1. **Primary**: Real-time external API data (Xero, Shopify, Unleashed)
2. **Secondary**: Actual database historical data  
3. **No Fallback**: When real data is unavailable, return detailed error responses with debugging information

All endpoints return JSON responses with consistent error handling and detailed debugging information to aid in connecting real data sources.

## Authentication

Development mode bypasses authentication per CLAUDE.md requirements. Production uses Clerk authentication with Bearer tokens.

## Health & Status Endpoints

### GET /health
Application health check with actual system status.

**Response Structure Example** (actual values reflect real system state):
```json
{
  "status": "healthy",
  "service": "sentia-manufacturing-dashboard", 
  "version": "1.0.6",
  "environment": "development",
  "database": {
    "connected": true,
    "initialized": true,
    "status": "operational"
  }
}
```

### GET /api/services/status
Comprehensive service integration status endpoint showing real connection states.

**Response Structure Example** (all status values reflect actual service connections):
```json
{
  "success": true,
  "data": {
    "overall": "degraded|operational|configured|needs_configuration",
    "services": {
      "xero": {
        "name": "Xero Accounting API",
        "status": "connected|configured_not_connected|error|disabled",
        "configured": true,
        "connected": false
      },
      "amazon": {
        "name": "Amazon SP-API", 
        "status": "disabled",
        "note": "Temporarily disabled due to credential issues"
      }
    }
  }
}
```

## Financial Data Endpoints

### GET /api/financial/working-capital
**REAL DATA ONLY**: Attempts to retrieve actual working capital data from:
1. Xero API (real accounting data)
2. Database (actual historical transactions)
3. Error response (detailed debugging info)

**When Real Data Available** (values from actual Xero/database):
```json
{
  "success": true,
  "data": {
    "accountsReceivable": 120000,  // REAL VALUE from Xero
    "accountsPayable": 45000,      // REAL VALUE from Xero
    "inventoryValue": 85000,       // REAL VALUE from database
    "workingCapital": 160000       // CALCULATED from real data
  },
  "dataSource": "xero|database",
  "note": "Calculated from database records - may not reflect complete financial picture"
}
```

**When Real Data Unavailable** (503 error with debugging info):
```json
{
  "success": false,
  "requiresXeroConnection": true,
  "error": "Unable to retrieve working capital data from any source",
  "message": "Working capital analysis requires Xero connection for real-time financial data",
  "errors": [
    {
      "source": "xero",
      "error": "Xero service not initialized",
      "details": "xeroInitialized: false, xeroService: false"
    }
  ],
  "suggestions": [
    "Connect to Xero via the dashboard banner for real-time working capital data",
    "Ensure Xero API credentials are properly configured"
  ]
}
```

### GET /api/financial/cash-flow
**REAL DATA ONLY**: Attempts to calculate actual cash flow from:
1. Xero API (real cash flow statements)
2. Database (actual revenue and expense transactions)
3. Error response (detailed debugging info)

**When Real Data Available**:
```json
{
  "success": true,
  "data": {
    "operatingCashFlow": 850000,  // CALCULATED from real transactions
    "revenue": 1200000,           // REAL VALUE from orders table
    "expenses": 350000,           // REAL VALUE from expenses table
    "period": "30 days"
  },
  "dataSource": "database",
  "note": "Calculated from database transactions - may not include all cash flow components"
}
```

### GET /api/financial/pl-analysis
**REAL DATA ONLY**: P&L analysis requiring real Xero connection.

**Query Parameters:**
- `period`: "year" (default), "quarter", "month"

**When Xero Connected** (all values from actual Xero data):
```json
{
  "success": true,
  "data": {
    "revenue": {
      "totalRevenue": 2500000,    // REAL VALUE from Xero
      "productSales": 2300000     // REAL VALUE from Xero
    },
    "expenses": {
      "costOfGoodsSold": 1500000, // REAL VALUE from Xero
      "operatingExpenses": 600000 // REAL VALUE from Xero
    },
    "profit": {
      "grossProfit": 1000000,     // CALCULATED from real Xero data
      "grossMargin": 40.0         // CALCULATED from real Xero data
    }
  }
}
```

**When Xero Required**:
```json
{
  "success": false,
  "requiresXeroConnection": true,
  "message": "Real-time P&L analysis requires Xero connection",
  "authUrl": "/api/xero/auth"
}
```

### GET /api/financial/kpi-summary
**REAL DATA ONLY**: KPI summary from actual data sources.

**Response Example** (all values from real data or marked as unavailable):
```json
{
  "success": true,
  "data": {
    "totalRevenue": {
      "value": "£2.5M",              // REAL VALUE from Xero/Shopify
      "helper": "+15.2% vs last year" // CALCULATED from real historical data
    },
    "unitsSold": {
      "value": "N/A",                 // Honest indication when data unavailable
      "helper": "Xero integration required"
    },
    "grossMargin": {
      "value": "40.2%",               // REAL VALUE from Xero
      "helper": "Current period"
    }
  },
  "meta": {
    "dataSource": "xero|shopify|database|no-data",
    "sources": {
      "xero": true,                   // ACTUAL connection status
      "shopify": false,               // ACTUAL connection status
      "database": true                // ACTUAL connection status
    }
  }
}
```

## Sales & Product Endpoints

### GET /api/sales/product-performance
**REAL DATA ONLY**: Product sales from Shopify multi-store or database.

**Query Parameters:**
- `period`: "year" (default), "quarter", "month"

**When Real Data Available** (all values from actual Shopify/database):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 2500000,        // REAL SUM from order records
      "totalOrders": 1250,            // REAL COUNT from order records
      "averageOrderValue": 2000       // CALCULATED from real orders
    },
    "products": [
      {
        "id": "prod_123",              // REAL product ID from database
        "title": "GABA Premium",       // REAL product name from database
        "revenue": 450000,             // REAL revenue from order items
        "unitsSold": 225,              // REAL quantity from order items
        "growth": 12.5                 // CALCULATED from historical data
      }
    ]
  }
}
```

## Inventory Endpoints

### GET /api/inventory/levels
**REAL DATA ONLY**: Actual inventory levels from database.

**Query Parameters:**
- `category`: Filter by product category
- `limit`: Limit number of results

**Response** (all values from actual inventory records):
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_123",                // REAL inventory ID
      "productName": "GABA Premium",  // REAL product name from database
      "currentStock": 150,            // REAL stock level from inventory table
      "reorderLevel": 50,             // REAL reorder threshold from database
      "value": 15000                  // CALCULATED from real cost and quantity
    }
  ]
}
```

## Forecasting Endpoints

### GET /api/forecasting/enhanced
**REAL DATA ONLY**: Forecasting based on actual historical data.

**When Historical Data Available** (trends calculated from real data):
```json
{
  "success": true,
  "forecast": {
    "basedOn": "historical_data",
    "dataPoints": 12,               // ACTUAL number of data points found
    "note": "Forecast calculated from actual historical revenue data"
  },
  "data": [
    {
      "date": "2025-01-01T00:00:00.000Z",
      "revenue": 2500000             // REAL historical revenue value
    }
  ],
  "dataSource": "database"
}
```

**When No Data Available**:
```json
{
  "success": false,
  "error": "Unable to generate forecasting data from any source",
  "errors": [
    {
      "source": "database",
      "error": "No historical data available"
    }
  ],
  "suggestions": [
    "Add historical sales data to database",
    "Connect Shopify for sales trend analysis"
  ]
}
```

## Xero Integration Endpoints

### GET /api/xero/auth
Initiates real Xero OAuth flow.

### GET /api/xero/status
Check actual Xero connection status.

**Response** (reflects real connection state):
```json
{
  "success": true,
  "status": {
    "connected": true,                    // REAL connection status
    "organizationId": "org_123",          // REAL Xero organization ID
    "organizationName": "Company Ltd",    // REAL organization name from Xero
    "lastSync": "2025-01-15T10:30:00.000Z" // REAL last sync timestamp
  }
}
```

## Error Response Format

All error responses provide real debugging information:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "timestamp": "2025-01-15T10:30:00.000Z",  // REAL timestamp
  "debugInfo": {
    "xeroInitialized": false,              // REAL service status
    "databaseAvailable": true,             // REAL database status
    "requestPath": "/api/endpoint"         // REAL request path
  },
  "suggestions": [
    "Connect to Xero for real-time data",
    "Check database connection"
  ]
}
```

## Data Sources Priority

1. **Xero**: Real-time accounting and financial data (when connected)
2. **Shopify**: Multi-store sales and product data (when connected)  
3. **Database**: Historical data from actual transactions (when available)
4. **Error Response**: Detailed debugging information when no real data sources available

## Key Principles

- **No Mock Data**: System never generates fake or sample data
- **Real Data Only**: All displayed values come from actual data sources
- **Transparent Errors**: When data unavailable, provide clear explanation why
- **Connection Guidance**: Error responses include actionable steps to connect real data sources
- **Development Mode**: Authentication bypass only - data retrieval still requires real connections

---

*Last Updated: January 15, 2025*
*API Version: 1.0.6*
*Environment: Development*
*Data Policy: Real data only - no mock data generation*