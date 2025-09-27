/**
 * ULTRA MINIMAL RENDER SERVER
 * Absolutely minimal server with NO external dependencies
 * Created to bypass ALL startup issues and resolve 502 errors
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 10000; // Render uses port 10000
const distPath = join(__dirname, 'dist');

console.log('Starting Ultra Minimal Server...');
console.log('Port:', PORT);
console.log('Directory:', __dirname);
console.log('Dist Path:', distPath);

// Create the simplest possible server
const server = createServer((req, res) => {
  // Log every request for debugging
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  // CRITICAL: Health check must work for Render
  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({
      status: 'healthy',
      server: 'ultra-minimal',
      timestamp: new Date().toISOString(),
      port: PORT,
      env: process.env.NODE_ENV || 'production',
      version: '1.0.0-emergency'
    }));
  }

  // API endpoints return JSON (no database needed)
  if (req.url === '/api/status' || req.url === '/api/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({
      status: 'ok',
      api: 'online',
      database: 'bypassed',
      message: 'Ultra minimal server - no database connection'
    }));
  }

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Check if dist folder exists
  if (!existsSync(distPath)) {
    console.error('ERROR: dist folder not found at', distPath);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Build not found',
      message: 'The application has not been built. Run npm run build.',
      path: distPath
    }));
  }

  // Serve index.html for all routes (SPA)
  const indexPath = join(distPath, 'index.html');

  if (existsSync(indexPath)) {
    try {
      const content = readFileSync(indexPath);
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    } catch (error) {
      console.error('Error reading index.html:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  } else {
    console.error('ERROR: index.html not found at', indexPath);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('index.html not found - build may have failed');
  }
});

// Start server with absolute minimum configuration
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('ULTRA MINIMAL SERVER RUNNING');
  console.log('='.repeat(60));
  console.log(`Port: ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('Status: Ready to serve requests');
  console.log('='.repeat(60));
});

// Handle errors without crashing
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't exit - keep serving
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit - keep serving
});