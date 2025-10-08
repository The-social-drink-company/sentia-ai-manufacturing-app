/**
 * Cache Configuration Management
 * 
 * Comprehensive cache configuration supporting Redis and memory caching
 * with environment-specific optimizations and performance tuning.
 */

import { config } from 'dotenv';

config();

/**
 * Cache Configuration Factory
 */
export class CacheConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  /**
   * Build environment-specific cache configuration
   */
  buildConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration();
    
    // Merge base and environment configs first
    const mergedConfig = {
      ...baseConfig,
      ...envConfig
    };
    
    // Set the config temporarily so computed properties can access it
    this.config = mergedConfig;
    
    return {
      ...mergedConfig,
      // Computed properties
      connectionConfig: this.buildConnectionConfiguration(),
      redisConfig: this.buildRedisConfiguration(),
      memoryConfig: this.buildMemoryConfiguration(),
      clusterConfig: this.buildClusterConfiguration(),
      performanceConfig: this.buildPerformanceConfiguration()
    };
  }

  /**
   * Base cache configuration
   */
  getBaseConfiguration() {
    return {
      // Cache type selection
      type: process.env.REDIS_URL ? 'redis' : 'memory',
      
      // Connection settings
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      database: parseInt(process.env.REDIS_DATABASE) || 0,
      
      // Basic cache options
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300, // 5 minutes
      maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
      keyPrefix: process.env.CACHE_KEY_PREFIX || 'sentia-mcp:',
      
      // Serialization
      serializer: 'json',
      compression: process.env.CACHE_COMPRESSION === 'true',
      compressionThreshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD) || 1024,
      
      // Connection management
      connectTimeout: parseInt(process.env.CACHE_CONNECT_TIMEOUT) || 10000,
      lazyConnect: process.env.CACHE_LAZY_CONNECT !== 'false',
      keepAlive: parseInt(process.env.CACHE_KEEP_ALIVE) || 30000,
      
      // Retry settings
      retryDelayOnFailover: parseInt(process.env.CACHE_RETRY_DELAY) || 100,
      maxRetriesPerRequest: parseInt(process.env.CACHE_MAX_RETRIES) || 3,
      enableOfflineQueue: process.env.CACHE_OFFLINE_QUEUE !== 'false'
    };
  }

  /**
   * Environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const configs = {
      development: {
        // Development cache settings
        type: 'memory',
        defaultTTL: 60, // 1 minute
        maxSize: 500, // Increased for testing
        keyPrefix: 'sentia-mcp:dev:',
        
        // Development Redis settings
        redis: {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          connectTimeout: 5000,
          enableReadyCheck: true,
          lazyConnect: true
        },
        
        // Memory cache settings
        memory: {
          maxSize: 500,
          checkPeriod: 60, // 1 minute
          useClones: false,
          deleteOnExpire: true,
          enableStatistics: true
        },
        
        // Development features
        enableCacheDebugging: true,
        logCacheOperations: true,
        enableCacheInvalidation: true,
        enableCacheMetrics: true,
        enableCacheInspection: true,
        enablePerformanceAnalytics: true,
        enableCacheWarming: true,
        
        // Performance optimization features
        enableCompression: false, // Disable for faster development
        enableBatching: false,
        enableMultiLevel: true
      },

      testing: {
        // Testing cache settings
        type: 'memory',
        defaultTTL: 30, // 30 seconds
        maxSize: 500,
        keyPrefix: 'sentia-mcp:test:',
        
        // Testing Redis settings
        redis: {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 2,
          connectTimeout: 5000,
          enableReadyCheck: true,
          lazyConnect: true
        },
        
        // Memory cache settings
        memory: {
          maxSize: 500,
          checkPeriod: 30, // 30 seconds
          useClones: true,
          deleteOnExpire: true,
          enableStatistics: true
        },
        
        // Testing features
        enableCacheClear: true,
        enableCacheInspection: true,
        enableCacheMetrics: true,
        testCacheIsolation: true,
        enableCacheValidation: true
      },

      staging: {
        // Staging cache settings
        type: process.env.REDIS_URL ? 'redis' : 'memory',
        defaultTTL: 300, // 5 minutes
        maxSize: 3000,
        keyPrefix: 'sentia-mcp:staging:',
        
        // Staging Redis settings
        redis: {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          connectTimeout: 10000,
          commandTimeout: 5000,
          enableReadyCheck: true,
          lazyConnect: true,
          keepAlive: 30000,
          family: 4
        },
        
        // Memory cache settings
        memory: {
          maxSize: 3000,
          checkPeriod: 600, // 10 minutes
          useClones: true,
          deleteOnExpire: true,
          enableStatistics: true
        },
        
        // Staging features
        enableCacheMetrics: true,
        enableCacheDebugging: true,
        enableCacheValidation: true,
        enableCacheProfiling: true,
        cacheHitRateThreshold: 0.8
      },

      production: {
        // Production cache settings
        type: 'redis',
        defaultTTL: 300, // 5 minutes
        maxSize: 10000, // Increased for production
        keyPrefix: 'sentia-mcp:prod:',
        
        // Production Redis settings
        redis: {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          connectTimeout: 10000,
          commandTimeout: 5000,
          enableReadyCheck: true,
          lazyConnect: true,
          keepAlive: 30000,
          family: 4,
          compression: 'gzip',
          enableAutoPipelining: true,
          maxMemoryPolicy: 'allkeys-lru'
        },
        
        // Memory cache fallback (L1)
        memory: {
          maxSize: 2000, // L1 cache size
          checkPeriod: 300, // 5 minutes
          useClones: true,
          deleteOnExpire: true,
          enableStatistics: true
        },
        
        // Production features
        enableDistributedCache: true,
        enableCacheCompression: true,
        enableCacheEncryption: true,
        enableCacheMetrics: true,
        enableCacheReplication: false, // Enable when multi-region
        enableCacheSharding: false, // Enable when needed
        
        // Performance optimization features
        enablePerformanceAnalytics: true,
        enableCacheWarming: true,
        enableBatching: true,
        enableMultiLevel: true,
        enablePredictiveWarming: true,
        enableCostAnalysis: true,
        enableAnomalyDetection: true,
        
        // Advanced production features
        enableGCOptimization: true,
        enableConnectionPooling: true,
        enableNetworkOptimization: true,
        enableResponseCompression: true
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Build connection configuration
   */
  buildConnectionConfiguration() {
    const config = this.config;
    
    if (config.type === 'redis') {
      return {
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.database,
        connectTimeout: config.connectTimeout,
        lazyConnect: config.lazyConnect,
        keepAlive: config.keepAlive,
        family: 4,
        retryDelayOnFailover: config.retryDelayOnFailover,
        maxRetriesPerRequest: config.maxRetriesPerRequest,
        enableOfflineQueue: config.enableOfflineQueue
      };
    }
    
    return null;
  }

  /**
   * Build Redis-specific configuration
   */
  buildRedisConfiguration() {
    if (this.config.type !== 'redis') {
      return null;
    }

    const config = this.config;
    const redisConfig = config.redis || {};
    
    return {
      // Connection settings
      url: process.env.REDIS_URL,
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.database,
      
      // Connection options
      connectTimeout: redisConfig.connectTimeout || config.connectTimeout,
      commandTimeout: redisConfig.commandTimeout || 5000,
      lazyConnect: redisConfig.lazyConnect !== false,
      keepAlive: redisConfig.keepAlive || config.keepAlive,
      family: redisConfig.family || 4,
      
      // Retry and resilience
      retryDelayOnFailover: redisConfig.retryDelayOnFailover || config.retryDelayOnFailover,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest || config.maxRetriesPerRequest,
      enableOfflineQueue: redisConfig.enableOfflineQueue !== false,
      enableReadyCheck: redisConfig.enableReadyCheck !== false,
      
      // Performance settings
      enableAutoPipelining: redisConfig.enableAutoPipelining === true,
      compression: redisConfig.compression || null,
      maxMemoryPolicy: redisConfig.maxMemoryPolicy || 'noeviction',
      
      // Key management
      keyPrefix: config.keyPrefix,
      keyGenerator: (key) => `${config.keyPrefix}${key}`,
      
      // Serialization
      serializer: {
        serialize: JSON.stringify,
        deserialize: JSON.parse
      },
      
      // Event handlers
      onConnect: () => {
        console.log('Redis cache connected');
      },
      onError: (error) => {
        console.error('Redis cache error:', error);
      },
      onReconnecting: () => {
        console.log('Redis cache reconnecting...');
      }
    };
  }

  /**
   * Build memory cache configuration
   */
  buildMemoryConfiguration() {
    const config = this.config;
    const memoryConfig = config.memory || {};
    
    return {
      // Size management
      maxSize: memoryConfig.maxSize || config.maxSize,
      maxMemory: parseInt(process.env.MEMORY_CACHE_MAX_MEMORY) || 100 * 1024 * 1024, // 100MB
      
      // TTL settings
      defaultTTL: config.defaultTTL,
      checkPeriod: memoryConfig.checkPeriod || 600, // 10 minutes
      
      // Behavior settings
      useClones: memoryConfig.useClones !== false,
      deleteOnExpire: memoryConfig.deleteOnExpire !== false,
      enableStatistics: memoryConfig.enableStatistics === true,
      
      // Performance settings
      stdTTL: config.defaultTTL,
      checkperiod: memoryConfig.checkPeriod || 600,
      errorOnMissing: false,
      useClones: memoryConfig.useClones !== false,
      
      // Event handlers
      onExpired: (key, value) => {
        if (this.environment === 'development') {
          console.log(`Cache key expired: ${key}`);
        }
      },
      onSet: (key, value) => {
        if (this.environment === 'development' && config.logCacheOperations) {
          console.log(`Cache set: ${key}`);
        }
      },
      onGet: (key, value) => {
        if (this.environment === 'development' && config.logCacheOperations) {
          console.log(`Cache get: ${key}`);
        }
      },
      onDel: (key, value) => {
        if (this.environment === 'development' && config.logCacheOperations) {
          console.log(`Cache delete: ${key}`);
        }
      }
    };
  }

  /**
   * Build cluster configuration
   */
  buildClusterConfiguration() {
    if (!process.env.REDIS_CLUSTER_NODES) {
      return null;
    }

    return {
      enableCluster: true,
      nodes: process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port) || 6379 };
      }),
      options: {
        enableReadyCheck: true,
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          family: 4
        },
        scaleReads: 'slave',
        maxRedirections: 3,
        retryDelayOnFailover: 100
      }
    };
  }

  /**
   * Build performance configuration
   */
  buildPerformanceConfiguration() {
    const config = this.config;
    
    return {
      // Cache strategy
      strategy: 'lru', // Least Recently Used
      writeThrough: false,
      writeBack: false,
      readThrough: false,
      
      // Performance optimizations
      enableCompression: config.compression,
      compressionThreshold: config.compressionThreshold,
      enableSerialization: true,
      serializationFormat: config.serializer,
      
      // Batching and pipelining
      enableBatching: this.environment === 'production',
      batchSize: parseInt(process.env.CACHE_BATCH_SIZE) || 100,
      batchTimeout: parseInt(process.env.CACHE_BATCH_TIMEOUT) || 10,
      enablePipelining: this.environment === 'production',
      pipelineSize: parseInt(process.env.CACHE_PIPELINE_SIZE) || 50,
      
      // Monitoring and metrics
      enableMetrics: config.enableCacheMetrics === true,
      metricsInterval: parseInt(process.env.CACHE_METRICS_INTERVAL) || 60000,
      enableHitRateTracking: true,
      hitRateThreshold: config.cacheHitRateThreshold || 0.8,
      
      // Memory management
      gcInterval: parseInt(process.env.CACHE_GC_INTERVAL) || 300000, // 5 minutes
      enableLRUEviction: true,
      evictionPolicy: 'lru',
      
      // Connection pooling
      poolSize: parseInt(process.env.CACHE_POOL_SIZE) || 10,
      poolIdleTimeout: parseInt(process.env.CACHE_POOL_IDLE_TIMEOUT) || 30000,
      poolMaxWaitingClients: parseInt(process.env.CACHE_POOL_MAX_WAITING) || 50
    };
  }

  /**
   * Get cache configuration for specific use case
   */
  getConfigForUseCase(useCase) {
    const configs = {
      session: {
        defaultTTL: 3600, // 1 hour
        keyPrefix: `${this.config.keyPrefix}session:`,
        compression: false
      },
      
      api: {
        defaultTTL: 300, // 5 minutes
        keyPrefix: `${this.config.keyPrefix}api:`,
        compression: true
      },
      
      tool: {
        defaultTTL: 600, // 10 minutes
        keyPrefix: `${this.config.keyPrefix}tool:`,
        compression: true
      },
      
      user: {
        defaultTTL: 1800, // 30 minutes
        keyPrefix: `${this.config.keyPrefix}user:`,
        compression: false
      },
      
      temporary: {
        defaultTTL: 60, // 1 minute
        keyPrefix: `${this.config.keyPrefix}temp:`,
        compression: false
      }
    };

    return {
      ...this.config,
      ...configs[useCase]
    };
  }

  /**
   * Validate cache configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Type validation
    if (!['redis', 'memory'].includes(this.config.type)) {
      errors.push('Cache type must be either "redis" or "memory"');
    }
    
    // Redis validation
    if (this.config.type === 'redis') {
      if (!this.config.host) {
        errors.push('Redis host is required when using Redis cache');
      }
      
      if (this.config.port < 1 || this.config.port > 65535) {
        errors.push('Redis port must be between 1 and 65535');
      }
      
      if (!process.env.REDIS_URL && this.environment === 'production') {
        warnings.push('REDIS_URL should be set in production');
      }
    }
    
    // Memory validation
    if (this.config.type === 'memory') {
      if (this.config.maxSize < 1) {
        errors.push('Memory cache max size must be at least 1');
      }
      
      if (this.config.maxSize > 10000 && this.environment === 'production') {
        warnings.push('Large memory cache size may impact performance in production');
      }
    }
    
    // TTL validation
    if (this.config.defaultTTL < 1) {
      errors.push('Default TTL must be at least 1 second');
    }
    
    // Environment-specific validation
    if (this.environment === 'production') {
      if (this.config.type === 'memory' && this.config.maxSize > 5000) {
        warnings.push('Consider using Redis for large cache sizes in production');
      }
      
      if (!this.config.compression && this.config.type === 'redis') {
        warnings.push('Consider enabling compression for Redis in production');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration for cache libraries
   */
  exportConfig() {
    return {
      // Basic settings
      type: this.config.type,
      defaultTTL: this.config.defaultTTL,
      keyPrefix: this.config.keyPrefix,
      
      // Type-specific configs
      redis: this.config.type === 'redis' ? this.config.redisConfig : null,
      memory: this.config.type === 'memory' ? this.config.memoryConfig : null,
      cluster: this.config.clusterConfig,
      
      // Performance settings
      performance: this.config.performanceConfig,
      
      // Environment info
      environment: this.environment
    };
  }

  /**
   * Get cache client configuration
   */
  getClientConfig() {
    if (this.config.type === 'redis') {
      return this.config.redisConfig;
    } else {
      return this.config.memoryConfig;
    }
  }
}

/**
 * Create cache configuration for current environment
 */
export function createCacheConfig(environment = process.env.NODE_ENV) {
  return new CacheConfig(environment);
}

/**
 * Get cache configuration
 */
export function getCacheConfig(environment = process.env.NODE_ENV) {
  const cacheConfig = new CacheConfig(environment);
  return cacheConfig.exportConfig();
}

/**
 * Validate cache configuration
 */
export function validateCacheConfig(environment = process.env.NODE_ENV) {
  const cacheConfig = new CacheConfig(environment);
  return cacheConfig.validate();
}

export default CacheConfig;