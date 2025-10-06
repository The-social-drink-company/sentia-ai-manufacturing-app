// API Service for Real Data Integration
// Connects to local API endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class APIService {
  constructor() {
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

  // AI Service Methods
  async getAIInsights(query) {
    return this.fetchWithAuth(`${this.apiBaseUrl}/ai/analyze`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async getDemandForecast(params) {
    return this.fetchWithAuth(`${this.apiBaseUrl}/forecasting/demand`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getInventoryOptimization() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/inventory/optimization`);
  }

  // Financial Data Methods
  async getWorkingCapital() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/working-capital`);
  }

  async getCashFlow() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/working-capital/xero/cashflow`);
  }

  async getFinancialMetrics() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/working-capital/metrics`);
  }

  // Production Data Methods
  async getProductionMetrics() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/production/metrics`);
  }

  async getInventoryData() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/inventory/current`);
  }

  async getQualityMetrics() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/quality/metrics`);
  }

  // Dashboard Data
  async getDashboardSummary() {
    return this.fetchWithAuth(`${this.apiBaseUrl}/dashboard/summary`);
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
    return this.fetchWithAuth(`${this.apiBaseUrl}/what-if/scenario`, {
      method: 'POST',
      body: JSON.stringify(scenario),
    });
  }

  // Real-time SSE connection for live data
  connectToLiveData(onMessage, onError) {
    const eventSource = new EventSource(`${this.apiBaseUrl}/events`);

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






