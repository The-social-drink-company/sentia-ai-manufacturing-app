// Comprehensive API Management System for Sentia Manufacturing Dashboard
// Centralized data integration layer with advanced error handling and caching

import { QueryClient } from '@tanstack/react-query';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';
import { CacheManager } from './CacheManager.js';
import { RetryManager } from './RetryManager.js';
import { CircuitBreaker } from './CircuitBreaker.js';
import { DataTransformer } from './DataTransformer.js';

export class ApiManager {
  constructor(options = {}) {
    this.baseURL = options.baseURL || null;
    this.timeout = options.timeout 0;
    this.maxRetries = options.maxRetries || 3;
    
    // Initialize subsystems
    this.cache = new CacheManager(options.cache);
    this.retryManager = new RetryManager(options.retry);
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    this.transformer = new DataTransformer();
    
    // Request/response interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Request queue for managing concurrent requests
    this.requestQueue = new Map();
    this.activeRequests = new Set();
    
    // Metrics for monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      lastRequestTime: null
    };
    
    this.init();
  }
  
  init() {
    // Set up default request interceptor for auth tokens
    this.addRequestInterceptor(async (config) => {
      const token = await this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return config;
    });
    
    // Set up default response interceptor for error handling
    this.addResponseInterceptor(
      (response) => response,
      (error) => this.handleGlobalError(error)
    );
  }
  
  // Core HTTP methods with advanced features
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }
  
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }
  
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }
  
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }
  
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
  
  // Main request method with comprehensive error handling
  async request(method, endpoint, data = null, options = {}) {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    const cacheKey = this.generateCacheKey(method, endpoint, data, options);
    
    try {
      // Update metrics
      this.metrics.totalRequests++;
      this.metrics.lastRequestTime = new Date();
      
      // Check cache first for GET requests
      if (method === 'GET' && options.cache !== false) {
        const cachedResponse = await this.cache.get(cacheKey);
        if (cachedResponse) {
          this.metrics.cacheHits++;
          logInfo('Cache hit for request', { endpoint, requestId });
          return cachedResponse;
        }
        this.metrics.cacheMisses++;
      }
      
      // Build request configuration
      const config = await this.buildRequestConfig(method, endpoint, data, options);
      config.requestId = requestId;
      
      // Apply request interceptors
      let processedConfig = config;
      for (const interceptor of this.requestInterceptors) {
        processedConfig = await interceptor(processedConfig);
      }
      
      // Execute request through circuit breaker
      const response = await this.circuitBreaker.execute(
        () => this.executeRequest(processedConfig),
        `${method} ${endpoint}`
      );
      
      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.success) {
          processedResponse = await interceptor.success(processedResponse);
        }
      }
      
      // Transform response data
      const transformedResponse = await this.transformer.transformResponse(
        processedResponse,
        endpoint,
        options.transform
      );
      
      // Cache successful GET responses
      if (method === 'GET' && transformedResponse && options.cache !== false) {
        await this.cache.set(cacheKey, transformedResponse, options.cacheTTL);
      }
      
      // Update success metrics
      this.metrics.successfulRequests++;
      const responseTime = performance.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      logInfo('API request successful', {
        method,
        endpoint,
        requestId,
        responseTime: Math.round(responseTime)
      });
      
      return transformedResponse;
      
    } catch (error) {
      // Update failure metrics
      this.metrics.failedRequests++;
      
      // Apply error response interceptors
      let processedError = error;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.error) {
          processedError = await interceptor.error(processedError);
        }
      }
      
      const responseTime = performance.now() - startTime;
      logError('API request failed', {
        method,
        endpoint,
        requestId,
        error: processedError.message,
        responseTime: Math.round(responseTime),
        stack: processedError.stack
      });
      
      throw processedError;
    }
  }
  
  // Execute the actual HTTP request
  async executeRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);
    
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal,
        ...config.fetchOptions
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          config,
          response
        );
      }
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, config);
      }
      
      throw error;
    }
  }
  
  // Build request configuration
  async buildRequestConfig(method, endpoint, data, options) {
    const url = this.buildURL(endpoint, options.params);
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    let body = null;
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      if (data instanceof FormData) {
        delete headers['Content-Type']; // Let browser set it
        body = data;
      } else if (typeof data === 'object') {
        body = JSON.stringify(data);
      } else {
        body = data;
      }
    }
    
    return {
      method,
      url,
      headers,
      body,
      timeout: options.timeout,
      fetchOptions: options.fetchOptions || {}
    };
  }
  
  // Build full URL with query parameters
  buildURL(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin + this.baseURL);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    });
    
    return url.toString();
  }
  
  // Authentication token retrieval
  async getAuthToken() {
    try {
      // Integration with Clerk authentication
      const user = window.Clerk?.user;
      if (user && typeof user.getToken === 'function') {
        return await user.getToken();
      }
      return null;
    } catch (error) {
      logWarn('Failed to get auth token', { error: error.message });
      return null;
    }
  }
  
  // Request/Response interceptors
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }
  
  addResponseInterceptor(success, error) {
    const interceptor = { success, error };
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }
  
  // Global error handling
  async handleGlobalError(error) {
    if (error.status === 401) {
      // Handle authentication errors
      logWarn('Authentication error, redirecting to login');
      window.location.href = '/sign-in';
      return;
    }
    
    if (error.status >= 500) {
      // Server errors - could trigger notifications
      this.notifyError('Server Error', error.message);
    }
    
    return Promise.reject(error);
  }
  
  // Utility methods
  generateRequestId() {
    return `req_${Date.now()}_${crypto.randomUUID().substring(2)}`;
  }
  
  generateCacheKey(method, endpoint, data, options) {
    const key = `${method}:${endpoint}`;
    const params = options.params || {};
    const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    return paramString ? `${key}?${paramString}` : key;
  }
  
  updateAverageResponseTime(responseTime) {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime + responseTime) / 2;
    }
  }
  
  // Notification helper (integration with notification system)
  notifyError(title, message) {
    if (window.notificationStore?.actions?.addNotification) {
      window.notificationStore.actions.addNotification({
        type: 'error',
        title,
        message,
        priority: 'high',
        category: 'api',
        persistent: true,
        autoClose: false,
        duration: 0
      });
    }
  }
  
  // Health check and diagnostics
  async healthCheck() {
    try {
      const response = await this.get('/health', { cache: false });
      return {
        status: 'healthy',
        response,
        metrics: this.getMetrics()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        metrics: this.getMetrics()
      };
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
        : 0,
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2)
        : 0
    };
  }
  
  // Cleanup and reset
  clearCache() {
    return this.cache.clear();
  }
  
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      lastRequestTime: null
    };
  }
}

// Custom API Error class
export class ApiError extends Error {
  constructor(message, status, config, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.config = config;
    this.response = response;
  }
}

// Default instance
export const apiManager = new ApiManager({
  cache: {
    maxSize: 100,
    defaultTTL: 300000 // 5 minutes
  },
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000
  },
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffFactor: 2
  }
});

// Export singleton for global use
export default apiManager;