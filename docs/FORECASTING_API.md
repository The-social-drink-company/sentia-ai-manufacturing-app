# Enhanced Demand Forecasting API Documentation

## Overview

The Enhanced Demand Forecasting API provides surgical improvements to the existing Node.js forecasting service with rigorous backtesting, ensemble models, FX-aware capabilities, and CFO-ready analytics.

## Key Features

- **Model Portfolio**: SMA, Holt-Winters, ARIMA, Linear Regression with ensemble weighting
- **Rolling-Origin Backtesting**: K-fold cross-validation with configurable parameters
- **Prediction Intervals**: Calibrated intervals with coverage tracking
- **FX-Aware Forecasting**: Multi-currency support with scenario analysis
- **Regional Calendar Support**: UK/EU/USA seasonal adjustments and holiday impacts
- **Performance Optimizations**: Caching, batching, and concurrent processing
- **CFO Analytics**: Executive dashboards and board pack generation
- **Real-time Updates**: Server-sent events for job progress tracking

## Base URL

```
/api
```

## Core Forecasting Endpoints

### Generate Forecast

**POST** `/forecast`

Generate a forecast job with idempotency support.

**Request Body:**
```json
{
  "series_filter": {
    "series_ids": ["series-1", "series-2"]
  },
  "horizon": 30,
  "models": ["Ensemble", "ARIMA", "HoltWinters"],
  "currency_mode": "local",
  "fx_scenario": {
    "type": "stress_up",
    "shock": 15
  },
  "scenario_config": {
    "region": "UK",
    "apply_adjustments": true
  },
  "feature_flags": {
    "FEATURE_FX_FORECAST": true,
    "FEATURE_CFO_EXPORTS": true
  }
}
```

**Headers:**
- `idempotent-key` (optional): Custom key for request deduplication

**Response:**
```json
{
  "success": true,
  "jobId": "abc123...",
  "status": "QUEUED",
  "message": "Forecast job queued successfully"
}
```

### Get Job Status

**GET** `/forecast/jobs/{jobId}`

Retrieve the status of a forecast job.

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "abc123...",
    "status": "COMPLETED",
    "progress": 100,
    "createdAt": "2024-01-01T10:00:00Z",
    "completedAt": "2024-01-01T10:05:00Z"
  }
}
```

### Get Job Results

**GET** `/forecast/jobs/{jobId}/results`

Retrieve the results of a completed forecast job.

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "abc123...",
    "status": "COMPLETED"
  },
  "results": {
    "forecasts": [
      {
        "seriesId": "series-1",
        "forecasts": {
          "Ensemble": [100.5, 102.1, 98.7, ...],
          "ARIMA": [99.8, 101.5, 97.2, ...],
          "HoltWinters": [101.2, 103.8, 99.1, ...]
        },
        "predictionIntervals": {
          "Ensemble": {
            "lower": [95.2, 96.8, 93.1, ...],
            "upper": [105.8, 107.4, 104.3, ...],
            "targetCoverage": 0.95,
            "achievedCoverage": 0.93
          }
        },
        "backtestMetrics": {
          "Ensemble": {
            "mape": 12.5,
            "rmse": 8.7,
            "mae": 6.2
          }
        },
        "ensembleWeights": {
          "ARIMA": 0.45,
          "HoltWinters": 0.35,
          "Linear": 0.20
        },
        "metadata": {
          "dataPoints": 180,
          "backtestFolds": 5,
          "horizon": "30 days",
          "region": "UK",
          "baseCurrency": "GBP"
        }
      }
    ]
  }
}
```

### Cancel Job

**POST** `/forecast/jobs/{jobId}/cancel`

Cancel a queued or running forecast job.

**Response:**
```json
{
  "success": true,
  "jobId": "abc123...",
  "message": "Job cancelled successfully"
}
```

## Diagnostics Endpoints

### Series Diagnostics

**GET** `/forecast/series/{seriesId}/diagnostics`

Get comprehensive diagnostics for a time series.

**Query Parameters:**
- `models` (optional): Comma-separated list of models to analyze

**Response:**
```json
{
  "success": true,
  "diagnostics": {
    "seriesId": "series-1",
    "dataQuality": {
      "overall": 0.85,
      "scores": {
        "completeness": 0.95,
        "recency": 0.80,
        "consistency": 0.88,
        "stability": 0.77
      },
      "issues": {
        "missingValues": 3,
        "consecutiveZeros": {"maxConsecutive": 2, "totalZeros": 5},
        "outliers": {"count": 4, "percentage": 2.2},
        "daysSinceLastUpdate": 1
      }
    },
    "backtestSummary": {
      "folds": 5,
      "bestModel": "ARIMA",
      "metrics": {
        "ARIMA": {"mape": 15.2, "rmse": 12.8},
        "Ensemble": {"mape": 12.7, "rmse": 10.5}
      }
    }
  }
}
```

### Data Quality Assessment

**POST** `/forecast/data-quality`

Assess data quality for multiple series.

**Request Body:**
```json
{
  "series_ids": ["series-1", "series-2", "series-3"]
}
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "seriesId": "series-1",
      "dataQuality": { /* quality metrics */ },
      "outliers": { /* outlier analysis */ },
      "status": "analyzed"
    }
  ],
  "summary": {
    "totalSeries": 3,
    "analyzed": 3,
    "errors": 0
  }
}
```

### Model Diagnostics

**GET** `/forecast/models/{modelType}/diagnostics`

Get detailed diagnostics for a specific model type.

**Query Parameters:**
- `seriesId` (required): Series ID to analyze

**Supported Models:** `SMA`, `HoltWinters`, `ARIMA`, `Linear`

**Response:**
```json
{
  "success": true,
  "model": "ARIMA",
  "seriesId": "series-1",
  "diagnostics": {
    "arCoefficients": [0.7, -0.2],
    "maCoefficients": [0.3],
    "intercept": 0.05,
    "residualMean": 0.01,
    "residualStd": 5.2,
    "parameters": {
      "p": 2,
      "d": 1,
      "q": 1,
      "type": "ARIMA"
    }
  }
}
```

## CFO Workbench Endpoints

### Generate Board Pack

**POST** `/cfo/board-pack`

Generate a comprehensive CFO board pack with executive metrics.

**Request Body:**
```json
{
  "series_ids": ["series-1", "series-2"],
  "reporting_currency": "GBP",
  "regions": ["UK", "EU", "USA"],
  "horizons": [30, 90, 180, 365],
  "include_scenarios": true,
  "include_risk_metrics": true
}
```

**Response:**
```json
{
  "success": true,
  "boardPack": {
    "executiveSummary": {
      "consolidated": {
        "baselineRevenue": 12500000,
        "upsideRevenue": 14000000,
        "downsideRevenue": 11000000,
        "totalVolatility": 24.0,
        "revenueAtRisk": 1500000,
        "confidenceInterval": 0.95
      },
      "byRegion": [
        {
          "region": "UK",
          "metrics": {
            "baselineRevenue": 7500000,
            "volatility": 18.5,
            "upside": 12.0,
            "downside": 8.0
          }
        }
      ],
      "keyInsights": [
        "UK is the top-performing region with 7.5M baseline revenue",
        "USA shows highest volatility at 32.1%"
      ]
    },
    "scenarioAnalysis": {
      "baseCase": {
        "description": "Current market conditions",
        "results": {
          "UK": {"totalRevenue": 7500000},
          "EU": {"totalRevenue": 3200000},
          "USA": {"totalRevenue": 1800000}
        }
      },
      "bullCase": {
        "description": "15% favorable market shift",
        "results": {
          "UK": {"totalRevenue": 8625000},
          "EU": {"totalRevenue": 3680000},
          "USA": {"totalRevenue": 2070000}
        }
      }
    },
    "recommendedActions": [
      {
        "category": "Revenue Management",
        "priority": "High",
        "action": "Implement revenue diversification strategy",
        "rationale": "High volatility (24.0%) indicates concentrated risk",
        "impact": "Reduce revenue volatility by 15-25%",
        "timeframe": "6-12 months"
      }
    ]
  }
}
```

### Scenario Analysis

**POST** `/cfo/scenario-analysis`

Generate detailed scenario analysis for a series.

**Request Body:**
```json
{
  "series_id": "series-1",
  "regions": ["UK", "EU", "USA"],
  "target_currency": "USD",
  "base_currency": "GBP",
  "horizon": 90
}
```

### FX Rates and Scenarios

**GET** `/cfo/fx-rates`

Get FX rates and scenario analysis.

**Query Parameters:**
- `base_currency`: Base currency (default: GBP)
- `target_currencies`: Comma-separated target currencies (default: EUR,USD)
- `scenarios`: Comma-separated scenarios (default: base,stress_up,stress_down)

**Response:**
```json
{
  "success": true,
  "baseCurrency": "GBP",
  "fxScenarios": {
    "base": {
      "EUR": 1.1650,
      "USD": 1.2450
    },
    "stress_up": {
      "EUR": 1.2815,
      "USD": 1.3695
    },
    "stress_down": {
      "EUR": 1.0485,
      "USD": 1.1205
    }
  },
  "generatedAt": "2024-01-01T10:00:00Z"
}
```

### Regional Events

**GET** `/cfo/regional-events`

Get regional calendar events that may impact forecasts.

**Query Parameters:**
- `region`: Region code (UK, EU, USA)
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `high_impact_only`: Filter for high-impact events only (true/false)

**Response:**
```json
{
  "success": true,
  "region": "UK",
  "events": [
    {
      "name": "dry_january",
      "period": "January",
      "impact": "+45%",
      "type": "wellness",
      "category": "period"
    },
    {
      "name": "mental_health_awareness_week",
      "period": "May",
      "impact": "+15%",
      "type": "awareness",
      "category": "period"
    }
  ],
  "highImpactOnly": false
}
```

## Accuracy Dashboard Endpoints

### Generate Accuracy Dashboard

**POST** `/accuracy/dashboard`

Generate comprehensive accuracy metrics dashboard.

**Request Body:**
```json
{
  "series_ids": ["series-1", "series-2"],
  "regions": ["UK", "EU", "USA"],
  "models": ["Ensemble", "ARIMA", "HoltWinters", "Linear"],
  "horizons": [7, 30, 90],
  "include_trends": true,
  "include_alerts": true
}
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "overview": {
      "totalSeries": 2,
      "avgMAPE": 15.7,
      "avgRMSE": 12.3,
      "bestModel": "Ensemble",
      "worstModel": "Linear",
      "overallHealth": "Good"
    },
    "modelPerformance": {
      "Ensemble": {
        "avgMAPE": 12.5,
        "avgRMSE": 9.8,
        "successRate": 98.5,
        "bestRegion": "UK",
        "worstRegion": "USA"
      }
    },
    "predictionIntervalCoverage": {
      "overall": {
        "targetCoverage": 0.95,
        "actualCoverage": 0.93,
        "coverageRatio": 0.98
      }
    },
    "alerts": [
      {
        "level": "Warning",
        "category": "Model Performance",
        "message": "Linear model MAPE (28.5%) is above critical threshold",
        "recommendation": "Consider replacing or retraining Linear model",
        "timestamp": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

### Model Performance Comparison

**GET** `/accuracy/model-performance`

Compare performance across different models.

**Query Parameters:**
- `series_ids` (required): Comma-separated series IDs
- `models`: Comma-separated model names
- `regions`: Comma-separated regions

### Accuracy Trends

**GET** `/accuracy/trends`

Get historical accuracy trends over time.

**Query Parameters:**
- `days`: Number of days to analyze (default: 90)

**Response:**
```json
{
  "success": true,
  "trends": {
    "mapeByWeek": [
      {"week": 1, "mape": 18.5, "date": "2024-01-01"},
      {"week": 2, "mape": 16.2, "date": "2024-01-08"}
    ],
    "coverageByWeek": [
      {"week": 1, "coverage": 0.94, "date": "2024-01-01"},
      {"week": 2, "coverage": 0.96, "date": "2024-01-08"}
    ],
    "trendAnalysis": {
      "mapeDirection": "Improving",
      "mapeChange": -8.5,
      "recommendation": "Performance is stable"
    }
  }
}
```

### Update Accuracy History

**POST** `/accuracy/update`

Update accuracy history with actual vs forecast values for real-time tracking.

**Request Body:**
```json
{
  "series_id": "series-1",
  "actual_values": [100, 105, 102, 108],
  "forecast_values": [98, 107, 100, 110],
  "metadata": {
    "model": "Ensemble",
    "region": "UK",
    "forecast_date": "2024-01-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "seriesId": "series-1",
  "accuracy": {
    "mape": 4.8,
    "mae": 3.5,
    "rmse": 4.2,
    "mse": 17.5
  },
  "message": "Accuracy history updated successfully"
}
```

## Real-time Updates

### Server-Sent Events

**GET** `/events`

Establish SSE connection for real-time job updates.

**Headers:**
- `Accept: text/event-stream`

**Event Types:**
- `job.forecast.statusChanged`: Job status updates
- `job.forecast.progress`: Job progress updates
- `connected`: Initial connection confirmation

**Example Event:**
```
data: {"type":"job.forecast.progress","jobId":"abc123","progress":75,"timestamp":"2024-01-01T10:00:00Z"}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "details": "Additional error details"
}
```

**HTTP Status Codes:**
- `200`: Success
- `202`: Accepted (for async operations)
- `400`: Bad Request (validation errors)
- `404`: Not Found (job or resource not found)
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to ensure system stability:
- General endpoints: 100 requests per minute
- Heavy computation endpoints: 10 requests per minute

## Feature Flags

The system supports feature flags for gradual rollout:
- `FEATURE_FX_FORECAST`: Enable FX-aware forecasting
- `FEATURE_CFO_EXPORTS`: Enable CFO analytics features
- `FEATURE_ENHANCED_MODELS`: Enable advanced model features

## Authentication

All endpoints require authentication. Include the authorization token in the request header:
```
Authorization: Bearer <your-token>
```

## SDK Examples

### JavaScript/Node.js

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': 'Bearer your-token-here'
  }
});

// Generate forecast
const { data } = await api.post('/forecast', {
  series_filter: { series_ids: ['series-1'] },
  horizon: 30,
  models: ['Ensemble']
});

console.log('Job ID:', data.jobId);

// Check job status
const status = await api.get(`/forecast/jobs/${data.jobId}`);
console.log('Status:', status.data.job.status);

// Get results when completed
if (status.data.job.status === 'COMPLETED') {
  const results = await api.get(`/forecast/jobs/${data.jobId}/results`);
  console.log('Forecast:', results.data.results.forecasts[0].forecasts.Ensemble);
}
```

### Python

```python
import requests
import time

api_base = 'http://localhost:5000/api'
headers = {'Authorization': 'Bearer your-token-here'}

# Generate forecast
response = requests.post(f'{api_base}/forecast', 
  headers=headers,
  json={
    'series_filter': {'series_ids': ['series-1']},
    'horizon': 30,
    'models': ['Ensemble']
  }
)

job_id = response.json()['jobId']
print(f'Job ID: {job_id}')

# Poll for completion
while True:
    status_response = requests.get(f'{api_base}/forecast/jobs/{job_id}', headers=headers)
    status = status_response.json()['job']['status']
    
    if status == 'COMPLETED':
        break
    elif status == 'FAILED':
        print('Job failed')
        break
        
    time.sleep(5)

# Get results
results_response = requests.get(f'{api_base}/forecast/jobs/{job_id}/results', headers=headers)
forecasts = results_response.json()['results']['forecasts'][0]['forecasts']['Ensemble']
print(f'Forecast values: {forecasts[:5]}...')  # First 5 values
```

## Performance Considerations

- **Caching**: Forecast results are cached for 30 minutes by default
- **Batching**: Multiple series can be processed in batches for efficiency
- **Concurrent Processing**: Up to 3 forecast jobs run concurrently
- **Memory Management**: Large result sets are paginated and streamed
- **Database Connection Pooling**: Optimized for high-concurrency scenarios

## Monitoring and Observability

The system provides comprehensive monitoring capabilities:
- Job execution metrics and timing
- Model accuracy tracking over time  
- Cache hit/miss ratios
- API request patterns and performance
- Error rates and failure analysis

For operational monitoring, check the `/api/metrics` endpoint for Prometheus-compatible metrics.