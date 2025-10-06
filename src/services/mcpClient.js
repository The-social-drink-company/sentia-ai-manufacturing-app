/**
 * MCP Client for Dashboard Integration
 * 
 * Provides a client library for secure communication with the MCP server
 * from the dashboard application. Handles authentication, request/response
 * processing, and error handling.
 * 
 * Features:
 * - Environment-aware server URLs
 * - JWT token management
 * - Automatic retry with exponential backoff
 * - Request/response logging
 * - Real-time data streaming
 * - Tool execution interface
 */

import axios from 'axios';
import { getMCPConfig } from '../../config/database-config.js';

class MCPClient {
  constructor() {
    this.config = getMCPConfig();
    this.baseURL = this.config.url;
    this.token = null;
    this.tokenExpiry = null;
    this.isAuthenticated = false;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sentia-Dashboard/3.0.0'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        await this.ensureAuthenticated();
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        console.error('MCP request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear and retry
          this.clearAuthentication();
          if (!error.config._retry) {
            error.config._retry = true;
            await this.ensureAuthenticated();
            error.config.headers.Authorization = `Bearer ${this.token}`;
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );

    console.log('MCPClient initialized', {
      baseURL: this.baseURL,
      environment: this.config.environment
    });
  }

  /**
   * Ensure we have a valid authentication token
   */
  async ensureAuthenticated() {
    if (this.isAuthenticated && this.token && this.tokenExpiry > Date.now()) {
      return; // Token is still valid
    }

    try {
      await this.authenticate();
    } catch (error) {
      console.error('MCP authentication failed:', error);
      throw new Error('Failed to authenticate with MCP server');
    }
  }

  /**
   * Authenticate with the MCP server
   */
  async authenticate() {
    try {
      const clientId = process.env.MCP_CLIENT_ID || 'sentia-dashboard';
      const clientSecret = this.config.auth?.jwt_secret || process.env.MCP_JWT_SECRET;
      
      if (!clientSecret) {
        throw new Error('MCP JWT secret not configured');
      }

      const response = await axios.post(`${this.baseURL}/api/dashboard/auth/token`, {
        clientId,
        clientSecret,
        environment: this.config.environment
      });

      if (response.data.access_token) {
        this.token = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        this.isAuthenticated = true;
        
        console.log('MCP authentication successful', {
          environment: this.config.environment,
          expiresIn: response.data.expires_in
        });
      } else {
        throw new Error('No access token received');
      }

    } catch (error) {
      console.error('MCP authentication error:', error.response?.data || error.message);
      this.clearAuthentication();
      throw error;
    }
  }

  /**
   * Clear authentication state
   */
  clearAuthentication() {
    this.token = null;
    this.tokenExpiry = null;
    this.isAuthenticated = false;
  }

  /**
   * Check MCP server health
   */
  async getHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/api/dashboard/health`);
      return response.data;
    } catch (error) {
      console.error('MCP health check failed:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get MCP server status and capabilities
   */
  async getStatus() {
    try {
      const response = await this.client.get('/api/dashboard/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get MCP status:', error);
      throw this.handleError(error, 'Failed to retrieve MCP server status');
    }
  }

  /**
   * Get available tools
   */
  async getTools() {
    try {
      const response = await this.client.get('/api/dashboard/tools');
      return response.data;
    } catch (error) {
      console.error('Failed to get MCP tools:', error);
      throw this.handleError(error, 'Failed to retrieve available tools');
    }
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName, arguments = {}, options = {}) {
    try {
      const response = await this.client.post('/api/dashboard/tools/execute', {
        tool: toolName,
        arguments,
        options
      });
      
      console.log('Tool executed successfully', {
        tool: toolName,
        requestId: response.data.requestId,
        executionTime: response.data.executionTime
      });
      
      return response.data;
    } catch (error) {
      console.error('Tool execution failed:', error);
      throw this.handleError(error, `Failed to execute tool: ${toolName}`);
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getRealtimeData(metrics = [], timeframe = '24h') {
    try {
      const response = await this.client.get('/api/dashboard/data/realtime', {
        params: { metrics: metrics.join(','), timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get realtime data:', error);
      throw this.handleError(error, 'Failed to retrieve real-time data');
    }
  }

  /**
   * Trigger data synchronization
   */
  async triggerSync(services = [], syncType = 'incremental', force = false) {
    try {
      const response = await this.client.post('/api/dashboard/sync/trigger', {
        services,
        syncType,
        force
      });
      
      console.log('Data sync triggered', {
        syncId: response.data.syncId,
        services,
        syncType
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw this.handleError(error, 'Failed to trigger data synchronization');
    }
  }

  /**
   * Get synchronization status
   */
  async getSyncStatus(syncId = null) {
    try {
      const url = syncId 
        ? `/api/dashboard/sync/status/${syncId}`
        : '/api/dashboard/sync/status';
        
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      throw this.handleError(error, 'Failed to retrieve synchronization status');
    }
  }

  /**
   * Specific tool execution methods
   */

  // Xero tools
  async getXeroContacts(options = {}) {
    return this.executeTool('xero_get_contacts', options);
  }

  async getXeroInvoices(options = {}) {
    return this.executeTool('xero_get_invoices', options);
  }

  async getXeroBankTransactions(options = {}) {
    return this.executeTool('xero_get_bank_transactions', options);
  }

  // Shopify tools
  async getShopifyOrders(region = 'uk', options = {}) {
    return this.executeTool('shopify_get_orders', { region, ...options });
  }

  async getShopifyProducts(region = 'uk', options = {}) {
    return this.executeTool('shopify_get_products', { region, ...options });
  }

  async getShopifyInventory(region = 'uk', options = {}) {
    return this.executeTool('shopify_get_inventory', { region, ...options });
  }

  // Amazon tools
  async getAmazonOrders(region = 'uk', options = {}) {
    return this.executeTool('amazon_get_orders', { region, ...options });
  }

  async getAmazonInventory(region = 'uk', options = {}) {
    return this.executeTool('amazon_get_inventory', { region, ...options });
  }

  // Unleashed tools
  async getUnleashedProducts(options = {}) {
    return this.executeTool('unleashed_get_products', options);
  }

  async getUnleashedInventory(options = {}) {
    return this.executeTool('unleashed_get_inventory', options);
  }

  async getUnleashedSalesOrders(options = {}) {
    return this.executeTool('unleashed_get_sales_orders', options);
  }

  // Analytics tools
  async analyzeWorkingCapital(timeframe = '90d', includeProjections = true) {
    return this.executeTool('analyze_working_capital', {
      timeframe,
      includeProjections
    });
  }

  async forecastDemand(productSKU, horizon = 30, method = 'hybrid') {
    return this.executeTool('forecast_demand', {
      productSKU,
      horizon,
      method
    });
  }

  async optimizeInventory(warehouse = null, includeRecommendations = true) {
    return this.executeTool('optimize_inventory', {
      warehouse,
      includeRecommendations
    });
  }

  /**
   * Real-time data streaming (WebSocket)
   */
  establishRealtimeConnection() {
    // TODO: Implement WebSocket connection for real-time updates
    const wsUrl = this.baseURL.replace('http', 'ws') + '/api/dashboard/stream';
    
    console.log('Establishing real-time connection:', wsUrl);
    
    // This would establish a WebSocket connection for real-time updates
    // Implementation depends on the specific WebSocket setup
    
    return {
      subscribe: (callback) => {
        console.log('Subscribing to real-time updates');
        // TODO: Implement subscription logic
      },
      unsubscribe: () => {
        console.log('Unsubscribing from real-time updates');
        // TODO: Implement unsubscription logic
      }
    };
  }

  /**
   * Error handling utility
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return new Error(data.error || data.message || `HTTP ${status}: ${defaultMessage}`);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('No response from MCP server - check connectivity');
    } else {
      // Something else happened
      return new Error(error.message || defaultMessage);
    }
  }

  /**
   * Utility methods
   */
  isConnected() {
    return this.isAuthenticated && this.token && this.tokenExpiry > Date.now();
  }

  getConnectionInfo() {
    return {
      baseURL: this.baseURL,
      environment: this.config.environment,
      authenticated: this.isAuthenticated,
      tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null
    };
  }
}

// Singleton instance
let mcpClient = null;

/**
 * Get or create MCP client instance
 */
export function getMCPClient() {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}

/**
 * Initialize MCP client with custom config
 */
export function initializeMCPClient(config = {}) {
  mcpClient = new MCPClient(config);
  return mcpClient;
}

/**
 * Check if MCP client is available
 */
export function isMCPAvailable() {
  try {
    const client = getMCPClient();
    return client.isConnected();
  } catch (error) {
    console.error('MCP availability check failed:', error);
    return false;
  }
}

export default MCPClient;