#!/usr/bin/env node

// Railway Startup Script
// This script ensures proper environment setup before starting the main server

console.log('========================================');
console.log('RAILWAY STARTUP SCRIPT');
console.log('========================================');
console.log('Environment:', process.env.NODE_ENV || 'unknown');
console.log('Port:', process.env.PORT || 'not set');
console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'not set');
console.log('');

// Check critical environment variables
const critical = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL || process.env.DEV_DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY
};

let hasErrors = false;
Object.entries(critical).forEach(([key, value]) => {
  if (!value) {
    console.error(`ERROR: Missing critical variable: ${key}`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('');
  console.error('FATAL: Cannot start server without critical environment variables');
  console.error('Please configure these in Railway Dashboard -> Variables');
  process.exit(1);
}

console.log('All critical variables present, starting server...');
console.log('');

// Start the actual server
require('./server.js');