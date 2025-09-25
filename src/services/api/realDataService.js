import axios from 'axios';
import { getAuthToken } from '../../lib/clerk-config';

class RealDataService {
  constructor() {
    if (!import.meta.env.VITE_API_BASE_URL) {
      throw new Error('Missing VITE_API_BASE_URL. Real data access requires a live API.');
    }

    this.apiClient = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.apiClient.interceptors.request.use(async (config) => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required. No anonymous access.');
      }
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  async getWorkingCapitalMetrics() {
    const response = await this.apiClient.get('/api/working-capital/overview');
    return response.data;
  }

  async getCashRunwayAnalysis() {
    const response = await this.apiClient.get('/api/working-capital/cash-runway');
    return response.data;
  }

  async getProductionJobs() {
    const response = await this.apiClient.get('/api/production/jobs');
    return response.data;
  }

  async updateProductionJob(jobId, data) {
    const response = await this.apiClient.put(`/api/production/jobs/${jobId}`, data);
    return response.data;
  }

  async getInventoryLevels() {
    const response = await this.apiClient.get('/api/inventory/levels');
    return response.data;
  }

  async syncWithXero() {
    const response = await this.apiClient.post('/api/xero/sync');
    return response.data;
  }

  async syncWithShopify() {
    const response = await this.apiClient.post('/api/shopify/sync');
    return response.data;
  }

  async uploadCSV(file, type) {
    if (!file) {
      throw new Error('File required for CSV upload');
    }

    if (!type) {
      throw new Error('CSV type required for upload');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.apiClient.post('/api/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  async generateForecast(parameters) {
    const response = await this.apiClient.post('/api/analytics/forecast', parameters);
    return response.data;
  }

  async requestAIAnalysis(tool, params) {
    const response = await this.apiClient.post('/api/mcp/request', {
      tool,
      params
    });
    return response.data;
  }

  connectRealTimeUpdates() {
    const apiBase = this.apiClient.defaults.baseURL;
    if (!apiBase) {
      throw new Error('WebSocket connection requires a configured API base URL.');
    }

    const wsUrl = apiBase.replace(/^http/i, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onopen = () => {
      console.log('Real-time connection established');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      throw new Error('Real-time connection failed');
    };

    return ws;
  }

  subscribeToSSE(endpoint) {
    const apiBase = this.apiClient.defaults.baseURL;
    if (!apiBase) {
      throw new Error('SSE subscription requires a configured API base URL.');
    }

    const eventSource = new EventSource(`${apiBase}${endpoint}`);

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      throw new Error('Real-time subscription failed');
    };

    return eventSource;
  }
}

export default new RealDataService();
