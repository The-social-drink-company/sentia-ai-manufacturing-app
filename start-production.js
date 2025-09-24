#!/usr/bin/env node

/**
 * SENTIA MANUFACTURING DASHBOARD - PRODUCTION STARTUP SCRIPT
 * 
 * This script ensures both the main server and MCP server start properly
 * in the Railway production environment with correct port management.
 */

import { spawn } from 'child_process';
import process from 'process';

// Environment configuration
const MAIN_SERVER_PORT = process.env.PORT || 5000;
const MCP_SERVER_PORT = process.env.MCP_PORT || 9001;

console.log('🚀 Starting Sentia Manufacturing Dashboard Production Services...');
console.log(`📊 Main Server Port: ${MAIN_SERVER_PORT}`);
console.log(`🤖 MCP Server Port: ${MCP_SERVER_PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);

// Start main server
const mainServer = spawn('node', ['server.js'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    PORT: MAIN_SERVER_PORT,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});

// Start MCP server  
const mcpServer = spawn('node', ['mcp-server/enterprise-server-simple.js'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    MCP_PORT: MCP_SERVER_PORT,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});

// Handle main server output
mainServer.stdout.on('data', (data) => {
  console.log(`[MAIN] ${data.toString().trim()}`);
});

mainServer.stderr.on('data', (data) => {
  console.error(`[MAIN ERROR] ${data.toString().trim()}`);
});

// Handle MCP server output
mcpServer.stdout.on('data', (data) => {
  console.log(`[MCP] ${data.toString().trim()}`);
});

mcpServer.stderr.on('data', (data) => {
  console.error(`[MCP ERROR] ${data.toString().trim()}`);
});

// Handle process exits
mainServer.on('exit', (code, signal) => {
  console.error(`❌ Main server exited with code ${code}, signal ${signal}`);
  process.exit(1);
});

mcpServer.on('exit', (code, signal) => {
  console.error(`❌ MCP server exited with code ${code}, signal ${signal}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  mainServer.kill('SIGTERM');
  mcpServer.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  mainServer.kill('SIGINT');
  mcpServer.kill('SIGINT');
  process.exit(0);
});

// Startup confirmation
setTimeout(() => {
  console.log('✅ Production services startup initiated');
  console.log('🌐 Main Dashboard: http://localhost:' + MAIN_SERVER_PORT);
  console.log('🤖 MCP AI Server: http://localhost:' + MCP_SERVER_PORT);
  console.log('📋 Services should be ready for connections');
}, 2000);