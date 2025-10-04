/**
 * Database Configuration Management
 * 
 * Advanced database configuration with connection pooling, SSL management,
 * performance tuning, monitoring, and environment-specific optimizations.
 */

import { config } from 'dotenv';

config();

/**
 * Database Configuration Factory
 */
export class DatabaseConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  /**
   * Build environment-specific database configuration
   */
  buildConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration();
    
    return {
      ...baseConfig,
      ...envConfig,
      // Computed properties
      connectionString: this.buildConnectionString(),
      poolConfig: this.buildPoolConfiguration(),
      sslConfig: this.buildSSLConfiguration(),
      performanceConfig: this.buildPerformanceConfiguration(),
      monitoringConfig: this.buildMonitoringConfiguration()
    };
  }

  /**
   * Base database configuration
   */
  getBaseConfiguration() {
    return {
      // Connection settings
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'sentia_manufacturing',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      
      // Basic connection options
      applicationName: 'sentia-mcp-server',
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
      
      // Schema and search path
      schema: process.env.DB_SCHEMA || 'public',
      searchPath: process.env.DB_SEARCH_PATH || 'public',
      
      // Character encoding
      charset: 'utf8',
      timezone: process.env.DB_TIMEZONE || 'UTC',
      
      // PostgreSQL specific
      client_encoding: 'UTF8',
      timezone: 'UTC'
    };
  }

  /**
   * Environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const configs = {
      development: {
        // Development database settings
        maxConnections: 5,
        minConnections: 1,
        acquireTimeoutMillis: 10000,
        createTimeoutMillis: 10000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        
        // Logging and debugging
        enableQueryLogging: true,
        logSlowQueries: true,
        slowQueryThreshold: 100, // 100ms
        enableVerboseLogging: true,
        
        // SSL settings
        ssl: false,
        
        // Performance settings
        enablePreparedStatements: true,
        enableQueryCache: false, // Disable for fresh results
        
        // Development features
        enableMigrations: true,
        enableSeeding: true,
        enableTestData: true,
        resetOnRestart: false
      },

      testing: {
        // Testing database settings
        maxConnections: 10,
        minConnections: 2,
        acquireTimeoutMillis: 15000,
        createTimeoutMillis: 15000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        
        // Test-specific logging
        enableQueryLogging: true,
        logSlowQueries: true,
        slowQueryThreshold: 200,
        enableTestLogging: true,
        
        // SSL settings
        ssl: false,
        
        // Testing features
        enableTransactionRollback: true,
        enableTestIsolation: true,
        enableParallelTests: false,
        enableTestData: true,
        enableSchemaReset: true
      },

      staging: {
        // Staging database settings
        maxConnections: 15,
        minConnections: 3,
        acquireTimeoutMillis: 20000,
        createTimeoutMillis: 20000,
        destroyTimeoutMillis: 10000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 500,
        
        // Staging logging
        enableQueryLogging: true,
        logSlowQueries: true,
        slowQueryThreshold: 500,
        enablePerformanceLogging: true,
        
        // SSL settings
        ssl: {
          rejectUnauthorized: false,
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY
        },
        
        // Performance optimization
        enablePreparedStatements: true,
        enableQueryCache: true,
        enableConnectionPooling: true,
        
        // Staging features
        enablePerformanceMonitoring: true,
        enableQueryAnalysis: true
      },

      production: {
        // Production database settings
        maxConnections: 20,
        minConnections: 5,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 15000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 1000,
        
        // Production logging (minimal)
        enableQueryLogging: false,
        logSlowQueries: true,
        slowQueryThreshold: 1000, // 1 second
        enableErrorLogging: true,
        
        // SSL settings (required in production)
        ssl: {
          rejectUnauthorized: false, // For Render PostgreSQL
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY
        },
        
        // Performance optimization
        enablePreparedStatements: true,
        enableQueryCache: true,
        enableConnectionPooling: true,
        enableReadReplicas: false, // Enable when available
        
        // Production features
        enableBackups: true,
        backupSchedule: '0 2 * * *', // Daily at 2 AM
        enableMonitoring: true,
        enableAlerts: true
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Build connection string from configuration
   */
  buildConnectionString() {
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    const config = this.config;
    let connectionString = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    
    const params = [];
    
    if (config.ssl) {
      params.push('sslmode=require');
    }
    
    if (config.schema && config.schema !== 'public') {
      params.push(`schema=${config.schema}`);
    }
    
    if (config.applicationName) {
      params.push(`application_name=${encodeURIComponent(config.applicationName)}`);
    }
    
    if (params.length > 0) {
      connectionString += '?' + params.join('&');
    }
    
    return connectionString;
  }

  /**
   * Build connection pool configuration
   */
  buildPoolConfiguration() {
    const config = this.config;
    
    return {
      // Pool size management
      min: config.minConnections || 1,
      max: config.maxConnections || 10,
      
      // Timeout settings
      acquireTimeoutMillis: config.acquireTimeoutMillis || 10000,
      createTimeoutMillis: config.createTimeoutMillis || 10000,
      destroyTimeoutMillis: config.destroyTimeoutMillis || 5000,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      
      // Pool maintenance
      reapIntervalMillis: config.reapIntervalMillis || 1000,
      createRetryIntervalMillis: config.createRetryIntervalMillis || 200,
      
      // Connection validation
      testOnBorrow: true,
      testOnReturn: false,
      testWhileIdle: true,
      validationQuery: 'SELECT 1',
      
      // Pool behavior
      fifo: true,
      priorityRange: 1,
      autostart: true,
      evictionRunIntervalMillis: 10000,
      
      // Error handling
      propagateCreateError: false,
      errorHandler: (error) => {
        console.error('Database pool error:', error);
      }
    };
  }

  /**
   * Build SSL configuration
   */
  buildSSLConfiguration() {
    const config = this.config;
    
    if (!config.ssl) {
      return false;
    }
    
    if (typeof config.ssl === 'boolean') {
      return config.ssl;
    }
    
    return {
      rejectUnauthorized: config.ssl.rejectUnauthorized !== false,
      ca: config.ssl.ca || process.env.DB_SSL_CA,
      cert: config.ssl.cert || process.env.DB_SSL_CERT,
      key: config.ssl.key || process.env.DB_SSL_KEY,
      servername: config.ssl.servername || config.host,
      checkServerIdentity: config.ssl.checkServerIdentity || null
    };
  }

  /**
   * Build performance configuration
   */
  buildPerformanceConfiguration() {
    const config = this.config;
    
    return {
      // Query optimization
      enablePreparedStatements: config.enablePreparedStatements !== false,
      enableQueryCache: config.enableQueryCache === true,
      queryCacheSize: parseInt(process.env.DB_QUERY_CACHE_SIZE) || 100,
      
      // Connection optimization
      enableConnectionPooling: config.enableConnectionPooling !== false,
      poolStrategy: 'round-robin',
      
      // Statement settings
      statementTimeout: config.statementTimeout || 30000,
      queryTimeout: config.queryTimeout || 30000,
      lockTimeout: parseInt(process.env.DB_LOCK_TIMEOUT) || 10000,
      
      // Read replica settings
      enableReadReplicas: config.enableReadReplicas === true,
      readReplicaHosts: process.env.DB_READ_REPLICA_HOSTS?.split(',') || [],
      readWriteSplit: config.readWriteSplit === true,
      
      // Batch settings
      enableBatchQueries: true,
      maxBatchSize: parseInt(process.env.DB_MAX_BATCH_SIZE) || 1000,
      batchTimeout: parseInt(process.env.DB_BATCH_TIMEOUT) || 5000,
      
      // Index optimization
      enableAutoAnalyze: this.environment === 'production',
      enableAutoVacuum: this.environment === 'production',
      maintenanceWorkMem: process.env.DB_MAINTENANCE_WORK_MEM || '256MB',
      sharedBuffers: process.env.DB_SHARED_BUFFERS || '256MB'
    };
  }

  /**
   * Build monitoring configuration
   */
  buildMonitoringConfiguration() {
    const config = this.config;
    
    return {
      // Query monitoring
      enableQueryLogging: config.enableQueryLogging === true,
      logSlowQueries: config.logSlowQueries === true,
      slowQueryThreshold: config.slowQueryThreshold || 1000,
      enableQueryStatistics: true,
      
      // Performance monitoring
      enablePerformanceMonitoring: config.enablePerformanceMonitoring === true,
      enableConnectionMonitoring: true,
      enablePoolMonitoring: true,
      
      // Health monitoring
      enableHealthChecks: true,
      healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 30000,
      healthCheckTimeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT) || 5000,
      healthCheckQuery: 'SELECT 1 as health_check',
      
      // Metrics collection
      enableMetricsCollection: true,
      metricsInterval: parseInt(process.env.DB_METRICS_INTERVAL) || 60000,
      metricsRetention: parseInt(process.env.DB_METRICS_RETENTION) || 86400000, // 24 hours
      
      // Alert thresholds
      alertThresholds: {
        connectionPool: {
          utilizationWarning: 80, // 80%
          utilizationCritical: 95, // 95%
        },
        responseTime: {
          warning: config.slowQueryThreshold || 1000,
          critical: (config.slowQueryThreshold || 1000) * 5
        },
        errorRate: {
          warning: 1, // 1%
          critical: 5 // 5%
        },
        connectionFailures: {
          warning: 5, // 5 failures per minute
          critical: 20 // 20 failures per minute
        }
      }
    };
  }

  /**
   * Get database configuration for specific use case
   */
  getConfigForUseCase(useCase) {
    const configs = {
      migration: {
        connectionTimeoutMillis: 60000,
        statementTimeout: 300000, // 5 minutes
        queryTimeout: 300000,
        maxConnections: 1
      },
      
      backup: {
        connectionTimeoutMillis: 60000,
        statementTimeout: 600000, // 10 minutes
        queryTimeout: 600000,
        maxConnections: 1
      },
      
      analytics: {
        connectionTimeoutMillis: 30000,
        statementTimeout: 120000, // 2 minutes
        queryTimeout: 120000,
        maxConnections: 5,
        enableReadReplicas: true
      },
      
      realtime: {
        connectionTimeoutMillis: 5000,
        statementTimeout: 10000,
        queryTimeout: 10000,
        maxConnections: 20,
        enableConnectionPooling: true
      }
    };

    return {
      ...this.config,
      ...configs[useCase]
    };
  }

  /**
   * Validate database configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Required fields validation
    if (!this.config.host) {
      errors.push('Database host is required');
    }
    
    if (!this.config.database) {
      errors.push('Database name is required');
    }
    
    if (!this.config.username) {
      errors.push('Database username is required');
    }
    
    // Range validation
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('Database port must be between 1 and 65535');
    }
    
    if (this.config.maxConnections < 1) {
      errors.push('Maximum connections must be at least 1');
    }
    
    if (this.config.maxConnections > 1000) {
      warnings.push('Very high connection count may impact performance');
    }
    
    // Environment-specific validation
    if (this.environment === 'production') {
      if (!this.config.ssl) {
        warnings.push('SSL should be enabled in production');
      }
      
      if (this.config.enableQueryLogging) {
        warnings.push('Query logging should be disabled in production for performance');
      }
      
      if (this.config.maxConnections < 5) {
        warnings.push('Consider increasing connection pool size for production');
      }
    }
    
    // SSL validation
    if (this.config.ssl && typeof this.config.ssl === 'object') {
      if (this.config.ssl.rejectUnauthorized && !this.config.ssl.ca) {
        warnings.push('SSL CA certificate should be provided when rejectUnauthorized is true');
      }
    }
    
    // Timeout validation
    if (this.config.connectionTimeoutMillis < 1000) {
      warnings.push('Connection timeout should be at least 1000ms');
    }
    
    if (this.config.queryTimeout < this.config.connectionTimeoutMillis) {
      warnings.push('Query timeout should be greater than connection timeout');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get connection string for external tools
   */
  getConnectionString() {
    return this.config.connectionString;
  }

  /**
   * Get pool configuration for connection pooling
   */
  getPoolConfig() {
    return this.config.poolConfig;
  }

  /**
   * Get SSL configuration
   */
  getSSLConfig() {
    return this.config.sslConfig;
  }

  /**
   * Export configuration for use with database libraries
   */
  exportConfig() {
    return {
      // Connection settings
      connectionString: this.config.connectionString,
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      username: this.config.username,
      password: this.config.password,
      
      // Pool settings
      pool: this.config.poolConfig,
      
      // SSL settings
      ssl: this.config.sslConfig,
      
      // Additional options
      options: {
        applicationName: this.config.applicationName,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
        statementTimeout: this.config.statementTimeout,
        queryTimeout: this.config.queryTimeout,
        schema: this.config.schema,
        timezone: this.config.timezone
      },
      
      // Environment info
      environment: this.environment
    };
  }
}

/**
 * Create database configuration for current environment
 */
export function createDatabaseConfig(environment = process.env.NODE_ENV) {
  return new DatabaseConfig(environment);
}

/**
 * Get database configuration
 */
export function getDatabaseConfig(environment = process.env.NODE_ENV) {
  const dbConfig = new DatabaseConfig(environment);
  return dbConfig.exportConfig();
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(environment = process.env.NODE_ENV) {
  const dbConfig = new DatabaseConfig(environment);
  return dbConfig.validate();
}

export default DatabaseConfig;