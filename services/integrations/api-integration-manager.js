/**
 * API Integration Manager for Sentia Manufacturing Dashboard
 * Manages all external API connections and ensures they're properly configured
 */

import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';
// Node 18+ has global fetch

class APIIntegrationManager {
  constructor() {
    this.services = new Map();
    this.healthStatus = {};
    this.initialized = false;
    
    // Define all external services
    this.serviceConfigs = {
      xero: {
        name: 'Xero Accounting',
        baseUrl: 'https://api.xero.com/api.xro/2.0',
        requiredEnvVars: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
        authType: 'oauth2',
        healthEndpoint: '/Organisation',
        priority: 1
      },
      shopify: {
        name: 'Shopify E-commerce',
        baseUrl: 'https://sentia-drinks.myshopify.com/admin/api/2024-01',
        requiredEnvVars: ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'SHOPIFY_ACCESS_TOKEN'],
        authType: 'apikey',
        healthEndpoint: '/shop.json',
        priority: 1
      },
      amazon: {
        name: 'Amazon SP-API',
        baseUrl: 'https://sellingpartnerapi-eu.amazon.com',
        requiredEnvVars: ['AMAZON_SP_API_CLIENT_ID', 'AMAZON_SP_API_CLIENT_SECRET', 'AMAZON_SP_API_REFRESH_TOKEN'],
        authType: 'oauth2',
        healthEndpoint: '/sellers/v1/marketplaceParticipations',
        priority: 2
      },
      unleashed: {
        name: 'Unleashed ERP',
        baseUrl: 'https://api.unleashedsoftware.com',
        requiredEnvVars: ['UNLEASHED_API_ID', 'UNLEASHED_API_KEY'],
        authType: 'apikey',
        healthEndpoint: '/Currencies',
        priority: 2
      },
      openai: {
        name: 'OpenAI GPT',
        baseUrl: 'https://api.openai.com/v1',
        requiredEnvVars: ['OPENAI_API_KEY'],
        authType: 'bearer',
        healthEndpoint: '/models',
        priority: 1
      },
      anthropic: {
        name: 'Anthropic Claude',
        baseUrl: 'https://api.anthropic.com/v1',
        requiredEnvVars: ['ANTHROPIC_API_KEY'],
        authType: 'apikey',
        healthEndpoint: '/messages',
        priority: 1
      },
      forecasting: {
        name: 'Forecasting Service',
        baseUrl: process.env.FORECASTING_API_URL || 'https://api.forecastingservice.com',
        requiredEnvVars: ['FORECASTING_API_KEY'],
        authType: 'apikey',
        healthEndpoint: '/health',
        priority: 3
      }
      // Removed Stripe, SendGrid, and Twilio - not needed for manufacturing dashboard
    };
  }

  /**
   * Initialize all API integrations
   */
  async initialize() {
    logInfo('Initializing API Integration Manager...');
    
    for (const [serviceId, config] of Object.entries(this.serviceConfigs)) {
      try {
        const service = await this.initializeService(serviceId, config);
        if (service) {
          this.services.set(serviceId, service);
          this.healthStatus[serviceId] = 'connected';
          logInfo(`✅ ${config.name} initialized successfully`);
        } else {
          this.healthStatus[serviceId] = 'not_configured';
          logWarn(`⚠️ ${config.name} not configured (missing credentials)`);
        }
      } catch (error) {
        this.healthStatus[serviceId] = 'error';
        logError(`❌ Failed to initialize ${config.name}`, { error: error.message });
      }
    }
    
    this.initialized = true;
    logInfo('API Integration Manager initialization complete', {
      totalServices: Object.keys(this.serviceConfigs).length,
      connectedServices: Object.values(this.healthStatus).filter(s => s === 'connected').length,
      failedServices: Object.values(this.healthStatus).filter(s => s === 'error').length
    });
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    return this.getStatus();
  }

  /**
   * Initialize individual service
   */
  async initializeService(serviceId, config) {
    // Check if required environment variables exist
    const missingVars = this.checkRequiredEnvVars(serviceId, config.requiredEnvVars);
    if (missingVars.length > 0) {
      logWarn(`Missing environment variables for ${config.name}`, { missingVars });
      return null;
    }
    
    // Create service object
    const service = {
      id: serviceId,
      name: config.name,
      baseUrl: config.baseUrl,
      authType: config.authType,
      credentials: this.getCredentials(serviceId, config),
      lastHealthCheck: null,
      isHealthy: false,
      errorCount: 0
    };
    
    // Test connection
    try {
      await this.testConnection(service, config);
      service.isHealthy = true;
      service.lastHealthCheck = new Date();
    } catch (error) {
      logError(`Failed to connect to ${config.name}`, { error: error.message });
      service.isHealthy = false;
      service.errorCount++;
    }
    
    return service;
  }

  /**
   * Get credentials for service
   */
  getCredentials(serviceId, config) {
    const creds = {};
    
    switch (serviceId) {
      case 'xero':
        creds.clientId = process.env.XERO_CLIENT_ID;
        creds.clientSecret = process.env.XERO_CLIENT_SECRET;
        creds.tenantId = process.env.XERO_TENANT_ID;
        break;
      case 'shopify':
        // Check for region-specific variables first (UK/USA), then fall back to generic
        creds.apiKey = process.env.SHOPIFY_UK_API_KEY || process.env.SHOPIFY_API_KEY;
        creds.apiSecret = process.env.SHOPIFY_UK_SECRET || process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_UK_API_SECRET;
        creds.accessToken = process.env.SHOPIFY_UK_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
        creds.shopUrl = process.env.SHOPIFY_UK_SHOP_URL || process.env.SHOPIFY_SHOP_URL || process.env.SHOPIFY_SHOP_DOMAIN;
        break;
      case 'amazon':
        creds.clientId = process.env.AMAZON_SP_API_CLIENT_ID;
        creds.clientSecret = process.env.AMAZON_SP_API_CLIENT_SECRET;
        creds.refreshToken = process.env.AMAZON_SP_API_REFRESH_TOKEN;
        creds.region = process.env.AMAZON_SP_API_REGION || 'eu-west-1';
        break;
      case 'unleashed':
        creds.apiId = process.env.UNLEASHED_API_ID;
        creds.apiKey = process.env.UNLEASHED_API_KEY;
        break;
      case 'openai':
        creds.apiKey = process.env.OPENAI_API_KEY;
        break;
      case 'anthropic':
        creds.apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      // Removed Stripe, SendGrid, and Twilio cases - not needed
      default:
        creds.apiKey = process.env[`${serviceId.toUpperCase()}_API_KEY`];
    }
    
    return creds;
  }

  /**
   * Test connection to service
   */
  async testConnection(service, config) {
    // Skip actual API calls in test/development unless explicitly enabled
    if (process.env.NODE_ENV !== 'production' && process.env.TEST_EXTERNAL_APIS !== 'true') {
      logInfo(`Skipping connection test for ${service.name} in ${process.env.NODE_ENV} environment`);
      return true;
    }
    
    const headers = this.getAuthHeaders(service);
    
    try {
      const response = await fetch(`${service.baseUrl}${config.healthEndpoint}`, {
        method: 'GET',
        headers,
        timeout: 5000
      });
      
      if (!response.ok && response.status !== 401) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get auth headers for service
   */
  getAuthHeaders(service) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Sentia-Manufacturing-Dashboard/1.0'
    };
    
    switch (service.authType) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${service.credentials.apiKey || service.credentials.secretKey}`;
        break;
      case 'apikey':
        if (service.id === 'shopify') {
          headers['X-Shopify-Access-Token'] = service.credentials.accessToken;
        } else if (service.id === 'anthropic') {
          headers['x-api-key'] = service.credentials.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['X-API-Key'] = service.credentials.apiKey;
        }
        break;
      case 'basic':
        const auth = Buffer.from(`${service.credentials.accountSid}:${service.credentials.authToken}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        break;
      case 'oauth2':
        // OAuth2 requires token exchange - handled separately
        break;
    }
    
    return headers;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    // Check health every 5 minutes
    setInterval(async () => {
      for (const [serviceId, service] of this.services) {
        try {
          const config = this.serviceConfigs[serviceId];
          await this.testConnection(service, config);
          service.isHealthy = true;
          service.lastHealthCheck = new Date();
          service.errorCount = 0;
          this.healthStatus[serviceId] = 'connected';
        } catch (error) {
          service.isHealthy = false;
          service.errorCount++;
          this.healthStatus[serviceId] = 'error';
          
          if (service.errorCount > 3) {
            logError(`Service ${service.name} has failed ${service.errorCount} health checks`, {
              lastError: error.message
            });
          }
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Make API request to service
   */
  async request(serviceId, endpoint, options = {}) {
    const service = this.services.get(serviceId);
    
    if (!service) {
      throw new Error(`Service ${serviceId} not initialized`);
    }
    
    if (!service.isHealthy) {
      throw new Error(`Service ${service.name} is currently unavailable`);
    }
    
    const url = `${service.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(service),
      ...options.headers
    };
    
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        timeout: options.timeout || 30000
      });
      
      if (!response.ok) {
        throw new Error(`${service.name} API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      service.errorCount++;
      logError(`API request failed for ${service.name}`, {
        endpoint,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get status of all services
   */
  getStatus() {
    const status = {
      initialized: this.initialized,
      services: {}
    };
    
    for (const [serviceId, config] of Object.entries(this.serviceConfigs)) {
      const service = this.services.get(serviceId);
      status.services[serviceId] = {
        name: config.name,
        status: this.healthStatus[serviceId] || 'not_initialized',
        isHealthy: service?.isHealthy || false,
        lastHealthCheck: service?.lastHealthCheck || null,
        errorCount: service?.errorCount || 0,
        priority: config.priority
      };
    }
    
    return status;
  }

  /**
   * Get specific service
   */
  getService(serviceId) {
    return this.services.get(serviceId);
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(serviceId) {
    const service = this.services.get(serviceId);
    return service && service.isHealthy;
  }

  /**
   * Shutdown all connections
   */
  shutdown() {
    logInfo('Shutting down API Integration Manager...');
    // Clear health monitoring interval
    // Cleanup any open connections
    this.services.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export default new APIIntegrationManager();