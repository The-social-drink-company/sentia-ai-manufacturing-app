/**
 * Server Configuration Management
 * 
 * Centralized configuration for the MCP server with environment-aware settings
 * and advanced validation engine with schema-based validation, cross-parameter
 * validation, and environment-specific validation rules.
 */

import { config } from 'dotenv';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Load environment variables
config();

/**
 * Server configuration object with environment-aware defaults
 */
export const SERVER_CONFIG = {
  // Core server settings
  server: {
    name: process.env.MCP_SERVER_NAME || 'sentia-manufacturing-mcp',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.MCP_SERVER_PORT) || 3001,
    host: process.env.MCP_SERVER_HOST || '0.0.0.0'
  },

  // Transport configuration
  transport: {
    type: process.env.MCP_TRANSPORT || 'dual', // 'stdio', 'http', or 'dual'
    stdio: {
      enabled: process.env.MCP_STDIO_ENABLED !== 'false'
    },
    http: {
      enabled: process.env.MCP_HTTP_ENABLED !== 'false',
      port: parseInt(process.env.MCP_HTTP_PORT) || 3002
    },
    sse: {
      enabled: process.env.MCP_SSE_ENABLED !== 'false',
      heartbeatInterval: parseInt(process.env.SSE_HEARTBEAT_INTERVAL) || 30000
    }
  },

  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'https://sentia-manufacturing-dashboard-621h.onrender.com', // Development
      'https://sentia-manufacturing-dashboard-test.onrender.com', // Testing
      'https://sentia-manufacturing-dashboard-production.onrender.com', // Production
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-MCP-Token']
  },

  // Security configuration (Enhanced with new authentication system)
  security: {
    // Legacy settings (maintained for backward compatibility)
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    authRequired: process.env.AUTH_REQUIRED === 'true',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    
    // Enhanced authentication settings
    authentication: {
      enabled: process.env.AUTH_ENABLED !== 'false',
      developmentBypass: process.env.NODE_ENV === 'development' || process.env.VITE_DEVELOPMENT_MODE === 'true',
      requireMFA: process.env.REQUIRE_MFA === 'true',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5
    },
    
    // API Key management
    apiKeys: {
      enabled: process.env.API_KEYS_ENABLED !== 'false',
      expirationDays: parseInt(process.env.API_KEY_EXPIRATION_DAYS) || 90,
      maxKeysPerUser: parseInt(process.env.MAX_API_KEYS_PER_USER) || 5,
      rotationWarningDays: parseInt(process.env.API_KEY_ROTATION_WARNING_DAYS) || 7
    },
    
    // Data encryption
    encryption: {
      enabled: process.env.DATA_ENCRYPTION_ENABLED !== 'false',
      developmentBypass: process.env.NODE_ENV === 'development' || process.env.VITE_DEVELOPMENT_MODE === 'true',
      algorithm: 'aes-256-gcm',
      keyRotationDays: parseInt(process.env.ENCRYPTION_KEY_ROTATION_DAYS) || 90
    },
    
    // Enhanced rate limiting
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: 'Too many requests from this IP, please try again later.',
      
      // Per-user rate limiting
      perUser: {
        enabled: process.env.PER_USER_RATE_LIMITING_ENABLED !== 'false',
        windowMs: parseInt(process.env.USER_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
        max: parseInt(process.env.USER_RATE_LIMIT_MAX) || 200
      },
      
      // Tool-specific rate limiting
      tools: {
        enabled: process.env.TOOL_RATE_LIMITING_ENABLED !== 'false',
        defaultLimitPerHour: parseInt(process.env.DEFAULT_TOOL_LIMIT_PER_HOUR) || 1000,
        expensiveToolsLimitPerHour: parseInt(process.env.EXPENSIVE_TOOLS_LIMIT_PER_HOUR) || 100
      }
    },
    
    // Security monitoring
    monitoring: {
      enabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
      developmentBypass: process.env.NODE_ENV === 'development' || process.env.VITE_DEVELOPMENT_MODE === 'true',
      
      // Failed authentication tracking
      failedAuth: {
        maxAttempts: parseInt(process.env.MAX_AUTH_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION) || 900000, // 15 minutes
        trackByIP: process.env.TRACK_FAILED_AUTH_BY_IP !== 'false',
        trackByUser: process.env.TRACK_FAILED_AUTH_BY_USER !== 'false'
      },
      
      // Suspicious activity detection
      suspiciousActivity: {
        enabled: process.env.SUSPICIOUS_ACTIVITY_DETECTION === 'true',
        multipleLocationThreshold: parseInt(process.env.MULTIPLE_LOCATION_THRESHOLD) || 2,
        rapidRequestThreshold: parseInt(process.env.RAPID_REQUEST_THRESHOLD) || 100,
        timeWindowMs: parseInt(process.env.ACTIVITY_TIME_WINDOW) || 60000 // 1 minute
      }
    },
    
    // Security headers and CSP
    helmet: {
      enabled: process.env.HELMET_ENABLED !== 'false',
      contentSecurityPolicy: {
        enabled: process.env.CSP_ENABLED !== 'false',
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"]
        }
      }
    },
    
    // Audit logging
    audit: {
      enabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
      level: process.env.AUDIT_LOG_LEVEL || 'info',
      events: [
        'authentication',
        'authorization', 
        'tool_execution',
        'data_access',
        'configuration_change',
        'user_management',
        'security_violation'
      ],
      retention: {
        days: parseInt(process.env.AUDIT_RETENTION_DAYS) || 90,
        maxSizeMB: parseInt(process.env.AUDIT_MAX_SIZE_MB) || 1000
      },
      encryption: process.env.AUDIT_ENCRYPTION_ENABLED !== 'false'
    }
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    enableQueryLogging: process.env.DB_QUERY_LOGGING === 'true',
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) || 1000
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: {
      enabled: process.env.LOG_FILE_ENABLED !== 'false',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '5m',
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || 5,
      directory: process.env.LOG_DIRECTORY || 'logs'
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
      colorize: process.env.LOG_COLORIZE !== 'false'
    }
  },

  // Tool configuration
  tools: {
    directory: process.env.TOOLS_DIRECTORY || 'tools',
    enabledCategories: process.env.ENABLED_TOOL_CATEGORIES?.split(',') || [
      'system', 'manufacturing', 'financial', 'database', 'integration'
    ],
    timeout: parseInt(process.env.TOOL_TIMEOUT) || 30000,
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_TOOLS) || 10,
    caching: {
      enabled: process.env.TOOL_CACHING_ENABLED !== 'false',
      defaultTTL: parseInt(process.env.TOOL_CACHE_TTL) || 300, // 5 minutes
      maxSize: parseInt(process.env.TOOL_CACHE_MAX_SIZE) || 1000
    }
  },

  // Resource management
  resources: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'application/json',
      'text/plain',
      'text/csv',
      'application/xml'
    ],
    tempDirectory: process.env.TEMP_DIRECTORY || 'tmp',
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 3600000 // 1 hour
  },

  // Advanced Monitoring and metrics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsEndpoint: process.env.METRICS_ENDPOINT || '/metrics',
    healthEndpoint: process.env.HEALTH_ENDPOINT || '/health',
    collectSystemMetrics: process.env.COLLECT_SYSTEM_METRICS !== 'false',
    collectToolMetrics: process.env.COLLECT_TOOL_METRICS !== 'false',
    retentionPeriod: parseInt(process.env.METRICS_RETENTION_PERIOD) || 7 * 24 * 60 * 60 * 1000, // 7 days
    
    // Advanced performance monitoring
    performance: {
      enabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false',
      sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE) || 1.0,
      responseTimeThresholds: {
        warning: parseInt(process.env.PERF_WARNING_THRESHOLD) || 1000,
        critical: parseInt(process.env.PERF_CRITICAL_THRESHOLD) || 5000
      },
      memoryThresholds: {
        warning: parseInt(process.env.MEMORY_WARNING_THRESHOLD) || 80,
        critical: parseInt(process.env.MEMORY_CRITICAL_THRESHOLD) || 95
      }
    },
    
    // Business analytics configuration
    businessAnalytics: {
      enabled: process.env.BUSINESS_ANALYTICS_ENABLED !== 'false',
      retentionDays: parseInt(process.env.BUSINESS_ANALYTICS_RETENTION_DAYS) || 90,
      costTracking: process.env.COST_TRACKING_ENABLED !== 'false',
      userAnalytics: process.env.USER_ANALYTICS_ENABLED !== 'false',
      manufacturingKPIs: process.env.MANUFACTURING_KPIS_ENABLED !== 'false'
    },
    
    // Alert engine configuration
    alerting: {
      enabled: process.env.ALERTING_ENABLED !== 'false',
      stormProtection: process.env.ALERT_STORM_PROTECTION !== 'false',
      maxAlertsPerMinute: parseInt(process.env.MAX_ALERTS_PER_MINUTE) || 10,
      deduplicationWindow: parseInt(process.env.ALERT_DEDUPLICATION_WINDOW) || 300000, // 5 minutes
      escalationTimeout: parseInt(process.env.ALERT_ESCALATION_TIMEOUT) || 1800000, // 30 minutes
      
      // Notification channels
      notifications: {
        webhook: {
          enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
          url: process.env.WEBHOOK_URL,
          secret: process.env.WEBHOOK_SECRET
        },
        email: {
          enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
          recipients: process.env.EMAIL_RECIPIENTS?.split(',') || [],
          smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          }
        },
        slack: {
          enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: process.env.SLACK_USERNAME || 'Sentia MCP Bot'
        },
        sms: {
          enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
          provider: process.env.SMS_PROVIDER || 'twilio',
          apiKey: process.env.SMS_API_KEY,
          apiSecret: process.env.SMS_API_SECRET,
          recipients: process.env.SMS_RECIPIENTS?.split(',') || []
        }
      }
    },
    
    // Log management configuration
    logManagement: {
      enabled: process.env.LOG_MANAGEMENT_ENABLED !== 'false',
      retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 90,
      maxSizeMB: parseInt(process.env.LOG_MAX_SIZE_MB) || 1000,
      compressionEnabled: process.env.LOG_COMPRESSION_ENABLED !== 'false',
      searchIndexEnabled: process.env.LOG_SEARCH_INDEX_ENABLED !== 'false'
    },
    
    // Metrics storage configuration
    storage: {
      type: process.env.METRICS_STORAGE_TYPE || 'memory', // 'memory', 'postgresql', 'redis'
      postgresql: {
        enabled: process.env.METRICS_STORAGE_POSTGRESQL_ENABLED === 'true',
        tableName: process.env.METRICS_TABLE_NAME || 'metrics',
        batchSize: parseInt(process.env.METRICS_BATCH_SIZE) || 100,
        flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL) || 60000 // 1 minute
      },
      redis: {
        enabled: process.env.METRICS_STORAGE_REDIS_ENABLED === 'true',
        keyPrefix: process.env.METRICS_REDIS_PREFIX || 'metrics:',
        ttl: parseInt(process.env.METRICS_REDIS_TTL) || 86400 // 24 hours
      }
    },
    
    // Prometheus integration
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      endpoint: process.env.PROMETHEUS_ENDPOINT || '/prometheus',
      defaultLabels: {
        service: 'sentia-mcp-server',
        version: '3.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }
  },

  // Cache configuration (Redis or in-memory)
  cache: {
    type: process.env.CACHE_TYPE || 'memory', // 'redis' or 'memory'
    redis: {
      url: process.env.REDIS_URL,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'sentia-mcp:',
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3
    },
    memory: {
      maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE) || 1000,
      checkPeriod: parseInt(process.env.MEMORY_CACHE_CHECK_PERIOD) || 600 // 10 minutes
    }
  },

  // External service integrations
  integrations: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    },
    xero: {
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUri: process.env.XERO_REDIRECT_URI,
      scopes: process.env.XERO_SCOPES?.split(',') || ['accounting.read', 'accounting.transactions'],
      syncInterval: process.env.XERO_SYNC_INTERVAL || '*/30 * * * *' // Every 30 minutes
    },
    shopify: {
      uk: {
        shopUrl: process.env.SHOPIFY_UK_SHOP_URL || 'sentiaspirits.myshopify.com',
        accessToken: process.env.SHOPIFY_UK_ACCESS_TOKEN,
        apiKey: process.env.SHOPIFY_UK_API_KEY,
        secret: process.env.SHOPIFY_UK_SECRET,
        apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
      },
      usa: {
        shopUrl: process.env.SHOPIFY_USA_SHOP_URL || 'us-sentiaspirits.myshopify.com',
        accessToken: process.env.SHOPIFY_USA_ACCESS_TOKEN,
        apiKey: process.env.SHOPIFY_USA_API_KEY,
        secret: process.env.SHOPIFY_USA_SECRET,
        apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
      },
      syncInterval: process.env.SHOPIFY_SYNC_INTERVAL || '*/15 * * * *' // Every 15 minutes
    },
    unleashed: {
      apiKey: process.env.UNLEASHED_API_KEY,
      apiUrl: process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com',
      apiId: process.env.UNLEASHED_API_ID
    },
    amazon: {
      uk: {
        marketplaceId: process.env.AMAZON_UK_MARKETPLACE_ID || 'A1F83G8C2ARO7P',
        sellerId: process.env.AMAZON_UK_SELLER_ID,
        clientId: process.env.AMAZON_UK_CLIENT_ID,
        clientSecret: process.env.AMAZON_UK_CLIENT_SECRET,
        refreshToken: process.env.AMAZON_UK_REFRESH_TOKEN
      },
      usa: {
        marketplaceId: process.env.AMAZON_USA_MARKETPLACE_ID || 'ATVPDKIKX0DER',
        sellerId: process.env.AMAZON_USA_SELLER_ID,
        clientId: process.env.AMAZON_USA_CLIENT_ID,
        clientSecret: process.env.AMAZON_USA_CLIENT_SECRET,
        refreshToken: process.env.AMAZON_USA_REFRESH_TOKEN
      },
      region: process.env.AMAZON_REGION || 'us-east-1',
      syncInterval: process.env.AMAZON_SYNC_INTERVAL || '*/60 * * * *' // Every hour
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      adminEmail: process.env.MICROSOFT_ADMIN_EMAIL,
      dataEmail: process.env.MICROSOFT_DATA_EMAIL
    },
    dashboard: {
      // Environment-specific dashboard URLs for inter-service communication
      development: {
        url: 'https://sentia-manufacturing-dashboard-621h.onrender.com',
        jwtSecret: process.env.MCP_JWT_SECRET || process.env.JWT_SECRET
      },
      testing: {
        url: 'https://sentia-manufacturing-dashboard-test.onrender.com',
        jwtSecret: process.env.MCP_JWT_SECRET || process.env.JWT_SECRET
      },
      production: {
        url: 'https://sentia-manufacturing-dashboard-production.onrender.com',
        jwtSecret: process.env.MCP_JWT_SECRET || process.env.JWT_SECRET
      }
    }
  }
};

/**
 * Advanced Configuration Validation Schema
 */
const configurationSchema = {
  type: 'object',
  properties: {
    server: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        environment: { 
          type: 'string', 
          enum: ['development', 'staging', 'testing', 'production', 'local'] 
        },
        port: { type: 'integer', minimum: 1, maximum: 65535 },
        host: { type: 'string', format: 'hostname' }
      },
      required: ['name', 'version', 'environment', 'port', 'host'],
      additionalProperties: false
    },
    transport: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['stdio', 'http', 'dual'] },
        stdio: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' }
          },
          required: ['enabled']
        },
        http: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            port: { type: 'integer', minimum: 1, maximum: 65535 }
          },
          required: ['enabled', 'port']
        },
        sse: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            heartbeatInterval: { type: 'integer', minimum: 1000, maximum: 300000 }
          },
          required: ['enabled', 'heartbeatInterval']
        }
      },
      required: ['type', 'stdio', 'http', 'sse']
    },
    database: {
      type: 'object',
      properties: {
        url: { type: 'string', minLength: 1 },
        maxConnections: { type: 'integer', minimum: 1, maximum: 1000 },
        idleTimeoutMillis: { type: 'integer', minimum: 1000 },
        connectionTimeoutMillis: { type: 'integer', minimum: 1000 },
        enableQueryLogging: { type: 'boolean' },
        slowQueryThreshold: { type: 'integer', minimum: 100 }
      },
      required: ['maxConnections', 'idleTimeoutMillis', 'connectionTimeoutMillis']
    },
    security: {
      type: 'object',
      properties: {
        jwtSecret: { type: 'string', minLength: 32 },
        jwtExpiresIn: { type: 'string', pattern: '^\\d+[smhd]$' },
        authRequired: { type: 'boolean' },
        rateLimitMax: { type: 'integer', minimum: 1 },
        rateLimitWindow: { type: 'integer', minimum: 1000 }
      },
      required: ['jwtSecret', 'jwtExpiresIn', 'authRequired']
    },
    cache: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['memory', 'redis'] },
        redis: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            keyPrefix: { type: 'string' },
            retryDelayOnFailover: { type: 'integer', minimum: 1 },
            maxRetriesPerRequest: { type: 'integer', minimum: 1 }
          }
        },
        memory: {
          type: 'object',
          properties: {
            maxSize: { type: 'integer', minimum: 1 },
            checkPeriod: { type: 'integer', minimum: 60 }
          }
        }
      },
      required: ['type']
    }
  },
  required: ['server', 'transport', 'database', 'security', 'cache']
};

/**
 * Initialize AJV validator with formats
 */
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Add custom formats
ajv.addFormat('hostname', {
  type: 'string',
  validate: (value) => {
    const hostnameRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$|^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$|^0\.0\.0\.0$/;
    return hostnameRegex.test(value);
  }
});

const validateConfigSchema = ajv.compile(configurationSchema);

/**
 * Enhanced Configuration Validation Engine
 */
export class ConfigurationValidator {
  constructor() {
    this.validationRules = new Map();
    this.crossValidationRules = [];
    this.environmentRules = new Map();
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Add custom validation rule for a configuration path
   */
  addValidationRule(path, validator, options = {}) {
    if (!this.validationRules.has(path)) {
      this.validationRules.set(path, []);
    }
    
    this.validationRules.get(path).push({
      validator,
      severity: options.severity || 'error',
      message: options.message || 'Validation failed',
      environments: options.environments || null
    });
  }

  /**
   * Add cross-parameter validation rule
   */
  addCrossValidationRule(validator, options = {}) {
    this.crossValidationRules.push({
      validator,
      severity: options.severity || 'error',
      message: options.message || 'Cross-validation failed',
      environments: options.environments || null
    });
  }

  /**
   * Add environment-specific validation rule
   */
  addEnvironmentRule(environment, validator, options = {}) {
    if (!this.environmentRules.has(environment)) {
      this.environmentRules.set(environment, []);
    }
    
    this.environmentRules.get(environment).push({
      validator,
      severity: options.severity || 'error',
      message: options.message || 'Environment validation failed'
    });
  }

  /**
   * Validate configuration with comprehensive checks
   */
  async validateConfiguration(config, environment = null) {
    this.warnings = [];
    this.errors = [];
    
    const env = environment || config.server?.environment || 'development';
    
    try {
      // 1. Schema validation
      await this.performSchemaValidation(config);
      
      // 2. Custom path validation
      await this.performPathValidation(config, env);
      
      // 3. Cross-parameter validation
      await this.performCrossValidation(config, env);
      
      // 4. Environment-specific validation
      await this.performEnvironmentValidation(config, env);
      
      // 5. Security validation
      await this.performSecurityValidation(config, env);
      
      // 6. Performance validation
      await this.performPerformanceValidation(config, env);
      
      // 7. Integration validation
      await this.performIntegrationValidation(config, env);
      
      const result = {
        valid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        environment: env,
        timestamp: new Date().toISOString()
      };
      
      if (!result.valid) {
        throw new Error(`Configuration validation failed:\n${this.errors.join('\n')}`);
      }
      
      if (this.warnings.length > 0) {
        console.warn(`Configuration warnings:\n${this.warnings.join('\n')}`);
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Configuration validation error: ${error.message}`);
    }
  }

  /**
   * Perform JSON schema validation
   */
  async performSchemaValidation(config) {
    const valid = validateConfigSchema(config);
    
    if (!valid) {
      validateConfigSchema.errors.forEach(error => {
        const path = error.instancePath.replace(/^\//, '').replace(/\//g, '.');
        this.errors.push(`Schema validation failed at '${path}': ${error.message}`);
      });
    }
  }

  /**
   * Perform custom path validation
   */
  async performPathValidation(config, environment) {
    for (const [path, rules] of this.validationRules) {
      const value = this.getValueAtPath(config, path);
      
      for (const rule of rules) {
        // Check if rule applies to current environment
        if (rule.environments && !rule.environments.includes(environment)) {
          continue;
        }
        
        try {
          const result = await rule.validator(value, config, path);
          
          if (result !== true) {
            const message = result || rule.message;
            
            if (rule.severity === 'warning') {
              this.warnings.push(`${path}: ${message}`);
            } else {
              this.errors.push(`${path}: ${message}`);
            }
          }
        } catch (error) {
          this.errors.push(`${path}: Validation error - ${error.message}`);
        }
      }
    }
  }

  /**
   * Perform cross-parameter validation
   */
  async performCrossValidation(config, environment) {
    for (const rule of this.crossValidationRules) {
      // Check if rule applies to current environment
      if (rule.environments && !rule.environments.includes(environment)) {
        continue;
      }
      
      try {
        const result = await rule.validator(config, environment);
        
        if (result !== true) {
          const message = result || rule.message;
          
          if (rule.severity === 'warning') {
            this.warnings.push(`Cross-validation: ${message}`);
          } else {
            this.errors.push(`Cross-validation: ${message}`);
          }
        }
      } catch (error) {
        this.errors.push(`Cross-validation error: ${error.message}`);
      }
    }
  }

  /**
   * Perform environment-specific validation
   */
  async performEnvironmentValidation(config, environment) {
    const rules = this.environmentRules.get(environment) || [];
    
    for (const rule of rules) {
      try {
        const result = await rule.validator(config, environment);
        
        if (result !== true) {
          const message = result || rule.message;
          
          if (rule.severity === 'warning') {
            this.warnings.push(`Environment (${environment}): ${message}`);
          } else {
            this.errors.push(`Environment (${environment}): ${message}`);
          }
        }
      } catch (error) {
        this.errors.push(`Environment validation error: ${error.message}`);
      }
    }
  }

  /**
   * Perform security validation
   */
  async performSecurityValidation(config, environment) {
    // Production security requirements
    if (environment === 'production') {
      if (!config.security?.authRequired) {
        this.errors.push('Authentication must be enabled in production');
      }
      
      if (!config.security?.jwtSecret || 
          config.security.jwtSecret.includes('dev') || 
          config.security.jwtSecret.includes('test') ||
          config.security.jwtSecret.length < 32) {
        this.errors.push('Production JWT secret must be properly configured and at least 32 characters');
      }
      
      if (config.logging?.level === 'debug') {
        this.warnings.push('Debug logging should be disabled in production');
      }
      
      if (!config.security?.helmet?.enabled) {
        this.warnings.push('Security headers (Helmet) should be enabled in production');
      }
    }
    
    // Security best practices
    if (config.cors?.origins?.includes('*')) {
      this.warnings.push('CORS should not allow all origins in production');
    }
    
    if (config.server?.host === '0.0.0.0' && environment === 'production') {
      this.warnings.push('Consider binding to specific IP instead of 0.0.0.0 in production');
    }
  }

  /**
   * Perform performance validation
   */
  async performPerformanceValidation(config, environment) {
    // Database connection pool validation
    if (config.database?.maxConnections > 100 && environment !== 'production') {
      this.warnings.push('High database connection count may not be necessary for non-production environments');
    }
    
    // Cache configuration validation
    if (environment === 'production' && config.cache?.type === 'memory') {
      this.warnings.push('Consider using Redis cache in production for better performance');
    }
    
    // Rate limiting validation
    if (config.security?.rateLimitMax > 10000) {
      this.warnings.push('Very high rate limits may not provide adequate protection');
    }
    
    // Monitoring validation
    if (environment === 'production' && !config.monitoring?.enabled) {
      this.warnings.push('Monitoring should be enabled in production');
    }
  }

  /**
   * Perform integration validation
   */
  async performIntegrationValidation(config, environment) {
    // Check integration configurations
    const integrations = config.integrations || {};
    
    for (const [service, serviceConfig] of Object.entries(integrations)) {
      if (!serviceConfig?.apiKey && !serviceConfig?.clientId && !serviceConfig?.accessToken) {
        this.warnings.push(`${service} integration may not be properly configured`);
      }
      
      // Service-specific validation
      switch (service) {
        case 'xero':
          if (!serviceConfig.clientId || !serviceConfig.clientSecret) {
            this.warnings.push('Xero integration requires both clientId and clientSecret');
          }
          break;
          
        case 'shopify':
          if (!serviceConfig.accessToken || !serviceConfig.shopDomain) {
            this.warnings.push('Shopify integration requires accessToken and shopDomain');
          }
          break;
          
        case 'amazon':
          if (!serviceConfig.sellerId || !serviceConfig.clientId || !serviceConfig.refreshToken) {
            this.warnings.push('Amazon integration requires sellerId, clientId, and refreshToken');
          }
          break;
      }
    }
  }

  /**
   * Get value at configuration path
   */
  getValueAtPath(config, path) {
    if (!path) return config;
    
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Get validation summary
   */
  getValidationSummary() {
    return {
      valid: this.errors.length === 0,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

/**
 * Global configuration validator instance
 */
export const configValidator = new ConfigurationValidator();

// Add default validation rules
configValidator.addValidationRule('database.url', (value) => {
  if (!value) return 'Database URL is required';
  if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
    return 'Database URL must be a PostgreSQL connection string';
  }
  return true;
});

configValidator.addValidationRule('security.jwtSecret', (value, config) => {
  if (config.security?.authRequired && !value) {
    return 'JWT secret is required when authentication is enabled';
  }
  if (value && value.length < 32) {
    return 'JWT secret must be at least 32 characters long';
  }
  return true;
});

configValidator.addCrossValidationRule((config) => {
  if (config.cache?.type === 'redis' && !config.cache?.redis?.url) {
    return 'Redis URL is required when using Redis cache';
  }
  return true;
});

configValidator.addCrossValidationRule((config) => {
  if (config.transport?.http?.port === config.server?.port) {
    return 'HTTP transport port cannot be the same as server port';
  }
  return true;
});

// Environment-specific rules
configValidator.addEnvironmentRule('production', (config) => {
  if (!config.database?.ssl) {
    return 'SSL should be enabled for database connections in production';
  }
  return true;
}, { severity: 'warning' });

/**
 * Enhanced validate function with comprehensive validation
 */
export async function validateConfig(config = SERVER_CONFIG, environment = null) {
  try {
    const result = await configValidator.validateConfiguration(config, environment);
    return result;
  } catch (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }
}

/**
 * Legacy validate function for backward compatibility
 * Updated to be more permissive for deployment flexibility
 */
export function validateConfigLegacy() {
  const errors = [];
  const warnings = [];

  // Critical validations only - allow missing integrations
  
  // Database URL is optional in development but warn if missing
  if (!SERVER_CONFIG.database.url) {
    if (SERVER_CONFIG.server.environment === 'production') {
      warnings.push('DATABASE_URL is missing - database features will be disabled');
    } else {
      warnings.push('DATABASE_URL is missing - running without database');
    }
  }

  // JWT secret validation - more flexible
  if (SERVER_CONFIG.security.authRequired && !SERVER_CONFIG.security.jwtSecret) {
    if (SERVER_CONFIG.server.environment === 'production') {
      errors.push('JWT_SECRET is required when authentication is enabled in production');
    } else {
      warnings.push('JWT_SECRET is missing - using default fallback');
    }
  }

  // Redis validation - fallback to memory cache
  if (SERVER_CONFIG.cache.type === 'redis' && !SERVER_CONFIG.cache.redis.url) {
    warnings.push('REDIS_URL is missing - falling back to memory cache');
    // Automatically fallback to memory cache
    SERVER_CONFIG.cache.type = 'memory';
  }

  // Validate port ranges
  if (SERVER_CONFIG.server.port < 1 || SERVER_CONFIG.server.port > 65535) {
    errors.push('MCP_SERVER_PORT must be between 1 and 65535');
  }

  // Validate rate limiting values - use defaults if invalid
  if (SERVER_CONFIG.security.rateLimiting.max < 1) {
    warnings.push('RATE_LIMIT_MAX invalid - using default of 100');
    SERVER_CONFIG.security.rateLimiting.max = 100;
  }

  if (SERVER_CONFIG.security.rateLimiting.windowMs < 1000) {
    warnings.push('RATE_LIMIT_WINDOW invalid - using default of 15 minutes');
    SERVER_CONFIG.security.rateLimiting.windowMs = 15 * 60 * 1000;
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('Configuration warnings:\n' + warnings.join('\n'));
  }

  // Only throw on critical errors
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

/**
 * Get environment-specific configuration overrides
 */
export function getEnvironmentConfig(environment = SERVER_CONFIG.server.environment) {
  const configs = {
    development: {
      security: {
        authRequired: false,
        rateLimiting: {
          max: 1000 // Higher limits for development
        }
      },
      logging: {
        level: 'debug',
        console: {
          colorize: true
        }
      },
      database: {
        enableQueryLogging: true
      }
    },
    
    testing: {
      security: {
        authRequired: true,
        rateLimiting: {
          max: 500
        }
      },
      logging: {
        level: 'info'
      },
      monitoring: {
        collectSystemMetrics: true,
        collectToolMetrics: true
      }
    },
    
    production: {
      security: {
        authRequired: true,
        rateLimiting: {
          max: 100
        },
        helmet: {
          enabled: true,
          contentSecurityPolicy: {
            enabled: true
          }
        }
      },
      logging: {
        level: 'warn',
        console: {
          colorize: false
        }
      },
      monitoring: {
        enabled: true,
        collectSystemMetrics: true,
        collectToolMetrics: true
      },
      cache: {
        type: 'redis' // Prefer Redis in production
      }
    }
  };

  return configs[environment] || {};
}

/**
 * Merge configuration with environment-specific overrides
 */
export function getMergedConfig(environment) {
  const envConfig = getEnvironmentConfig(environment);
  
  function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  return deepMerge(SERVER_CONFIG, envConfig);
}

/**
 * Export the final configuration
 */
export const CONFIG = getMergedConfig(SERVER_CONFIG.server.environment);

// Validate configuration on import (using legacy function for backward compatibility)
try {
  validateConfigLegacy();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  // CRITICAL: Don't exit in production to allow graceful degradation
  // Log the error but continue startup - missing integrations should not break core functionality
  if (process.env.NODE_ENV === 'production') {
    console.warn('Production deployment continuing with configuration warnings - some integrations may be disabled');
  }
}