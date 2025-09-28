// SSE (Server-Sent Events) API Routes
// Enterprise-grade real-time data streaming for Sentia Manufacturing Dashboard

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Store active SSE connections
const clients = new Map();

// Middleware to configure SSE
const sseMiddleware = (req, res, next) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no' // For NGINX
  });
  
  // Send initial connection message
  res.write(':ok\n\n');
  
  next();
};

// Main SSE endpoint for live data
router.get('/live-data', sseMiddleware, (req, res) => {
  const clientId = uuidv4();
  const client = {
    id: clientId,
    response: res,
    lastActivity: Date.now(),
    subscriptions: new Set(['all'])
  };
  
  clients.set(clientId, client);
  console.log(`[SSE] Client connected: ${clientId}`);
  
  // Send initial connection event
  sendToClient(client, 'connected', {
    clientId,
    timestamp: new Date().toISOString(),
    message: 'Connected to Sentia Manufacturing Dashboard SSE'
  });
  
  // Start heartbeat
  const heartbeatInterval = setInterval(() => {
    sendToClient(client, 'heartbeat', {
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
      clientsConnected: clients.size
    });
  }, 15000);
  
  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
    console.log(`[SSE] Client disconnected: ${clientId}`);
  });
});

// Send event to specific client
function sendToClient(client, eventType, data) {
  try {
    const event = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    client.response.write(event);
    client.lastActivity = Date.now();
  } catch (error) {
    console.error(`[SSE] Error sending to client ${client.id}:`, error);
  }
}

// Broadcast to all connected clients
function broadcast(eventType, data, filter = null) {
  const timestamp = new Date().toISOString();
  const payload = { ...data, timestamp };
  
  clients.forEach(client => {
    if (!filter || filter(client)) {
      sendToClient(client, eventType, payload);
    }
  });
}

// KPI Update Simulator (replace with real data sources)
setInterval(() => {
  const kpiData = {
    metrics: {
      revenue: Math.round(Math.random() * 100000 + 500000),
      orders: Math.round(Math.random() * 200 + 800),
      efficiency: (Math.random() * 10 + 85).toFixed(1),
      quality: (Math.random() * 5 + 94).toFixed(1)
    },
    trends: {
      revenue: Math.random() > 0.5 ? 'up' : 'down',
      orders: Math.random() > 0.5 ? 'up' : 'down',
      efficiency: Math.random() > 0.5 ? 'up' : 'stable',
      quality: Math.random() > 0.5 ? 'up' : 'stable'
    }
  };
  
  broadcast('kpi-update', kpiData);
}, 10000);

// Production Update Simulator
setInterval(() => {
  const productionData = {
    unitsProduced: Math.round(Math.random() * 500 + 2000),
    efficiency: (Math.random() * 10 + 85).toFixed(1),
    currentShift: 'Day',
    machinesActive: Math.round(Math.random() * 5 + 15),
    bottlenecks: Math.random() > 0.7 ? ['Line 3', 'Packaging'] : []
  };
  
  broadcast('production-update', productionData);
}, 15000);

// Quality Metrics Update
setInterval(() => {
  const qualityData = {
    defects: Math.round(Math.random() * 10),
    qualityScore: (Math.random() * 5 + 94).toFixed(2),
    inspectionsPassed: Math.round(Math.random() * 50 + 450),
    inspectionsTotal: 500,
    alerts: Math.random() > 0.8 ? ['Quality threshold warning on Line 2'] : []
  };
  
  broadcast('quality-update', qualityData);
}, 20000);

// Inventory Update
setInterval(() => {
  const inventoryData = {
    totalSkus: Math.round(Math.random() * 100 + 400),
    lowStockItems: Math.round(Math.random() * 5),
    stockValue: Math.round(Math.random() * 500000 + 2000000),
    turnoverRate: (Math.random() * 2 + 3).toFixed(2),
    criticalItems: Math.random() > 0.9 ? ['SKU-A123', 'SKU-B456'] : []
  };
  
  broadcast('inventory-update', inventoryData);
}, 25000);

// Order Status Updates
setInterval(() => {
  const orderData = {
    newOrders: Math.round(Math.random() * 10),
    processing: Math.round(Math.random() * 50 + 100),
    shipped: Math.round(Math.random() * 30 + 70),
    delivered: Math.round(Math.random() * 20 + 50),
    returns: Math.round(Math.random() * 3),
    urgent: Math.random() > 0.7 ? Math.round(Math.random() * 3) : 0
  };
  
  broadcast('order-update', orderData);
}, 12000);

// Alert System (requires live alerting system integration)
setInterval(() => {
  const alertError = {
    error: 'Real-time alerts require live monitoring system integration',
    required_integrations: [
      'Alert Management System (AMS) for real-time notifications',
      'Monitoring and Observability platform (Datadog/New Relic)',
      'Business rules engine for alert generation',
      'Threshold monitoring systems',
      'Incident management platform (PagerDuty/OpsGenie)'
    ],
    status: 'disconnected',
    message: 'Connect monitoring systems for live alert notifications'
  };
  
  broadcast('alert-error', alertError);
}, 30000);

// System Health Check (requires live monitoring integration)
setInterval(() => {
  const healthError = {
    error: 'System health monitoring requires live infrastructure monitoring integration',
    required_integrations: [
      'Infrastructure monitoring platform (Datadog/New Relic/Prometheus)',
      'Application Performance Monitoring (APM) system',
      'Server resource monitoring agents',
      'Database health monitoring',
      'Service mesh monitoring for microservices health'
    ],
    status: 'disconnected',
    actual_uptime: process.uptime(),
    connected_clients: clients.size,
    message: 'Connect monitoring systems for live health metrics'
  };
  
  broadcast('health-error', healthError);
}, 60000);

// Endpoint to trigger manual updates
router.post('/trigger/:eventType', express.json(), (req, res) => {
  const { eventType } = req.params;
  const data = req.body;
  
  broadcast(eventType, data);
  
  res.json({
    success: true,
    event: eventType,
    clientsNotified: clients.size
  });
});

// Get connected clients info
router.get('/clients', (req, res) => {
  const clientInfo = Array.from(clients.values()).map(client => ({
    id: client.id,
    lastActivity: client.lastActivity,
    subscriptions: Array.from(client.subscriptions)
  }));
  
  res.json({
    total: clients.size,
    clients: clientInfo
  });
});

// Clean up inactive clients
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  clients.forEach((client, id) => {
    if (now - client.lastActivity > timeout) {
      console.log(`[SSE] Removing inactive client: ${id}`);
      clients.delete(id);
    }
  });
}, 60000);

export const sendSSEEvent = (eventType, data, filter) => broadcast(eventType, data, filter)

export default router;