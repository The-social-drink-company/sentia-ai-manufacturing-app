/**
 * Unified API Client for External Service Integration
 * 
 * Provides a centralized interface for all external API connections including:
 * - Xero (Accounting)
 * - Shopify (E-commerce) 
 * - Amazon SP-API (Marketplace)
 * - Unleashed (Inventory Management)
 * - Microsoft Graph (Office 365)
 * 
 * Features:
 * - Retry mechanisms with exponential backoff
 * - Rate limiting and quota management
 * - Circuit breaker pattern for fault tolerance
 * - Connection pooling and caching
 * - Comprehensive error handling and logging
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class UnifiedApiClient {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      baseBackoffMs: config.baseBackoffMs || 1000,
      maxBackoffMs: config.maxBackoffMs || 30000,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerResetTime: config.circuitBreakerResetTime || 60000,
      ...config
    };

    // Rate limiting per service
    this.rateLimiters = new Map();
    
    // Circuit breaker states per service  
    this.circuitBreakers = new Map();
    
    // Connection pools
    this.connectionPools = new Map();
    
    // Initialize service clients
    this.initializeServiceClients();
    
    logInfo('UnifiedApiClient initialized', { 
      services: Object.keys(this.serviceClients),
      config: this.config 
    });
  }

  /**
   * Initialize individual service clients
   */
  initializeServiceClients() {
    this.serviceClients = {
      xero: this.createXeroClient(),
      shopify: this.createShopifyClient(),
      amazon: this.createAmazonClient(), 
      unleashed: this.createUnleashedClient(),
      microsoft: this.createMicrosoftClient()
    };
  }

  /**
   * Create Xero API client
   */
  createXeroClient() {
    return {
      name: 'xero',
      baseURL: 'https://api.xero.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Xero-tenant-id': process.env.XERO_TENANT_ID
      },
      auth: {
        clientId: process.env.XERO_CLIENT_ID,
        clientSecret: process.env.XERO_CLIENT_SECRET,
        redirectUri: process.env.XERO_REDIRECT_URI
      },
      rateLimit: {
        requestsPerMinute: 60,
        dailyLimit: 5000
      }
    };
  }

  /**
   * Create Shopify API client
   */
  createShopifyClient() {
    return {
      name: 'shopify',
      uk: {
        baseURL: `https://${process.env.SHOPIFY_UK_SHOP_URL}/admin/api/2024-01`,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_UK_ACCESS_TOKEN
        }
      },
      usa: {
        baseURL: `https://${process.env.SHOPIFY_USA_SHOP_URL}/admin/api/2024-01`,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_USA_ACCESS_TOKEN
        }
      },
      rateLimit: {
        requestsPerSecond: 2,
        burstSize: 40
      }
    };
  }

  /**
   * Create Amazon SP-API client
   */
  createAmazonClient() {
    return {
      name: 'amazon',
      uk: {
        baseURL: 'https://sellingpartnerapi-eu.amazon.com',
        marketplaceId: process.env.AMAZON_UK_MARKETPLACE_ID,
        region: 'eu-west-1'
      },
      usa: {
        baseURL: 'https://sellingpartnerapi-na.amazon.com', 
        marketplaceId: process.env.AMAZON_USA_MARKETPLACE_ID,
        region: 'us-east-1'
      },
      auth: {
        clientId: process.env.AMAZON_CLIENT_ID,
        clientSecret: process.env.AMAZON_CLIENT_SECRET,
        refreshToken: process.env.AMAZON_REFRESH_TOKEN
      },
      rateLimit: {
        requestsPerSecond: 0.5, // Very conservative for Amazon
        quotaRecoveryRate: 'varies_by_endpoint'
      }
    };
  }

  /**
   * Create Unleashed API client
   */
  createUnleashedClient() {
    return {
      name: 'unleashed',
      baseURL: process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-auth-id': process.env.UNLEASHED_API_ID,
        'api-auth-signature': this.generateUnleashedSignature
      },
      auth: {
        apiKey: process.env.UNLEASHED_API_KEY
      },
      rateLimit: {
        requestsPerMinute: 100,
        dailyLimit: 10000
      }
    };
  }

  /**
   * Create Microsoft Graph API client
   */
  createMicrosoftClient() {
    return {
      name: 'microsoft',
      baseURL: 'https://graph.microsoft.com/v1.0',
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        tenantId: process.env.MICROSOFT_TENANT_ID
      },
      rateLimit: {
        requestsPerSecond: 10,
        throttleThreshold: 'dynamic'
      }
    };
  }

  /**
   * Execute API request with retry logic and circuit breaker
   */
  async executeRequest(serviceName, endpoint, options = {}) {
    const service = this.serviceClients[serviceName];
    if (!service) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(serviceName)) {
      throw new Error(`Circuit breaker open for service: ${serviceName}`);
    }

    // Check rate limiting
    await this.checkRateLimit(serviceName);

    const requestId = this.generateRequestId();
    logInfo('API request started', { 
      requestId, 
      service: serviceName, 
      endpoint,
      method: options.method || 'GET'
    });

    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeHttpRequest(service, endpoint, options, requestId);
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(serviceName);
        
        logInfo('API request successful', {
          requestId,
          service: serviceName,
          endpoint,
          attempt,
          statusCode: response.status,
          responseTime: response.responseTime
        });

        return response.data;

      } catch (error) {
        lastError = error;
        
        logWarn('API request failed', {
          requestId,
          service: serviceName,
          endpoint, 
          attempt,
          error: error.message,
          statusCode: error.response?.status
        });

        // Increment circuit breaker failure count
        this.recordCircuitBreakerFailure(serviceName);

        // Don't retry on authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          break;
        }

        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }

        // Calculate backoff delay
        if (attempt < this.config.maxRetries) {
          const backoffMs = this.calculateBackoffDelay(attempt);
          logInfo('Retrying request after backoff', {
            requestId,
            service: serviceName,
            attempt: attempt + 1,
            backoffMs
          });
          await setTimeout(backoffMs);
        }
      }
    }

    logError('API request failed after all retries', {
      requestId,
      service: serviceName,
      endpoint,
      attempts: this.config.maxRetries,
      error: lastError.message
    });

    throw lastError;
  }

  /**
   * Make HTTP request using axios
   */
  async makeHttpRequest(service, endpoint, options, requestId) {
    const startTime = Date.now();
    
    const axiosConfig = {
      timeout: this.config.timeout,
      ...options,
      headers: {
        ...service.headers,
        ...options.headers,
        'X-Request-ID': requestId,
        'User-Agent': 'Sentia-Manufacturing-Dashboard/3.0.0'
      }
    };

    // Handle different service configurations
    if (service.uk && service.usa) {
      // Multi-region service (Shopify, Amazon)
      const region = options.region || 'uk';
      const regionConfig = service[region];
      axiosConfig.baseURL = regionConfig.baseURL;
      
      if (regionConfig.headers) {
        Object.assign(axiosConfig.headers, regionConfig.headers);
      }
    } else {
      // Single endpoint service
      axiosConfig.baseURL = service.baseURL;
    }

    const response = await axios({
      url: endpoint,
      ...axiosConfig
    });

    response.responseTime = Date.now() - startTime;
    return response;
  }

  /**
   * Check rate limiting for service
   */
  async checkRateLimit(serviceName) {
    const service = this.serviceClients[serviceName];
    if (!service.rateLimit) return;

    const now = Date.now();
    const rateLimiter = this.rateLimiters.get(serviceName) || {
      requests: [],
      lastReset: now
    };

    // Clean old requests
    const window = 60000; // 1 minute window
    rateLimiter.requests = rateLimiter.requests.filter(
      requestTime => now - requestTime < window
    );

    // Check if we're at the limit
    const limit = service.rateLimit.requestsPerMinute || 60;
    if (rateLimiter.requests.length >= limit) {
      const oldestRequest = Math.min(...rateLimiter.requests);
      const waitTime = window - (now - oldestRequest);
      
      logWarn('Rate limit reached, waiting', {
        service: serviceName,
        limit,
        waitTime
      });
      
      await setTimeout(waitTime);
    }

    // Record this request
    rateLimiter.requests.push(now);
    this.rateLimiters.set(serviceName, rateLimiter);
  }

  /**
   * Circuit breaker implementation
   */
  isCircuitBreakerOpen(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      if (Date.now() - breaker.lastFailureTime > this.config.circuitBreakerResetTime) {
        breaker.state = 'half-open';
        logInfo('Circuit breaker half-open', { service: serviceName });
      }
      return breaker.state === 'open';
    }

    return false;
  }

  recordCircuitBreakerFailure(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName) || {
      failures: 0,
      state: 'closed',
      lastFailureTime: null
    };

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.state = 'open';
      logWarn('Circuit breaker opened', {
        service: serviceName,
        failures: breaker.failures
      });
    }

    this.circuitBreakers.set(serviceName, breaker);
  }

  resetCircuitBreaker(serviceName) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
      this.circuitBreakers.set(serviceName, breaker);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(attempt) {
    const delay = this.config.baseBackoffMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, this.config.maxBackoffMs);
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate Unleashed API signature
   */
  generateUnleashedSignature(httpVerb, url, query, body) {
    // Implementation would depend on Unleashed's specific signing requirements
    // This is a placeholder for the actual signature generation
    const crypto = require('crypto');
    const apiKey = process.env.UNLEASHED_API_KEY;
    const message = `${httpVerb}${url}${query || ''}${body || ''}`;
    return crypto.createHmac('sha256', apiKey).update(message).digest('base64');
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    const health = {};
    
    for (const serviceName of Object.keys(this.serviceClients)) {
      const breaker = this.circuitBreakers.get(serviceName);
      const rateLimiter = this.rateLimiters.get(serviceName);
      
      health[serviceName] = {
        status: breaker?.state || 'closed',
        failures: breaker?.failures || 0,
        requestsInWindow: rateLimiter?.requests?.length || 0,
        lastRequestTime: rateLimiter?.requests?.slice(-1)[0] || null
      };
    }
    
    return health;
  }

  /**
   * Specific service methods
   */

  // Xero methods
  async getXeroContacts(options = {}) {
    return this.executeRequest('xero', '/api.xro/2.0/Contacts', {
      method: 'GET',
      ...options
    });
  }

  async getXeroInvoices(options = {}) {
    return this.executeRequest('xero', '/api.xro/2.0/Invoices', {
      method: 'GET',
      ...options
    });
  }

  async getXeroBankTransactions(options = {}) {
    return this.executeRequest('xero', '/api.xro/2.0/BankTransactions', {
      method: 'GET',
      ...options
    });
  }

  // Shopify methods
  async getShopifyOrders(region = 'uk', options = {}) {
    return this.executeRequest('shopify', '/orders.json', {
      method: 'GET',
      region,
      ...options
    });
  }

  async getShopifyProducts(region = 'uk', options = {}) {
    return this.executeRequest('shopify', '/products.json', {
      method: 'GET',
      region,
      ...options
    });
  }

  async getShopifyInventory(region = 'uk', options = {}) {
    return this.executeRequest('shopify', '/inventory_levels.json', {
      method: 'GET',
      region,
      ...options
    });
  }

  // Amazon methods
  async getAmazonOrders(region = 'uk', options = {}) {
    return this.executeRequest('amazon', '/orders/v0/orders', {
      method: 'GET',
      region,
      ...options
    });
  }

  async getAmazonInventory(region = 'uk', options = {}) {
    return this.executeRequest('amazon', '/fba/inventory/v1/summaries', {
      method: 'GET',
      region,
      ...options
    });
  }

  // Unleashed methods
  async getUnleashedProducts(options = {}) {
    return this.executeRequest('unleashed', '/Products', {
      method: 'GET',
      ...options
    });
  }

  async getUnleashedInventory(options = {}) {
    return this.executeRequest('unleashed', '/StockOnHand', {
      method: 'GET',
      ...options
    });
  }

  async getUnleashedSalesOrders(options = {}) {
    return this.executeRequest('unleashed', '/SalesOrders', {
      method: 'GET',
      ...options
    });
  }

  // Microsoft Graph methods
  async getMicrosoftUsers(options = {}) {
    return this.executeRequest('microsoft', '/users', {
      method: 'GET',
      ...options
    });
  }

  async getMicrosoftCalendarEvents(userId, options = {}) {
    return this.executeRequest('microsoft', `/users/${userId}/events`, {
      method: 'GET',
      ...options
    });
  }
}

/**
 * Create singleton instance
 */
let unifiedApiClient = null;

export function createUnifiedApiClient(config = {}) {
  if (!unifiedApiClient) {
    unifiedApiClient = new UnifiedApiClient(config);
  }
  return unifiedApiClient;
}

export function getUnifiedApiClient() {
  if (!unifiedApiClient) {
    throw new Error('UnifiedApiClient not initialized. Call createUnifiedApiClient() first.');
  }
  return unifiedApiClient;
}

export default UnifiedApiClient;