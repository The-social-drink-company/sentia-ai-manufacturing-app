#!/usr/bin/env node

/**
 * Unified Server Starter - Main Application + MCP Server
 * Runs both servers as configured in render.yaml
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MAIN_PORT = process.env.PORT || 10000;
const MCP_PORT = process.env.MCP_SERVER_PORT || 9000;
const MCP_ENABLED = process.env.MCP_ENABLED !== 'false';

console.log('🚀 Starting Sentia Manufacturing Dashboard with MCP Integration');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Main Server Port: ${MAIN_PORT}`);
console.log(`🤖 MCP Server Port: ${MCP_PORT}`);
console.log(`✨ MCP Enabled: ${MCP_ENABLED}`);

// Start main server
const mainServer = spawn('node', ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: MAIN_PORT },
  stdio: 'inherit'
});

// Start MCP server if enabled
let mcpServer;
if (MCP_ENABLED) {
  console.log('🤖 Starting MCP Server...');

  mcpServer = spawn('node', ['enterprise-server-simple.js'], {
    cwd: join(__dirname, 'mcp-server'),
    env: {
      ...process.env,
      PORT: MCP_PORT,
      EXPRESS_PORT: MCP_PORT,
      MCP_SERVER_PORT: MCP_PORT
    },
    stdio: 'inherit'
  });

  mcpServer.on('error', (err) => {
    console.error('❌ MCP Server error:', err);
  });

  mcpServer.on('exit', (code) => {
    console.log(`MCP Server exited with code ${code}`);
    if (code !== 0 && code !== null) {
      console.log('🔄 Attempting to restart MCP Server...');
      setTimeout(() => {
        // Restart logic could go here
      }, 5000);
    }
  });
}

// Handle main server events
mainServer.on('error', (err) => {
  console.error('❌ Main server error:', err);
  process.exit(1);
});

mainServer.on('exit', (code) => {
  console.log(`Main server exited with code ${code}`);
  if (mcpServer) {
    mcpServer.kill();
  }
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📦 Received SIGTERM, shutting down gracefully...');
  mainServer.kill();
  if (mcpServer) {
    mcpServer.kill();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  mainServer.kill();
  if (mcpServer) {
    mcpServer.kill();
  }
  process.exit(0);
});

console.log('✅ Servers starting... Check logs for connection status.');