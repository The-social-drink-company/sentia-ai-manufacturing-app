/**
 * MCP Integration API Routes
 * Provides endpoints for MCP Server integration, monitoring, and sync management
 */

import express from 'express';
import { getMCPClient } from '../services/mcp-client.js';
import { getAPIIntegrationService } from '../services/api-integration-service.js';
import { getWebSocketMonitor } from '../services/websocket-monitor.js';
import { getAutoSyncManager } from '../services/auto-sync-manager.js';

const router = express.Router();

// Service instances
const mcpClient = getMCPClient();
const apiService = getAPIIntegrationService();
const wsMonitor = getWebSocketMonitor();
const autoSyncManager = getAutoSyncManager();

// ====================
// Health & Status Endpoints
// ====================

/**
 * GET /api/mcp/health
 * Check MCP Server connection health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await mcpClient.checkHealth();
    res.json({
      status: 'ok',
      mcp: {
        connected: mcpClient.isHealthy(),
        url: process.env.MCP_SERVER_URL,
        serviceId: process.env.MCP_SERVER_SERVICE_ID,
        ...health
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'MCP Server health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/mcp/status
 * Get comprehensive MCP system status
 */
router.get('/status', async (req, res) => {
  try {
    const [mcpStatus, wsStatus, syncStatus] = await Promise.all([
      mcpClient.getSystemStatus(),
      wsMonitor.getHealthReport(),
      autoSyncManager.getStatus()
    ]);

    res.json({
      mcp: mcpStatus,
      websocket: wsStatus,
      autoSync: syncStatus,
      environment: process.env.NODE_ENV,
      neonBranch: process.env.NEON_BRANCH
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system status',
      error: error.message
    });
  }
});

// ====================
// WebSocket Monitoring
// ====================

/**
 * GET /api/mcp/websocket/status
 * Get WebSocket connection status
 */
router.get('/websocket/status', wsMonitor.getStatusEndpoint());

/**
 * GET /api/mcp/websocket/stats
 * Get WebSocket statistics
 */
router.get('/websocket/stats', wsMonitor.getStatsEndpoint());

/**
 * GET /api/mcp/websocket/history
 * Get WebSocket connection and message history
 */
router.get('/websocket/history', wsMonitor.getHistoryEndpoint());

/**
 * POST /api/mcp/websocket/reconnect
 * Force WebSocket reconnection
 */
router.post('/websocket/reconnect', (req, res) => {
  wsMonitor.reconnect();
  res.json({
    status: 'ok',
    message: 'WebSocket reconnection initiated'
  });
});

// ====================
// Auto-Sync Management
// ====================

/**
 * GET /api/mcp/sync/status
 * Get auto-sync status
 */
router.get('/sync/status', autoSyncManager.getStatusEndpoint());

/**
 * POST /api/mcp/sync/trigger/:service
 * Trigger sync for specific service
 */
router.post('/sync/trigger/:service', autoSyncManager.getTriggerEndpoint());

/**
 * POST /api/mcp/sync/full
 * Trigger full sync of all services
 */
router.post('/sync/full', autoSyncManager.getFullSyncEndpoint());

/**
 * POST /api/mcp/sync/enable
 * Enable auto-sync
 */
router.post('/sync/enable', async (req, res) => {
  await autoSyncManager.enable();
  res.json({
    status: 'ok',
    message: 'Auto-sync enabled',
    currentStatus: autoSyncManager.getStatus()
  });
});

/**
 * POST /api/mcp/sync/disable
 * Disable auto-sync
 */
router.post('/sync/disable', async (req, res) => {
  await autoSyncManager.disable();
  res.json({
    status: 'ok',
    message: 'Auto-sync disabled',
    currentStatus: autoSyncManager.getStatus()
  });
});

// ====================
// AI Manufacturing Tools
// ====================

/**
 * POST /api/mcp/ai/manufacturing-request
 * Process manufacturing request through AI
 */
router.post('/ai/manufacturing-request', async (req, res) => {
  try {
    const { request } = req.body;

    if (!request) {
      return res.status(400).json({
        status: 'error',
        message: 'Request parameter is required'
      });
    }

    const result = await mcpClient.processManufacturingRequest(request);
    res.json({
      status: 'ok',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Manufacturing request failed',
      error: error.message
    });
  }
});

/**
 * POST /api/mcp/ai/optimize-inventory
 * Optimize inventory using AI
 */
router.post('/ai/optimize-inventory', async (req, res) => {
  try {
    const parameters = req.body;
    const result = await mcpClient.optimizeInventory(parameters);
    res.json({
      status: 'ok',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Inventory optimization failed',
      error: error.message
    });
  }
});

/**
 * POST /api/mcp/ai/forecast-demand
 * Forecast demand using AI
 */
router.post('/ai/forecast-demand', async (req, res) => {
  try {
    const parameters = req.body;
    const result = await mcpClient.forecastDemand(parameters);
    res.json({
      status: 'ok',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Demand forecasting failed',
      error: error.message
    });
  }
});

/**
 * POST /api/mcp/ai/analyze-quality
 * Analyze quality data using AI
 */
router.post('/ai/analyze-quality', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        status: 'error',
        message: 'Data parameter is required'
      });
    }

    const result = await mcpClient.analyzeQuality(data);
    res.json({
      status: 'ok',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Quality analysis failed',
      error: error.message
    });
  }
});

// ====================
// API Integration Endpoints
// ====================

/**
 * GET /api/mcp/xero/invoices
 * Get Xero invoices
 */
router.get('/xero/invoices', async (req, res) => {
  try {
    const invoices = await apiService.getXeroInvoices(req.query);
    res.json({
      status: 'ok',
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Xero invoices',
      error: error.message
    });
  }
});

/**
 * GET /api/mcp/xero/contacts
 * Get Xero contacts
 */
router.get('/xero/contacts', async (req, res) => {
  try {
    const contacts = await apiService.getXeroContacts(req.query);
    res.json({
      status: 'ok',
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Xero contacts',
      error: error.message
    });
  }
});

/**
 * GET /api/mcp/shopify/orders
 * Get Shopify orders
 */
router.get('/shopify/orders', async (req, res) => {
  try {
    const orders = await apiService.getShopifyOrders(req.query);
    res.json({
      status: 'ok',
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Shopify orders',
      error: error.message
    });
  }
});

/**
 * GET /api/mcp/shopify/products
 * Get Shopify products
 */
router.get('/shopify/products', async (req, res) => {
  try {
    const products = await apiService.getShopifyProducts(req.query);
    res.json({
      status: 'ok',
      data: products
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Shopify products',
      error: error.message
    });
  }
});

/**
 * GET /api/mcp/shopify/inventory
 * Get Shopify inventory
 */
router.get('/shopify/inventory', async (req, res) => {
  try {
    const { locationId } = req.query;
    const inventory = await apiService.getShopifyInventory(locationId);
    res.json({
      status: 'ok',
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Shopify inventory',
      error: error.message
    });
  }
});

/**
 * GET /api/mcp/amazon/orders
 * Get Amazon orders
 */
router.get('/amazon/orders', async (req, res) => {
  try {
    const orders = await apiService.getAmazonOrders(req.query);
    res.json({
      status: 'ok',
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Amazon orders',
      error: error.message
    });
  }
});

/**
 * GET /api/mcp/amazon/inventory
 * Get Amazon inventory
 */
router.get('/amazon/inventory', async (req, res) => {
  try {
    const inventory = await apiService.getAmazonInventory(req.query);
    res.json({
      status: 'ok',
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Amazon inventory',
      error: error.message
    });
  }
});

// ====================
// Vector Database
// ====================

/**
 * POST /api/mcp/vector/search
 * Search vector database
 */
router.post('/vector/search', async (req, res) => {
  try {
    const { query, category } = req.body;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameter is required'
      });
    }

    const results = await mcpClient.searchVectorDatabase(query, category);
    res.json({
      status: 'ok',
      results
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Vector search failed',
      error: error.message
    });
  }
});

/**
 * POST /api/mcp/vector/store
 * Store data in vector database
 */
router.post('/vector/store', async (req, res) => {
  try {
    const { data, category } = req.body;

    if (!data || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Data and category parameters are required'
      });
    }

    const result = await mcpClient.storeInVectorDatabase(data, category);
    res.json({
      status: 'ok',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Vector storage failed',
      error: error.message
    });
  }
});

// ====================
// Decision Engine
// ====================

/**
 * POST /api/mcp/decision/execute
 * Execute decision rule
 */
router.post('/decision/execute', async (req, res) => {
  try {
    const { rule, context } = req.body;

    if (!rule || !context) {
      return res.status(400).json({
        status: 'error',
        message: 'Rule and context parameters are required'
      });
    }

    const result = await mcpClient.executeDecisionRule(rule, context);
    res.json({
      status: 'ok',
      result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Decision execution failed',
      error: error.message
    });
  }
});

/**
 * POST /api/mcp/decision/recommend
 * Get AI recommendations
 */
router.post('/decision/recommend', async (req, res) => {
  try {
    const { type, parameters } = req.body;

    if (!type || !parameters) {
      return res.status(400).json({
        status: 'error',
        message: 'Type and parameters are required'
      });
    }

    const recommendations = await mcpClient.getRecommendations(type, parameters);
    res.json({
      status: 'ok',
      recommendations
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Recommendation generation failed',
      error: error.message
    });
  }
});

// ====================
// Metrics & Monitoring
// ====================

/**
 * GET /api/mcp/metrics
 * Get MCP Server metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await mcpClient.getMetrics();
    res.json({
      status: 'ok',
      metrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get metrics',
      error: error.message
    });
  }
});

/**
 * POST /api/mcp/events
 * Log event to MCP Server
 */
router.post('/events', async (req, res) => {
  try {
    const { event, data } = req.body;

    if (!event) {
      return res.status(400).json({
        status: 'error',
        message: 'Event parameter is required'
      });
    }

    await mcpClient.logEvent(event, data);
    res.json({
      status: 'ok',
      message: 'Event logged successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to log event',
      error: error.message
    });
  }
});

export default router;