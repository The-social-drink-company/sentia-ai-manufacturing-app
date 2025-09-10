/**
 * Railway MCP Service
 * Handles integration with Railway-hosted MCP server
 */

import fetch from 'node-fetch';

class RailwayMCPService {
  constructor() {
    this.baseUrl = this.getRailwayMCPUrl();
    this.timeout = 10000; // 10 second timeout
    this.retries = 3;
    this.token = (process.env.MCP_SERVER_TOKEN || process.env.RAILWAY_MCP_TOKEN || '').trim();
  }

  getRailwayMCPUrl() {
    // Highest priority: explicit override
    if (process.env.MCP_SERVER_URL && process.env.MCP_SERVER_URL.trim().length > 0) {
      return process.env.MCP_SERVER_URL.trim();
    }

    const envName = (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || 'development').toLowerCase();

    // MCP Server is deployed in separate Railway project (3adb1ac4-84d8-473b-885f-3a9790fe6140)
    // All environments use the same MCP server endpoint
    return 'https://web-production-99691282.up.railway.app';
  }

  async healthCheck() {
    try {
      // Try primary health endpoint
      let response;
      try {
        response = await this.makeRequest('/health');
      } catch (e) {
        // Fallback to /mcp/info if /health not available
        response = await this.makeRequest('/mcp/info');
      }
      return {
        status: 'connected',
        provider: 'railway-hosted',
        environment: process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || 'development',
        endpoint: this.baseUrl,
        health: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'disconnected',
        provider: 'railway-hosted',
        environment: process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || 'development',
        endpoint: this.baseUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getMCPStatus() {
    try {
      // Prefer /mcp/status, fallback to /mcp/info
      let response;
      try {
        response = await this.makeRequest('/mcp/status');
      } catch (e) {
        response = await this.makeRequest('/mcp/info');
      }
      return {
        status: 'connected',
        capabilities: response.capabilities || ['manufacturing-ai', 'data-integration', 'analytics'],
        provider: 'railway-hosted',
        connections: response.connections || { active: 1, healthy: true },
        xero: response.xero || { status: 'configured', lastSync: new Date().toISOString() },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        provider: 'railway-hosted',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getXeroData(endpoint) {
    try {
      const response = await this.makeRequest(`/mcp/xero/${endpoint}`);
      return {
        success: true,
        data: response,
        source: 'railway-mcp',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`Xero ${endpoint} data unavailable:`, error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackData(endpoint),
        source: 'fallback',
        timestamp: new Date().toISOString()
      };
    }
  }

  async syncData() {
    try {
      const response = await this.makeRequest('/mcp/sync', 'POST');
      return {
        success: true,
        result: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Sentia-Manufacturing-Dashboard/2.0.0'
          },
          signal: controller.signal
        };

        // Attach auth token if provided
        if (this.token) {
          options.headers.Authorization = `Bearer ${this.token}`;
        }

        if (body && method !== 'GET') {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          const text = await response.text();
          // Try to parse as JSON, fallback to text
          try {
            return JSON.parse(text);
          } catch {
            return { message: text, status: 'success' };
          }
        }
      } catch (error) {
        lastError = error;
        console.warn(`Railway MCP request attempt ${attempt}/${this.retries} failed:`, error.message);
        
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  getFallbackData(endpoint) {
    const fallbacks = {
      'balance-sheet': {
        assets: 5200000,
        liabilities: 2100000,
        equity: 3100000,
        currency: 'GBP',
        note: 'Fallback data - Railway MCP server unavailable'
      },
      'cash-flow': {
        operating: 450000,
        investing: -125000,
        financing: -80000,
        net: 245000,
        currency: 'GBP',
        note: 'Fallback data - Railway MCP server unavailable'
      },
      'profit-loss': {
        revenue: 2800000,
        expenses: 2100000,
        profit: 700000,
        margin: 25.0,
        currency: 'GBP',
        note: 'Fallback data - Railway MCP server unavailable'
      }
    };

    return fallbacks[endpoint] || { 
      error: 'No fallback data available',
      note: 'Railway MCP server unavailable'
    };
  }
}

export default new RailwayMCPService();