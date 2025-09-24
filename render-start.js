#!/usr/bin/env node

/**
 * RENDER START SCRIPT
 * Ensures proper server startup with all required environment variables
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('='.repeat(70));
console.log('SENTIA MANUFACTURING - RENDER STARTUP');
console.log('='.repeat(70));

// Set critical environment variables if not present
const ENV_DEFAULTS = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk',
  MCP_SERVER_URL: process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com',
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '/api',
  PORT: process.env.PORT || '5000'
};

// Apply defaults
Object.keys(ENV_DEFAULTS).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = ENV_DEFAULTS[key];
    console.log(`Setting ${key} = ${ENV_DEFAULTS[key]}`);
  } else {
    console.log(`Using ${key} = ${process.env[key]}`);
  }
});

console.log('='.repeat(70));

// Start the actual server
const serverProcess = spawn('node', ['render-server.js'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit',
  shell: false
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, forwarding to server');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, forwarding to server');
  serverProcess.kill('SIGINT');
});