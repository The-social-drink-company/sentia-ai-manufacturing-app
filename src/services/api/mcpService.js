/**
 * MCP (Model Context Protocol) Service Integration
 * Connects to the MCP server for AI-powered manufacturing intelligence
 */

import axios from 'axios';
import { logInfo, logError, logWarn, logDebug, devLog } from '../../utils/structuredLogger.js';

// MCP Server configuration
const MCP_BASE_URL = import.meta.env.VITE_MCP_URL || 'http://localhost:9000/mcp';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000/api';

// Create axios instance with default config
const mcpClient = axios.create({
  baseURL: MCP_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
mcpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// MCP Service API
export const mcpService = {
  // Health check
  async checkHealth() {
    try {
      const response = await mcpClient.get('/health');
      return response.data;
    } catch (error) {
      logError('MCP health check failed', error);
      return { status: 'offline', message: error.message };
    }
  },

  // Get AI insights
  async getAIInsights(context) {
    try {
      const response = await mcpClient.post('/ai/insights', { context });
      return response.data;
    } catch (error) {
      logError('Failed to get AI insights', error);
      throw error;
    }
  },

  // Manufacturing optimization
  async optimizeManufacturing(parameters) {
    try {
      const response = await mcpClient.post('/tools/optimize-manufacturing', parameters);
      return response.data;
    } catch (error) {
      logError('Manufacturing optimization failed', error);
      throw error;
    }
  },

  // Demand forecasting
  async forecastDemand(data) {
    try {
      const response = await mcpClient.post('/tools/forecast-demand', data);
      return response.data;
    } catch (error) {
      logError('Demand forecasting failed', error);
      throw error;
    }
  },

  // Inventory optimization
  async optimizeInventory(data) {
    try {
      const response = await mcpClient.post('/tools/optimize-inventory', data);
      return response.data;
    } catch (error) {
      logError('Inventory optimization failed', error);
      throw error;
    }
  },

  // Quality analysis
  async analyzeQuality(metrics) {
    try {
      const response = await mcpClient.post('/tools/analyze-quality', metrics);
      return response.data;
    } catch (error) {
      logError('Quality analysis failed', error);
      throw error;
    }
  },

  // Working capital optimization
  async optimizeWorkingCapital(financials) {
    try {
      const response = await mcpClient.post('/tools/optimize-working-capital', financials);
      return response.data;
    } catch (error) {
      logError('Working capital optimization failed', error);
      throw error;
    }
  },

  // Get Xero data through MCP
  async getXeroData(endpoint) {
    try {
      const response = await mcpClient.get(`/xero/${endpoint}`);
      return response.data;
    } catch (error) {
      logError('Failed to get Xero data', error);
      throw error;
    }
  },

  // Get Shopify data through MCP
  async getShopifyData(endpoint) {
    try {
      const response = await mcpClient.get(`/shopify/${endpoint}`);
      return response.data;
    } catch (error) {
      logError('Failed to get Shopify data', error);
      throw error;
    }
  },

  // Execute MCP tool
  async executeTool(toolName, params) {
    try {
      const response = await mcpClient.post('/tools/execute', {
        tool: toolName,
        params
      });
      return response.data;
    } catch (error) {
      logError('Failed to execute tool', { toolName, error });
      throw error;
    }
  },

  // Get AI recommendations
  async getRecommendations(context) {
    try {
      const response = await mcpClient.post('/ai/recommendations', { context });
      return response.data;
    } catch (error) {
      logError('Failed to get recommendations', error);
      throw error;
    }
  },

  // Stream AI responses (for real-time updates)
  streamAIResponse(prompt, onMessage, onError, onComplete) {
    const eventSource = new EventSource(`${MCP_BASE_URL}/ai/stream?prompt=${encodeURIComponent(prompt)}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };

    eventSource.addEventListener('complete', () => {
      onComplete();
      eventSource.close();
    });

    return eventSource;
  },

  // Get system status
  async getSystemStatus() {
    try {
      const response = await mcpClient.get('/status');
      return response.data;
    } catch (error) {
      logError('Failed to get system status', error);
      return {
        mcp: 'offline',
        ai: 'unknown',
        integrations: {},
        error: error.message
      };
    }
  }
};

// Hook for React components
export const useMCPService = () => {
  return mcpService;
};

export default mcpService;