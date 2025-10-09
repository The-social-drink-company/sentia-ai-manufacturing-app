/**
 * DIAGNOSTIC SERVER - Minimal test server for Render deployment
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Diagnostic server is running',
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Diagnostic Server</title></head>
    <body>
      <h1>Diagnostic Server Running</h1>
      <p>Port: ${PORT}</p>
      <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
      <p>Check health: <a href="/health">/health</a></p>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Diagnostic server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});