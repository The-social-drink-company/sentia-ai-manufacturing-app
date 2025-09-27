/**
 * MCP Server Client Integration
 * Connects to Railway-hosted MCP Server for AI orchestration
 * Service ID: 99691282-de66-45b2-98cf-317083dd11ba
 */

import axios from 'axios';
import WebSocket from 'ws';
import EventEmitter from 'events';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class MCPServerClient extends EventEmitter {
  constructor() {
    super();
    this.baseURL = process.env.MCP_SERVER_URL || 'https://web-production-99691282.up.railway.app';
    this.serviceId = process.env.MCP_SERVER_SERVICE_ID || '99691282-de66-45b2-98cf-317083dd11ba';
    this.apiEndpoint = `${this.baseURL}/mcp`;
    this.healthEndpoint = `${this.baseURL}/health`;
    this.wsEndpoint = this.baseURL.replace('https:', 'wss:') + '/ws';

    this.jwtSecret = process.env.MCP_JWT_SECRET;
    this.ws = null;
    this.isConnected = false;
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;

    // Initialize axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-ID': this.serviceId,
        'Authorization': `Bearer ${this.jwtSecret}`
      }
    });

    // Initialize connection
    this.initialize();
  }

  async initialize() {
    try {
      // Check MCP Server health
      const healthCheck = await this.checkHealth();
      if (healthCheck.status === 'healthy') {
        logDebug('MCP Server connection established:', this.baseURL);

        // Initialize WebSocket for real-time updates
        if (process.env.MCP_ENABLE_WEBSOCKET === 'true') {
          this.initializeWebSocket();
        }
      }
    } catch (error) {
      logError('Failed to initialize MCP Server connection:', error.message);
      this.scheduleReconnect();
    }
  }

  initializeWebSocket() {
    try {
      this.ws = new WebSocket(this.wsEndpoint, {
        headers: {
          'Authorization': `Bearer ${this.jwtSecret}`,
          'X-Service-ID': this.serviceId
        }
      });

      this.ws.on(_'open', _() => {
        logDebug('WebSocket connection established with MCP Server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.ws.on(_'message', _(data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          logError('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on(_'close', _() => {
        logDebug('WebSocket connection closed');
        this.isConnected = false;
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.ws.on(_'error', _(error) => {
        logError('WebSocket error:', error);
        this.emit('error', error);
      });
    } catch (error) {
      logError('Failed to initialize WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  handleWebSocketMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'ai-response':
        this.emit('ai-response', data);
        break;
      case 'manufacturing-alert':
        this.emit('manufacturing-alert', data);
        break;
      case 'api-update':
        this.emit('api-update', data);
        break;
      case 'system-status':
        this.emit('system-status', data);
        break;
      default:
        this.emit('message', message);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logDebug(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(_() => {
        this.initialize();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      logError('Max reconnection attempts reached. MCP Server unavailable.');
      this.emit('max-reconnect-exceeded');
    }
  }

  // ====================
  // Health & Status
  // ====================

  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async getSystemStatus() {
    try {
      const response = await this.client.get('/mcp/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  // ====================
  // AI Manufacturing Tools
  // ====================

  async processManufacturingRequest(request) {
    try {
      const response = await this.client.post('/mcp/tools/ai-manufacturing-request', {
        request,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
      return response.data;
    } catch (error) {
      throw new Error(`Manufacturing request failed: ${error.message}`);
    }
  }

  async optimizeInventory(parameters) {
    try {
      const response = await this.client.post('/mcp/tools/optimize-inventory', {
        ...parameters,
        database: process.env.NEON_BRANCH
      });
      return response.data;
    } catch (error) {
      throw new Error(`Inventory optimization failed: ${error.message}`);
    }
  }

  async forecastDemand(parameters) {
    try {
      const response = await this.client.post('/mcp/tools/forecast-demand', {
        ...parameters,
        database: process.env.NEON_BRANCH
      });
      return response.data;
    } catch (error) {
      throw new Error(`Demand forecasting failed: ${error.message}`);
    }
  }

  async analyzeQuality(data) {
    try {
      const response = await this.client.post('/mcp/tools/analyze-quality', {
        data,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error(`Quality analysis failed: ${error.message}`);
    }
  }

  // ====================
  // API Integrations
  // ====================

  async callUnifiedAPI(service, method, endpoint, data = null) {
    try {
      const response = await this.client.post('/mcp/tools/unified-api-call', {
        service,
        method,
        endpoint,
        data,
        environment: process.env.NODE_ENV
      });
      return response.data;
    } catch (error) {
      throw new Error(`Unified API call failed: ${error.message}`);
    }
  }

  async syncXeroData() {
    try {
      const response = await this.client.post('/mcp/integrations/xero/sync', {
        database: process.env.NEON_BRANCH
      });
      return response.data;
    } catch (error) {
      throw new Error(`Xero sync failed: ${error.message}`);
    }
  }

  async syncShopifyData() {
    try {
      const response = await this.client.post('/mcp/integrations/shopify/sync', {
        database: process.env.NEON_BRANCH
      });
      return response.data;
    } catch (error) {
      throw new Error(`Shopify sync failed: ${error.message}`);
    }
  }

  async syncAmazonData() {
    try {
      const response = await this.client.post('/mcp/integrations/amazon/sync', {
        database: process.env.NEON_BRANCH
      });
      return response.data;
    } catch (error) {
      throw new Error(`Amazon sync failed: ${error.message}`);
    }
  }

  // ====================
  // Database Operations
  // ====================

  async queryDatabase(query, branch = null) {
    try {
      const response = await this.client.post('/mcp/database/query', {
        query,
        branch: branch || process.env.NEON_BRANCH,
        projectId: process.env.NEON_PROJECT_ID
      });
      return response.data;
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async syncDatabaseBranches() {
    try {
      const response = await this.client.post('/mcp/database/sync-branches', {
        branches: ['development', 'testing', 'production'],
        projectId: process.env.NEON_PROJECT_ID
      });
      return response.data;
    } catch (error) {
      throw new Error(`Branch sync failed: ${error.message}`);
    }
  }

  // ====================
  // Vector Database
  // ====================

  async searchVectorDatabase(query, category = null) {
    try {
      const response = await this.client.post('/mcp/vector/search', {
        query,
        category,
        limit: 10
      });
      return response.data;
    } catch (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  async storeInVectorDatabase(data, category) {
    try {
      const response = await this.client.post('/mcp/vector/store', {
        data,
        category,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error(`Vector storage failed: ${error.message}`);
    }
  }

  // ====================
  // Decision Engine
  // ====================

  async executeDecisionRule(rule, context) {
    try {
      const response = await this.client.post('/mcp/decision/execute', {
        rule,
        context,
        environment: process.env.NODE_ENV
      });
      return response.data;
    } catch (error) {
      throw new Error(`Decision execution failed: ${error.message}`);
    }
  }

  async getRecommendations(type, parameters) {
    try {
      const response = await this.client.post('/mcp/decision/recommend', {
        type,
        parameters,
        database: process.env.NEON_BRANCH
      });
      return response.data;
    } catch (error) {
      throw new Error(`Recommendation failed: ${error.message}`);
    }
  }

  // ====================
  // Monitoring & Metrics
  // ====================

  async getMetrics() {
    try {
      const response = await this.client.get('/mcp/metrics');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get metrics: ${error.message}`);
    }
  }

  async logEvent(event, data) {
    try {
      const response = await this.client.post('/mcp/events', {
        event,
        data,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        serviceId: this.serviceId
      });
      return response.data;
    } catch (error) {
      logError('Failed to log event:', error);
    }
  }

  // ====================
  // Utility Methods
  // ====================

  isHealthy() {
    return this.isConnected;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  async testConnection() {
    try {
      const health = await this.checkHealth();
      const status = await this.getSystemStatus();

      return {
        healthy: health.status === 'healthy',
        mcpServer: this.baseURL,
        serviceId: this.serviceId,
        ...health,
        ...status
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let mcpClient = null;

export const getMCPClient = () => {
  if (!mcpClient) {
    mcpClient = new MCPServerClient();
  }
  return mcpClient;
};

export default MCPServerClient;