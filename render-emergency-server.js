/**
 * RENDER EMERGENCY SERVER
 * Ultra-minimal server for debugging 502 errors
 * This server has NO dependencies and minimal startup time
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 5000;
const distPath = join(__dirname, 'dist');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create server with minimal overhead
const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Health check - CRITICAL for Render
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'healthy',
      server: 'render-emergency',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'production'
    }));
  }

  // API status check
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      api: 'online',
      version: '1.0.0-emergency',
      timestamp: new Date().toISOString()
    }));
  }

  // API health check
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'healthy',
      api: true,
      database: 'not-connected',
      timestamp: new Date().toISOString()
    }));
  }

  // Serve static files from dist
  let filePath = req.url === '/' ? '/index.html' : req.url;

  // Remove query strings
  filePath = filePath.split('?')[0];

  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  const fullPath = join(distPath, filePath);

  // Check if dist exists
  if (!existsSync(distPath)) {
    console.error('WARNING: dist folder not found at', distPath);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Application not built',
      message: 'The dist folder is missing. Run npm run build.'
    }));
  }

  // Try to serve the file
  if (existsSync(fullPath)) {
    try {
      const ext = extname(fullPath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const content = readFileSync(fullPath);

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      console.error('Error reading file:', fullPath, error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  } else {
    // Fallback to index.html for client-side routing
    const indexPath = join(distPath, 'index.html');
    if (existsSync(indexPath)) {
      try {
        const content = readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } catch (error) {
        console.error('Error reading index.html:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

// Start server immediately
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('RENDER EMERGENCY SERVER STARTED');
  console.log('='.repeat(50));
  console.log('Port:', PORT);
  console.log('Time:', new Date().toISOString());
  console.log('Health:', `http://localhost:${PORT}/health`);
  console.log('Mode:', process.env.NODE_ENV || 'production');
  console.log('='.repeat(50));
});

// Handle errors gracefully
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});