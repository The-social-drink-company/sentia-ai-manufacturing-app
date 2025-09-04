# Stock Level Optimization API Documentation

## Overview

The Stock Level Optimization API provides comprehensive inventory optimization capabilities including Economic Order Quantity (EOQ) calculations, safety stock optimization, constraint handling, multi-warehouse management, working capital planning, and CFO-level reporting.

## Features

- **Core Optimization**: EOQ, Safety Stock, and Reorder Point calculations
- **Constraint Handling**: MOQ, lot-size, capacity, and working capital constraints
- **Multi-Warehouse Support**: Cross-border optimization with FX and duty considerations
- **Working Capital Management**: Cash flow planning and constraint optimization
- **Job Management**: Asynchronous processing with queue management
- **Explainability**: Decision rationale and diagnostic reports
- **CFO Reporting**: Executive board packs and financial impact analysis

## Base URL

All API endpoints are prefixed with `/api/optimization`.

## Feature Flags

The API supports feature flags to enable/disable functionality:

- `FEATURE_MULTI_WAREHOUSE`: Multi-warehouse optimization endpoints
- `FEATURE_WC_OPTIMIZATION`: Working capital optimization endpoints  
- `FEATURE_CFO_REPORTS`: CFO reporting and board pack generation
- `FEATURE_DIAGNOSTICS`: Decision explanation and diagnostics

## Authentication

All endpoints require authentication via the application's standard authentication mechanism.

---

## Core Optimization Endpoints

### Optimize Single SKU

Optimizes a single SKU with constraint handling and decision explanation.

**Endpoint**: `POST /api/optimization/sku/optimize`

**Request Body**:
```json
{
  "sku": {
    "skuId": "SKU-12345",
    "annualDemand": 1200,
    "demandMean": 3.28,
    "demandStdDev": 1.2,
    "leadTimeDays": 14,
    "unitCost": 25.50,
    "unitPrice": 35.00,
    "holdingCostRate": 0.25,
    "orderingCost": 50,
    "moq": 100,
    "lotSize": 50,
    "serviceLevel": 0.98,
    "currentInventory": 150
  },
  "constraints": {
    "workingCapitalLimit": 50000,
    "maxOrderSize": 500
  },
  "demandHistory": [
    {
      "week": 1,
      "demand": 25,
      "date": "2024-01-01"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "skuId": "SKU-12345",
    "inputs": {
      "demandMeanDaily": 3.28,
      "demandStdDaily": 1.2,
      "leadTimeDays": 14,
      "serviceLevel": 0.98,
      "unitCost": 25.50,
      "holdingRate": 0.25,
      "moq": 100,
      "lotSize": 50
    },
    "calculations": {
      "eoq": 137,
      "safetyStock": 25,
      "rop": 65,
      "muLT": 46,
      "sigmaLT": 4.49
    },
    "outputs": {
      "recommendedOrderQty": 150,
      "recommendedOrderDate": "2024-02-15",
      "expectedStockoutRiskPct": 2.0,
      "projectedHoldingCost": 125.75
    },
    "adjustments": [
      {
        "constraint": "moq_constraint",
        "beforeQty": 137,
        "afterQty": 150,
        "reason": "Rounded up to meet MOQ of 100",
        "costImpact": 8.25
      }
    ],
    "riskFlags": ["high_variance"],
    "abcClass": "B",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "explanation": {
    "decisionSummary": {
      "plainLanguage": "For SKU SKU-12345, the optimization engine recommends ordering 150 units...",
      "keyMetrics": {
        "orderQuantity": 150,
        "serviceLevel": "98%",
        "stockoutRisk": "2.0%",
        "holdingCost": "£125.75",
        "orderDate": "2024-02-15"
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Optimize Batch of SKUs

Optimizes multiple SKUs with global constraints and ABC classification.

**Endpoint**: `POST /api/optimization/batch/optimize`

**Request Body**:
```json
{
  "skus": [
    {
      "skuId": "SKU-001",
      "annualDemand": 1200,
      "demandMean": 3.28,
      "demandStdDev": 1.2,
      "leadTimeDays": 14,
      "unitCost": 25.50,
      "unitPrice": 50.00,
      "serviceLevel": 0.98
    }
  ],
  "globalConstraints": {
    "workingCapitalLimit": 100000,
    "capacityLimit": 1000
  }
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "skuId": "SKU-001",
      "inputs": {},
      "calculations": {},
      "outputs": {},
      "abcClass": "A"
    }
  ],
  "summary": {
    "totalSKUs": 1,
    "ordersToPlace": 1,
    "deferredOrders": 0,
    "totalInvestment": 25000,
    "totalHoldingCost": 1500,
    "avgStockoutRisk": 2.5,
    "abcDistribution": {
      "A": 1,
      "B": 0,
      "C": 0
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "constraintsApplied": true
}
```

---

## Job Management Endpoints

### Create Optimization Job

Creates an asynchronous optimization job for long-running operations.

**Endpoint**: `POST /api/optimization/jobs/create`

**Request Body**:
```json
{
  "jobType": "BATCH_OPTIMIZATION",
  "payload": {
    "skus": [],
    "globalConstraints": {}
  },
  "options": {
    "priority": "HIGH",
    "maxRetries": 3,
    "timeout": 300000,
    "tags": ["monthly-optimization"]
  }
}
```

**Valid Job Types**:
- `SKU_OPTIMIZATION`: Single SKU optimization
- `BATCH_OPTIMIZATION`: Multiple SKU optimization  
- `MULTI_WAREHOUSE_OPTIMIZATION`: Multi-warehouse optimization
- `WC_ANALYSIS`: Working capital analysis
- `CFO_REPORT_GENERATION`: Board pack generation
- `DIAGNOSTICS_ANALYSIS`: Decision diagnostics

**Response**:
```json
{
  "success": true,
  "job": {
    "jobId": "OPT-1642248600000-abc123def",
    "status": "QUEUED",
    "estimatedDuration": 30
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Job Status

Retrieves the current status and results of a job.

**Endpoint**: `GET /api/optimization/jobs/{jobId}/status`

**Response**:
```json
{
  "success": true,
  "jobId": "OPT-1642248600000-abc123def",
  "type": "BATCH_OPTIMIZATION",
  "status": "COMPLETED",
  "progress": {
    "stage": "COMPLETED",
    "percentage": 100,
    "message": "Job completed successfully",
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:31:00Z"
  },
  "result": {
    "results": [],
    "summary": {},
    "metadata": {}
  },
  "metadata": {
    "createdAt": "2024-01-15T10:29:45Z",
    "createdBy": "user123",
    "estimatedDuration": 30
  },
  "timestamp": "2024-01-15T10:31:05Z"
}
```

### Cancel Job

Cancels a queued or running job.

**Endpoint**: `DELETE /api/optimization/jobs/{jobId}`

**Response**:
```json
{
  "success": true,
  "jobId": "OPT-1642248600000-abc123def",
  "status": "CANCELLED",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Queue Status

Returns the current job queue status and health metrics.

**Endpoint**: `GET /api/optimization/queue/status`

**Response**:
```json
{
  "success": true,
  "queue": {
    "queueLength": 5,
    "activeJobs": 2,
    "maxConcurrentJobs": 3,
    "nextJob": {
      "jobId": "OPT-1642248600000-def456ghi",
      "type": "SKU_OPTIMIZATION",
      "priority": "HIGH"
    }
  },
  "health": {
    "queueHealth": "HEALTHY",
    "activeJobs": 2,
    "successRate": 95.5,
    "averageProcessingTime": 25000,
    "lastProcessedJob": "2024-01-15T10:25:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Multi-Warehouse Endpoints

*Available when `FEATURE_MULTI_WAREHOUSE=true`*

### Multi-Warehouse Optimization

Optimizes inventory across multiple warehouses with cross-border considerations.

**Endpoint**: `POST /api/optimization/multi-warehouse/optimize`

**Request Body**:
```json
{
  "skus": [],
  "demandByRegion": {
    "uk": [],
    "eu": [],
    "usa": []
  },
  "constraints": {
    "uk": {
      "workingCapitalLimit": 50000
    },
    "eu": {
      "workingCapitalLimit": 40000
    },
    "usa": {
      "workingCapitalLimit": 60000
    }
  }
}
```

### Source Warehouse Selection

Selects optimal source warehouse for demand fulfillment.

**Endpoint**: `POST /api/optimization/multi-warehouse/source-selection`

**Request Body**:
```json
{
  "sku": {
    "skuId": "SKU-12345",
    "unitCost": 25.50,
    "productCategory": "tea_products",
    "leadTimeDays": 14,
    "demandForecast": 100
  },
  "demandRegion": "uk",
  "availableSources": [
    {
      "warehouse": "WH_UK_001",
      "region": "uk",
      "currency": "GBP"
    },
    {
      "warehouse": "WH_EU_001", 
      "region": "eu",
      "currency": "EUR"
    }
  ]
}
```

### Optimize Transfers

Optimizes inter-warehouse transfers to minimize costs and lead times.

**Endpoint**: `POST /api/optimization/multi-warehouse/transfers/optimize`

**Request Body**:
```json
{
  "transferRequests": [
    {
      "skuId": "SKU-12345",
      "fromWarehouse": {
        "region": "uk",
        "id": "WH_UK_001"
      },
      "toWarehouse": {
        "region": "eu",
        "id": "WH_EU_001"
      },
      "requiredQty": 100,
      "urgencyLevel": "normal",
      "unitPrice": 35.00
    }
  ]
}
```

### Get Warehouse Config

Returns warehouse configuration for a specific region.

**Endpoint**: `GET /api/optimization/multi-warehouse/config/{region}`

**Response**:
```json
{
  "success": true,
  "region": "uk",
  "config": {
    "locations": ["Manchester", "London", "Birmingham"],
    "totalCapacity": 150000,
    "currency": "GBP",
    "workingHours": 40,
    "peakSeasons": ["Q4", "Summer"]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Working Capital Endpoints

*Available when `FEATURE_WC_OPTIMIZATION=true`*

### Analyze Working Capital

Analyzes working capital requirements for an order plan.

**Endpoint**: `POST /api/optimization/working-capital/analyze`

**Request Body**:
```json
{
  "orderPlan": [
    {
      "orderId": "ORD-001",
      "skuId": "SKU-001",
      "quantity": 100,
      "unitCost": 25.50,
      "orderDate": "2024-02-01",
      "deliveryDate": "2024-02-15",
      "paymentTerms": 45,
      "customerTerms": 30,
      "turnoverDays": 45,
      "marginMultiplier": 1.3
    }
  ],
  "region": "uk"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "timeline": [
      {
        "date": "2024-02-01",
        "cumulativeWC": 2550,
        "utilizationPct": 1.275,
        "cashFlow": -2550,
        "exceedsLimit": false,
        "exceedsTarget": false
      }
    ],
    "violations": [],
    "peakUtilization": 87.5,
    "avgUtilization": 65.2
  },
  "kpis": {
    "peakUtilization": 87.5,
    "avgUtilization": 65.2,
    "utilizationTarget": 85.0,
    "violationDays": 0,
    "daysOutstanding": 30,
    "inventoryDays": 45,
    "cashConversionCycle": 30
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Optimize Payment Timing

Optimizes payment timing for early pay discounts.

**Endpoint**: `POST /api/optimization/working-capital/optimize-payments`

### Apply WC Constraints

Applies working capital constraints to defer orders when necessary.

**Endpoint**: `POST /api/optimization/working-capital/apply-constraints`

### Get WC Limits

Returns working capital limits for a region.

**Endpoint**: `GET /api/optimization/working-capital/limits/{region}`

---

## CFO Reporting Endpoints

*Available when `FEATURE_CFO_REPORTS=true`*

### Generate Board Pack

Generates comprehensive CFO board pack with executive insights.

**Endpoint**: `POST /api/optimization/reports/board-pack`

**Request Body**:
```json
{
  "optimizationData": [
    {
      "skuId": "SKU-001",
      "inputs": {},
      "calculations": {},
      "outputs": {},
      "abcClass": "A"
    }
  ],
  "period": "Q1-2024",
  "region": "ALL"
}
```

**Response**:
```json
{
  "success": true,
  "boardPack": {
    "executiveSummary": {
      "reportHeader": {
        "title": "Stock Optimization Executive Summary",
        "period": "Q1-2024",
        "region": "ALL",
        "generatedAt": "2024-01-15T10:30:00Z",
        "confidentiality": "BOARD CONFIDENTIAL"
      },
      "keyFindings": {
        "totalInvestment": "£1,250,000",
        "workingCapitalImpact": "£1,062,500",
        "riskReduction": "15%",
        "serviceLevel": "97.8%",
        "inventoryTurns": 6.2,
        "annualSavings": "£62,500"
      },
      "criticalIssues": [
        "Working capital utilization approaching 90% in EU region"
      ],
      "opportunities": [
        "Early payment discounts could save £45K annually"
      ]
    },
    "financialImpact": {},
    "strategicInsights": {},
    "riskAssessment": {},
    "operationalMetrics": {},
    "workingCapitalAnalysis": {},
    "recommendedActions": {},
    "appendices": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Export Board Pack

Exports board pack to various formats (PDF, Excel, PowerPoint).

**Endpoint**: `POST /api/optimization/reports/export`

**Request Body**:
```json
{
  "boardPack": {},
  "format": "pdf"
}
```

---

## Diagnostics Endpoints

*Available when `FEATURE_DIAGNOSTICS=true`*

### Explain Decision

Generates detailed explanation for an optimization decision.

**Endpoint**: `POST /api/optimization/diagnostics/explain`

**Request Body**:
```json
{
  "optimizationResult": {
    "skuId": "SKU-12345",
    "inputs": {},
    "calculations": {},
    "outputs": {},
    "adjustments": [],
    "riskFlags": [],
    "abcClass": "B"
  }
}
```

**Response**:
```json
{
  "success": true,
  "explanation": {
    "decisionSummary": {
      "plainLanguage": "For SKU SKU-12345, the optimization engine recommends...",
      "keyMetrics": {}
    },
    "mathematicalRationale": {
      "eoqCalculation": {
        "formula": "EOQ = √(2 × D × S / H)",
        "parameters": {},
        "result": "137 units"
      }
    },
    "constraintImpacts": {},
    "riskAnalysis": {},
    "alternativeScenarios": [],
    "sensitivityAnalysis": {},
    "businessJustification": {},
    "implementationGuidance": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Generate Diagnostic Report

Generates system-wide diagnostic report for optimization batch.

**Endpoint**: `POST /api/optimization/diagnostics/report`

### Get Decision History

Returns decision history for a specific SKU.

**Endpoint**: `GET /api/optimization/diagnostics/history/{skuId}?limit=10`

---

## System Endpoints

### Health Check

Returns system health and feature status.

**Endpoint**: `GET /api/optimization/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "features": {
    "multiWarehouse": true,
    "workingCapital": true,
    "cfoReports": true,
    "diagnostics": true
  },
  "jobManager": {
    "queueHealth": "HEALTHY",
    "activeJobs": 2,
    "successRate": 95.5
  }
}
```

### Version Information

Returns API version and capabilities.

**Endpoint**: `GET /api/optimization/version`

### Clear Cache

Clears optimization result cache.

**Endpoint**: `DELETE /api/optimization/cache`

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Authentication required
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server-side error
- `503`: Service Unavailable - Service temporarily unavailable

---

## Mathematical Formulas

### Economic Order Quantity (EOQ)
```
EOQ = √(2 × D × S / H)

Where:
- D = Annual demand (units/year)
- S = Setup/ordering cost per order (£)
- H = Holding cost per unit per year (£/unit/year)
```

### Safety Stock
```
Safety Stock = z × σ_LT

Where:
- z = Service level z-score (99% = 2.33, 98% = 2.05, 95% = 1.65)
- σ_LT = Standard deviation of demand during lead time

For multiplicative seasonality:
σ_LT = √(LT × σ²_daily × (1 + CV²_seasonal))
```

### Reorder Point (ROP)
```
ROP = μ_LT + Safety Stock

Where:
- μ_LT = Mean demand during lead time
- Safety Stock = Calculated safety buffer
```

---

## Rate Limits

- Standard endpoints: 100 requests/minute per user
- Job creation: 10 requests/minute per user
- Report generation: 5 requests/minute per user

---

## SDKs and Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const optimizationClient = axios.create({
  baseURL: 'https://api.example.com/api/optimization',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Optimize single SKU
const optimizeSKU = async (sku) => {
  try {
    const response = await optimizationClient.post('/sku/optimize', {
      sku,
      constraints: {},
      demandHistory: []
    });
    
    return response.data;
  } catch (error) {
    console.error('Optimization failed:', error.response.data);
    throw error;
  }
};

// Create batch optimization job
const createBatchJob = async (skus) => {
  try {
    const response = await optimizationClient.post('/jobs/create', {
      jobType: 'BATCH_OPTIMIZATION',
      payload: { skus },
      options: { priority: 'HIGH' }
    });
    
    return response.data.job.jobId;
  } catch (error) {
    console.error('Job creation failed:', error.response.data);
    throw error;
  }
};
```

### Python Example

```python
import requests
import json

class OptimizationClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def optimize_sku(self, sku, constraints=None, demand_history=None):
        url = f"{self.base_url}/api/optimization/sku/optimize"
        payload = {
            'sku': sku,
            'constraints': constraints or {},
            'demandHistory': demand_history or []
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def create_batch_job(self, skus):
        url = f"{self.base_url}/api/optimization/jobs/create"
        payload = {
            'jobType': 'BATCH_OPTIMIZATION',
            'payload': {'skus': skus},
            'options': {'priority': 'HIGH'}
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        return response.json()['job']['jobId']
```

---

## Support

For API support and questions:
- Documentation: [Internal Docs Portal]
- Support Email: support@company.com
- Slack Channel: #optimization-api