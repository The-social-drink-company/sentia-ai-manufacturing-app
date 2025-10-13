/**
 * Integration Test Setup Configuration
 * Sets up test databases, external service mocks, and integration environment
 */

import { beforeAll, afterAll } from 'vitest';

// Mock external services for integration tests
global.mockServices = {
  xero: {
    enabled: false,
    baseURL: 'http://localhost:3999/mock-xero'
  },
  shopify: {
    enabled: false,
    baseURL: 'http://localhost:4000/mock-shopify'
  },
  amazon: {
    enabled: false,
    baseURL: 'http://localhost:4001/mock-amazon'
  },
  anthropic: {
    enabled: false,
    baseURL: 'http://localhost:4002/mock-anthropic'
  },
  openai: {
    enabled: false,
    baseURL: 'http://localhost:4003/mock-openai'
  },
  unleashed: {
    enabled: false,
    baseURL: 'http://localhost:4004/mock-unleashed'
  }
};

beforeAll(async () => {
  console.log('🔧 Setting up integration test environment');
  
  // Set integration test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MCP_SERVER_PORT = '3001';
  process.env.MCP_HTTP_PORT = '3002';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'sqlite::memory:';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  
  // Mock API credentials for testing
  process.env.XERO_CLIENT_ID = 'test_xero_client_id';
  process.env.XERO_CLIENT_SECRET = 'test_xero_client_secret';
  process.env.SHOPIFY_UK_ACCESS_TOKEN = 'test_shopify_uk_token';
  process.env.SHOPIFY_USA_ACCESS_TOKEN = 'test_shopify_usa_token';
  process.env.AMAZON_SP_API_CLIENT_ID = 'test_amazon_client_id';
  process.env.AMAZON_SP_API_CLIENT_SECRET = 'test_amazon_client_secret';
  process.env.ANTHROPIC_API_KEY = 'test_anthropic_key';
  process.env.OPENAI_API_KEY = 'test_openai_key';
  process.env.UNLEASHED_API_KEY = 'test_unleashed_key';
  process.env.UNLEASHED_API_SECRET = 'test_unleashed_secret';
  
  // JWT secrets for authentication testing
  process.env.JWT_SECRET = 'test_jwt_secret_key_integration';
  process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key';
  process.env.ENCRYPTION_KEY = 'test_aes_256_encryption_key_32_char';
  
  // Disable external monitoring in tests
  process.env.ENABLE_PERFORMANCE_MONITORING = 'false';
  process.env.ENABLE_BUSINESS_ANALYTICS = 'false';
  process.env.PROMETHEUS_METRICS_ENABLED = 'false';
  
  console.log('✅ Integration test environment setup completed');
});

afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment');
  
  // Clean up any test data or connections
  if (global.testServer) {
    await global.testServer.close();
  }
  
  if (global.testRedis) {
    await global.testRedis.disconnect();
  }
  
  console.log('✅ Integration test cleanup completed');
});

// Helper functions for integration tests
global.integrationTestUtils = {
  startTestServer: async () => {
    const { createServer } = await import('../../src/server.js');
    const server = await createServer({
      port: process.env.MCP_SERVER_PORT,
      httpPort: process.env.MCP_HTTP_PORT,
      logLevel: 'error'
    });
    global.testServer = server;
    return server;
  },
  
  stopTestServer: async () => {
    if (global.testServer) {
      await global.testServer.close();
      global.testServer = null;
    }
  },
  
  waitForServer: async (port, timeout = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) return true;
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Server on port ${port} did not start within ${timeout}ms`);
  },
  
  createApiRequest: (method, path, data = null) => ({
    method,
    url: `http://localhost:${process.env.MCP_HTTP_PORT}${path}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: data ? JSON.stringify(data) : undefined
  })
};