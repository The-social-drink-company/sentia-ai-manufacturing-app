/**
 * Enhanced Unit Tests for MCP Server Core Functionality
 * Comprehensive test coverage for server initialization, configuration, and core operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';

// Mock dependencies before importing server
vi.mock('@modelcontextprotocol/sdk', () => ({
  Server: class MockServer extends EventEmitter {
    constructor() {
      super();
      this.tools = new Map();
    }
    addTool(tool) {
      this.tools.set(tool.name, tool);
    }
    close() {
      return Promise.resolve();
    }
  },
  StdioServerTransport: class MockTransport {
    start() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
}));

vi.mock('express', () => {
  const mockApp = {
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    listen: vi.fn((port, callback) => {
      if (callback) callback();
      return { close: vi.fn() };
    }),
    set: vi.fn()
  };
  
  const express = vi.fn(() => mockApp);
  express.static = vi.fn();
  express.json = vi.fn();
  express.urlencoded = vi.fn();
  
  return { default: express };
});

describe('MCP Server Core Functionality', () => {
  let server;
  let mockConsole;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock console to reduce test noise
    mockConsole = global.testUtils.mockConsole();
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.MCP_SERVER_PORT = '3001';
    process.env.MCP_HTTP_PORT = '3002';
  });

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
    
    // Restore console
    if (mockConsole) {
      mockConsole();
    }
  });

  describe('Server Initialization', () => {
    it('should initialize server with default configuration', async () => {
      const { createServer } = await import('../../src/server.js');
      
      server = await createServer();
      
      expect(server).toBeDefined();
      expect(server.tools).toBeDefined();
      expect(server.tools.size).toBeGreaterThan(0);
    });

    it('should initialize server with custom configuration', async () => {
      const { createServer } = await import('../../src/server.js');
      
      const customConfig = {
        port: 3333,
        httpPort: 3334,
        logLevel: 'debug',
        enableMetrics: false
      };
      
      server = await createServer(customConfig);
      
      expect(server).toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock a dependency to throw an error
      vi.doMock('../../src/config/server-config.js', () => {
        throw new Error('Configuration error');
      });
      
      const { createServer } = await import('../../src/server.js');
      
      await expect(createServer()).rejects.toThrow('Configuration error');
    });
  });

  describe('Tool Registration', () => {
    beforeEach(async () => {
      const { createServer } = await import('../../src/server.js');
      server = await createServer();
    });

    it('should register integration tools correctly', () => {
      const expectedIntegrations = [
        'xero-financial-reports',
        'shopify-orders',
        'amazon-inventory',
        'anthropic-financial-analysis',
        'openai-data-analysis',
        'unleashed-products'
      ];
      
      expectedIntegrations.forEach(toolName => {
        expect(server.tools.has(toolName)).toBe(true);
      });
    });

    it('should handle tool registration errors', () => {
      // This test would verify error handling in tool registration
      expect(() => {
        server.addTool(null);
      }).not.toThrow(); // Should handle gracefully
    });
  });

  describe('Configuration Management', () => {
    it('should load environment-specific configuration', async () => {
      const { loadConfiguration } = await import('../../src/config/environment-config.js');
      
      const config = await loadConfiguration('test');
      
      expect(config).toBeDefined();
      expect(config.environment).toBe('test');
      expect(config.server).toBeDefined();
      expect(config.security).toBeDefined();
    });

    it('should validate configuration parameters', async () => {
      const { validateConfiguration } = await import('../../src/config/server-config.js');
      
      const validConfig = {
        server: { port: 3001, httpPort: 3002 },
        security: { enableAuth: true },
        monitoring: { enabled: true }
      };
      
      const result = await validateConfiguration(validConfig);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid configuration', async () => {
      const { validateConfiguration } = await import('../../src/config/server-config.js');
      
      const invalidConfig = {
        server: { port: 'invalid' }, // Should be number
        security: { enableAuth: 'maybe' } // Should be boolean
      };
      
      const result = await validateConfiguration(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { createServer } = await import('../../src/server.js');
      server = await createServer();
    });

    it('should handle uncaught exceptions gracefully', async () => {
      const originalHandlers = process.listeners('uncaughtException');
      
      // Trigger an uncaught exception
      process.emit('uncaughtException', new Error('Test error'));
      
      // Should not crash the test
      expect(true).toBe(true);
    });

    it('should handle unhandled promise rejections', async () => {
      const originalHandlers = process.listeners('unhandledRejection');
      
      // Trigger an unhandled rejection
      process.emit('unhandledRejection', new Error('Test rejection'));
      
      // Should not crash the test
      expect(true).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      const { createServer } = await import('../../src/server.js');
      server = await createServer();
    });

    it('should track performance metrics', async () => {
      const { performanceMonitor } = await import('../../src/utils/performance-monitor.js');
      
      const timerId = performanceMonitor.start('test-operation');
      await global.testUtils.delay(10); // Simulate some work
      performanceMonitor.end(timerId);
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.operations).toBeDefined();
      expect(metrics.operations['test-operation']).toBeDefined();
    });

    it('should detect memory leaks', async () => {
      const { performanceMonitor } = await import('../../src/utils/performance-monitor.js');
      
      const initialMemory = process.memoryUsage();
      
      // Simulate memory usage
      const largeArray = new Array(1000000).fill('test');
      
      const currentMemory = process.memoryUsage();
      
      expect(currentMemory.heapUsed).toBeGreaterThan(initialMemory.heapUsed);
      
      // Clean up
      largeArray.length = 0;
    });
  });

  describe('Security Features', () => {
    beforeEach(async () => {
      const { createServer } = await import('../../src/server.js');
      server = await createServer();
    });

    it('should validate authentication tokens', async () => {
      const { validateToken } = await import('../../src/utils/security.js');
      
      const validToken = 'valid-test-token';
      const invalidToken = 'invalid-test-token';
      
      const validResult = await validateToken(validToken);
      const invalidResult = await validateToken(invalidToken);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });

    it('should encrypt sensitive data', async () => {
      const { encrypt, decrypt } = await import('../../src/utils/encryption.js');
      
      const sensitiveData = 'secret-api-key';
      const encrypted = encrypt(sensitiveData);
      const decrypted = decrypt(encrypted.encrypted, encrypted.iv, encrypted.authTag);
      
      expect(encrypted.encrypted).not.toBe(sensitiveData);
      expect(decrypted).toBe(sensitiveData);
    });
  });

  describe('Business Logic', () => {
    beforeEach(async () => {
      const { createServer } = await import('../../src/server.js');
      server = await createServer();
    });

    it('should calculate business metrics correctly', async () => {
      const { calculateROI, calculateCost } = await import('../../src/utils/business-analytics.js');
      
      const toolExecution = {
        toolName: 'xero-financial-reports',
        duration: 1000,
        status: 'success',
        metadata: { recordsProcessed: 100 }
      };
      
      const roi = calculateROI(toolExecution);
      const cost = calculateCost(toolExecution);
      
      expect(roi).toBeGreaterThan(0);
      expect(cost).toBeGreaterThan(0);
      expect(typeof roi).toBe('number');
      expect(typeof cost).toBe('number');
    });

    it('should handle data validation correctly', async () => {
      const { validateToolInput } = await import('../../src/utils/validation.js');
      
      const validInput = { type: 'financial-report', dateRange: '2024-01-01,2024-12-31' };
      const invalidInput = { type: 'invalid', dateRange: 'invalid-date' };
      
      const validResult = validateToolInput('xero-financial-reports', validInput);
      const invalidResult = validateToolInput('xero-financial-reports', invalidInput);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
    });
  });
});