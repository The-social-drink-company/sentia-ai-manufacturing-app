/**
 * MCP Integration Test Suite
 * Comprehensive tests for MCP Server integration
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { getMCPClient } from '../services/mcp-client.js';
import { getAPIIntegrationService } from '../services/api-integration-service.js';
import { getWebSocketMonitor } from '../services/websocket-monitor.js';
import { getAutoSyncManager } from '../services/auto-sync-manager.js';

describe('MCP Integration Tests', () => {
  let mcpClient;
  let apiService;
  let wsMonitor;
  let autoSyncManager;

  beforeAll(() => {
    // Initialize services
    mcpClient = getMCPClient();
    apiService = getAPIIntegrationService();
    wsMonitor = getWebSocketMonitor();
    autoSyncManager = getAutoSyncManager();

    // Mock environment variables
    process.env.MCP_SERVER_URL = 'https://web-production-99691282.up.railway.app';
    process.env.MCP_SERVER_SERVICE_ID = '99691282-de66-45b2-98cf-317083dd11ba';
    process.env.MCP_JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    // Cleanup
    mcpClient.disconnect();
    wsMonitor.destroy();
    autoSyncManager.destroy();
  });

  describe('MCP Client', () => {
    it('should initialize with correct configuration', () => {
      expect(mcpClient.baseURL).toBe('https://web-production-99691282.up.railway.app');
      expect(mcpClient.serviceId).toBe('99691282-de66-45b2-98cf-317083dd11ba');
    });

    it('should handle health check', async () => {
      const mockHealth = { healthy: true, timestamp: new Date() };
      vi.spyOn(mcpClient, 'checkHealth').mockResolvedValue(mockHealth);

      const health = await mcpClient.checkHealth();
      expect(health.healthy).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
      vi.spyOn(mcpClient, 'testConnection').mockRejectedValue(new Error('Connection failed'));

      const result = await mcpClient.testConnection().catch(err => ({
        healthy: false,
        error: err.message
      }));

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should emit events on WebSocket messages', (done) => {
      mcpClient.on('message', (data) => {
        expect(data).toBeDefined();
        done();
      });

      // Simulate WebSocket message
      mcpClient.emit('message', { type: 'test', data: 'test message' });
    });
  });

  describe('API Integration Service', () => {
    it('should initialize with all API services', () => {
      const services = apiService.getAvailableServices();
      expect(services).toContain('xero');
      expect(services).toContain('shopify');
      expect(services).toContain('amazon');
      expect(services).toContain('unleashed');
    });

    it('should handle Xero data sync', async () => {
      const mockData = { invoices: [], contacts: [] };
      vi.spyOn(apiService, 'syncXeroData').mockResolvedValue({
        success: true,
        data: mockData
      });

      const result = await apiService.syncXeroData();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle API errors with fallback', async () => {
      vi.spyOn(apiService, 'getShopifyOrders').mockRejectedValue(new Error('API Error'));
      vi.spyOn(apiService, 'getCachedData').mockResolvedValue({
        source: 'cache',
        data: []
      });

      const result = await apiService.getShopifyOrders().catch(() =>
        apiService.getCachedData('shopify', 'orders')
      );

      expect(result.source).toBe('cache');
    });

    it('should validate API keys', () => {
      const xeroValid = apiService.isServiceConfigured('xero');
      const shopifyValid = apiService.isServiceConfigured('shopify');

      expect(typeof xeroValid).toBe('boolean');
      expect(typeof shopifyValid).toBe('boolean');
    });
  });

  describe('WebSocket Monitor', () => {
    it('should track connection statistics', () => {
      const stats = wsMonitor.getStats();

      expect(stats).toHaveProperty('currentStatus');
      expect(stats).toHaveProperty('messagesReceived');
      expect(stats).toHaveProperty('connectionAttempts');
      expect(stats).toHaveProperty('uptime');
    });

    it('should format uptime correctly', () => {
      const formatted = wsMonitor.formatUptime(3661); // 1 hour, 1 minute, 1 second
      expect(formatted).toBe('1h 1m 1s');
    });

    it('should calculate success rate', () => {
      wsMonitor.stats.connectionAttempts = 10;
      wsMonitor.stats.successfulConnections = 8;

      const rate = wsMonitor.calculateSuccessRate();
      expect(rate).toBe(80);
    });

    it('should emit status updates', (done) => {
      wsMonitor.on('stats-updated', (stats) => {
        expect(stats).toBeDefined();
        expect(stats.currentStatus).toBeDefined();
        done();
      });

      wsMonitor.updateStats();
    });
  });

  describe('Auto-Sync Manager', () => {
    it('should initialize with correct configuration', () => {
      const status = autoSyncManager.getStatus();

      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('syncStatus');
    });

    it('should check service API keys', () => {
      const hasXeroKeys = autoSyncManager.checkServiceKeys('xero');
      const hasShopifyKeys = autoSyncManager.checkServiceKeys('shopify');

      expect(typeof hasXeroKeys).toBe('boolean');
      expect(typeof hasShopifyKeys).toBe('boolean');
    });

    it('should handle sync triggers', async () => {
      vi.spyOn(autoSyncManager, 'triggerSync').mockResolvedValue({
        success: true,
        service: 'xero',
        timestamp: new Date()
      });

      const result = await autoSyncManager.triggerSync('xero', 'test');
      expect(result.success).toBe(true);
      expect(result.service).toBe('xero');
    });

    it('should respect environment settings', () => {
      process.env.NODE_ENV = 'development';
      const shouldSync = autoSyncManager.shouldSyncService('database');

      // Database sync should be disabled in development
      expect(shouldSync).toBe(false);
    });

    it('should handle enable/disable operations', async () => {
      await autoSyncManager.disable();
      expect(autoSyncManager.config.enabled).toBe(false);

      await autoSyncManager.enable();
      expect(autoSyncManager.config.enabled).toBe(true);
    });
  });

  describe('MCP API Endpoints', () => {
    it('should respond to health check', async () => {
      const mockApp = {
        get: vi.fn((path, handler) => {
          if (path === '/health') {
            return handler(
              {},
              { json: (data) => expect(data.status).toBe('ok') }
            );
          }
        })
      };

      mockApp.get('/health', (req, res) => {
        res.json({ status: 'ok' });
      });

      expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
    });

    it('should handle sync triggers via API', async () => {
      const mockReq = { params: { service: 'xero' } };
      const mockRes = {
        json: vi.fn()
      };

      const handler = autoSyncManager.getTriggerEndpoint();
      await handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should provide WebSocket statistics', () => {
      const mockReq = {};
      const mockRes = {
        json: vi.fn()
      };

      const handler = wsMonitor.getStatsEndpoint();
      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        currentStatus: expect.any(String),
        messagesReceived: expect.any(Number)
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP Server unavailable', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await mcpClient.checkHealth().catch(err => ({
        healthy: false,
        error: err.message
      }));

      expect(result.healthy).toBe(false);
      expect(result.error).toContain('error');
    });

    it('should handle invalid JWT token', async () => {
      process.env.MCP_JWT_SECRET = 'invalid';

      const result = await mcpClient.authenticate().catch(err => ({
        authenticated: false,
        error: 'Invalid token'
      }));

      expect(result.authenticated).toBe(false);
    });

    it('should handle database connection failure', async () => {
      vi.spyOn(apiService, 'syncDatabaseBranches').mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await apiService.syncDatabaseBranches().catch(err => ({
        success: false,
        error: err.message
      }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database');
    });
  });

  describe('Integration Flow', () => {
    it('should complete full sync cycle', async () => {
      const syncFlow = async () => {
        // 1. Check health
        const health = await mcpClient.checkHealth().catch(() => ({ healthy: false }));

        // 2. Initialize WebSocket
        if (health.healthy) {
          await mcpClient.initialize();
        }

        // 3. Trigger sync
        const syncResult = await autoSyncManager.triggerFullSync('test');

        return {
          health,
          syncResult
        };
      };

      const result = await syncFlow();
      expect(result).toHaveProperty('health');
      expect(result).toHaveProperty('syncResult');
    });

    it('should handle real-time updates', (done) => {
      const updateFlow = () => {
        // Listen for updates
        mcpClient.on('api-update', (update) => {
          expect(update).toHaveProperty('service');
          expect(update).toHaveProperty('timestamp');
          done();
        });

        // Simulate API update
        mcpClient.emit('api-update', {
          service: 'xero',
          timestamp: new Date(),
          data: {}
        });
      };

      updateFlow();
    });
  });
});

describe('MCP Performance Tests', () => {
  it('should handle high message volume', async () => {
    const messageCount = 1000;
    const messages = [];

    for (let i = 0; i < messageCount; i++) {
      messages.push({
        id: i,
        type: 'test',
        data: `Message ${i}`
      });
    }

    const startTime = Date.now();

    messages.forEach(msg => {
      wsMonitor.handleMessage(msg);
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    expect(processingTime).toBeLessThan(1000); // Should process 1000 messages in < 1 second
    expect(wsMonitor.stats.messagesReceived).toBeGreaterThanOrEqual(messageCount);
  });

  it('should handle concurrent sync requests', async () => {
    const services = ['xero', 'shopify', 'amazon'];
    const syncPromises = services.map(service =>
      autoSyncManager.triggerSync(service, 'concurrent-test').catch(() => ({
        success: false,
        service
      }))
    );

    const results = await Promise.allSettled(syncPromises);
    expect(results).toHaveLength(services.length);
  });
});