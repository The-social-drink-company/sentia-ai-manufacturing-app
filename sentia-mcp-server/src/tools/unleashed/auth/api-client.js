/**
 * Unleashed API Client
 * 
 * HTTP client wrapper for Unleashed Software API with retry logic, rate limiting,
 * error handling, and response parsing optimized for manufacturing operations.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import axios from 'axios';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedAPIClient {
  constructor(config, auth) {
    this.config = config;
    this.auth = auth;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.isInitialized = false;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Sentia-MCP-Server/1.0.0'
      }
    });

    // Request/response interceptors for logging and error handling
    this.setupInterceptors();
    
    logger.info('Unleashed API client initialized', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      maxRetries: this.maxRetries
    });
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        
        logger.debug('Unleashed API request', {
          url: config.url,
          method: config.method?.toUpperCase(),
          params: config.params
        });
        
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        
        logger.debug('Unleashed API response', {
          url: response.config.url,
          status: response.status,
          duration,
          dataSize: JSON.stringify(response.data).length
        });
        
        return response;
      },
      (error) => {
        const duration = error.config?.metadata ? 
          Date.now() - error.config.metadata.startTime : 0;
        
        logger.error('Unleashed API error', {
          url: error.config?.url,
          status: error.response?.status,
          duration,
          error: error.message
        });
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize the API client
   */
  async initialize() {
    try {
      logger.info('Initializing Unleashed API client...');
      
      // Validate authentication
      if (!this.auth.isValidated) {
        await this.auth.validateCredentials();
      }
      
      this.isInitialized = true;
      logger.info('Unleashed API client initialized successfully');
      
      return true;
      
    } catch (error) {
      logger.error('Failed to initialize Unleashed API client', { error: error.message });
      throw error;
    }
  }

  /**
   * Make authenticated GET request to Unleashed API
   */
  async get(endpoint, params = {}, options = {}) {
    try {
      const { useCache = true, cacheKey, retries = this.maxRetries } = options;
      
      // Build authenticated URL
      const authenticatedUrl = this.auth.buildAuthenticatedUrl(
        this.baseUrl,
        endpoint,
        params
      );

      logger.debug('Making GET request to Unleashed API', {
        endpoint,
        paramCount: Object.keys(params).length,
        useCache,
        retries
      });

      const response = await this.executeWithRetry(
        () => this.client.get(authenticatedUrl),
        retries
      );

      return this.parseResponse(response);

    } catch (error) {
      logger.error('GET request failed', {
        endpoint,
        params,
        error: error.message
      });
      throw this.handleError(error);
    }
  }

  /**
   * Make authenticated POST request to Unleashed API
   */
  async post(endpoint, data = {}, params = {}, options = {}) {
    try {
      const { retries = this.maxRetries } = options;
      
      // Get auth headers
      const headers = this.auth.getAuthHeaders(endpoint, params);
      
      // Build URL with query parameters
      const url = new URL(endpoint, this.baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      logger.debug('Making POST request to Unleashed API', {
        endpoint,
        dataSize: JSON.stringify(data).length,
        paramCount: Object.keys(params).length,
        retries
      });

      const response = await this.executeWithRetry(
        () => this.client.post(url.toString(), data, { headers }),
        retries
      );

      return this.parseResponse(response);

    } catch (error) {
      logger.error('POST request failed', {
        endpoint,
        error: error.message
      });
      throw this.handleError(error);
    }
  }

  /**
   * Execute request with retry logic and exponential backoff
   */
  async executeWithRetry(requestFn, maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error codes
        if (this.shouldNotRetry(error)) {
          logger.warn('Non-retryable error encountered', {
            status: error.response?.status,
            attempt,
            maxRetries
          });
          throw error;
        }
        
        if (attempt === maxRetries) {
          logger.error('Max retries exceeded', {
            attempts: maxRetries,
            finalError: error.message
          });
          throw error;
        }
        
        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(attempt);
        
        logger.warn('Request failed, retrying...', {
          attempt,
          maxRetries,
          delay,
          error: error.message
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error should not be retried
   */
  shouldNotRetry(error) {
    const status = error.response?.status;
    
    // Don't retry on authentication or client errors
    const nonRetryableStatuses = [400, 401, 403, 404, 422];
    return nonRetryableStatuses.includes(status);
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep for specified milliseconds
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse and validate API response
   */
  parseResponse(response) {
    try {
      const { data, status, headers } = response;
      
      // Check for successful status codes
      if (status < 200 || status >= 300) {
        throw new Error(`HTTP ${status}: ${response.statusText}`);
      }

      // Parse response based on Unleashed API structure
      const parsedResponse = {
        success: true,
        data: data.Items || data.Item || data,
        pagination: data.Pagination || null,
        status,
        headers: {
          'x-rate-limit-remaining': headers['x-rate-limit-remaining'],
          'x-rate-limit-limit': headers['x-rate-limit-limit'],
          'x-rate-limit-reset': headers['x-rate-limit-reset']
        },
        timestamp: new Date().toISOString()
      };

      logger.debug('Response parsed successfully', {
        dataCount: Array.isArray(parsedResponse.data) ? parsedResponse.data.length : 1,
        hasPagination: !!parsedResponse.pagination,
        status
      });

      return parsedResponse;

    } catch (error) {
      logger.error('Failed to parse response', { error: error.message });
      throw new Error(`Response parsing failed: ${error.message}`);
    }
  }

  /**
   * Handle and standardize API errors
   */
  handleError(error) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const data = error.response?.data;
    
    let errorMessage = error.message;
    let errorCode = 'UNLEASHED_API_ERROR';
    
    // Map specific error codes
    switch (status) {
      case 400:
        errorCode = 'BAD_REQUEST';
        errorMessage = data?.message || 'Invalid request parameters';
        break;
      case 401:
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Invalid or expired API credentials';
        break;
      case 403:
        errorCode = 'FORBIDDEN';
        errorMessage = 'Access denied to requested resource';
        break;
      case 404:
        errorCode = 'NOT_FOUND';
        errorMessage = 'Requested resource not found';
        break;
      case 429:
        errorCode = 'RATE_LIMITED';
        errorMessage = 'API rate limit exceeded';
        break;
      case 500:
        errorCode = 'SERVER_ERROR';
        errorMessage = 'Unleashed server error';
        break;
      default:
        if (error.code === 'ECONNABORTED') {
          errorCode = 'TIMEOUT';
          errorMessage = 'Request timeout';
        } else if (error.code === 'ENOTFOUND') {
          errorCode = 'NETWORK_ERROR';
          errorMessage = 'Network connection failed';
        }
    }

    const standardError = new Error(errorMessage);
    standardError.code = errorCode;
    standardError.status = status;
    standardError.originalError = error;

    return standardError;
  }

  /**
   * Health check for API connectivity
   */
  async healthCheck() {
    try {
      logger.info('Performing Unleashed API health check...');
      
      // Make a simple request to test connectivity
      const response = await this.get('/StockItems', { pageSize: 1 });
      
      return {
        status: 'healthy',
        responseTime: response.headers?.['response-time'] || 'unknown',
        rateLimitRemaining: response.headers?.['x-rate-limit-remaining'] || 'unknown',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get client status and statistics
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      authentication: this.auth.getStatus()
    };
  }

  /**
   * Build full endpoint URL
   */
  buildUrl(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    return url.toString();
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      logger.info('Cleaning up API client...');
      
      // Clear any pending timeouts or intervals
      this.isInitialized = false;
      
      logger.info('API client cleanup completed');
      
    } catch (error) {
      logger.error('Error during API client cleanup', { error: error.message });
    }
  }
}