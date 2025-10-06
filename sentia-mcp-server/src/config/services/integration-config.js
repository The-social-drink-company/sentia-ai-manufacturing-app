/**
 * Integration Configuration Management
 * 
 * Comprehensive configuration for external service integrations including
 * Xero, Shopify, Amazon, Anthropic, OpenAI, and Unleashed ERP with
 * environment-specific settings, rate limiting, and failover handling.
 */

import { config } from 'dotenv';

config();

/**
 * Integration Configuration Factory
 */
export class IntegrationConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  /**
   * Build environment-specific integration configuration
   */
  buildConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration();
    
    return {
      ...baseConfig,
      ...envConfig,
      // Computed properties
      xeroConfig: this.buildXeroConfiguration(),
      shopifyConfig: this.buildShopifyConfiguration(),
      amazonConfig: this.buildAmazonConfiguration(),
      anthropicConfig: this.buildAnthropicConfiguration(),
      openaiConfig: this.buildOpenAIConfiguration(),
      unleashedConfig: this.buildUnleashedConfiguration(),
      globalConfig: this.buildGlobalConfiguration()
    };
  }

  /**
   * Base integration configuration
   */
  getBaseConfiguration() {
    return {
      // Global integration settings
      timeout: parseInt(process.env.INTEGRATION_TIMEOUT) || 30000,
      retryAttempts: parseInt(process.env.INTEGRATION_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.INTEGRATION_RETRY_DELAY) || 1000,
      enableCaching: process.env.INTEGRATION_ENABLE_CACHING !== 'false',
      cacheTTL: parseInt(process.env.INTEGRATION_CACHE_TTL) || 300,
      
      // Request/Response settings
      enableRequestLogging: process.env.INTEGRATION_LOG_REQUESTS === 'true',
      enableResponseLogging: process.env.INTEGRATION_LOG_RESPONSES === 'true',
      enableErrorLogging: process.env.INTEGRATION_LOG_ERRORS !== 'false',
      
      // Security settings
      enableSandboxMode: process.env.INTEGRATION_SANDBOX_MODE === 'true',
      enableMockMode: process.env.INTEGRATION_MOCK_MODE === 'true',
      validateSSL: process.env.INTEGRATION_VALIDATE_SSL !== 'false',
      
      // Rate limiting
      enableRateLimiting: process.env.INTEGRATION_RATE_LIMITING !== 'false',
      globalRateLimit: parseInt(process.env.INTEGRATION_GLOBAL_RATE_LIMIT) || 1000,
      
      // Circuit breaker
      enableCircuitBreaker: process.env.INTEGRATION_CIRCUIT_BREAKER === 'true',
      circuitBreakerThreshold: parseInt(process.env.INTEGRATION_CB_THRESHOLD) || 5,
      circuitBreakerTimeout: parseInt(process.env.INTEGRATION_CB_TIMEOUT) || 30000,
      
      // Health checking
      enableHealthChecks: process.env.INTEGRATION_HEALTH_CHECKS !== 'false',
      healthCheckInterval: parseInt(process.env.INTEGRATION_HEALTH_INTERVAL) || 60000
    };
  }

  /**
   * Environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const configs = {
      development: {
        // Development integration settings
        enableSandboxMode: true,
        enableMockMode: true,
        enableRequestLogging: true,
        enableResponseLogging: true,
        enableErrorLogging: true,
        
        // Relaxed timeouts for debugging
        timeout: 60000,
        retryAttempts: 2,
        
        // Enhanced debugging
        enableVerboseLogging: true,
        enableDebugMode: true,
        enableTestingEndpoints: true,
        
        // Development features
        enableHotReload: true,
        enableConfigReload: true,
        enableMockData: true
      },

      testing: {
        // Testing integration settings
        enableSandboxMode: true,
        enableMockMode: false,
        enableRequestLogging: true,
        enableResponseLogging: false,
        enableErrorLogging: true,
        
        // Testing timeouts
        timeout: 45000,
        retryAttempts: 2,
        
        // Testing features
        enableTestingEndpoints: true,
        enableResponseValidation: true,
        enableContractTesting: true,
        enableStubbing: true,
        
        // Quality assurance
        enablePerformanceTesting: true,
        enableLoadTesting: true,
        enableFailoverTesting: true
      },

      staging: {
        // Staging integration settings
        enableSandboxMode: true,
        enableMockMode: false,
        enableRequestLogging: true,
        enableResponseLogging: false,
        enableErrorLogging: true,
        
        // Production-like timeouts
        timeout: 45000,
        retryAttempts: 3,
        
        // Staging features
        enableProductionMirroring: true,
        enablePerformanceTesting: true,
        enableValidation: true,
        
        // Pre-production validation
        enablePreProductionChecks: true,
        enableRegressionTesting: true,
        enableCapacityTesting: true
      },

      production: {
        // Production integration settings
        enableSandboxMode: false,
        enableMockMode: false,
        enableRequestLogging: false,
        enableResponseLogging: false,
        enableErrorLogging: true,
        
        // Optimized timeouts
        timeout: 30000,
        retryAttempts: 3,
        
        // Production optimizations
        enableCircuitBreaker: true,
        enableCaching: true,
        enableCompression: true,
        
        // Production monitoring
        enableMonitoring: true,
        enableAlerting: true,
        enableMetrics: true
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Build Xero integration configuration
   */
  buildXeroConfiguration() {
    const config = this.config;
    
    return {
      // Basic Xero settings
      enabled: process.env.XERO_ENABLED === 'true',
      sandbox: config.enableSandboxMode,
      baseUrl: config.enableSandboxMode 
        ? 'https://api.xero.com/api.xro/2.0'
        : 'https://api.xero.com/api.xro/2.0',
      
      // Authentication
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUri: process.env.XERO_REDIRECT_URI,
      scopes: process.env.XERO_SCOPES?.split(',') || [
        'accounting.transactions',
        'accounting.reports.read',
        'accounting.contacts'
      ],
      
      // Request settings
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      
      // Rate limiting (Xero: 60 requests per minute)
      rateLimit: {
        enabled: config.enableRateLimiting,
        requestsPerMinute: 60,
        dailyLimit: 5000,
        strategy: 'token-bucket',
        burst: 10
      },
      
      // Caching
      enableCaching: config.enableCaching,
      cacheConfig: {
        ttl: config.cacheTTL,
        maxSize: 1000,
        keyPrefix: 'xero:',
        invalidateOnError: true
      },
      
      // Logging
      logRequests: config.enableRequestLogging,
      logResponses: config.enableResponseLogging,
      logErrors: config.enableErrorLogging,
      
      // Validation and testing
      enableValidation: config.enableResponseValidation || false,
      enableMocking: config.enableMockMode,
      testCredentials: this.environment === 'testing',
      
      // Error handling
      circuitBreaker: {
        enabled: config.enableCircuitBreaker,
        failureThreshold: 5,
        resetTimeout: 30000
      },
      
      // Webhooks
      webhooks: {
        enabled: process.env.XERO_WEBHOOKS_ENABLED === 'true',
        endpoint: process.env.XERO_WEBHOOK_ENDPOINT,
        secret: process.env.XERO_WEBHOOK_SECRET
      },
      
      // Specific API endpoints
      endpoints: {
        contacts: '/Contacts',
        invoices: '/Invoices',
        payments: '/Payments',
        accounts: '/Accounts',
        reports: '/Reports'
      }
    };
  }

  /**
   * Build Shopify integration configuration
   */
  buildShopifyConfiguration() {
    const config = this.config;
    
    return {
      // Basic Shopify settings
      enabled: process.env.SHOPIFY_ENABLED === 'true',
      sandbox: config.enableSandboxMode,
      
      // Store configuration
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecret: process.env.SHOPIFY_API_SECRET,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2023-10',
      
      // Request settings
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      
      // Rate limiting (Shopify: 2 requests per second, 40 bucket size)
      rateLimit: {
        enabled: config.enableRateLimiting,
        requestsPerSecond: 2,
        bucketSize: 40,
        strategy: 'leaky-bucket',
        restoreRate: 2
      },
      
      // Caching
      enableCaching: config.enableCaching,
      cacheConfig: {
        ttl: config.cacheTTL,
        maxSize: 2000,
        keyPrefix: 'shopify:',
        invalidateOnUpdate: true
      },
      
      // Logging
      logRequests: config.enableRequestLogging,
      logResponses: config.enableResponseLogging,
      logErrors: config.enableErrorLogging,
      
      // Validation and testing
      enableValidation: config.enableResponseValidation || false,
      enableMocking: config.enableMockMode,
      testStore: process.env.SHOPIFY_TEST_STORE,
      
      // Error handling
      circuitBreaker: {
        enabled: config.enableCircuitBreaker,
        failureThreshold: 5,
        resetTimeout: 30000
      },
      
      // Webhooks
      webhooks: {
        enabled: process.env.SHOPIFY_WEBHOOKS_ENABLED === 'true',
        endpoint: process.env.SHOPIFY_WEBHOOK_ENDPOINT,
        secret: process.env.SHOPIFY_WEBHOOK_SECRET,
        topics: [
          'orders/create',
          'orders/updated',
          'orders/paid',
          'inventory_levels/update'
        ]
      },
      
      // Specific API resources
      resources: {
        orders: '/admin/api/{version}/orders.json',
        products: '/admin/api/{version}/products.json',
        customers: '/admin/api/{version}/customers.json',
        inventory: '/admin/api/{version}/inventory_levels.json'
      }
    };
  }

  /**
   * Build Amazon SP-API configuration
   */
  buildAmazonConfiguration() {
    const config = this.config;
    
    return {
      // Basic Amazon settings
      enabled: process.env.AMAZON_ENABLED === 'true',
      sandbox: config.enableSandboxMode,
      region: process.env.AMAZON_REGION || 'us-east-1',
      
      // Credentials
      accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
      roleArn: process.env.AMAZON_ROLE_ARN,
      clientId: process.env.AMAZON_CLIENT_ID,
      clientSecret: process.env.AMAZON_CLIENT_SECRET,
      refreshToken: process.env.AMAZON_REFRESH_TOKEN,
      
      // Request settings
      timeout: config.timeout * 2, // Amazon can be slower
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      
      // Rate limiting (Amazon: varies by endpoint)
      rateLimit: {
        enabled: config.enableRateLimiting,
        requestsPerSecond: 0.5, // Conservative default
        burstLimit: 10,
        strategy: 'sliding-window'
      },
      
      // Caching
      enableCaching: config.enableCaching,
      cacheConfig: {
        ttl: config.cacheTTL * 2, // Longer cache for Amazon
        maxSize: 1500,
        keyPrefix: 'amazon:',
        compressLargeResponses: true
      },
      
      // Logging
      logRequests: config.enableRequestLogging,
      logResponses: config.enableResponseLogging,
      logErrors: config.enableErrorLogging,
      
      // Validation and testing
      enableValidation: config.enableResponseValidation || false,
      enableMocking: config.enableMockMode,
      testMarketplace: this.environment === 'testing',
      
      // Error handling
      circuitBreaker: {
        enabled: config.enableCircuitBreaker,
        failureThreshold: 3, // Lower threshold for Amazon
        resetTimeout: 60000 // Longer reset for Amazon
      },
      
      // SP-API specific settings
      marketplaces: {
        US: 'ATVPDKIKX0DER',
        CA: 'A2EUQ1WTGCTBG2',
        UK: 'A1F83G8C2ARO7P',
        DE: 'A1PA6795UKMFR9'
      },
      
      // API endpoints
      endpoints: {
        orders: '/orders/v0/orders',
        reports: '/reports/2021-06-30/reports',
        inventory: '/fba/inventory/v1/summaries',
        catalog: '/catalog/v0/items'
      }
    };
  }

  /**
   * Build Anthropic integration configuration
   */
  buildAnthropicConfiguration() {
    const config = this.config;
    
    return {
      // Basic Anthropic settings
      enabled: process.env.ANTHROPIC_ENABLED === 'true',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      
      // Model configuration
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7,
      
      // Request settings
      timeout: config.timeout * 3, // AI calls can be slow
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay * 2,
      
      // Rate limiting (Anthropic: varies by tier)
      rateLimit: {
        enabled: config.enableRateLimiting,
        requestsPerMinute: this.environment === 'production' ? 1000 : 100,
        tokensPerMinute: this.environment === 'production' ? 80000 : 8000,
        strategy: 'token-bucket'
      },
      
      // Caching
      enableCaching: config.enableCaching && this.environment !== 'testing',
      cacheConfig: {
        ttl: config.cacheTTL * 4, // Longer cache for AI responses
        maxSize: 500,
        keyPrefix: 'anthropic:',
        hashInputs: true
      },
      
      // Logging
      logRequests: config.enableRequestLogging,
      logResponses: this.environment === 'development',
      logErrors: config.enableErrorLogging,
      enableUsageTracking: true,
      
      // Testing and development
      testMode: this.environment === 'testing',
      enableMocking: config.enableMockMode,
      
      // Error handling
      circuitBreaker: {
        enabled: config.enableCircuitBreaker,
        failureThreshold: 3,
        resetTimeout: 30000
      },
      
      // Safety and moderation
      enableSafetyCheck: true,
      contentFiltering: this.environment === 'production',
      
      // Performance
      enableStreaming: false,
      batchProcessing: this.environment === 'production'
    };
  }

  /**
   * Build OpenAI integration configuration
   */
  buildOpenAIConfiguration() {
    const config = this.config;
    
    return {
      // Basic OpenAI settings
      enabled: process.env.OPENAI_ENABLED === 'true',
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      
      // Model configuration
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      
      // Request settings
      timeout: config.timeout * 3,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay * 2,
      
      // Rate limiting (OpenAI: varies by tier)
      rateLimit: {
        enabled: config.enableRateLimiting,
        requestsPerMinute: this.environment === 'production' ? 3000 : 300,
        tokensPerMinute: this.environment === 'production' ? 90000 : 9000,
        strategy: 'token-bucket'
      },
      
      // Caching
      enableCaching: config.enableCaching && this.environment !== 'testing',
      cacheConfig: {
        ttl: config.cacheTTL * 4,
        maxSize: 500,
        keyPrefix: 'openai:',
        hashInputs: true
      },
      
      // Logging
      logRequests: config.enableRequestLogging,
      logResponses: this.environment === 'development',
      logErrors: config.enableErrorLogging,
      enableUsageTracking: true,
      
      // Testing and development
      testMode: this.environment === 'testing',
      enableMocking: config.enableMockMode,
      
      // Error handling
      circuitBreaker: {
        enabled: config.enableCircuitBreaker,
        failureThreshold: 3,
        resetTimeout: 30000
      },
      
      // Safety and moderation
      enableModeration: this.environment === 'production',
      contentFiltering: this.environment === 'production',
      
      // Performance
      enableStreaming: false,
      batchProcessing: this.environment === 'production'
    };
  }

  /**
   * Build Unleashed ERP integration configuration
   */
  buildUnleashedConfiguration() {
    const config = this.config;
    
    return {
      // Basic Unleashed settings
      enabled: process.env.UNLEASHED_ENABLED === 'true',
      baseUrl: process.env.UNLEASHED_BASE_URL || 'https://api.unleashedsoftware.com',
      apiId: process.env.UNLEASHED_API_ID,
      apiKey: process.env.UNLEASHED_API_KEY,
      
      // Request settings
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      
      // Rate limiting (Unleashed: reasonable limits)
      rateLimit: {
        enabled: config.enableRateLimiting,
        requestsPerMinute: 1000,
        strategy: 'fixed-window'
      },
      
      // Caching
      enableCaching: config.enableCaching,
      cacheConfig: {
        ttl: config.cacheTTL,
        maxSize: 2000,
        keyPrefix: 'unleashed:',
        invalidateOnUpdate: true
      },
      
      // Logging
      logRequests: config.enableRequestLogging,
      logResponses: config.enableResponseLogging,
      logErrors: config.enableErrorLogging,
      
      // Validation and testing
      enableValidation: config.enableResponseValidation || false,
      enableMocking: config.enableMockMode,
      
      // Error handling
      circuitBreaker: {
        enabled: config.enableCircuitBreaker,
        failureThreshold: 5,
        resetTimeout: 30000
      },
      
      // ERP specific endpoints
      endpoints: {
        products: '/Products',
        stockOnHand: '/StockOnHand',
        salesOrders: '/SalesOrders',
        purchaseOrders: '/PurchaseOrders',
        customers: '/Customers',
        suppliers: '/Suppliers'
      }
    };
  }

  /**
   * Build global integration configuration
   */
  buildGlobalConfiguration() {
    const config = this.config;
    
    return {
      // Global settings that apply to all integrations
      defaultTimeout: config.timeout,
      defaultRetryAttempts: config.retryAttempts,
      defaultRetryDelay: config.retryDelay,
      
      // Health monitoring
      healthChecks: {
        enabled: config.enableHealthChecks,
        interval: config.healthCheckInterval,
        timeout: 5000,
        failureThreshold: 3,
        endpoints: [
          { name: 'xero', url: '/health/xero' },
          { name: 'shopify', url: '/health/shopify' },
          { name: 'amazon', url: '/health/amazon' },
          { name: 'anthropic', url: '/health/anthropic' },
          { name: 'openai', url: '/health/openai' },
          { name: 'unleashed', url: '/health/unleashed' }
        ]
      },
      
      // Failover and fallback
      failover: {
        enabled: true,
        strategy: 'round-robin',
        healthCheckRequired: true,
        backupServices: {
          ai: ['anthropic', 'openai'],
          erp: ['unleashed'],
          ecommerce: ['shopify'],
          accounting: ['xero']
        }
      },
      
      // Monitoring and alerting
      monitoring: {
        enabled: this.environment === 'production',
        metricsCollection: true,
        alertThresholds: {
          errorRate: 5, // 5% error rate
          responseTime: 10000, // 10 seconds
          availability: 95 // 95% uptime
        }
      },
      
      // Security
      security: {
        enableSSLVerification: this.environment === 'production',
        enableEncryption: true,
        rotateCredentials: this.environment === 'production',
        auditIntegrationCalls: true
      }
    };
  }

  /**
   * Validate integration configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Global validation
    if (this.config.timeout < 1000) {
      warnings.push('Integration timeout should be at least 1000ms');
    }
    
    if (this.config.retryAttempts < 0 || this.config.retryAttempts > 10) {
      warnings.push('Retry attempts should be between 0 and 10');
    }
    
    // Xero validation
    if (this.config.xeroConfig.enabled) {
      if (!this.config.xeroConfig.clientId || !this.config.xeroConfig.clientSecret) {
        errors.push('Xero client ID and secret are required when Xero is enabled');
      }
    }
    
    // Shopify validation
    if (this.config.shopifyConfig.enabled) {
      if (!this.config.shopifyConfig.shopDomain || !this.config.shopifyConfig.accessToken) {
        errors.push('Shopify shop domain and access token are required when Shopify is enabled');
      }
    }
    
    // AI services validation
    if (this.config.anthropicConfig.enabled && !this.config.anthropicConfig.apiKey) {
      errors.push('Anthropic API key is required when Anthropic is enabled');
    }
    
    if (this.config.openaiConfig.enabled && !this.config.openaiConfig.apiKey) {
      errors.push('OpenAI API key is required when OpenAI is enabled');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration for integration libraries
   */
  exportConfig() {
    return {
      // Global settings
      global: this.config.globalConfig,
      
      // Service-specific configs
      xero: this.config.xeroConfig,
      shopify: this.config.shopifyConfig,
      amazon: this.config.amazonConfig,
      anthropic: this.config.anthropicConfig,
      openai: this.config.openaiConfig,
      unleashed: this.config.unleashedConfig,
      
      // Environment info
      environment: this.environment
    };
  }
}

/**
 * Create integration configuration for current environment
 */
export function createIntegrationConfig(environment = process.env.NODE_ENV) {
  return new IntegrationConfig(environment);
}

/**
 * Get integration configuration
 */
export function getIntegrationConfig(environment = process.env.NODE_ENV) {
  const integrationConfig = new IntegrationConfig(environment);
  return integrationConfig.exportConfig();
}

/**
 * Validate integration configuration
 */
export function validateIntegrationConfig(environment = process.env.NODE_ENV) {
  const integrationConfig = new IntegrationConfig(environment);
  return integrationConfig.validate();
}

export default IntegrationConfig;