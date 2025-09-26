import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';

/**
 * Render MCP Service
 * Handles integration with Render-hosted MCP server
 */

// Node 18+ has global fetch

class RenderMCPService {
  constructor() {
    this.baseUrl = this.getRenderMCPUrl();
    this.timeout = 10000; // 10 second timeout
    this.retries = 3;
    this.token = (process.env.MCP_SERVER_TOKEN || process.env.RENDER_MCP_TOKEN || '').trim();
  }

  getRenderMCPUrl() {
    // Use local embedded MCP server for Render deployments
    if (process.env.RENDER) {
      // MCP server is embedded in the main application
      return 'http://localhost:' + (process.env.PORT || 3000);
    }

    // For local development, use separate MCP server if configured
    if (process.env.MCP_SERVER_URL && process.env.MCP_SERVER_URL.trim().length > 0) {
      return process.env.MCP_SERVER_URL.trim();
    }

    // Default to localhost MCP server
    return 'http://localhost:3001';
  }

  async healthCheck() {
    try {
      // For Render embedded MCP server, check for local MCP endpoints
      if (process.env.RENDER) {
        // Return embedded MCP status (always healthy when main server is running)
        return {
          status: 'connected',
          provider: 'render-embedded',
          environment: process.env.RENDER_SERVICE_NAME || process.env.NODE_ENV || 'production',
          endpoint: this.baseUrl,
          mode: 'embedded',
          timestamp: new Date().toISOString()
        };
      }

      // For external MCP servers, try health endpoints
      let response;
      try {
        response = await this.makeRequest('/health');
      } catch (err) {
        // Try alternative endpoints
        try {
          response = await this.makeRequest('/mcp/status');
        } catch {
          response = await this.makeRequest('/api/health');
        }
      }

      if (response) {
        return {
          status: 'connected',
          provider: 'render-mcp',
          environment: process.env.NODE_ENV || 'production',
          endpoint: this.baseUrl,
          mode: 'external',
          version: response.version || 'unknown',
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No response from MCP server');
    } catch (error) {
      return {
        status: 'disconnected',
        provider: 'render-mcp',
        error: error.message,
        endpoint: this.baseUrl,
        mode: process.env.RENDER ? 'embedded' : 'external',
        timestamp: new Date().toISOString()
      };
    }
  }

  async makeRequest(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = this.baseUrl + path;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('MCP request timeout');
      }
      throw error;
    }
  }

  async sendAnalyticsRequest(data) {
    try {
      return await this.makeRequest('/mcp/ai/manufacturing-request', {
        method: 'POST',
        body: data
      });
    } catch (error) {
      logError('MCP Analytics request failed:', error);
      return null;
    }
  }

  async getDiagnostics() {
    try {
      return await this.makeRequest('/mcp/diagnostics');
    } catch (error) {
      logError('MCP Diagnostics request failed:', error);
      return null;
    }
  }

  async chat(message) {
    try {
      return await this.makeRequest('/mcp/ai/chat', {
        method: 'POST',
        body: { message }
      });
    } catch (error) {
      logError('MCP Chat request failed:', error);
      return null;
    }
  }
}

// Create singleton instance
const renderMCPService = new RenderMCPService();

// Export for use in other modules
export default renderMCPService;