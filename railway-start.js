#!/usr/bin/env node

// Railway startup diagnostic script
console.log('========================================');
console.log('RAILWAY STARTUP DIAGNOSTIC');
console.log('========================================');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('');

// Check critical environment variables
console.log('Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('  PORT:', process.env.PORT || 'NOT SET');
console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  CLERK_PUBLISHABLE_KEY:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('');

// Check if server.js exists
const fs = require('fs');
const path = require('path');

const serverPath = path.join(process.cwd(), 'server.js');
if (fs.existsSync(serverPath)) {
  console.log(' server.js found at:', serverPath);
  console.log(' Starting Express server...');
  console.log('========================================');

  // Start the actual server
  require('./server.js');
} else {
  console.error(' ERROR: server.js not found!');
  console.error(' Current directory contents:');
  const files = fs.readdirSync(process.cwd());
  files.forEach(file => console.log('  -', file));

  // Fallback: Try to find server.js in other locations
  const possiblePaths = [
    './src/server.js',
    './api/server.js',
    './backend/server.js',
    '../server.js'
  ];

  let foundServer = false;
  for (const altPath of possiblePaths) {
    if (fs.existsSync(altPath)) {
      console.log(` Found server at alternate location: ${altPath}`);
      console.log(' Starting server from:', altPath);
      require(altPath);
      foundServer = true;
      break;
    }
  }

  if (!foundServer) {
    console.error(' FATAL: Cannot find server.js anywhere!');
    console.error(' Creating emergency fallback server...');

    // Emergency fallback server
    const express = require('express');
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.get('/health', (req, res) => {
      res.json({
        status: 'emergency',
        message: 'Emergency fallback server - server.js not found',
        env: process.env.NODE_ENV,
        port: PORT
      });
    });

    app.get('/', (req, res) => {
      res.send('Emergency server running - server.js not found');
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Emergency server running on port ${PORT}`);
    });
  }
}