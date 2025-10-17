#!/usr/bin/env node

/**
 * MCP SERVER STARTUP WRAPPER FOR RAILWAY
 * This file redirects Railway deployment to start the MCP server
 * instead of the main Express server
 */

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚂 Railway MCP Server Startup Wrapper')
console.log('🔄 Redirecting to MCP server in mcp-server directory...')

// Change to mcp-server directory and start the enterprise MCP server
const mcpServerPath = join(__dirname, 'mcp-server')
const serverScript = 'enterprise-server-simple.js'

console.log(`📁 MCP Server Path: ${mcpServerPath}`)
console.log(`🚀 Starting: ${serverScript}`)
console.log(`🌐 Port: ${process.env.PORT || 'not set'}`)
console.log(`🏭 Environment: ${process.env.NODE_ENV || 'development'}`)

// Spawn the MCP server process
const mcpProcess = spawn('node', [serverScript], {
  cwd: mcpServerPath,
  stdio: 'inherit',
  env: {
    ...process.env,
    // Ensure PORT is passed through
    PORT: process.env.PORT || '9000',
  },
})

mcpProcess.on('error', error => {
  console.error('❌ Failed to start MCP server:', error)
  process.exit(1)
})

mcpProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`❌ MCP server exited with code ${code} (signal: ${signal})`)
    process.exit(code || 1)
  } else {
    console.log('✅ MCP server shut down gracefully')
    process.exit(0)
  }
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down MCP server...')
  mcpProcess.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down MCP server...')
  mcpProcess.kill('SIGINT')
})

// Prevent the wrapper from exiting immediately
setInterval(() => {
  // Keep alive - the actual MCP server handles all requests
}, 5000)
