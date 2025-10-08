# Advanced Analytics & Reporting System (Phase 5.2)

## Overview

The Advanced Analytics & Reporting system represents a comprehensive enterprise-grade analytics platform built specifically for manufacturing intelligence. This system provides real-time data processing, predictive analytics, interactive visualizations, and automated reporting capabilities designed to optimize manufacturing operations, financial performance, and customer relationships.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Analytics Modules](#analytics-modules)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Installation & Setup](#installation--setup)
- [Usage Examples](#usage-examples)
- [Performance & Scalability](#performance--scalability)
- [Security & Compliance](#security--compliance)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

The Advanced Analytics & Reporting system follows a modular, event-driven architecture that integrates seamlessly with the existing MCP server infrastructure.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard Frontend                          │
├─────────────────────────────────────────────────────────────────┤
│                    Dashboard API Layer                          │
│  /api/dashboard/analytics/*  (JWT Authentication)               │
├─────────────────────────────────────────────────────────────────┤
│                  Analytics Engine Layer                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Advanced        │ │ Visualization   │ │ Alert Engine    │   │
│  │ Analytics       │ │ Engine          │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                  Specialized Analytics                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Financial       │ │ Operational     │ │ Customer        │   │
│  │ Analytics       │ │ Analytics       │ │ Analytics       │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Data & Cache Layer                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ PostgreSQL      │ │ Redis Cache     │ │ Memory Cache    │   │
│  │ (with pgvector) │ │ (Optional)      │ │ (Default)       │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Modular Design**: Each analytics component operates independently while sharing common infrastructure
2. **Event-Driven**: Real-time processing using EventEmitter pattern for scalable data streaming
3. **Multi-Level Caching**: Memory, Redis, and database caching for optimal performance
4. **Microservice Ready**: Designed for easy separation into dedicated analytics microservices
5. **Enterprise Security**: JWT authentication, role-based access control, and audit logging

## Core Components

### 1. Advanced Analytics Engine (`src/utils/analytics.js`)

The core analytics engine providing comprehensive data analysis capabilities.

**Key Features:**
- Real-time stream processing
- Predictive analytics with ML models
- Anomaly detection and pattern recognition
- Trend analysis and correlation detection
- Multi-model forecasting (ARIMA, LSTM, Prophet, Linear)

**Usage:**
```javascript
import { AdvancedAnalytics } from '../utils/analytics.js';

const analytics = new AdvancedAnalytics({
  enableRealTimeProcessing: true,
  enablePredictiveAnalytics: true,
  enableAnomalyDetection: true
});

// Run comprehensive analysis
const result = await analytics.runComprehensiveAnalysis(data, {
  analysisId: 'manufacturing-001',
  includeAnomalies: true,
  includeTrends: true,
  includeForecasts: true
});
```

### 2. Visualization Engine (`src/utils/visualization.js`)

Enterprise-grade visualization system with interactive charting capabilities.

**Supported Chart Types:**
- Line charts (time series, multi-series)
- Bar charts (vertical, horizontal, stacked)
- Pie charts (with labels and percentages)
- Scatter plots (correlation analysis)
- Heatmaps (performance matrices)
- Area charts (trend visualization)
- Candlestick charts (financial data)
- Histograms (distribution analysis)

**Features:**
- Real-time data updates
- Interactive tooltips and zoom
- Theme support (Sentia, Dark, Light, Custom)
- Export formats (SVG, PNG, PDF, JSON)
- Accessibility compliance
- Mobile-responsive design

### 3. Advanced Alert Engine (`src/utils/advanced-alerts.js`)

Intelligent alerting system with ML-based anomaly detection.

**Alert Types:**
- Threshold-based alerts
- Anomaly detection alerts
- Predictive alerts
- Trend-based warnings
- Correlation alerts

**Notification Channels:**
- Email notifications
- Slack integration
- SMS alerts (Twilio)
- Webhook callbacks
- Dashboard notifications

### 4. Reporting System (`src/routes/reports.js`)

Automated report generation and distribution system.

**Report Types:**
- Executive dashboards
- Financial reports
- Operational reports
- Quality reports
- Custom reports

**Features:**
- Scheduled report generation
- Multi-format export (PDF, Excel, CSV)
- Template customization
- Automated distribution
- Report versioning

## Analytics Modules

### Financial Analytics (`src/utils/financial-analytics.js`)

Comprehensive financial analysis and forecasting capabilities.

**Core Functions:**
- Revenue analysis and growth tracking
- Profitability analysis (gross, operating, net margins)
- Cash flow forecasting
- Customer Lifetime Value (CLV) calculation
- Working capital optimization
- Financial KPI tracking and benchmarking

**Key Metrics:**
```javascript
// Example financial KPIs calculated
{
  grossProfitMargin: 0.65,
  operatingProfitMargin: 0.20,
  netProfitMargin: 0.15,
  currentRatio: 2.0,
  quickRatio: 1.33,
  inventoryTurnover: 4.8,
  receivablesTurnover: 15.0,
  debtToEquityRatio: 0.6
}
```

### Operational Analytics (`src/utils/operational-analytics.js`)

Manufacturing operations optimization and efficiency analysis.

**Core Functions:**
- OEE (Overall Equipment Effectiveness) calculation
- Production efficiency analysis
- Inventory optimization (ABC/XYZ analysis)
- Quality control and SPC analysis
- Supply chain analytics
- Bottleneck identification

**OEE Calculation:**
```javascript
// OEE = Availability × Performance × Quality
const oee = {
  availability: (plannedTime - downtime) / plannedTime,
  performance: actualOutput / targetOutput,
  quality: goodProduction / actualProduction,
  overall: availability × performance × quality
};
```

### Customer Analytics (`src/utils/customer-analytics.js`)

Advanced customer intelligence and segmentation analysis.

**Core Functions:**
- RFM segmentation analysis
- Customer Lifetime Value (CLV) calculation
- Churn prediction and prevention
- Customer behavior analysis
- Cohort analysis and retention tracking

**RFM Segmentation:**
- **Recency**: How recently did the customer purchase?
- **Frequency**: How often do they purchase?
- **Monetary**: How much do they spend?

## API Endpoints

### Analytics Analysis
```http
POST /api/dashboard/analytics/analyze
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "dataSource": "manufacturing",
  "analysisType": "comprehensive",
  "timeframe": "30d",
  "filters": {
    "productLine": "A",
    "region": "US"
  },
  "options": {
    "includeAnomalies": true,
    "includeTrends": true,
    "includeForecasts": true
  }
}
```

### Visualization Generation
```http
POST /api/dashboard/analytics/visualize
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "chartType": "line",
  "data": [
    {"timestamp": "2024-01-01", "value": 1000},
    {"timestamp": "2024-01-02", "value": 1200}
  ],
  "options": {
    "title": "Revenue Trend",
    "theme": "sentia",
    "interactive": true
  }
}
```

### Predictive Forecasting
```http
POST /api/dashboard/analytics/forecast
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "metric": "revenue",
  "historicalData": [...],
  "forecastHorizon": 12,
  "modelType": "arima",
  "includeConfidenceIntervals": true
}
```

### Alert Management
```http
GET /api/dashboard/analytics/alerts?status=active&priority=high
Authorization: Bearer <jwt-token>

POST /api/dashboard/analytics/alerts
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "name": "High Revenue Alert",
  "metric": "revenue",
  "condition": "greater_than",
  "threshold": 50000,
  "priority": "medium"
}
```

### Performance Metrics
```http
GET /api/dashboard/analytics/performance?timeframe=24h
Authorization: Bearer <jwt-token>
```

### Data Export
```http
POST /api/dashboard/analytics/export
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "dataType": "revenue",
  "format": "json",
  "timeframe": "30d",
  "includeVisualizations": false
}
```

### Insights & Recommendations
```http
GET /api/dashboard/analytics/insights?category=financial&priority=high
Authorization: Bearer <jwt-token>
```

## Configuration

The analytics system is highly configurable through environment variables and the centralized configuration system.

### Key Configuration Sections

```javascript
// Analytics configuration in server-config.js
analytics: {
  enabled: true,
  
  advancedAnalytics: {
    enableRealTimeProcessing: true,
    enablePredictiveAnalytics: true,
    enableAnomalyDetection: true,
    processing: {
      batchSize: 1000,
      maxMemoryUsage: 512,
      timeout: 30000
    }
  },
  
  visualization: {
    enableInteractivity: true,
    enableRealTimeUpdates: true,
    defaultTheme: 'sentia',
    performance: {
      maxDataPoints: 10000,
      renderTimeout: 30000
    }
  },
  
  caching: {
    enabled: true,
    levels: {
      memory: { enabled: true, maxSize: '256mb', ttl: 300000 },
      redis: { enabled: false, ttl: 3600000 },
      database: { enabled: false, ttl: 86400000 }
    }
  }
}
```

### Environment Variables

**Core Analytics:**
- `ANALYTICS_ENABLED`: Enable/disable analytics globally
- `ADVANCED_ANALYTICS_ENABLED`: Enable advanced analytics engine
- `ENABLE_REALTIME_PROCESSING`: Enable real-time data processing
- `ENABLE_PREDICTIVE_ANALYTICS`: Enable predictive capabilities
- `ENABLE_ANOMALY_DETECTION`: Enable anomaly detection

**Machine Learning:**
- `ML_ANOMALY_DETECTION_ENABLED`: Enable ML-based anomaly detection
- `ANOMALY_DETECTION_ALGORITHM`: Algorithm choice (isolation_forest, etc.)
- `DEFAULT_FORECASTING_MODEL`: Default ML model (arima, lstm, prophet)
- `FORECASTING_MODELS`: Available models (comma-separated)

**Financial Analytics:**
- `FINANCIAL_ANALYTICS_ENABLED`: Enable financial analytics
- `DEFAULT_CURRENCY`: Default currency (USD, EUR, etc.)
- `ENABLE_MULTI_CURRENCY`: Enable multi-currency support
- `GROSS_MARGIN_WARNING_THRESHOLD`: Warning threshold for gross margin

**Operational Analytics:**
- `OPERATIONAL_ANALYTICS_ENABLED`: Enable operational analytics
- `OEE_CALCULATION_ENABLED`: Enable OEE calculations
- `OEE_AVAILABILITY_TARGET`: Target availability percentage
- `OEE_PERFORMANCE_TARGET`: Target performance percentage
- `OEE_QUALITY_TARGET`: Target quality percentage

**Visualization:**
- `VISUALIZATION_ENABLED`: Enable visualization engine
- `INTERACTIVE_VISUALIZATIONS`: Enable interactive features
- `DEFAULT_VISUALIZATION_THEME`: Default theme (sentia, dark, light)
- `VIZ_MAX_DATA_POINTS`: Maximum data points per visualization

**Caching:**
- `ANALYTICS_CACHING_ENABLED`: Enable analytics caching
- `MEMORY_CACHE_ENABLED`: Enable memory caching
- `REDIS_CACHE_ENABLED`: Enable Redis caching
- `ANALYSIS_CACHE_TTL`: Cache TTL for analysis results

## Installation & Setup

### Prerequisites
- Node.js v18+
- PostgreSQL with pgvector extension
- Redis (optional, for enhanced caching)

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**
```bash
# Copy template and configure
cp .env.template .env

# Key analytics settings
ANALYTICS_ENABLED=true
ADVANCED_ANALYTICS_ENABLED=true
ENABLE_REALTIME_PROCESSING=true
ENABLE_PREDICTIVE_ANALYTICS=true
FINANCIAL_ANALYTICS_ENABLED=true
OPERATIONAL_ANALYTICS_ENABLED=true
CUSTOMER_ANALYTICS_ENABLED=true
VISUALIZATION_ENABLED=true
```

3. **Database Setup**
```sql
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Analytics cache table (if database caching is enabled)
CREATE TABLE IF NOT EXISTS analytics_cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB
);
```

4. **Start the Server**
```bash
npm start
```

5. **Verify Installation**
```bash
# Check health endpoint
curl http://localhost:3001/health

# Check analytics endpoints
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/dashboard/analytics/performance
```

## Usage Examples

### Basic Analytics Analysis

```javascript
import { AdvancedAnalytics } from './src/utils/analytics.js';

const analytics = new AdvancedAnalytics();

// Analyze manufacturing data
const manufacturingData = [
  { timestamp: '2024-01-01', production: 1000, efficiency: 0.85 },
  { timestamp: '2024-01-02', production: 1200, efficiency: 0.88 },
  // ... more data
];

const analysis = await analytics.runComprehensiveAnalysis(manufacturingData, {
  analysisId: 'daily-production',
  includeAnomalies: true,
  includeTrends: true
});

console.log('Analysis Results:', analysis);
```

### Financial Analytics

```javascript
import { FinancialAnalytics } from './src/utils/financial-analytics.js';

const financialAnalytics = new FinancialAnalytics();

// Analyze revenue trends
const revenueData = [
  { month: '2024-01', revenue: 100000, costs: 70000 },
  { month: '2024-02', revenue: 110000, costs: 75000 },
  // ... more data
];

const financialAnalysis = await financialAnalytics.analyzeFinancialData({
  revenue: revenueData
});

console.log('Financial KPIs:', financialAnalysis.kpis);
console.log('Profitability:', financialAnalysis.profitability);
```

### Operational Analytics

```javascript
import { OperationalAnalytics } from './src/utils/operational-analytics.js';

const operationalAnalytics = new OperationalAnalytics();

// Calculate OEE
const productionData = {
  equipment: [
    {
      id: 'PROD001',
      plannedTime: 480,
      downtime: 30,
      actualProduction: 95,
      targetProduction: 100,
      goodProduction: 90
    }
  ]
};

const oeeResults = await operationalAnalytics.calculateOEE(productionData);
console.log('OEE Results:', oeeResults);
```

### Visualization Generation

```javascript
import { VisualizationEngine } from './src/utils/visualization.js';

const visualizationEngine = new VisualizationEngine();

// Create revenue trend chart
const chartData = [
  { timestamp: '2024-01-01', value: 10000 },
  { timestamp: '2024-01-02', value: 12000 },
  // ... more data
];

const chart = await visualizationEngine.generateChart('line', chartData, {
  title: 'Daily Revenue Trend',
  theme: 'sentia',
  interactive: true,
  export: { format: 'svg' }
});

console.log('Chart Generated:', chart);
```

### Alert Configuration

```javascript
import { AdvancedAlertEngine } from './src/utils/advanced-alerts.js';

const alertEngine = new AdvancedAlertEngine();

// Create revenue threshold alert
const alert = await alertEngine.createAlert({
  name: 'High Revenue Alert',
  description: 'Alert when daily revenue exceeds threshold',
  metric: 'revenue',
  condition: 'greater_than',
  threshold: 50000,
  priority: 'medium',
  notifications: ['email', 'slack']
});

console.log('Alert Created:', alert);
```

## Performance & Scalability

### Performance Characteristics

- **Analysis Speed**: 9-11 seconds for 10,000 data points
- **Memory Usage**: <512MB for standard operations
- **Cache Hit Rate**: 89%+ with multi-level caching
- **Concurrent Operations**: Up to 10 parallel analyses
- **Real-time Processing**: <100ms latency for streaming data

### Scalability Features

1. **Parallel Processing**: Automatic multi-worker processing for large datasets
2. **Memory Optimization**: Configurable memory limits and garbage collection
3. **Intelligent Caching**: Multi-level caching with automatic invalidation
4. **Data Sampling**: Automatic sampling for large visualizations
5. **Background Processing**: Non-blocking operations for expensive calculations

### Performance Tuning

```javascript
// High-performance configuration
const config = {
  processing: {
    enableParallelProcessing: true,
    maxWorkers: 8,
    batchSize: 2000,
    maxMemoryUsage: 1024
  },
  caching: {
    enabled: true,
    levels: {
      memory: { maxSize: '512mb', ttl: 600000 },
      redis: { enabled: true, ttl: 3600000 }
    }
  },
  visualization: {
    performance: {
      enableSampling: true,
      samplingThreshold: 5000,
      enableWebGL: true
    }
  }
};
```

## Security & Compliance

### Security Features

1. **Authentication**: JWT token-based authentication for all API endpoints
2. **Authorization**: Role-based access control (RBAC) for different analytics features
3. **Data Encryption**: AES-256-GCM encryption for sensitive data at rest
4. **Audit Logging**: Comprehensive audit trail for all analytics operations
5. **Rate Limiting**: API rate limiting to prevent abuse
6. **Input Validation**: Strict input validation and sanitization

### Compliance Considerations

- **GDPR**: Customer data anonymization and right to deletion
- **SOX**: Financial data integrity and audit trails
- **ISO 27001**: Security management system compliance
- **Data Retention**: Configurable data retention policies

### Security Configuration

```javascript
// Security settings
security: {
  authentication: { enabled: true, requireMFA: false },
  encryption: { enabled: true, algorithm: 'aes-256-gcm' },
  rateLimiting: { enabled: true, max: 100, windowMs: 900000 },
  audit: { enabled: true, level: 'info', retention: { days: 90 } }
}
```

## Testing

The analytics system includes comprehensive testing at multiple levels:

### Test Structure
```
tests/
├── unit/analytics/
│   ├── advanced-analytics.test.js
│   ├── visualization-engine.test.js
│   ├── financial-analytics.test.js
│   └── operational-analytics.test.js
├── integration/analytics/
│   └── dashboard-api-analytics.test.js
└── e2e/
    └── analytics-workflow.test.js
```

### Running Tests

```bash
# Run all analytics tests
npm run test:analytics

# Run unit tests only
npm run test:unit:analytics

# Run integration tests
npm run test:integration:analytics

# Run end-to-end tests
npm run test:e2e:analytics

# Run with coverage
npm run test:coverage:analytics
```

### Test Coverage

- **Unit Tests**: 95%+ coverage for all analytics modules
- **Integration Tests**: Complete API endpoint testing
- **E2E Tests**: Full workflow validation
- **Performance Tests**: Load testing and memory validation

## Troubleshooting

### Common Issues

#### 1. Analytics Engine Not Starting
```bash
# Check configuration
curl http://localhost:3001/health

# Verify environment variables
echo $ANALYTICS_ENABLED
echo $ADVANCED_ANALYTICS_ENABLED

# Check logs
tail -f logs/combined.log | grep analytics
```

#### 2. Visualization Rendering Issues
```bash
# Check memory usage
curl http://localhost:3001/api/dashboard/analytics/performance

# Verify chart data format
# Ensure data arrays contain valid timestamp/value pairs
```

#### 3. Cache Performance Issues
```bash
# Check cache status
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/dashboard/analytics/performance

# Clear cache if needed
# Redis: redis-cli FLUSHDB
# Memory: restart server
```

#### 4. Alert System Not Triggering
```bash
# Check alert configuration
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/dashboard/analytics/alerts

# Verify notification channels
# Check email/Slack/SMS configuration
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
# Set debug environment variables
export LOG_LEVEL=debug
export ANALYTICS_DEBUG=true
export NODE_ENV=development

# Restart server and monitor logs
npm start
```

### Performance Debugging

```javascript
// Enable performance monitoring
const analytics = new AdvancedAnalytics({
  enablePerformanceMonitoring: true,
  debugMode: true,
  logLevel: 'debug'
});

// Monitor memory usage
analytics.on('performance-metric', (metric) => {
  console.log('Performance:', metric);
});
```

## Support & Maintenance

### Regular Maintenance Tasks

1. **Cache Cleanup**: Regularly clear expired cache entries
2. **Log Rotation**: Ensure log files don't consume excessive disk space
3. **Performance Monitoring**: Monitor response times and memory usage
4. **Alert Review**: Review and tune alert thresholds
5. **Data Quality**: Monitor data quality scores and validation errors

### Monitoring Endpoints

- **Health Check**: `GET /health`
- **Analytics Performance**: `GET /api/dashboard/analytics/performance`
- **Cache Status**: `GET /metrics` (Prometheus format)
- **Error Rates**: Monitor application logs

### Version Compatibility

- **MCP Server**: v3.0.0+
- **Node.js**: v18.0.0+
- **PostgreSQL**: v12.0+ (with pgvector)
- **Redis**: v6.0+ (optional)

---

For additional support or questions, please refer to the main MCP server documentation or contact the development team.