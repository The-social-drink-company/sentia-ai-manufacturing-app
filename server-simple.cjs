// SIMPLE PRODUCTION SERVER - NO EXTRA DEPENDENCIES
// Force Railway rebuild: 2025-09-04T19:13:00Z
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
// Railway always sets PORT - if not set, use 3000 (Railway standard)
const PORT = process.env.PORT || 3000;

// Log environment info
console.log('Environment PORT:', process.env.PORT);
console.log('Using PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// SSE connections for real-time updates
const sseClients = new Set();

// SSE endpoint for real-time events
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    timestamp: new Date().toISOString(),
    message: 'SSE connection established'
  })}\n\n`);
  
  sseClients.add(res);
  
  req.on('close', () => {
    sseClients.delete(res);
    console.log(`SSE client disconnected. Active connections: ${sseClients.size}`);
  });
});

// Broadcast SSE events to all connected clients
function broadcastSSE(eventType, data) {
  const message = `data: ${JSON.stringify({ 
    type: eventType, 
    ...data, 
    timestamp: new Date().toISOString() 
  })}\n\n`;
  
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (error) {
      sseClients.delete(client);
    }
  }
  console.log(`Broadcast SSE event: ${eventType} to ${sseClients.size} clients`);
}

// Simulate periodic updates for demo purposes
setInterval(() => {
  broadcastSSE('metrics.kpi.updated', {
    efficiency: Math.round((95 + Math.random() * 10) * 100) / 100,
    throughput: Math.round((85 + Math.random() * 20) * 100) / 100,
    uptime: Math.round((98 + Math.random() * 2) * 100) / 100,
    quality: Math.round((96 + Math.random() * 4) * 100) / 100
  });
}, 30000); // Every 30 seconds

// Helper functions for generating realistic business data
function generateRandomAlerts() {
  const alertTypes = ['cash_flow', 'accounts_receivable', 'inventory', 'payment_delays', 'forecast_accuracy'];
  const alertLevels = ['info', 'warning', 'critical'];
  const alertCount = Math.floor(Math.random() * 6); // 0-5 alerts
  
  const alerts = [];
  for (let i = 0; i < alertCount; i++) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const level = alertLevels[Math.floor(Math.random() * alertLevels.length)];
    
    alerts.push({
      type,
      level,
      message: generateAlertMessage(type, level),
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
    });
  }
  
  return alerts;
}

function generateAlertMessage(type, level) {
  const messages = {
    cash_flow: {
      info: 'Cash flow projection updated successfully',
      warning: 'Cash flow showing potential strain in next 30 days',
      critical: 'Critical cash flow shortage predicted within 14 days'
    },
    accounts_receivable: {
      info: 'AR aging report generated',
      warning: 'AR aging showing increase in 60+ day outstanding',
      critical: 'Critical: AR overdue amount exceeds 25% of total receivables'
    },
    inventory: {
      info: 'Inventory levels within normal range',
      warning: 'Inventory turnover below target efficiency',
      critical: 'Critical inventory shortage detected for key products'
    },
    payment_delays: {
      info: 'Payment processing on schedule',
      warning: 'Some supplier payments approaching due dates',
      critical: 'Critical: Multiple supplier payments overdue'
    },
    forecast_accuracy: {
      info: 'Forecast models performing within expected range',
      warning: 'Forecast accuracy declining, model retraining recommended',
      critical: 'Critical forecast accuracy degradation detected'
    }
  };
  
  return messages[type][level];
}

function generateCashFlowProjections(timeRange, scenario) {
  const months = timeRange === '12M' ? 12 : timeRange === '6M' ? 6 : 3;
  const scenarioMultiplier = scenario === 'optimistic' ? 1.15 : scenario === 'pessimistic' ? 0.85 : 1.0;
  
  const projections = [];
  const baseOperatingCash = 50000;
  const baseInvestmentCash = -15000;
  const baseFinancingCash = -10000;
  
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    const seasonal = Math.sin(i * Math.PI / 6) * 0.2; // Seasonal variation
    const trend = i * 0.05; // Growth trend
    const randomVariation = (Math.random() - 0.5) * 0.3;
    
    const factor = (1 + seasonal + trend + randomVariation) * scenarioMultiplier;
    
    projections.push({
      month: date.toISOString().substr(0, 7), // YYYY-MM format
      operatingCashFlow: Math.round(baseOperatingCash * factor),
      investmentCashFlow: Math.round(baseInvestmentCash * (1 + randomVariation * 0.5)),
      financingCashFlow: Math.round(baseFinancingCash * (1 + randomVariation * 0.3)),
      netCashFlow: Math.round((baseOperatingCash + baseInvestmentCash + baseFinancingCash) * factor),
      cumulativeCash: Math.round(200000 + (i + 1) * baseOperatingCash * factor * 0.3)
    });
  }
  
  return projections;
}

function generateDemandForecast(seriesId, options) {
  const { models, scenario, horizon } = options;
  const scenarioMultiplier = scenario === 'optimistic' ? 1.2 : scenario === 'pessimistic' ? 0.8 : 1.0;
  
  const forecastData = [];
  const baseDemand = 100;
  
  for (let i = 0; i < horizon; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    
    const trend = 100 + Math.sin(i * 0.1) * 20;
    const seasonal = Math.sin(i * 0.3) * 15;
    const noise = (Math.random() - 0.5) * 10;
    
    const baseValue = (trend + seasonal) * scenarioMultiplier;
    
    const dataPoint = {
      date: date.toISOString().split('T')[0],
      actual: i < 7 ? baseValue + noise : null, // Only show actual for past week
    };
    
    // Add model forecasts based on requested models
    if (models.includes('Ensemble')) {
      dataPoint.Ensemble = Math.round((baseValue + noise * 0.5) * 100) / 100;
    }
    if (models.includes('ARIMA')) {
      dataPoint.ARIMA = Math.round((baseValue * 0.95 + seasonal * 0.8 + noise * 0.3) * 100) / 100;
    }
    if (models.includes('HoltWinters')) {
      dataPoint.HoltWinters = Math.round((baseValue * 0.98 + seasonal * 1.2 + noise * 0.4) * 100) / 100;
    }
    if (models.includes('Linear')) {
      dataPoint.Linear = Math.round((baseValue + i * 2 + noise * 0.2) * 100) / 100;
    }
    
    // Add confidence intervals
    dataPoint.confidence_lower = Math.round((baseValue - 15) * 100) / 100;
    dataPoint.confidence_upper = Math.round((baseValue + 15) * 100) / 100;
    
    forecastData.push(dataPoint);
  }
  
  return {
    series: forecastData,
    accuracy: {
      mape: Math.round((10 + Math.random() * 10) * 10) / 10,
      smape: Math.round((12 + Math.random() * 12) * 10) / 10,
      rmse: Math.round((70 + Math.random() * 40) * 10) / 10,
      coverage: Math.round((92 + Math.random() * 8) * 10) / 10
    },
    metadata: {
      lastUpdate: new Date().toISOString(),
      modelCount: models.length,
      dataPoints: forecastData.length
    },
    trust: {
      level: Math.random() > 0.7 ? 'excellent' : 'good',
      freshness: Math.random() > 0.8 ? 'fresh' : 'recent',
      lastValidated: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString()
    }
  };
}

// KPI Metrics endpoint
app.get('/api/kpi-metrics', (req, res) => {
  const { timeRange = '24h', filters = '{}' } = req.query;
  
  // Generate realistic KPI data based on time and some randomness
  const now = new Date();
  const baseMetrics = {
    totalRevenue: {
      value: Math.round((120000 + Math.random() * 20000) * 100) / 100,
      change: Math.round((5 + Math.random() * 10 - 5) * 10) / 10,
      changeType: Math.random() > 0.4 ? 'positive' : 'negative',
      status: Math.random() > 0.3 ? 'good' : 'warning',
      trustLevel: 'good',
      freshness: 'fresh',
      lastUpdated: new Date(now.getTime() - Math.random() * 5 * 60 * 1000).toISOString()
    },
    stockLevel: {
      value: Math.round((90 + Math.random() * 20) * 10) / 10,
      change: Math.round((Math.random() * 10 - 5) * 10) / 10,
      changeType: Math.random() > 0.5 ? 'positive' : 'negative',
      status: Math.random() > 0.4 ? 'good' : 'warning',
      trustLevel: Math.random() > 0.8 ? 'needs_attention' : 'good',
      freshness: 'recent',
      lastUpdated: new Date(now.getTime() - Math.random() * 30 * 60 * 1000).toISOString()
    },
    forecastAccuracy: {
      value: Math.round((80 + Math.random() * 15) * 10) / 10,
      change: Math.round((Math.random() * 8 - 2) * 10) / 10,
      changeType: Math.random() > 0.6 ? 'positive' : 'negative',
      status: Math.random() > 0.2 ? 'excellent' : 'good',
      trustLevel: 'excellent',
      freshness: 'fresh',
      lastUpdated: new Date(now.getTime() - Math.random() * 2 * 60 * 1000).toISOString()
    },
    capacityUtilization: {
      value: Math.round((70 + Math.random() * 25) * 10) / 10,
      change: Math.round((Math.random() * 6 - 2) * 10) / 10,
      changeType: Math.random() > 0.5 ? 'positive' : 'negative',
      status: 'good',
      trustLevel: 'good',
      freshness: 'recent',
      lastUpdated: new Date(now.getTime() - Math.random() * 20 * 60 * 1000).toISOString()
    },
    cashPosition: {
      value: Math.round((250 + Math.random() * 100)),
      change: Math.round((Math.random() * 20 - 10) * 10) / 10,
      changeType: Math.random() > 0.4 ? 'positive' : 'negative',
      status: Math.random() > 0.3 ? 'good' : 'warning',
      trustLevel: 'good',
      freshness: 'fresh',
      lastUpdated: new Date(now.getTime() - Math.random() * 10 * 60 * 1000).toISOString()
    },
    productionThroughput: {
      value: Math.round((85 + Math.random() * 20) * 10) / 10,
      change: Math.round((Math.random() * 8 - 3) * 10) / 10,
      changeType: Math.random() > 0.5 ? 'positive' : 'negative',
      status: Math.random() > 0.3 ? 'good' : 'warning',
      trustLevel: 'good',
      freshness: 'fresh',
      lastUpdated: new Date(now.getTime() - Math.random() * 8 * 60 * 1000).toISOString()
    },
    alertsCount: {
      value: Math.round(Math.random() * 8),
      change: Math.round((Math.random() * 80 - 40) * 10) / 10,
      changeType: Math.random() > 0.6 ? 'positive' : 'negative',
      status: Math.random() > 0.4 ? 'good' : 'warning',
      trustLevel: Math.random() > 0.7 ? 'stale' : 'good',
      freshness: Math.random() > 0.8 ? 'stale' : 'recent',
      lastUpdated: new Date(now.getTime() - Math.random() * 60 * 60 * 1000).toISOString()
    }
  };
  
  // Set appropriate changeType based on change value
  Object.keys(baseMetrics).forEach(key => {
    const metric = baseMetrics[key];
    metric.changeType = metric.change > 0 ? 'positive' : metric.change < 0 ? 'negative' : 'neutral';
  });
  
  res.json({
    data: baseMetrics,
    timeRange,
    filters: JSON.parse(filters),
    timestamp: now.toISOString()
  });
});

// Working Capital API endpoints
app.get('/api/working-capital/diagnostics', (req, res) => {
  const diagnosticsData = {
    overallHealthScore: Math.round((75 + Math.random() * 25) * 10) / 10,
    dataQuality: {
      overallScore: Math.round((80 + Math.random() * 20) * 10) / 10,
      completeness: Math.round((85 + Math.random() * 15) * 10) / 10,
      accuracy: Math.round((90 + Math.random() * 10) * 10) / 10,
      freshness: Math.round((75 + Math.random() * 25) * 10) / 10
    },
    modelAccuracy: {
      overallAccuracy: Math.random() > 0.7 ? 'good' : 'excellent',
      cashFlowModel: Math.round((85 + Math.random() * 15) * 10) / 10,
      demandForecast: Math.round((80 + Math.random() * 20) * 10) / 10,
      workingCapitalModel: Math.round((88 + Math.random() * 12) * 10) / 10
    },
    performanceMetrics: {
      status: Math.random() > 0.6 ? 'optimal' : 'good',
      responseTime: Math.round((50 + Math.random() * 100) * 10) / 10,
      throughput: Math.round((95 + Math.random() * 5) * 10) / 10,
      availability: Math.round((99 + Math.random() * 1) * 100) / 100
    },
    alerts: generateRandomAlerts()
  };
  
  res.json({
    data: diagnosticsData,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/working-capital/projections', (req, res) => {
  const { timeRange = '12M', scenario = 'baseline' } = req.query;
  
  const projections = generateCashFlowProjections(timeRange, scenario);
  
  res.json({
    data: projections,
    timeRange,
    scenario,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/working-capital/kpis', (req, res) => {
  const kpis = {
    daysSalesOutstanding: {
      current: Math.round((25 + Math.random() * 10) * 10) / 10,
      target: 30,
      trend: Math.random() > 0.5 ? 'improving' : 'declining',
      change: Math.round((Math.random() * 4 - 2) * 10) / 10
    },
    daysPayableOutstanding: {
      current: Math.round((35 + Math.random() * 10) * 10) / 10,
      target: 45,
      trend: Math.random() > 0.5 ? 'improving' : 'declining', 
      change: Math.round((Math.random() * 6 - 3) * 10) / 10
    },
    inventoryTurnover: {
      current: Math.round((8 + Math.random() * 4) * 10) / 10,
      target: 12,
      trend: Math.random() > 0.5 ? 'improving' : 'declining',
      change: Math.round((Math.random() * 2 - 1) * 10) / 10
    },
    cashConversionCycle: {
      current: Math.round((45 + Math.random() * 15) * 10) / 10,
      target: 40,
      trend: Math.random() > 0.5 ? 'improving' : 'declining',
      change: Math.round((Math.random() * 8 - 4) * 10) / 10
    },
    workingCapitalRatio: {
      current: Math.round((1.2 + Math.random() * 0.8) * 100) / 100,
      target: 1.5,
      trend: Math.random() > 0.5 ? 'improving' : 'declining',
      change: Math.round((Math.random() * 0.2 - 0.1) * 100) / 100
    }
  };
  
  res.json({
    data: kpis,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/demand-forecast/:seriesId', (req, res) => {
  const { seriesId } = req.params;
  const { models, scenario = 'baseline', horizon = 30 } = req.query;
  
  const forecastData = generateDemandForecast(seriesId, {
    models: models ? models.split(',') : ['Ensemble', 'ARIMA'],
    scenario,
    horizon: parseInt(horizon)
  });
  
  res.json({
    data: forecastData,
    seriesId,
    timestamp: new Date().toISOString()
  });
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API is running',
    sseConnections: sseClients.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint', path: req.path });
});

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Serve index.html for all other routes (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server - NIXPACKS requires binding to all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('SENTIA MANUFACTURING DASHBOARD');
  console.log(`Server running on port ${PORT}`);
  console.log(`Server listening on: http://0.0.0.0:${PORT}`);
  console.log('Using NIXPACKS builder');
  console.log('========================================');
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});