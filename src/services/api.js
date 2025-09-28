// API Service for Real Data Integration
// Connects to MCP Server and external APIs

const MCP_SERVER_URL = 'https://mcp-server-tkyu.onrender.com';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class APIService {
  constructor() {
    this.mcpServerUrl = MCP_SERVER_URL;
    this.apiBaseUrl = API_BASE_URL;
  }

  // Helper method for API calls
  async fetchWithAuth(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Call Failed:', error);
      throw error;
    }
  }

  // MCP Server Methods
  async getMCPStatus() {
    return this.fetchWithAuth(`${this.mcpServerUrl}/health`);
  }

  async getAIInsights(query) {
    return this.fetchWithAuth(`${this.mcpServerUrl}/api/ai/insights`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async getDemandForecast(params) {
    return this.fetchWithAuth(`${this.mcpServerUrl}/api/ai/forecast`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getInventoryOptimization() {
    return this.fetchWithAuth(`${this.mcpServerUrl}/api/ai/inventory-optimization`);
  }

  // Financial Data Methods
  async getWorkingCapital() {
    try {
      // Try MCP server first
      const data = await this.fetchWithAuth(`${this.mcpServerUrl}/api/financial/working-capital`);
      return data;
    } catch (error) {\n      console.warn("[APIService] MCP working capital request failed, falling back to local API", error);\n      return this.fetchWithAuth(`${this.apiBaseUrl}/financial/working-capital`);\n    }
  }

  async getCashFlow() {
    try {
      const data = await this.fetchWithAuth(`${this.mcpServerUrl}/api/financial/cash-flow`);
      return data;
    } catch (error) {\n      console.warn("[APIService] MCP cash flow request failed, falling back to local API", error);\n      return this.fetchWithAuth(`${this.apiBaseUrl}/financial/cash-flow`);\n    }
  }

  async getFinancialMetrics() {
    try {
      const data = await this.fetchWithAuth(`${this.mcpServerUrl}/api/financial/metrics`);
      return data;
    } catch (error) {\n      console.warn("[APIService] MCP financial metrics request failed, falling back to local API", error);\n      return this.fetchWithAuth(`${this.apiBaseUrl}/financial/metrics`);\n    }
  }

  // Production Data Methods
  async getProductionMetrics() {
    try {
      const data = await this.fetchWithAuth(`${this.mcpServerUrl}/api/production/metrics`);
      return data;
    } catch (_error) {
      return this.fetchWithAuth(`${this.apiBaseUrl}/production/metrics`);
    }
  }

  async getInventoryData() {
    try {
      const data = await this.fetchWithAuth(`${this.mcpServerUrl}/api/inventory/current`);
      return data;
    } catch (_error) {
      return this.fetchWithAuth(`${this.apiBaseUrl}/inventory/current`);
    }
  }

  async getQualityMetrics() {
    try {
      const data = await this.fetchWithAuth(`${this.mcpServerUrl}/api/quality/metrics`);
      return data;
    } catch (_error) {
      return this.fetchWithAuth(`${this.apiBaseUrl}/quality/metrics`);
    }
  }

  // Dashboard Data
  async getDashboardSummary() {
    try {
      const data = await this.fetchWithAuth(`${this.mcpServerUrl}/api/dashboard/summary`);
      return data;
    } catch (_error) {
      return this.fetchWithAuth(`${this.apiBaseUrl}/dashboard/summary`);
    }
  }

  // External API Integrations
  async getXeroData() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/integrations/xero/data`);
  }

  async getShopifyData() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/integrations/shopify/data`);
  }

  async getAmazonData() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/integrations/amazon/data`);
  }

  // What-If Analysis
  async runWhatIfScenario(scenario) {
    return this.fetchWithAuth(`${this.mcpServerUrl}/api/ai/what-if`, {
      method: 'POST',
      body: JSON.stringify(scenario),
    });
  }

  // Real-time SSE connection for live data
  connectToLiveData(onMessage, onError) {
    const eventSource = new EventSource(`${this.mcpServerUrl}/api/sse/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('SSE Parse Error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Connection Error:', error);
      if (onError) onError(error);
    };

    return eventSource;
  }
}

// Create singleton instance
const apiService = new APIService();

export default apiService;
export { APIService };


