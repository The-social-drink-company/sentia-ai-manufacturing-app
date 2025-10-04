/**
 * API Configuration Management
 * 
 * Comprehensive API configuration including rate limiting, timeouts,
 * retry policies, authentication, and environment-specific optimizations.
 */

import { config } from 'dotenv';

config();

/**
 * API Configuration Factory
 */
export class APIConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  /**
   * Build environment-specific API configuration
   */
  buildConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration();
    
    return {
      ...baseConfig,
      ...envConfig,
      // Computed properties
      rateLimitConfig: this.buildRateLimitConfiguration(),
      timeoutConfig: this.buildTimeoutConfiguration(),
      retryConfig: this.buildRetryConfiguration(),
      authConfig: this.buildAuthConfiguration(),
      validationConfig: this.buildValidationConfiguration()
    };
  }

  /**
   * Base API configuration
   */
  getBaseConfiguration() {
    return {
      // Server settings
      host: process.env.API_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT) || 3001,
      baseUrl: process.env.API_BASE_URL || '/api',
      version: process.env.API_VERSION || 'v1',
      
      // Request limits
      maxRequestSize: process.env.API_MAX_REQUEST_SIZE || '10mb',
      maxUrlLength: parseInt(process.env.API_MAX_URL_LENGTH) || 2048,
      maxHeaderSize: parseInt(process.env.API_MAX_HEADER_SIZE) || 8192,
      
      // Default timeouts
      requestTimeout: parseInt(process.env.API_REQUEST_TIMEOUT) || 30000,
      responseTimeout: parseInt(process.env.API_RESPONSE_TIMEOUT) || 30000,
      keepAliveTimeout: parseInt(process.env.API_KEEP_ALIVE_TIMEOUT) || 5000,
      headersTimeout: parseInt(process.env.API_HEADERS_TIMEOUT) || 10000,
      
      // Rate limiting
      rateLimitEnabled: process.env.API_RATE_LIMIT_ENABLED !== 'false',
      rateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 900000, // 15 minutes
      rateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX) || 100,
      
      // Retry settings
      enableRetry: process.env.API_ENABLE_RETRY !== 'false',
      maxRetries: parseInt(process.env.API_MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000,
      
      // Compression
      enableCompression: process.env.API_ENABLE_COMPRESSION !== 'false',
      compressionThreshold: parseInt(process.env.API_COMPRESSION_THRESHOLD) || 1024,
      compressionLevel: parseInt(process.env.API_COMPRESSION_LEVEL) || 6,
      
      // CORS
      enableCORS: process.env.API_ENABLE_CORS !== 'false',
      corsOrigins: process.env.API_CORS_ORIGINS?.split(',') || ['*'],
      corsCredentials: process.env.API_CORS_CREDENTIALS === 'true',
      
      // Security headers
      enableHelmet: process.env.API_ENABLE_HELMET !== 'false',
      enableCSP: process.env.API_ENABLE_CSP !== 'false',
      enableHSTS: process.env.API_ENABLE_HSTS !== 'false',
      
      // Authentication
      enableAuth: process.env.API_ENABLE_AUTH !== 'false',
      authHeader: process.env.API_AUTH_HEADER || 'Authorization',
      authScheme: process.env.API_AUTH_SCHEME || 'Bearer',
      
      // Validation
      enableValidation: process.env.API_ENABLE_VALIDATION !== 'false',
      strictValidation: process.env.API_STRICT_VALIDATION === 'true',
      
      // Logging
      enableRequestLogging: process.env.API_ENABLE_REQUEST_LOGGING === 'true',
      enableResponseLogging: process.env.API_ENABLE_RESPONSE_LOGGING === 'true',
      logLevel: process.env.API_LOG_LEVEL || 'info'
    };
  }

  /**
   * Environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const configs = {
      development: {
        // Development API settings
        enableCORS: true,
        corsOrigins: [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
          'https://localhost:3000',
          'https://localhost:5173'
        ],
        corsCredentials: true,
        
        // Relaxed limits for development
        rateLimitEnabled: false,
        rateLimitMax: 10000,
        requestTimeout: 60000,
        responseTimeout: 60000,
        
        // Enhanced debugging
        enableRequestLogging: true,
        enableResponseLogging: true,
        logLevel: 'debug',
        enableDetailedErrors: true,
        enableStackTraces: true,
        
        // Security (relaxed)
        enableHelmet: false,
        enableCSP: false,
        enableHSTS: false,
        strictValidation: false,
        
        // Development features
        enableSwagger: true,
        enableGraphQL: true,
        enableTestingEndpoints: true,
        enableMockData: true,
        enableHotReload: true
      },

      testing: {
        // Testing API settings
        enableCORS: true,
        corsOrigins: [
          'https://sentia-manufacturing-test.onrender.com',
          'https://test.sentia.com',
          'http://localhost:3000',
          'http://localhost:5173'
        ],
        corsCredentials: true,
        
        // Higher limits for testing
        rateLimitEnabled: true,
        rateLimitMax: 500,
        requestTimeout: 45000,
        responseTimeout: 45000,
        
        // Testing logging
        enableRequestLogging: true,
        enableResponseLogging: false,
        logLevel: 'info',
        enableDetailedErrors: true,
        
        // Moderate security
        enableHelmet: true,
        enableCSP: true,
        enableHSTS: false,
        strictValidation: true,
        
        // Testing features
        enableTestingEndpoints: true,
        enableMockData: true,
        enableTestingHeaders: true,
        testingBypass: true
      },

      staging: {
        // Staging API settings
        enableCORS: true,
        corsOrigins: [
          'https://sentia-manufacturing-staging.onrender.com',
          'https://staging.sentia.com',
          'https://test.sentia.com'
        ],
        corsCredentials: true,
        
        // Production-like limits
        rateLimitEnabled: true,
        rateLimitMax: 200,
        requestTimeout: 45000,
        responseTimeout: 45000,
        
        // Balanced logging
        enableRequestLogging: true,
        enableResponseLogging: false,
        logLevel: 'info',
        enableDetailedErrors: true,
        
        // Enhanced security
        enableHelmet: true,
        enableCSP: true,
        enableHSTS: true,
        strictValidation: true,
        
        // Staging features
        enableStagingHelpers: true,
        enablePerformanceMonitoring: true,
        enableLoadTesting: true
      },

      production: {
        // Production API settings
        enableCORS: true,
        corsOrigins: [
          'https://sentia-manufacturing-production.onrender.com',
          'https://app.sentia.com',
          'https://dashboard.sentia.com'
        ],
        corsCredentials: true,
        
        // Strict limits for production
        rateLimitEnabled: true,
        rateLimitMax: 100,
        requestTimeout: 30000,
        responseTimeout: 30000,
        
        // Minimal logging
        enableRequestLogging: false,
        enableResponseLogging: false,
        logLevel: 'warn',
        enableDetailedErrors: false,
        enableStackTraces: false,
        
        // Maximum security
        enableHelmet: true,
        enableCSP: true,
        enableHSTS: true,
        strictValidation: true,
        
        // Production optimizations
        enableCompression: true,
        enableCaching: true,
        enableCircuitBreaker: true,
        enableBulkOperations: true,
        enableAsyncProcessing: true
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Build rate limiting configuration
   */
  buildRateLimitConfiguration() {
    const config = this.config;
    
    return {
      // Basic rate limiting
      enabled: config.rateLimitEnabled,
      windowMs: config.rateLimitWindow,
      max: config.rateLimitMax,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      
      // Skip conditions
      skip: (req) => {
        // Skip rate limiting for health checks
        if (req.path === '/health') return true;
        
        // Skip for testing environment with bypass header
        if (this.environment === 'testing' && req.headers['x-testing-bypass']) {
          return true;
        }
        
        // Skip for development environment
        return this.environment === 'development';
      },
      
      // Custom key generator
      keyGenerator: (req) => {
        return req.ip + ':' + req.url;
      },
      
      // Per-user rate limiting
      perUser: {
        enabled: config.rateLimitEnabled,
        windowMs: config.rateLimitWindow,
        max: config.rateLimitMax * 2, // Higher limit per user
        keyGenerator: (req) => {
          return req.user?.id || req.ip;
        }
      },
      
      // Endpoint-specific limits
      endpoints: {
        '/api/tools': {
          windowMs: 60000, // 1 minute
          max: this.environment === 'production' ? 20 : 100
        },
        '/api/auth': {
          windowMs: 300000, // 5 minutes
          max: 10 // Strict limit for auth endpoints
        },
        '/api/upload': {
          windowMs: 300000, // 5 minutes
          max: 5 // Very strict for uploads
        }
      },
      
      // Advanced features
      stormProtection: {
        enabled: this.environment === 'production',
        threshold: 1000, // Requests per minute
        blockDuration: 600000 // 10 minutes
      },
      
      // Rate limit stores
      store: process.env.REDIS_URL ? 'redis' : 'memory',
      storeConfig: {
        redis: {
          url: process.env.REDIS_URL,
          keyPrefix: 'rl:',
          expiry: config.rateLimitWindow
        },
        memory: {
          max: 10000,
          ttl: config.rateLimitWindow
        }
      }
    };
  }

  /**
   * Build timeout configuration
   */
  buildTimeoutConfiguration() {
    const config = this.config;
    
    return {
      // Request timeouts
      request: config.requestTimeout,
      response: config.responseTimeout,
      keepAlive: config.keepAliveTimeout,
      headers: config.headersTimeout,
      
      // Connection timeouts
      connect: parseInt(process.env.API_CONNECT_TIMEOUT) || 10000,
      socket: parseInt(process.env.API_SOCKET_TIMEOUT) || 30000,
      
      // Idle timeouts
      idle: parseInt(process.env.API_IDLE_TIMEOUT) || 60000,
      session: parseInt(process.env.API_SESSION_TIMEOUT) || 3600000, // 1 hour
      
      // Tool-specific timeouts
      tools: {
        default: config.requestTimeout,
        expensive: config.requestTimeout * 2,
        ai: config.requestTimeout * 3,
        upload: config.requestTimeout * 5
      },
      
      // Environment-specific adjustments
      multipliers: {
        development: 2.0, // Longer timeouts for debugging
        testing: 1.5,
        staging: 1.2,
        production: 1.0
      },
      
      // Timeout handlers
      onTimeout: (req, res) => {
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process',
          timeout: config.requestTimeout
        });
      },
      
      // Graceful timeout
      graceful: {
        enabled: true,
        timeout: 10000, // 10 seconds for graceful shutdown
        killTimeout: 5000 // 5 seconds force kill
      }
    };
  }

  /**
   * Build retry configuration
   */
  buildRetryConfiguration() {
    const config = this.config;
    
    return {
      // Basic retry settings
      enabled: config.enableRetry,
      maxRetries: config.maxRetries,
      initialDelay: config.retryDelay,
      
      // Retry strategies
      strategy: 'exponential', // linear, exponential, fixed
      backoffMultiplier: 2,
      maxDelay: 30000, // 30 seconds
      jitter: true,
      
      // Retry conditions
      retryCondition: (error) => {
        // Retry on network errors
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          return true;
        }
        
        // Retry on 5xx server errors
        if (error.response && error.response.status >= 500) {
          return true;
        }
        
        // Retry on 429 (rate limited) after delay
        if (error.response && error.response.status === 429) {
          return true;
        }
        
        return false;
      },
      
      // Per-endpoint retry settings
      endpoints: {
        '/api/tools': {
          maxRetries: 2,
          initialDelay: 2000
        },
        '/api/auth': {
          maxRetries: 1, // Minimal retries for auth
          initialDelay: 1000
        },
        '/api/integrations': {
          maxRetries: config.maxRetries,
          initialDelay: config.retryDelay
        }
      },
      
      // Circuit breaker integration
      circuitBreaker: {
        enabled: this.environment === 'production',
        failureThreshold: 5,
        resetTimeout: 30000,
        monitoringWindow: 60000
      },
      
      // Retry events
      onRetry: (attempt, delay, error) => {
        if (this.environment === 'development') {
          console.log(`Retry attempt ${attempt} after ${delay}ms:`, error.message);
        }
      },
      
      onFailure: (error, attempts) => {
        console.error(`Failed after ${attempts} attempts:`, error.message);
      }
    };
  }

  /**
   * Build authentication configuration
   */
  buildAuthConfiguration() {
    const config = this.config;
    
    return {
      // Basic auth settings
      enabled: config.enableAuth,
      required: config.enableAuth && this.environment !== 'development',
      header: config.authHeader,
      scheme: config.authScheme,
      
      // JWT settings
      jwt: {
        secret: process.env.JWT_SECRET,
        algorithm: 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        issuer: process.env.JWT_ISSUER || 'sentia-mcp-server',
        audience: process.env.JWT_AUDIENCE || 'sentia-mcp-client'
      },
      
      // API key settings
      apiKey: {
        enabled: process.env.API_KEY_AUTH_ENABLED === 'true',
        header: 'X-API-Key',
        query: 'api_key',
        validate: (key) => {
          return process.env.API_KEYS?.split(',').includes(key);
        }
      },
      
      // Session settings
      session: {
        enabled: true,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: this.environment === 'production',
          httpOnly: true,
          maxAge: 3600000, // 1 hour
          sameSite: 'strict'
        }
      },
      
      // OAuth settings
      oauth: {
        enabled: process.env.OAUTH_ENABLED === 'true',
        providers: ['google', 'github', 'microsoft'],
        redirectUrl: process.env.OAUTH_REDIRECT_URL
      },
      
      // Role-based access control
      rbac: {
        enabled: true,
        roles: ['admin', 'manager', 'operator', 'viewer'],
        permissions: {
          admin: ['*'],
          manager: ['read', 'write', 'tools:execute'],
          operator: ['read', 'tools:execute'],
          viewer: ['read']
        }
      },
      
      // Auth bypass for development
      developmentBypass: {
        enabled: this.environment === 'development',
        mockUser: {
          id: 'dev-user-1',
          email: 'developer@sentia.com',
          role: 'admin',
          permissions: ['*']
        }
      }
    };
  }

  /**
   * Build validation configuration
   */
  buildValidationConfiguration() {
    const config = this.config;
    
    return {
      // Basic validation
      enabled: config.enableValidation,
      strict: config.strictValidation,
      
      // Request validation
      request: {
        validateHeaders: true,
        validateQuery: true,
        validateBody: true,
        validateParams: true,
        
        // Size limits
        maxBodySize: config.maxRequestSize,
        maxHeaderSize: config.maxHeaderSize,
        maxUrlLength: config.maxUrlLength,
        
        // Content type validation
        allowedContentTypes: [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain'
        ]
      },
      
      // Response validation
      response: {
        validateSchema: this.environment !== 'production',
        validateStatus: true,
        validateHeaders: this.environment === 'development'
      },
      
      // Schema validation
      schema: {
        engine: 'ajv',
        strict: config.strictValidation,
        allErrors: true,
        removeAdditional: true,
        useDefaults: true,
        coerceTypes: true
      },
      
      // Custom validators
      customValidators: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\+?[\d\s-()]+$/,
        url: /^https?:\/\/.+/,
        uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      },
      
      // Sanitization
      sanitization: {
        enabled: true,
        htmlEscape: true,
        sqlEscape: true,
        xssProtection: true,
        trimWhitespace: true
      },
      
      // Error handling
      onValidationError: (errors, req, res) => {
        const formattedErrors = errors.map(error => ({
          field: error.instancePath,
          message: error.message,
          value: error.data
        }));
        
        res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors
        });
      }
    };
  }

  /**
   * Validate API configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Port validation
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('API port must be between 1 and 65535');
    }
    
    // Timeout validation
    if (this.config.requestTimeout < 1000) {
      warnings.push('Request timeout should be at least 1000ms');
    }
    
    if (this.config.responseTimeout < this.config.requestTimeout) {
      warnings.push('Response timeout should be greater than request timeout');
    }
    
    // Rate limit validation
    if (this.config.rateLimitEnabled && this.config.rateLimitMax < 1) {
      errors.push('Rate limit max must be at least 1');
    }
    
    // Environment-specific validation
    if (this.environment === 'production') {
      if (!this.config.enableHelmet) {
        warnings.push('Helmet should be enabled in production');
      }
      
      if (!this.config.enableCSP) {
        warnings.push('Content Security Policy should be enabled in production');
      }
      
      if (this.config.enableDetailedErrors) {
        warnings.push('Detailed errors should be disabled in production');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration for API frameworks
   */
  exportConfig() {
    return {
      // Basic settings
      host: this.config.host,
      port: this.config.port,
      baseUrl: this.config.baseUrl,
      version: this.config.version,
      
      // Feature configs
      rateLimit: this.config.rateLimitConfig,
      timeout: this.config.timeoutConfig,
      retry: this.config.retryConfig,
      auth: this.config.authConfig,
      validation: this.config.validationConfig,
      
      // Environment info
      environment: this.environment
    };
  }
}

/**
 * Create API configuration for current environment
 */
export function createAPIConfig(environment = process.env.NODE_ENV) {
  return new APIConfig(environment);
}

/**
 * Get API configuration
 */
export function getAPIConfig(environment = process.env.NODE_ENV) {
  const apiConfig = new APIConfig(environment);
  return apiConfig.exportConfig();
}

/**
 * Validate API configuration
 */
export function validateAPIConfig(environment = process.env.NODE_ENV) {
  const apiConfig = new APIConfig(environment);
  return apiConfig.validate();
}

export default APIConfig;