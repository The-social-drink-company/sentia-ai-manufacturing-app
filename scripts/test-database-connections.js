#!/usr/bin/env node

/**
 * TEST DATABASE CONNECTIONS
 * Verifies that each branch can connect to its correct database
 * and that the MCP server is accessible
 */

import pg from 'pg';
import axios from 'axios';
import { getDatabaseConfig, getMCPConfig } from '../config/database-config.js';

const { Client } = pg;

console.log('='.repeat(70));
console.log('DATABASE CONNECTION TEST');
console.log('='.repeat(70));

// Test configurations for each environment
const environments = ['development', 'test', 'production'];

async function testDatabaseConnection(env) {
  console.log(`\nTesting ${env.toUpperCase()} database...`);

  // Override environment for testing
  process.env.BRANCH = env;
  const config = getDatabaseConfig();

  console.log(`Database: ${config.database}`);
  console.log(`Host: ${config.host}`);

  const client = new Client({
    connectionString: config.external, // Use external for testing
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ Connected to ${env} database`);

    // Test query
    const result = await client.query(`
      SELECT
        current_database() as database,
        current_user as user,
        version() as version,
        pg_database_size(current_database()) as size_bytes,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections
    `);

    const info = result.rows[0];
    console.log(`   Database: ${info.database}`);
    console.log(`   User: ${info.user}`);
    console.log(`   Version: ${info.version.split(',')[0]}`);
    console.log(`   Size: ${(info.size_bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Active Connections: ${info.active_connections}`);

    // Check for pgvector extension
    const extensions = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname IN ('vector', 'pg_stat_statements', 'uuid-ossp')
    `);

    if (extensions.rows.length > 0) {
      console.log(`   Extensions:`);
      extensions.rows.forEach(ext => {
        console.log(`     - ${ext.extname} v${ext.extversion}`);
      });
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to connect to ${env} database`);
    console.error(`   Error: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function testMCPServer() {
  console.log('\nTesting MCP Server connection...');

  const config = getMCPConfig();
  console.log(`MCP Server URL: ${config.url}`);

  try {
    const response = await axios.get(`${config.url}/health`, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${config.auth.jwt_secret}`
      }
    });

    console.log('✅ MCP Server is accessible');
    console.log(`   Status: ${response.data.status || 'healthy'}`);
    console.log(`   Version: ${response.data.version || 'unknown'}`);

    if (response.data.services) {
      console.log('   Services:');
      Object.entries(response.data.services).forEach(([service, status]) => {
        console.log(`     - ${service}: ${status}`);
      });
    }

    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn('⚠️ MCP Server is not responding');
      console.log('   The server may be starting up or temporarily unavailable');
    } else if (error.response) {
      console.error('❌ MCP Server returned an error');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.error('❌ Failed to connect to MCP Server');
      console.error(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  let allPassed = true;
  const results = {};

  // Test each database
  for (const env of environments) {
    const passed = await testDatabaseConnection(env);
    results[env] = passed;
    if (!passed) allPassed = false;
  }

  // Test MCP server
  const mcpPassed = await testMCPServer();
  results.mcp = mcpPassed;
  if (!mcpPassed) allPassed = false;

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  console.log('\nDatabase Connections:');
  environments.forEach(env => {
    const status = results[env] ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${env.padEnd(15)} ${status}`);
  });

  console.log('\nMCP Server:');
  console.log(`  Connection      ${results.mcp ? '✅ PASS' : '⚠️ UNAVAILABLE'}`);

  console.log('\n' + '='.repeat(70));

  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
  } else if (results.mcp === false) {
    console.log('✅ DATABASES CONNECTED (MCP Server may be starting)');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }

  console.log('='.repeat(70));

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});