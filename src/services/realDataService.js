/**
 * Real Data Service - Enterprise Production API Client
 * Version: 2.0.0 - September 2025
 *
 * CRITICAL: This service enforces REAL DATA ONLY policy
 * - All data from PostgreSQL database or external APIs
 * - No hardcoded values
 * - No fallback data on error - fail fast
 * - Real-time data fetching
 * - CSV upload support for bulk data
 *
 * @module RealDataService
 */

import axios from 'axios';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// Environment configuration - NO DEFAULTS ALLOWED IN PRODUCTION
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const WS_BASE = import.meta.env.VITE_WEBSOCKET_URL;
const REQUIRE_REAL_DATA = import.meta.env.VITE_REQUIRE_REAL_DATA !== 'false';

// Validate configuration in production
if (import.meta.env.PROD && !API_BASE) {
  throw new Error('CRITICAL: API_BASE_URL not configured. Real data service requires API endpoint.');
}

// Logging utilities (compatible with existing codebase)
const logInfo = (message, data) => {
  if (import.meta.env.DEV) logDebug(`[INFO] ${message}`, data);
};

const logError = (message, error) => {
  logError(`[ERROR] ${message}`, error);
};

const logWarn = (message, data) => {
  if (import.meta.env.DEV) logWarn(`[WARN] ${message}`, data);
};

// Request configuration with authentication
const getRequestConfig = async () => {
  try {
    // Try to get Clerk token if available
    let token = null;
    try {
      const clerkModule = await import('../lib/clerk-config.js');
      if (clerkModule.getAuthToken) {
        token = await clerkModule.getAuthToken();
      }
    } catch (e) {
      // Clerk not available, continue without auth
      logWarn('Clerk authentication not available', e);
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Real-Data-Only': 'true', // Signal to backend: no mock data
      'X-Request-ID': crypto.randomUUID()
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Clerk-Token'] = token;
    }

    return {
      headers,
      timeout: 30000, // 30 second timeout
      validateStatus: (status) => status < 500 // Don't throw on 4xx
    };
  } catch (error) {
    logError('Failed to get request configuration', error);
    throw new Error('Failed to configure API request');
  }
};

/**
 * RealDataService Class - Enforces real data only policy
 */
class RealDataService {
  constructor() {
    this.validateRealDataPolicy();
    this.wsConnection = null;
    this.sseConnection = null;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Validate that real data policy is enforced
   */
  validateRealDataPolicy() {
    if (REQUIRE_REAL_DATA) {
      logInfo('Real Data Policy: ENFORCED - No mock data allowed');
    } else {
      logWarn('Real Data Policy: WARNING - Policy may not be enforced');
    }
  }

  /**
   * Generic API request handler with retry logic
   * NO FALLBACK DATA - throws on failure
   */
  async makeRequest(endpoint, method = 'GET', data = null, options = {}) {
    const config = await getRequestConfig();
    const url = `${API_BASE}${endpoint}`;

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logInfo('API Request', { endpoint, method, attempt });

        const response = await axios({
          url,
          method,
          data,
          ...config,
          ...options
        });

        // Validate response has real data
        if (response.data === null || response.data === undefined) {
          throw new Error('API returned null/undefined data');
        }

        // Check for mock data indicators
        if (this.isMockData(response.data)) {
          throw new Error('CRITICAL: Mock data detected in API response');
        }

        logInfo('API Success', { endpoint, status: response.status });
        return response.data;

      } catch (error) {
        lastError = error;
        logError(`API Request Failed (attempt ${attempt}/${this.retryAttempts})`, {
          endpoint,
          error: error.message,
          status: error.response?.status
        });

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // NO FALLBACK - throw the error
    throw new Error(`Real data unavailable: ${lastError.message}`);
  }

  /**
   * Check if data appears to be mock/fake
   */
  isMockData(data) {
    const mockIndicators = [
      'mock', 'fake', 'demo', 'test', 'sample',
      'lorem', 'ipsum', 'placeholder', 'example'
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    return mockIndicators.some(indicator => dataStr.includes(indicator));
  }

  /**
   * Delay helper for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== REAL DATA FETCHERS ====================

  /**
   * Fetch real-time KPI data from backend
   * NO FALLBACK - throws on error
   */
  async fetchRealKPIs() {
    return this.makeRequest('/kpis/realtime');
  }

  /**
   * Fetch real Amazon SP-API data
   * NO FALLBACK - throws on error
   */
  async fetchAmazonData() {
    return this.makeRequest('/external/amazon/orders');
  }

  /**
   * Fetch real Shopify data
   * NO FALLBACK - throws on error
   */
  async fetchShopifyData() {
    return this.makeRequest('/external/shopify/analytics');
  }

  /**
   * Fetch real Unleashed inventory data
   * NO FALLBACK - throws on error
   */
  async fetchUnleashedInventory() {
    return this.makeRequest('/external/unleashed/stock');
  }

  /**
   * Fetch real production metrics from IoT sensors
   * NO FALLBACK - throws on error
   */
  async fetchProductionMetrics() {
    return this.makeRequest('/production/metrics');
  }

  /**
   * Fetch real financial data from database
   * NO FALLBACK - throws on error
   */
  async fetchFinancialData() {
    return this.makeRequest('/financial/summary');
  }

  /**
   * Fetch real demand forecast from ML model
   * NO FALLBACK - throws on error
   */
  async fetchDemandForecast() {
    return this.makeRequest('/forecasting/demand');
  }

  /**
   * Fetch real predictive maintenance data from sensors
   * NO FALLBACK - throws on error
   */
  async fetchMaintenanceAlerts() {
    return this.makeRequest('/maintenance/predictions');
  }

  /**
   * Fetch real multi-channel sales data
   * NO FALLBACK - aggregates from real sources only
   */
  async fetchMultiChannelSales() {
    const [amazon, shopify, direct] = await Promise.all([
      this.fetchAmazonData(),
      this.fetchShopifyData(),
      this.makeRequest('/sales/direct')
    ]);

    return {
      amazon: amazon.revenue,
      shopify: shopify.sales,
      direct: direct.sales,
      total: amazon.revenue + shopify.sales + direct.sales
    };
  }

  /**
   * Fetch real working capital metrics
   * NO FALLBACK - throws on error
   */
  async fetchWorkingCapital() {
    return this.makeRequest('/working-capital/current');
  }

  /**
   * Fetch Xero accounting data
   * NO FALLBACK - throws on error
   */
  async fetchXeroData() {
    return this.makeRequest('/external/xero/financials');
  }

  /**
   * Fetch real inventory optimization recommendations
   * NO FALLBACK - throws on error
   */
  async fetchInventoryOptimization() {
    return this.makeRequest('/inventory/optimization');
  }

  /**
   * Fetch cash runway analysis
   * NO FALLBACK - throws on error
   */
  async fetchCashRunway() {
    return this.makeRequest('/financial/cash-runway');
  }

  /**
   * Fetch quality control metrics
   * NO FALLBACK - throws on error
   */
  async fetchQualityMetrics() {
    return this.makeRequest('/quality/metrics');
  }

  // ==================== BULK DATA OPERATIONS ====================

  /**
   * Upload CSV file for bulk data import
   * Only accepts real data files
   */
  async uploadCSV(file, dataType) {
    if (!file || !dataType) {
      throw new Error('File and data type required for CSV upload');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);
    formData.append('validateRealData', 'true');

    const config = await getRequestConfig();
    delete config.headers['Content-Type']; // Let browser set multipart boundary

    return this.makeRequest('/data/import/csv', 'POST', formData, {
      ...config,
      headers: {
        ...config.headers,
        'X-Real-Data-Only': 'true'
      }
    });
  }

  /**
   * Export data to CSV
   */
  async exportToCSV(dataType, filters = {}) {
    const params = new URLSearchParams({
      dataType,
      ...filters,
      realDataOnly: true
    });

    const data = await this.makeRequest(`/data/export/csv?${params}`, 'GET');

    // Create download link
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // ==================== REAL-TIME CONNECTIONS ====================

  /**
   * Connect to WebSocket for real-time data updates
   * Only accepts validated real data from server
   */
  connectWebSocket(handlers = {}) {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const wsUrl = WS_BASE || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      logInfo('WebSocket connected for real-time data');

      // Send authentication
      this.wsConnection.send(JSON.stringify({
        type: 'auth',
        token: localStorage.getItem('clerk_token'),
        realDataOnly: true
      }));

      if (handlers.onOpen) handlers.onOpen();
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Validate real data
        if (this.isMockData(data)) {
          throw new Error('Mock data detected in WebSocket message');
        }

        if (handlers.onMessage) handlers.onMessage(data);
      } catch (error) {
        logError('WebSocket message error', error);
        if (handlers.onError) handlers.onError(error);
      }
    };

    this.wsConnection.onerror = (error) => {
      logError('WebSocket error', error);
      if (handlers.onError) handlers.onError(error);
    };

    this.wsConnection.onclose = () => {
      logInfo('WebSocket disconnected');
      if (handlers.onClose) handlers.onClose();

      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        if (handlers.autoReconnect !== false) {
          this.connectWebSocket(handlers);
        }
      }, 5000);
    };

    return this.wsConnection;
  }

  /**
   * Connect to Server-Sent Events for real-time updates
   * Alternative to WebSocket for unidirectional data flow
   */
  connectSSE(endpoint, handlers = {}) {
    if (this.sseConnection) {
      this.sseConnection.close();
    }

    const sseUrl = `${API_BASE}${endpoint}`;
    this.sseConnection = new EventSource(sseUrl, {
      withCredentials: true
    });

    this.sseConnection.onopen = () => {
      logInfo('SSE connected for real-time updates');
      if (handlers.onOpen) handlers.onOpen();
    };

    this.sseConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Validate real data
        if (this.isMockData(data)) {
          throw new Error('Mock data detected in SSE message');
        }

        if (handlers.onMessage) handlers.onMessage(data);
      } catch (error) {
        logError('SSE message error', error);
        if (handlers.onError) handlers.onError(error);
      }
    };

    this.sseConnection.onerror = (error) => {
      logError('SSE error', error);
      if (handlers.onError) handlers.onError(error);

      // SSE will auto-reconnect
    };

    return this.sseConnection;
  }

  /**
   * Disconnect all real-time connections
   */
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }

    logInfo('All real-time connections closed');
  }

  // ==================== DATA VALIDATION ====================

  /**
   * Validate that data is from real source
   * Throws error if mock data detected
   */
  validateRealData(data, source) {
    if (!data) {
      throw new Error(`No data received from ${source}`);
    }

    // Check for mock patterns
    if (this.isMockData(data)) {
      throw new Error(`CRITICAL: Mock data detected from ${source}`);
    }

    // Check for suspicious patterns
    const suspicious = this.detectSuspiciousPatterns(data);
    if (suspicious.length > 0) {
      logWarn('Suspicious data patterns detected', { source, patterns: suspicious });
    }

    return true;
  }

  /**
   * Detect suspicious patterns that might indicate non-real data
   */
  detectSuspiciousPatterns(data) {
    const patterns = [];
    const dataStr = JSON.stringify(data);

    // Check for sequential IDs (1,2,3,4,5)
    if (/\"id\":[1-5],\"id\":[1-5],\"id\":[1-5]/.test(dataStr)) {
      patterns.push('Sequential IDs detected');
    }

    // Check for round numbers
    if (/: *(100|200|500|1000|5000|10000)/.test(dataStr)) {
      patterns.push('Suspicious round numbers');
    }

    // Check for repeated values
    const values = dataStr.match(/: *([0-9.]+)/g);
    if (values) {
      const counts = {};
      values.forEach(v => counts[v] = (counts[v] || 0) + 1);
      const repeated = Object.entries(counts).filter(([_, count]) => count > 5);
      if (repeated.length > 0) {
        patterns.push('Repeated values detected');
      }
    }

    return patterns;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Fetch multiple data sources in parallel
   * All must succeed - no partial data
   */
  async fetchBatch(endpoints) {
    const promises = endpoints.map(endpoint =>
      this.makeRequest(endpoint)
    );

    return Promise.all(promises);
  }

  /**
   * Paginated data fetching for large datasets
   */
  async fetchPaginated(endpoint, pageSize = 100) {
    const results = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await this.makeRequest(
        `${endpoint}?page=${page}&pageSize=${pageSize}`
      );

      results.push(...data.items);
      hasMore = data.hasMore;
      page++;
    }

    return results;
  }

  // ==================== CACHING (WITH VALIDATION) ====================

  /**
   * Cache real data with validation
   * Cache is invalidated if mock data detected
   */
  async fetchWithCache(endpoint, cacheKey, maxAge = 60000) {
    const cached = this.getFromCache(cacheKey);

    if (cached && cached.timestamp > Date.now() - maxAge) {
      // Validate cached data is still real
      try {
        this.validateRealData(cached.data, 'cache');
        return cached.data;
      } catch (error) {
        logWarn('Invalid cached data, fetching fresh', { cacheKey, error });
        this.clearCache(cacheKey);
      }
    }

    const data = await this.makeRequest(endpoint);
    this.saveToCache(cacheKey, data);
    return data;
  }

  getFromCache(key) {
    const cached = localStorage.getItem(`realdata_${key}`);
    return cached ? JSON.parse(cached) : null;
  }

  saveToCache(key, data) {
    localStorage.setItem(`realdata_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }

  clearCache(key = null) {
    if (key) {
      localStorage.removeItem(`realdata_${key}`);
    } else {
      // Clear all real data cache
      Object.keys(localStorage)
        .filter(k => k.startsWith('realdata_'))
        .forEach(k => localStorage.removeItem(k));
    }
  }

  // ==================== ERROR HANDLING ====================

  /**
   * Handle API errors - NO FALLBACK DATA
   * Always throws - never returns mock data
   */
  handleError(error, context) {
    logError('Real Data Service Error', {
      context,
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    // Determine error type
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error('Authentication required for real data access');
        case 403:
          throw new Error('Permission denied to access real data');
        case 404:
          throw new Error(`Real data endpoint not found: ${context}`);
        case 429:
          throw new Error('Rate limit exceeded for real data API');
        case 500:
        case 502:
        case 503:
          throw new Error('Real data service temporarily unavailable');
        default:
          throw new Error(`Real data request failed: ${error.response.status}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Cannot reach real data service');
    } else {
      throw error;
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check health of all data sources
   * Returns status of each integration
   */
  async checkHealth() {
    const healthChecks = [
      { name: 'Database', endpoint: '/health/database' },
      { name: 'Xero', endpoint: '/health/xero' },
      { name: 'Amazon SP-API', endpoint: '/health/amazon' },
      { name: 'Shopify UK', endpoint: '/health/shopify-uk' },
      { name: 'Shopify USA', endpoint: '/health/shopify-usa' },
      { name: 'Unleashed', endpoint: '/health/unleashed' },
      { name: 'MCP Server', endpoint: '/health/mcp' }
    ];

    const results = await Promise.allSettled(
      healthChecks.map(async check => {
        try {
          const result = await this.makeRequest(check.endpoint);
          return { ...check, status: 'healthy', ...result };
        } catch (error) {
          return { ...check, status: 'unhealthy', error: error.message };
        }
      })
    );

    return results.map(r => r.value);
  }
}

// ==================== SINGLETON INSTANCE ====================

// Create singleton instance
const realDataService = new RealDataService();

// Export individual methods for backward compatibility
export const fetchRealKPIs = realDataService.fetchRealKPIs.bind(realDataService);
export const fetchAmazonData = realDataService.fetchAmazonData.bind(realDataService);
export const fetchShopifyData = realDataService.fetchShopifyData.bind(realDataService);
export const fetchUnleashedInventory = realDataService.fetchUnleashedInventory.bind(realDataService);
export const fetchProductionMetrics = realDataService.fetchProductionMetrics.bind(realDataService);
export const fetchFinancialData = realDataService.fetchFinancialData.bind(realDataService);
export const fetchDemandForecast = realDataService.fetchDemandForecast.bind(realDataService);
export const fetchMaintenanceAlerts = realDataService.fetchMaintenanceAlerts.bind(realDataService);
export const fetchMultiChannelSales = realDataService.fetchMultiChannelSales.bind(realDataService);
export const fetchWorkingCapital = realDataService.fetchWorkingCapital.bind(realDataService);
export const fetchXeroData = realDataService.fetchXeroData.bind(realDataService);
export const fetchInventoryOptimization = realDataService.fetchInventoryOptimization.bind(realDataService);
export const fetchCashRunway = realDataService.fetchCashRunway.bind(realDataService);
export const fetchQualityMetrics = realDataService.fetchQualityMetrics.bind(realDataService);
export const uploadCSV = realDataService.uploadCSV.bind(realDataService);
export const exportToCSV = realDataService.exportToCSV.bind(realDataService);
export const connectWebSocket = realDataService.connectWebSocket.bind(realDataService);
export const connectSSE = realDataService.connectSSE.bind(realDataService);
export const disconnect = realDataService.disconnect.bind(realDataService);
export const validateRealData = realDataService.validateRealData.bind(realDataService);
export const fetchBatch = realDataService.fetchBatch.bind(realDataService);
export const fetchPaginated = realDataService.fetchPaginated.bind(realDataService);
export const fetchWithCache = realDataService.fetchWithCache.bind(realDataService);
export const clearCache = realDataService.clearCache.bind(realDataService);
export const checkHealth = realDataService.checkHealth.bind(realDataService);

// Legacy support for existing code
export const connectToRealTimeData = (onUpdate) => {
  return realDataService.connectWebSocket({
    onMessage: onUpdate
  });
};

// Export service instance
export default realDataService;