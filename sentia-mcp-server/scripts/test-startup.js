#!/usr/bin/env node

/**
 * MCP Server Startup Test Script
 * 
 * This script helps identify startup issues by testing individual components
 * and providing detailed error information for troubleshooting.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { createLogger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const logger = createLogger();

/**
 * Test configuration loading
 */
async function testConfiguration() {
  console.log('=== Testing Configuration ===');
  
  try {
    const { SERVER_CONFIG, validateConfigLegacy } = await import('../src/config/server-config.js');
    
    console.log('✓ Configuration module loaded');
    console.log('Config:', {
      environment: SERVER_CONFIG.server.environment,
      port: SERVER_CONFIG.server.port,
      host: SERVER_CONFIG.server.host,
      transport: SERVER_CONFIG.transport.type
    });
    
    try {
      validateConfigLegacy();
      console.log('✓ Configuration validation passed');
    } catch (error) {
      console.log('⚠ Configuration validation warnings:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ Configuration test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

/**
 * Test database connectivity
 */
async function testDatabase() {
  console.log('\n=== Testing Database ===');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('⚠ No DATABASE_URL found - skipping database test');
    return true;
  }
  
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      max: 1,
      connectionTimeoutMillis: 5000
    });
    
    console.log('✓ Database pool created');
    
    const client = await pool.connect();
    console.log('✓ Database connection established');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('✓ Database query executed');
    console.log('Database info:', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    
    client.release();
    await pool.end();
    console.log('✓ Database connection closed');
    
    return true;
  } catch (error) {
    console.error('✗ Database test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    });
    return false;
  }
}

/**
 * Test server instantiation
 */
async function testServerCreation() {
  console.log('\n=== Testing Server Creation ===');
  
  try {
    console.log('Loading SentiaMCPServer class...');
    const { SentiaMCPServer } = await import('../src/server.js');
    console.log('✓ SentiaMCPServer class loaded');
    
    console.log('Creating server instance...');
    const server = new SentiaMCPServer();
    console.log('✓ Server instance created');
    
    console.log('Server details:', {
      toolsLoaded: server.tools?.size || 0,
      promptsLoaded: server.prompts?.size || 0,
      connectionsActive: server.connections?.size || 0
    });
    
    return { success: true, server };
  } catch (error) {
    console.error('✗ Server creation failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    return { success: false, error };
  }
}

/**
 * Test tool loading
 */
async function testToolLoading() {
  console.log('\n=== Testing Tool Loading ===');
  
  const toolsDir = join(__dirname, '..', 'src', 'tools');
  
  try {
    if (!existsSync(toolsDir)) {
      console.log('⚠ Tools directory does not exist:', toolsDir);
      return true;
    }
    
    console.log('Tools directory found:', toolsDir);
    
    // Test individual tool imports
    const { readdirSync } = await import('fs');
    const toolFiles = readdirSync(toolsDir).filter(file => file.endsWith('.js'));
    
    console.log('Found tool files:', toolFiles.length);
    
    for (const toolFile of toolFiles.slice(0, 3)) { // Test first 3 tools
      try {
        const toolPath = join(toolsDir, toolFile);
        const toolModule = await import(toolPath);
        console.log(`✓ Loaded tool: ${toolFile}`);
      } catch (error) {
        console.error(`✗ Failed to load tool ${toolFile}:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('✗ Tool loading test failed:', error.message);
    return false;
  }
}

/**
 * Test network binding
 */
async function testNetworkBinding() {
  console.log('\n=== Testing Network Binding ===');
  
  try {
    const http = await import('http');
    const express = await import('express');
    
    const app = express.default();
    app.get('/test', (req, res) => res.json({ status: 'ok' }));
    
    const port = process.env.MCP_SERVER_PORT || 3001;
    const host = process.env.MCP_SERVER_HOST || '0.0.0.0';
    
    console.log(`Testing binding to ${host}:${port}...`);
    
    const server = await new Promise((resolve, reject) => {
      const srv = http.createServer(app);
      srv.listen(port, host, () => {
        console.log('✓ Network binding successful');
        resolve(srv);
      });
      srv.on('error', reject);
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Binding timeout')), 5000);
    });
    
    // Test the server
    const testUrl = `http://localhost:${port}/test`;
    console.log('Testing HTTP request...');
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      console.log('✓ HTTP request successful:', data);
    } catch (fetchError) {
      console.log('⚠ HTTP request failed:', fetchError.message);
    }
    
    // Close the server
    server.close();
    console.log('✓ Test server closed');
    
    return true;
  } catch (error) {
    console.error('✗ Network binding test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔧 MCP Server Startup Diagnostic Tool\n');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Platform:', process.platform);
  console.log('Node.js:', process.version);
  console.log('Process ID:', process.pid);
  console.log('Working Directory:', process.cwd());
  console.log('');
  
  const results = [];
  
  // Run tests in sequence
  results.push({ name: 'Configuration', success: await testConfiguration() });
  results.push({ name: 'Database', success: await testDatabase() });
  results.push({ name: 'Tool Loading', success: await testToolLoading() });
  results.push({ name: 'Network Binding', success: await testNetworkBinding() });
  
  const serverTest = await testServerCreation();
  results.push({ name: 'Server Creation', success: serverTest.success });
  
  // Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✓' : '✗'} ${result.name}`);
  });
  
  console.log(`\nPassed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The server should start successfully.');
  } else {
    console.log('⚠ Some tests failed. Check the errors above for troubleshooting.');
  }
  
  return { passed, total, allPassed: passed === total };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error) => {
    console.error('\n💥 Test suite crashed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
}

export { runTests };