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