// Minimal Express server for Railway health check testing
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

console.log('========================================');
console.log('RAILWAY HEALTH TEST SERVER');
console.log('========================================');
console.log('Environment Variables:');
console.log('  PORT:', PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('========================================');

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('[HEALTH] Request received');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('[ROOT] Request received');
  res.send(`
    <html>
      <body>
        <h1>Railway Test Server Running</h1>
        <p>Environment: ${process.env.NODE_ENV || 'unknown'}</p>
        <p>Port: ${PORT}</p>
        <p><a href="/health">Check Health</a></p>
      </body>
    </html>
  `);
});

// API test endpoint
app.get('/api/test', (req, res) => {
  console.log('[API] Test request received');
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server listening on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
});

// Keep-alive heartbeat
setInterval(() => {
  console.log(`[HEARTBEAT] ${new Date().toISOString()} - Server alive on port ${PORT}`);
}, 30000);