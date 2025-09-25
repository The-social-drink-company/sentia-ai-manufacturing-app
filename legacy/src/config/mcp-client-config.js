import { logDebug, logInfo, logWarn, logError } from '../utils/logger';

/**
 * MCP CLIENT CONFIGURATION
 * Ensures all branches connect to the MCP server hosted on Render
 */

// MCP Server configuration (same for all environments)
const MCP_SERVER_BASE = 'https://mcp-server-tkyu.onrender.com';
const MCP_WEBSOCKET_BASE = 'wss://mcp-server-tkyu.onrender.com';

// Get current environment from various sources
const getCurrentEnvironment = () => {
  // Check various environment indicators
  const hostname = window.location.hostname;

  if (hostname.includes('development')) return 'development';
  if (hostname.includes('testing')) return 'test';
  if (hostname.includes('production')) return 'production';
  if (hostname === 'localhost') return 'development';

  // Fallback to environment variable
  return import.meta.env.MODE || 'development';
};

// Get API base URL based on environment
const getAPIBaseURL = () => {
  const env = getCurrentEnvironment();

  const urls = {
    development: import.meta.env.VITE_API_BASE_URL || 'https://sentia-manufacturing-development.onrender.com/api',
    test: 'https://sentia-manufacturing-testing.onrender.com/api',
    production: 'https://sentia-manufacturing-production.onrender.com/api'
  };

  return urls[env] || urls.development;
};

// MCP Client configuration
export const MCPClientConfig = {
  // MCP Server endpoints
  server: {
    base: MCP_SERVER_BASE,
    websocket: MCP_WEBSOCKET_BASE,
    health: `${MCP_SERVER_BASE}/health`,
    api: `${MCP_SERVER_BASE}/api`,
    tools: `${MCP_SERVER_BASE}/api/tools`,
    execute: `${MCP_SERVER_BASE}/api/execute`,
    stream: `${MCP_SERVER_BASE}/api/stream`,
    ai: {
      query: `${MCP_SERVER_BASE}/api/ai/query`,
      analyze: `${MCP_SERVER_BASE}/api/ai/analyze`,
      forecast: `${MCP_SERVER_BASE}/api/ai/forecast`,
      optimize: `${MCP_SERVER_BASE}/api/ai/optimize`
    }
  },

  // API configuration
  api: {
    base: getAPIBaseURL(),
    mcp: `${getAPIBaseURL()}/mcp`,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // WebSocket configuration
  websocket: {
    url: MCP_WEBSOCKET_BASE,
    reconnect: true,
    reconnectAttempts: 5,
    reconnectDelay: 3000,
    heartbeatInterval: 30000
  },

  // Authentication
  auth: {
    jwt_secret: import.meta.env.VITE_MCP_JWT_SECRET || 'UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc=',
    bearer_prefix: 'Bearer'
  },

  // Environment info
  environment: getCurrentEnvironment(),
  isProduction: getCurrentEnvironment() === 'production',
  isDevelopment: getCurrentEnvironment() === 'development',
  isTesting: getCurrentEnvironment() === 'test'
};

// MCP Client class for making requests
export class MCPClient {
  constructor(config = MCPClientConfig) {
    this.config = config;
    this.token = config.auth.jwt_secret;
  }

  // Make authenticated request to MCP server
  async request(endpoint, options = {}) {
    const url = `${this.config.server.base}${endpoint}`;

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${this.config.auth.bearer_prefix} ${this.token}`,
        'X-Environment': this.config.environment,
        'X-Client': 'sentia-dashboard'
      },
      timeout: this.config.api.timeout,
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logError('MCP request error:', error);

      // Retry logic
      if (options.retry !== false && (options.retryCount || 0) < this.config.api.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.api.retryDelay));
        return this.request(endpoint, { ...options, retryCount: (options.retryCount || 0) + 1 });
      }

      throw error;
    }
  }

  // Execute MCP tool
  async executeTool(toolName, params = {}) {
    return this.request('/api/execute', {
      method: 'POST',
      body: JSON.stringify({
        tool: toolName,
        params,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Query AI
  async queryAI(prompt, context = {}) {
    return this.request('/api/ai/query', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        context,
        environment: this.config.environment,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Get health status
  async getHealth() {
    return this.request('/health', {
      method: 'GET',
      retry: false
    });
  }

  // Connect to WebSocket
  connectWebSocket(onMessage, onError) {
    const ws = new WebSocket(this.config.websocket.url);

    ws.onopen = () => {
      logDebug('MCP WebSocket connected');
      // Send authentication
      ws.send(JSON.stringify({
        type: 'auth',
        token: this.token,
        environment: this.config.environment
      }));

      // Start heartbeat
      this.heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, this.config.websocket.heartbeatInterval);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'pong' && onMessage) {
          onMessage(data);
        }
      } catch (error) {
        logError('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      logError('MCP WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      logDebug('MCP WebSocket disconnected');
      clearInterval(this.heartbeatInterval);

      // Reconnect logic
      if (this.config.websocket.reconnect) {
        setTimeout(() => {
          this.connectWebSocket(onMessage, onError);
        }, this.config.websocket.reconnectDelay);
      }
    };

    this.ws = ws;
    return ws;
  }

  // Disconnect WebSocket
  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();

// Export default
export default MCPClientConfig;
