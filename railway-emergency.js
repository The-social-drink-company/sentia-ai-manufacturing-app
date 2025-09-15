/**
 * RAILWAY EMERGENCY FALLBACK SERVER
 * Absolute minimum server with zero dependencies except Express
 * Use this if main server fails
 */

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get PORT - Railway MUST provide this
const PORT = process.env.PORT;

if (!PORT) {
  console.error('ERROR: PORT environment variable not set by Railway!');
  console.error('This indicates Railway is not passing environment variables correctly.');
  // Use fallback but log the issue
  const FALLBACK_PORT = 3000;
  console.error(`Using fallback port ${FALLBACK_PORT} but this will likely fail on Railway!`);
}

const app = express();
const ACTUAL_PORT = PORT || 3000;

// Log everything for debugging
console.log('='.repeat(50));
console.log('RAILWAY EMERGENCY SERVER STARTING');
console.log('='.repeat(50));
console.log('Environment Variables:');
console.log('  PORT:', process.env.PORT || 'NOT SET (PROBLEM!)');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
console.log('  All env keys:', Object.keys(process.env).filter(k => k.includes('RAILWAY')));
console.log('='.repeat(50));

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// CRITICAL ENDPOINTS
app.get('/', (req, res) => {
  res.send(`
    <h1>Railway Emergency Server</h1>
    <p>Status: RUNNING</p>
    <p>Port: ${ACTUAL_PORT}</p>
    <p>ENV PORT: ${process.env.PORT || 'NOT SET'}</p>
    <p>Time: ${new Date().toISOString()}</p>
    <hr>
    <a href="/health">Health Check</a>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: ACTUAL_PORT,
    env_port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

// Alternative health endpoints Railway might check
app.get('/healthz', (req, res) => res.send('OK'));
app.get('/_health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve React app if it exists
const distPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(distPath)) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/health') && !req.path.startsWith('/api')) {
      res.sendFile(distPath);
    }
  });
}

// Start server
const server = app.listen(ACTUAL_PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('EMERGENCY SERVER STARTED SUCCESSFULLY');
  console.log(`Listening on: 0.0.0.0:${ACTUAL_PORT}`);
  console.log(`Health check: http://0.0.0.0:${ACTUAL_PORT}/health`);
  if (!process.env.PORT) {
    console.log('WARNING: Railway PORT not detected!');
  }
  console.log('='.repeat(50));
});

// Error handling
server.on('error', (error) => {
  console.error('SERVER ERROR:', error);
  process.exit(1);
});

// Keep alive logging
setInterval(() => {
  console.log(`[HEARTBEAT] ${new Date().toISOString()} - Port ${ACTUAL_PORT} - Env PORT: ${process.env.PORT || 'MISSING'}`);
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});