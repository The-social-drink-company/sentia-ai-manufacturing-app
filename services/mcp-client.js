/**
 * MCP Client Service
 * Provides interface to communicate with the MCP Server
 */

class MCPClient {
  constructor() {
    this.baseURL = process.env.VITE_MCP_SERVER_URL || 'https://sentia-mcp-production.onrender.com';
    this.apiKey = process.env.MCP_API_KEY || null;
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Check MCP server health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: 'healthy',
        data
      };
    } catch (error) {
      console.error('MCP health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Call unified API through MCP server
   * @param {string} service - Service name (xero, shopify, amazon, etc.)
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   */
  async callUnifiedAPI(service, method, endpoint, params = null) {
    try {
      const url = `${this.baseURL}/api/tools/unified-api-call`;
      
      const requestBody = {
        service,
        method,
        endpoint,
        ...(params && { params })
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API call returned failure status');
      }

      return {
        success: true,
        data: data.result
      };
    } catch (error) {
      console.error(`MCP API call failed (${service} ${method} ${endpoint}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute MCP tool directly
   * @param {string} toolName - Name of the tool to execute
   * @param {object} args - Tool arguments
   */
  async executeTool(toolName, args = {}) {
    try {
      const url = `${this.baseURL}/api/tools/${toolName}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Tool execution returned failure status');
      }

      return {
        success: true,
        data: data.result
      };
    } catch (error) {
      console.error(`MCP tool execution failed (${toolName}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available tools from MCP server
   */
  async getAvailableTools() {
    try {
      const response = await fetch(`${this.baseURL}/api/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Failed to get tools: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        tools: data.tools || [],
        categories: data.categories || []
      };
    } catch (error) {
      console.error('Failed to get available tools:', error);
      return {
        success: false,
        error: error.message,
        tools: [],
        categories: []
      };
    }
  }
}

// Create singleton instance
let mcpClientInstance = null;

/**
 * Get MCP Client singleton instance
 */
export function getMCPClient() {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }
  return mcpClientInstance;
}

export default MCPClient;