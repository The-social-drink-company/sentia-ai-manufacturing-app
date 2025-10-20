# MCP Integration User Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [Using the Monitoring Dashboard](#using-the-monitoring-dashboard)
5. [API Integration](#api-integration)
6. [AI Manufacturing Tools](#ai-manufacturing-tools)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The MCP (Model Context Protocol) Server integration provides centralized AI orchestration and API management for the CapLiquify Manufacturing Platform. It connects all external services (Xero, Shopify, Amazon) through a unified interface and provides AI-powered manufacturing intelligence.

### Key Benefits

- 🤖 **AI-Powered Analytics**: Advanced manufacturing intelligence using multiple LLMs
- 🔄 **Automatic Synchronization**: Keep all data sources up-to-date automatically
- 📊 **Real-time Monitoring**: Track system health and performance in real-time
- 🔗 **Unified API Interface**: Single point of access for all external services
- 💾 **Intelligent Caching**: Automatic fallback to cached data when services are unavailable

---

## Getting Started

### Accessing MCP Features

The MCP integration is available at:

- **Development**: https://sentia-manufacturing-development.up.railway.app
- **Testing**: https://sentia-manufacturing-testing.up.railway.app
- **Production**: https://sentia-manufacturing-production.up.railway.app

### Required Permissions

To access MCP features, users need:

- `api:read` - View API data and status
- `api:write` - Trigger manual syncs
- `admin:system` - Configure auto-sync and monitoring

### Initial Setup

1. **Verify Connection**
   - Navigate to `/mcp-monitor` in the dashboard
   - Check that MCP Server status shows "Connected"
   - Verify WebSocket connection is active

2. **Configure Auto-Sync** (Admins only)
   - Go to the Synchronization tab
   - Click "Enable Auto-Sync"
   - Configure sync intervals if needed

3. **Test API Connections**
   - Check the API Status tab
   - Verify each service shows "Connected"
   - Trigger test syncs if needed

---

## Features

### 1. Real-time Data Synchronization

The system automatically synchronizes data from multiple sources:

| Service  | Default Interval | Data Synced                      |
| -------- | ---------------- | -------------------------------- |
| Xero     | Every 30 minutes | Invoices, Contacts, Transactions |
| Shopify  | Every 15 minutes | Orders, Products, Inventory      |
| Amazon   | Every hour       | Orders, Inventory                |
| Database | Every 6 hours    | Branch synchronization           |

**Manual Sync**: Click "Sync Now" button for any service in the monitoring dashboard.

### 2. AI Manufacturing Intelligence

Access AI-powered features through the dashboard:

#### Demand Forecasting

- Navigate to **Analytics → Demand Forecasting**
- AI analyzes historical data to predict future demand
- Provides recommendations for inventory optimization

#### Quality Analysis

- Go to **Analytics → Quality Control**
- AI identifies quality patterns and anomalies
- Suggests preventive measures

#### Inventory Optimization

- Access via **Inventory → Optimization**
- AI calculates optimal stock levels
- Reduces carrying costs while preventing stockouts

### 3. WebSocket Real-time Updates

The dashboard receives real-time updates for:

- Manufacturing alerts
- AI analysis results
- API synchronization status
- System health notifications

### 4. Unified API Access

All external services are accessible through a single interface:

```
/api/mcp/xero/*      - Xero accounting data
/api/mcp/shopify/*   - Shopify e-commerce data
/api/mcp/amazon/*    - Amazon marketplace data
```

---

## Using the Monitoring Dashboard

### Dashboard Overview

Access the MCP Monitoring Dashboard at `/mcp-monitor`

#### Status Cards

- **MCP Server**: Shows connection status to the AI orchestration server
- **WebSocket**: Real-time connection status and uptime
- **Database**: Current database branch (development/testing/production)
- **Auto-Sync**: Whether automatic synchronization is enabled

#### Navigation Tabs

1. **Overview Tab**
   - System information
   - Key metrics
   - Connection details

2. **WebSocket Tab**
   - Connection statistics
   - Message throughput
   - Reconnection options

3. **Synchronization Tab**
   - Service sync status
   - Last sync times
   - Manual sync triggers
   - Auto-sync toggle

4. **API Status Tab**
   - Individual API health
   - Error counts
   - Connection status

### Common Tasks

#### Enable/Disable Auto-Sync

1. Go to Synchronization tab
2. Click "Enable Auto-Sync" or "Disable Auto-Sync"
3. System will confirm the change

#### Trigger Manual Sync

1. Navigate to Synchronization tab
2. Find the service you want to sync
3. Click "Sync Now" button
4. Monitor progress in the status indicator

#### Reconnect WebSocket

1. Go to WebSocket tab
2. Click "Reconnect" button
3. Wait for connection to re-establish
4. Check status shows "Connected"

#### View Sync History

1. Open API Status tab
2. Check "Last Sync" timestamps
3. Review error counts if any

---

## API Integration

### Making API Calls

#### Get Xero Invoices

```javascript
fetch('/api/mcp/xero/invoices')
  .then(res => res.json())
  .then(data => {
    console.log('Invoices:', data)
  })
```

#### Get Shopify Orders

```javascript
fetch('/api/mcp/shopify/orders?limit=10')
  .then(res => res.json())
  .then(data => {
    console.log('Recent orders:', data)
  })
```

#### Trigger Sync

```javascript
fetch('/api/mcp/sync/trigger/xero', {
  method: 'POST',
})
  .then(res => res.json())
  .then(result => {
    console.log('Sync result:', result)
  })
```

### Available Endpoints

#### Health & Monitoring

- `GET /api/mcp/health` - System health check
- `GET /api/mcp/status` - Comprehensive status
- `GET /api/mcp/websocket/stats` - WebSocket statistics
- `GET /api/mcp/sync/status` - Sync status

#### Data Access

- `GET /api/mcp/xero/invoices` - Xero invoices
- `GET /api/mcp/xero/contacts` - Xero contacts
- `GET /api/mcp/shopify/orders` - Shopify orders
- `GET /api/mcp/shopify/products` - Shopify products
- `GET /api/mcp/shopify/inventory` - Shopify inventory
- `GET /api/mcp/amazon/orders` - Amazon orders

#### Control

- `POST /api/mcp/sync/trigger/:service` - Trigger sync
- `POST /api/mcp/sync/enable` - Enable auto-sync
- `POST /api/mcp/sync/disable` - Disable auto-sync
- `POST /api/mcp/websocket/reconnect` - Reconnect WebSocket

---

## AI Manufacturing Tools

### 1. Manufacturing Request Processing

Submit natural language requests for AI analysis:

```javascript
fetch('/api/mcp/ai/manufacturing-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request: 'Analyze production efficiency for last month',
  }),
})
  .then(res => res.json())
  .then(analysis => {
    console.log('AI Analysis:', analysis)
  })
```

### 2. Inventory Optimization

Get AI-powered inventory recommendations:

```javascript
fetch('/api/mcp/ai/optimize-inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    products: ['SKU001', 'SKU002'],
    timeframe: '30days',
  }),
})
  .then(res => res.json())
  .then(recommendations => {
    console.log('Optimization:', recommendations)
  })
```

### 3. Demand Forecasting

Predict future demand using AI:

```javascript
fetch('/api/mcp/ai/forecast-demand', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product: 'SKU001',
    periods: 12,
  }),
})
  .then(res => res.json())
  .then(forecast => {
    console.log('Forecast:', forecast)
  })
```

### 4. Quality Analysis

Analyze quality metrics with AI:

```javascript
fetch('/api/mcp/ai/analyze-quality', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: qualityMetrics,
  }),
})
  .then(res => res.json())
  .then(analysis => {
    console.log('Quality Analysis:', analysis)
  })
```

---

## Troubleshooting

### Common Issues

#### MCP Server Shows "Disconnected"

**Symptoms**: Status card shows disconnected, no real-time updates

**Solutions**:

1. Check internet connection
2. Click "Reconnect" in WebSocket tab
3. Refresh the page
4. Contact support if issue persists

#### Auto-Sync Not Working

**Symptoms**: Data not updating automatically

**Solutions**:

1. Verify auto-sync is enabled
2. Check individual service status
3. Look for error messages in sync status
4. Manually trigger sync to test
5. Check API keys are configured

#### WebSocket Connection Drops

**Symptoms**: Frequent disconnections, missed updates

**Solutions**:

1. Check network stability
2. Review firewall settings
3. Enable auto-reconnect in settings
4. Monitor connection statistics

#### API Data Not Loading

**Symptoms**: Empty data sets, loading errors

**Solutions**:

1. Check service sync status
2. Verify API credentials are valid
3. Try manual sync
4. Check for cached data availability
5. Review error logs

### Error Messages

| Error                       | Meaning                      | Solution                                          |
| --------------------------- | ---------------------------- | ------------------------------------------------- |
| "MCP Server unreachable"    | Cannot connect to MCP Server | Check server status, network connection           |
| "Authentication failed"     | Invalid API credentials      | Update API keys in settings                       |
| "Sync timeout"              | Sync taking too long         | Check data volume, try again later                |
| "Rate limit exceeded"       | Too many API calls           | Wait before retrying, check sync intervals        |
| "WebSocket connection lost" | Real-time connection dropped | Auto-reconnect will engage, or manually reconnect |

### Getting Help

1. **Check System Status**
   - Visit `/mcp-monitor`
   - Review all status indicators
   - Check error counts

2. **View Logs**
   - Access developer console (F12)
   - Check network tab for failed requests
   - Review console for error messages

3. **Contact Support**
   - Email: support@sentia.com
   - Include:
     - Screenshot of monitoring dashboard
     - Error messages
     - Steps to reproduce issue
     - Time of occurrence

### Performance Tips

1. **Optimize Sync Intervals**
   - Adjust based on data change frequency
   - Reduce intervals during peak hours
   - Increase for rarely-changing data

2. **Use Cached Data**
   - System automatically uses cache when services unavailable
   - Cache refreshes on successful sync
   - Manual refresh available if needed

3. **Monitor WebSocket Health**
   - Keep auto-refresh enabled
   - Watch for high error counts
   - Reconnect if uptime is low

4. **Batch API Requests**
   - Use bulk endpoints when available
   - Combine related data requests
   - Leverage auto-sync instead of manual calls

---

## Best Practices

### For Administrators

1. **Regular Monitoring**
   - Check dashboard daily
   - Review sync history weekly
   - Monitor error trends

2. **Sync Configuration**
   - Set appropriate intervals
   - Enable critical services only
   - Test changes in development first

3. **Security**
   - Rotate API keys regularly
   - Monitor unauthorized access attempts
   - Keep credentials secure

### For Users

1. **Data Usage**
   - Rely on synchronized data
   - Report discrepancies promptly
   - Use AI features for insights

2. **Performance**
   - Avoid excessive manual syncs
   - Use filters to limit data
   - Cache results when possible

3. **Troubleshooting**
   - Check status before reporting issues
   - Document error messages
   - Try basic fixes first

---

## Appendix

### Sync Intervals Reference

| Service  | Minimum | Default | Maximum  |
| -------- | ------- | ------- | -------- |
| Xero     | 15 min  | 30 min  | 2 hours  |
| Shopify  | 5 min   | 15 min  | 1 hour   |
| Amazon   | 30 min  | 1 hour  | 4 hours  |
| Database | 1 hour  | 6 hours | 24 hours |

### API Rate Limits

| Service    | Requests/Hour | Burst Limit |
| ---------- | ------------- | ----------- |
| Xero       | 5000          | 60/min      |
| Shopify    | 2/sec         | 40/10sec    |
| Amazon     | 18000         | 30/sec      |
| MCP Server | Unlimited     | N/A         |

### Keyboard Shortcuts

| Shortcut | Action            |
| -------- | ----------------- |
| `R`      | Refresh data      |
| `S`      | Open sync panel   |
| `W`      | WebSocket status  |
| `M`      | Toggle monitoring |
| `Ctrl+R` | Force reconnect   |

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Support**: support@sentia.com

