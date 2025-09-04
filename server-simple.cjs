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