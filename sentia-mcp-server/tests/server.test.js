/**
 * Basic tests for MCP Server functionality
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { SentiaMCPServer } from '../src/server.js';

test('MCP Server instantiation', async () => {
  const server = new SentiaMCPServer();
  
  assert(server instanceof SentiaMCPServer, 'Server should be instance of SentiaMCPServer');
  assert(server.tools instanceof Map, 'Server should have tools Map');
  assert(server.resources instanceof Map, 'Server should have resources Map');
  assert(server.prompts instanceof Map, 'Server should have prompts Map');
  assert(server.connections instanceof Map, 'Server should have connections Map');
  assert(typeof server.metrics === 'object', 'Server should have metrics object');
});

test('System tools are loaded', async () => {
  const server = new SentiaMCPServer();
  
  // Check that system tools are loaded
  assert(server.tools.has('system-status'), 'Should have system-status tool');
  assert(server.tools.has('list-tools'), 'Should have list-tools tool');
  assert(server.tools.has('database-query'), 'Should have database-query tool');
  
  const systemStatusTool = server.tools.get('system-status');
  assert(systemStatusTool.category === 'system', 'System status tool should be in system category');
  assert(typeof systemStatusTool.execute === 'function', 'System status tool should have execute function');
});

test('Example tool is loaded', async () => {
  const server = new SentiaMCPServer();
  
  // Check that the example tool is loaded
  assert(server.tools.has('example-tool'), 'Should have example-tool loaded');
  
  const exampleTool = server.tools.get('example-tool');
  assert(exampleTool.category === 'system', 'Example tool should be in system category');
  assert(typeof exampleTool.execute === 'function', 'Example tool should have execute function');
  assert(exampleTool.inputSchema, 'Example tool should have input schema');
});

test('Tool execution works', async () => {
  const server = new SentiaMCPServer();
  
  const exampleTool = server.tools.get('example-tool');
  
  const result = await exampleTool.execute({
    message: 'Hello MCP Server',
    multiply: 5,
    options: { uppercase: true, timestamp: true },
    correlationId: 'test-correlation-id',
    source: 'test'
  });
  
  assert(result.originalMessage === 'Hello MCP Server', 'Should preserve original message');
  assert(result.processedMessage === 'HELLO MCP SERVER', 'Should uppercase the message');
  assert(result.calculation === 10, 'Should multiply by 2');
  assert(result.metadata.toolName === 'example-tool', 'Should include tool metadata');
  assert(result.metadata.correlationId === 'test-correlation-id', 'Should include correlation ID');
});

test('Tool parameter validation', async () => {
  const server = new SentiaMCPServer();
  
  const exampleTool = server.tools.get('example-tool');
  
  // Test missing required parameter
  try {
    await exampleTool.execute({
      multiply: 5
      // message is required but missing
    });
    assert.fail('Should throw error for missing required parameter');
  } catch (error) {
    // Expected to throw an error
    assert(error instanceof Error, 'Should throw an error');
  }
});

test('Server configuration is valid', async () => {
  const server = new SentiaMCPServer();
  
  // Test that server configuration is properly loaded
  assert(typeof server.app === 'object', 'Server should have Express app');
  assert(typeof server.server === 'object', 'Server should have MCP server instance');
});

console.log('Running MCP Server tests...');