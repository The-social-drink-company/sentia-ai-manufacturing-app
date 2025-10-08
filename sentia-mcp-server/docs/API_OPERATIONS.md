# Sentia MCP Server - API & Operations Guide

## 📋 **Overview**

This document provides comprehensive operational guidance for deploying, monitoring, and maintaining the Sentia MCP Server in production environments.

## 🚀 **Deployment Information**

### **Environment Configuration**
- **Development**: Available on Render (auto-deploy from development branch)
- **Testing**: Available on Render (manual deploy to test branch)
- **Production**: Available on Render (manual deploy to production branch)

### **Transport Support**
- **Stdio Transport**: For direct Claude Desktop integration
- **HTTP/SSE Transport**: For web dashboard integration and API access
- **Health Endpoints**: `/health`, `/metrics` for monitoring

### **Claude Desktop Integration**
- **Config File**: `claude-desktop-config.json` provided
- **Transport**: Stdio-based for direct Claude access
- **Installation**: Copy config to Claude Desktop settings

## 🌐 **API Endpoints**

### **Core System Endpoints**

#### **Health & Status**
- `GET /health` - System health check with dependency validation
- `GET /health/detailed` - Comprehensive health report with metrics
- `GET /status` - Service status and version information
- `GET /info` - API information and capabilities

#### **Metrics & Monitoring**
- `GET /api/metrics` - Current system metrics overview
- `GET /api/metrics/prometheus` - Prometheus-compatible metrics
- `GET /api/metrics/performance` - Performance analysis (P95/P99)
- `GET /api/metrics/business` - Business intelligence data and ROI
- `GET /api/metrics/alerts` - Active alerts and alert history
- `GET /api/metrics/stream/sse` - Real-time metrics streaming (SSE)
- `GET /api/metrics/stream/ws` - WebSocket metrics streaming

#### **Configuration Management**
- `GET /api/config/status` - Configuration system status
- `GET /api/config/environment` - Current environment settings
- `GET /api/config/security` - Security configuration (masked)
- `GET /api/config/performance` - Performance settings
- `GET /api/config/services` - All service configurations
- `POST /api/config/dynamic` - Update configuration at runtime
- `POST /api/config/validate` - Validate configuration changes
- `POST /api/config/reload` - Reload configuration from files

#### **Cache Management** (Phase 5)
- `GET /api/cache/stats` - Overall cache statistics and hit rates
- `GET /api/cache/health` - Cache system health status
- `GET /api/cache/analytics` - Real-time cache analytics dashboard
- `GET /api/cache/performance` - Performance metrics and trends
- `POST /api/cache/warm` - Trigger cache warming for specific keys
- `POST /api/cache/invalidate` - Invalidate cache by pattern or rule
- `DELETE /api/cache/clear` - Clear cache by strategy or all
- `GET /api/cache/recommendations` - Optimization recommendations

#### **Performance Optimization** (Phase 5)
- `GET /api/performance/stats` - Performance optimization statistics
- `GET /api/performance/metrics` - Real-time performance metrics
- `POST /api/performance/optimize` - Trigger performance optimization
- `GET /api/performance/compression` - Compression effectiveness metrics
- `GET /api/performance/batching` - API batching performance data
- `GET /api/performance/memory` - Memory usage and optimization status

#### **Log Management**
- `GET /api/logs/search` - Advanced log search with queries
- `GET /api/logs/aggregate` - Log aggregation and analysis
- `GET /api/logs/export` - Log export for compliance
- `GET /api/logs/retention` - Retention policy management
- `POST /api/logs/query` - Complex log queries with filters
- `GET /api/logs/correlation/{id}` - Correlation ID-based tracking

#### **Alert Management**
- `GET /api/alerts/active` - Current active alerts
- `POST /api/alerts/acknowledge` - Alert acknowledgment
- `GET /api/alerts/history` - Alert history and trends
- `POST /api/alerts/test` - Test alert configurations
- `PUT /api/alerts/config` - Update alert configuration
- `GET /api/alerts/escalation` - Escalation policy management

### **Integration Tool Endpoints**

#### **Xero Integration (5 tools)**
- `POST /api/tools/xero/financial-reports` - Generate financial reports
- `POST /api/tools/xero/invoices` - Retrieve invoice data
- `POST /api/tools/xero/contacts` - Manage customer/supplier contacts
- `POST /api/tools/xero/bank-transactions` - Bank transaction processing
- `POST /api/tools/xero/create-invoice` - Create new invoices

#### **Shopify Integration (6 tools)**
- `POST /api/tools/shopify/orders` - Order management and retrieval
- `POST /api/tools/shopify/products` - Product catalog management
- `POST /api/tools/shopify/customers` - Customer data and profiles
- `POST /api/tools/shopify/inventory` - Inventory levels and tracking
- `POST /api/tools/shopify/analytics` - Sales and performance analytics
- `POST /api/tools/shopify/product-management` - Product creation/updates

#### **Amazon Integration (6 tools)**
- `POST /api/tools/amazon/orders` - Order management and fulfillment
- `POST /api/tools/amazon/inventory` - FBA/FBM inventory management
- `POST /api/tools/amazon/products` - Product catalog and ASIN management
- `POST /api/tools/amazon/reports` - Sales and performance reports
- `POST /api/tools/amazon/listings` - Product listing optimization
- `POST /api/tools/amazon/advertising` - PPC campaign management

#### **Anthropic AI Integration (6 tools)**
- `POST /api/tools/anthropic/financial-analysis` - Financial data analysis
- `POST /api/tools/anthropic/sales-performance` - Sales trend analysis
- `POST /api/tools/anthropic/business-reports` - Executive reporting
- `POST /api/tools/anthropic/inventory-optimization` - Stock optimization
- `POST /api/tools/anthropic/competitive-analysis` - Market analysis
- `POST /api/tools/anthropic/strategic-planning` - Business strategy

#### **OpenAI Integration (6 tools)**
- `POST /api/tools/openai/data-analysis` - Statistical data analysis
- `POST /api/tools/openai/content-generation` - Content creation
- `POST /api/tools/openai/customer-insights` - Customer behavior analysis
- `POST /api/tools/openai/operational-optimization` - Process optimization
- `POST /api/tools/openai/forecasting` - Demand and sales forecasting
- `POST /api/tools/openai/automated-reporting` - Report generation

#### **Unleashed ERP Integration (7 tools)**
- `POST /api/tools/unleashed/get-products` - Product catalog retrieval
- `POST /api/tools/unleashed/get-inventory` - Inventory level checking
- `POST /api/tools/unleashed/get-production-orders` - Manufacturing orders
- `POST /api/tools/unleashed/get-purchase-orders` - Purchase order management
- `POST /api/tools/unleashed/get-sales-orders` - Sales order processing
- `POST /api/tools/unleashed/get-suppliers` - Supplier management
- `POST /api/tools/unleashed/get-customers` - Customer management

## 🚀 **Quick Deployment Guide**

### **Local Production Testing**
```bash
# Start complete production environment locally
cd sentia-mcp-server
docker-compose -f docker-compose.production.yml up -d

# Access services
# MCP Server: http://localhost:3001
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
```

### **Render Production Deployment**
```bash
# Deploy to development environment
git push origin development

# Deploy to testing environment (after development validation)
git push origin testing

# Deploy to production (after UAT approval)
git push origin production
```

### **CI/CD Pipeline Triggers**
```bash
# Manual deployment with environment selection
gh workflow run mcp-server-deploy.yml -f environment=production

# Security scan and vulnerability check
gh workflow run mcp-server-deploy.yml -f force_deploy=false
```

### **Monitoring & Health Checks**
```bash
# Check system health
curl https://sentia-mcp-server-production.onrender.com/health

# View Prometheus metrics
curl https://sentia-mcp-server-production.onrender.com/api/metrics/prometheus

# Advanced health validation
node scripts/health-check-advanced.js
```

## 🔧 **Production Environment Variables**

### **Core Production Settings**
```bash
# Core production settings
NODE_ENV=production
MCP_SERVER_PORT=3001
AUTH_REQUIRED=true
SECURITY_HEADERS_ENABLED=true

# Performance optimization
NODE_OPTIONS="--max-old-space-size=2048 --gc-concurrent"
UV_THREADPOOL_SIZE=16
CACHE_TYPE=redis

# Monitoring
PROMETHEUS_METRICS_ENABLED=true
MONITORING_ENABLED=true
ALERTING_ENABLED=true
```

### **Security Configuration**
```bash
# Authentication & Security
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
ENCRYPTION_KEY=your_production_encryption_key
MFA_ENABLED=true
SESSION_TIMEOUT=3600000
SECURITY_MONITORING_ENABLED=true
AUDIT_LOGGING_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

### **Integration Credentials**
```bash
# Xero
XERO_CLIENT_ID=your_production_xero_client_id
XERO_CLIENT_SECRET=your_production_xero_secret

# Shopify
SHOPIFY_UK_ACCESS_TOKEN=your_production_uk_token
SHOPIFY_USA_ACCESS_TOKEN=your_production_usa_token

# Amazon
AMAZON_SP_API_CLIENT_ID=your_production_sp_api_client
AMAZON_SP_API_CLIENT_SECRET=your_production_sp_api_secret

# AI Services
ANTHROPIC_API_KEY=your_production_anthropic_key
OPENAI_API_KEY=your_production_openai_key

# Unleashed
UNLEASHED_API_KEY=your_production_unleashed_key
UNLEASHED_API_SECRET=your_production_unleashed_secret
```

## 📞 **Support and Maintenance**

### **Monitoring**
- **Health Checks**: Enhanced `/health` endpoint with comprehensive system status
- **Metrics API**: Complete `/api/metrics/*` endpoints for performance tracking
- **Real-time Streaming**: SSE and WebSocket endpoints for live monitoring
- **Structured Logging**: Advanced logging with correlation IDs and async capabilities
- **Performance Analytics**: P95/P99 response time analysis and memory leak detection
- **Business Intelligence**: ROI tracking, cost analysis, and usage optimization
- **Enterprise Alerting**: Multi-channel notifications with escalation policies
- **Log Management**: Centralized aggregation, search, and retention policies

### **Health Check Examples**

**Basic Health Check**
```bash
curl -X GET https://sentia-mcp-server-production.onrender.com/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-10-06T10:30:00Z",
  "uptime": 3600000,
  "version": "4.0.0",
  "environment": "production"
}
```

**Detailed Health Check**
```bash
curl -X GET https://sentia-mcp-server-production.onrender.com/health/detailed

# Response
{
  "status": "healthy",
  "timestamp": "2024-10-06T10:30:00Z",
  "services": {
    "database": { "status": "connected", "responseTime": 5 },
    "redis": { "status": "connected", "responseTime": 2 },
    "xero": { "status": "connected", "lastCheck": "2024-10-06T10:29:00Z" },
    "shopify": { "status": "connected", "lastCheck": "2024-10-06T10:29:00Z" },
    "amazon": { "status": "connected", "lastCheck": "2024-10-06T10:29:00Z" },
    "unleashed": { "status": "connected", "lastCheck": "2024-10-06T10:29:00Z" }
  },
  "metrics": {
    "memoryUsage": { "used": 256, "total": 2048, "percentage": 12.5 },
    "cpuUsage": { "percentage": 15.2 },
    "activeConnections": 45,
    "responseTime": { "p95": 120, "p99": 250 }
  }
}
```

### **Troubleshooting**

#### **Integration Validation**
```bash
# Validate all integrations
npm run validate:all

# Validate specific integration
npm run validate:xero
npm run validate:shopify
npm run validate:amazon
npm run validate:unleashed

# Use provided validation scripts
node scripts/validate-unleashed-integration.js
```

#### **Log Analysis**
```bash
# Search logs by correlation ID
curl -X GET "/api/logs/correlation/abc123-def456-ghi789"

# Search logs by time range and level
curl -X POST "/api/logs/search" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2024-10-06T09:00:00Z",
    "endTime": "2024-10-06T10:00:00Z",
    "level": "ERROR",
    "limit": 100
  }'

# Export logs for analysis
curl -X GET "/api/logs/export?format=json&startTime=2024-10-06T00:00:00Z"
```

#### **Error Recovery**
```bash
# Check error rates
curl -X GET "/api/metrics/performance"

# View active alerts
curl -X GET "/api/alerts/active"

# Acknowledge alert
curl -X POST "/api/alerts/acknowledge" \
  -H "Content-Type: application/json" \
  -d '{"alertId": "alert-123", "userId": "user-456", "comment": "Issue resolved"}'
```

#### **Performance Monitoring**
```bash
# Monitor metrics endpoint for bottlenecks
curl -X GET "/api/metrics/performance"

# Check memory usage
curl -X GET "/api/metrics?filter=memory"

# Monitor business metrics
curl -X GET "/api/metrics/business"
```

## 🔧 **Operational Procedures**

### **Deployment Checklist**

**Pre-Deployment**
- [ ] All tests passing in CI/CD pipeline
- [ ] Security scan completed without high-severity issues
- [ ] Performance benchmarks within acceptable limits
- [ ] Integration validation tests successful
- [ ] Configuration validated for target environment

**Deployment**
- [ ] Blue-green deployment strategy activated
- [ ] Health checks passing during deployment
- [ ] Monitoring alerts configured and active
- [ ] Rollback plan prepared and validated
- [ ] Database migrations completed successfully

**Post-Deployment**
- [ ] Health checks confirming service availability
- [ ] Integration endpoints responding correctly
- [ ] Monitoring metrics within normal ranges
- [ ] Log aggregation functioning properly
- [ ] Alert systems operational

### **Incident Response Procedures**

**Severity Levels**
1. **Critical (P0)**: Service completely down or data loss
2. **High (P1)**: Major functionality impaired
3. **Medium (P2)**: Minor functionality affected
4. **Low (P3)**: Cosmetic issues or enhancement requests

**Response Timeline**
- **P0**: Immediate response (< 15 minutes)
- **P1**: 1 hour response
- **P2**: 4 hour response
- **P3**: 24 hour response

**Escalation Process**
1. **Initial Response**: On-call engineer investigates
2. **Escalation**: Team lead notified if not resolved in 30 minutes
3. **Management**: Manager notified for P0/P1 incidents
4. **Communication**: Stakeholders updated every 30 minutes for P0/P1

### **Backup and Recovery Procedures**

**Backup Schedule**
- **Database**: Every 4 hours with 30-day retention
- **Application**: Daily with 90-day retention
- **Configuration**: On change with 90-day retention
- **Logs**: Daily with 7-day retention

**Recovery Procedures**
```bash
# Database recovery
curl -X POST "/api/admin/backup/restore" \
  -H "Content-Type: application/json" \
  -d '{"backupId": "backup-20241006-100000", "confirmRestore": true}'

# Configuration rollback
curl -X POST "/api/config/rollback" \
  -H "Content-Type: application/json" \
  -d '{"changeId": "config-change-123"}'

# Application rollback
gh workflow run rollback-deployment.yml -f version=v3.9.0
```

## 📊 **Monitoring and Alerting**

### **Key Performance Indicators (KPIs)**
- **Uptime**: 99.9% target
- **Response Time**: P95 < 500ms, P99 < 1000ms
- **Error Rate**: < 1% of total requests
- **Integration Success Rate**: > 99% for all integrations
- **Memory Usage**: < 80% of allocated memory
- **CPU Usage**: < 75% average, < 90% peak

### **Alert Thresholds**

**Critical Alerts**
- Service downtime (immediate notification)
- Error rate > 5% (2-minute threshold)
- Memory usage > 90% (5-minute threshold)
- Response time P99 > 5 seconds (5-minute threshold)

**Warning Alerts**
- Error rate > 2% (5-minute threshold)
- Memory usage > 80% (10-minute threshold)
- Response time P95 > 1 second (10-minute threshold)
- Integration failure rate > 1% (15-minute threshold)

### **Business Metrics Tracking**
- Tool execution success rates and costs
- ROI calculation for business operations
- Usage pattern analysis and optimization
- Revenue impact correlation
- Customer satisfaction metrics

## 📚 **Related Documentation**

- **[MCP Server Overview](MCP_SERVER_OVERVIEW.md)**: Architecture and technology stack overview
- **[Integrations Guide](INTEGRATIONS_GUIDE.md)**: Detailed integration implementations and patterns
- **[Authentication & Security](AUTHENTICATION_SECURITY.md)**: Enterprise security system (Phase 3.1)
- **[Monitoring & Logging](MONITORING_LOGGING.md)**: Comprehensive monitoring infrastructure (Phase 3.2)
- **[Configuration Management](CONFIGURATION_MANAGEMENT.md)**: Multi-environment configuration system (Phase 3.3)
- **[Deployment Infrastructure](DEPLOYMENT_INFRASTRUCTURE.md)**: Complete deployment automation (Phase 4)
- **[Development Guide](DEVELOPMENT_GUIDE.md)**: Setup, workflow, and development instructions

---

*This API and operations guide provides comprehensive operational guidance for deploying, monitoring, and maintaining the Sentia MCP Server in production environments with 36 enterprise-grade MCP tools.*