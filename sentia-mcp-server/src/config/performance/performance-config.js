/**
 * Performance Configuration Management
 * 
 * Comprehensive performance configuration including resource optimization,
 * caching strategies, load balancing, scaling policies, and environment-specific
 * performance tuning for the MCP server.
 */

import { config } from 'dotenv';
import os from 'os';

config();

/**
 * Performance Configuration Factory
 */
export class PerformanceConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  /**
   * Build environment-specific performance configuration
   */
  buildConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration();
    
    return {
      ...baseConfig,
      ...envConfig,
      // Computed properties
      resourceConfig: this.buildResourceConfiguration(),
      cachingConfig: this.buildCachingConfiguration(),
      optimizationConfig: this.buildOptimizationConfiguration(),
      scalingConfig: this.buildScalingConfiguration(),
      monitoringConfig: this.buildMonitoringConfiguration(),
      tuningConfig: this.buildTuningConfiguration()
    };
  }

  /**
   * Base performance configuration
   */
  getBaseConfiguration() {
    return {
      // Resource limits
      maxMemoryUsage: process.env.PERF_MAX_MEMORY || '2gb',
      maxCPUUsage: parseInt(process.env.PERF_MAX_CPU) || 80, // 80%
      maxFileDescriptors: parseInt(process.env.PERF_MAX_FD) || 1024,
      maxConnections: parseInt(process.env.PERF_MAX_CONNECTIONS) || 1000,
      
      // Concurrency settings
      maxConcurrentRequests: parseInt(process.env.PERF_MAX_CONCURRENT_REQUESTS) || 100,
      maxConcurrentTools: parseInt(process.env.PERF_MAX_CONCURRENT_TOOLS) || 10,
      workerPoolSize: parseInt(process.env.PERF_WORKER_POOL_SIZE) || 4,
      
      // Timeout settings
      requestTimeout: parseInt(process.env.PERF_REQUEST_TIMEOUT) || 30000,
      responseTimeout: parseInt(process.env.PERF_RESPONSE_TIMEOUT) || 30000,
      keepAliveTimeout: parseInt(process.env.PERF_KEEP_ALIVE_TIMEOUT) || 5000,
      
      // Buffer sizes
      requestBufferSize: parseInt(process.env.PERF_REQUEST_BUFFER_SIZE) || 1048576, // 1MB
      responseBufferSize: parseInt(process.env.PERF_RESPONSE_BUFFER_SIZE) || 1048576, // 1MB
      
      // Caching settings
      enableCaching: process.env.PERF_ENABLE_CACHING !== 'false',
      cacheStrategy: process.env.PERF_CACHE_STRATEGY || 'lru',
      cacheTTL: parseInt(process.env.PERF_CACHE_TTL) || 300000, // 5 minutes
      
      // Compression settings
      enableCompression: process.env.PERF_ENABLE_COMPRESSION !== 'false',
      compressionLevel: parseInt(process.env.PERF_COMPRESSION_LEVEL) || 6,
      compressionThreshold: parseInt(process.env.PERF_COMPRESSION_THRESHOLD) || 1024,
      
      // Connection pooling
      enableConnectionPooling: process.env.PERF_ENABLE_CONNECTION_POOLING !== 'false',
      connectionPoolSize: parseInt(process.env.PERF_CONNECTION_POOL_SIZE) || 10,
      connectionPoolTimeout: parseInt(process.env.PERF_CONNECTION_POOL_TIMEOUT) || 30000,
      
      // Garbage collection
      enableGCOptimization: process.env.PERF_ENABLE_GC_OPTIMIZATION === 'true',
      gcInterval: parseInt(process.env.PERF_GC_INTERVAL) || 300000, // 5 minutes
      
      // Profiling
      enableProfiling: process.env.PERF_ENABLE_PROFILING === 'true',
      profileInterval: parseInt(process.env.PERF_PROFILE_INTERVAL) || 60000, // 1 minute
      
      // Load balancing
      enableLoadBalancing: process.env.PERF_ENABLE_LOAD_BALANCING === 'true',
      loadBalancingStrategy: process.env.PERF_LOAD_BALANCING_STRATEGY || 'round-robin'
    };
  }

  /**
   * Environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const configs = {
      development: {
        // Development performance (relaxed for debugging)
        maxMemoryUsage: '4gb',
        maxCPUUsage: 90,
        maxConcurrentRequests: 200,
        maxConcurrentTools: 20,
        workerPoolSize: 2,
        
        // Longer timeouts for debugging
        requestTimeout: 120000, // 2 minutes
        responseTimeout: 120000,
        keepAliveTimeout: 30000,
        
        // Enhanced caching for development
        enableCaching: true,
        cacheStrategy: 'lru',
        cacheTTL: 60000, // 1 minute
        
        // Compression settings
        enableCompression: false, // Disable for easier debugging
        
        // Connection pooling
        enableConnectionPooling: true,
        connectionPoolSize: 5,
        
        // Development profiling
        enableProfiling: true,
        profileInterval: 30000, // 30 seconds
        
        // Development features
        enableHotReload: true,
        enableDebugMode: true,
        enableMemoryProfiling: true,
        enableCPUProfiling: true,
        enableDetailedMetrics: true
      },

      testing: {
        // Testing performance (stable and predictable)
        maxMemoryUsage: '2gb',
        maxCPUUsage: 85,
        maxConcurrentRequests: 150,
        maxConcurrentTools: 15,
        workerPoolSize: 3,
        
        // Testing timeouts
        requestTimeout: 60000, // 1 minute
        responseTimeout: 60000,
        keepAliveTimeout: 15000,
        
        // Testing caching
        enableCaching: false, // Disable for consistent test results
        cacheStrategy: 'lru',
        cacheTTL: 30000, // 30 seconds
        
        // Compression settings
        enableCompression: true,
        compressionLevel: 4,
        
        // Connection pooling
        enableConnectionPooling: true,
        connectionPoolSize: 8,
        
        // Testing profiling
        enableProfiling: true,
        profileInterval: 60000, // 1 minute
        
        // Testing features
        enablePerformanceBaselines: true,
        enableRegressionDetection: true,
        enableLoadTesting: true,
        enableStressTesting: true
      },

      staging: {
        // Staging performance (production-like)
        maxMemoryUsage: '3gb',
        maxCPUUsage: 80,
        maxConcurrentRequests: 500,
        maxConcurrentTools: 15,
        workerPoolSize: 4,
        
        // Production-like timeouts
        requestTimeout: 45000, // 45 seconds
        responseTimeout: 45000,
        keepAliveTimeout: 10000,
        
        // Staging caching
        enableCaching: true,
        cacheStrategy: 'lru',
        cacheTTL: 300000, // 5 minutes
        
        // Compression settings
        enableCompression: true,
        compressionLevel: 6,
        
        // Connection pooling
        enableConnectionPooling: true,
        connectionPoolSize: 15,
        
        // Staging profiling
        enableProfiling: true,
        profileInterval: 300000, // 5 minutes
        
        // Staging features
        enablePreProductionTesting: true,
        enableCapacityPlanning: true,
        enablePerformanceValidation: true
      },

      production: {
        // Production performance (optimized)
        maxMemoryUsage: '4gb',
        maxCPUUsage: 75,
        maxConcurrentRequests: 1000,
        maxConcurrentTools: 20,
        workerPoolSize: os.cpus().length,
        
        // Optimized timeouts
        requestTimeout: 30000, // 30 seconds
        responseTimeout: 30000,
        keepAliveTimeout: 5000,
        
        // Production caching
        enableCaching: true,
        cacheStrategy: 'lru',
        cacheTTL: 600000, // 10 minutes
        
        // Maximum compression
        enableCompression: true,
        compressionLevel: 9,
        
        // Connection pooling
        enableConnectionPooling: true,
        connectionPoolSize: 20,
        
        // Production profiling (minimal)
        enableProfiling: false,
        profileInterval: 3600000, // 1 hour
        
        // Production optimizations
        enableClusterMode: true,
        enableAutoScaling: false, // Enable when supported
        enableResourceOptimization: true,
        enableGCOptimization: true
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Build resource configuration
   */
  buildResourceConfiguration() {
    const config = this.config;
    
    return {
      // Memory management
      memory: {
        maxUsage: config.maxMemoryUsage,
        heapSize: this.environment === 'production' ? '3gb' : '2gb',
        enableHeapProfiling: config.enableMemoryProfiling || false,
        gcStrategy: this.environment === 'production' ? 'aggressive' : 'standard',
        memoryLeakDetection: this.environment !== 'production'
      },
      
      // CPU management
      cpu: {
        maxUsage: config.maxCPUUsage,
        enableCPUProfiling: config.enableCPUProfiling || false,
        threadPoolSize: config.workerPoolSize,
        enableMultithreading: true,
        affinityMask: process.env.CPU_AFFINITY_MASK || null
      },
      
      // I/O management
      io: {
        maxFileDescriptors: config.maxFileDescriptors,
        ioBufferSize: config.requestBufferSize,
        enableAsyncIO: true,
        enableIOProfiling: this.environment === 'development'
      },
      
      // Network management
      network: {
        maxConnections: config.maxConnections,
        keepAliveTimeout: config.keepAliveTimeout,
        tcpNoDelay: true,
        socketTimeout: config.responseTimeout,
        enableNetworkProfiling: this.environment === 'development'
      },
      
      // Process management
      process: {
        enableClusterMode: config.enableClusterMode || false,
        workerCount: config.workerPoolSize,
        workerRestartThreshold: 1000000, // 1M requests
        workerMemoryThreshold: '1gb',
        enableProcessMonitoring: true
      }
    };
  }

  /**
   * Build caching configuration
   */
  buildCachingConfiguration() {
    const config = this.config;
    
    return {
      // Global caching settings
      enabled: config.enableCaching,
      strategy: config.cacheStrategy,
      defaultTTL: config.cacheTTL,
      
      // Cache layers
      layers: {
        memory: {
          enabled: true,
          maxSize: this.environment === 'production' ? 1000 : 500,
          strategy: 'lru',
          ttl: config.cacheTTL / 2
        },
        
        redis: {
          enabled: process.env.REDIS_URL ? true : false,
          maxSize: this.environment === 'production' ? 10000 : 5000,
          strategy: 'lru',
          ttl: config.cacheTTL,
          compression: this.environment === 'production'
        },
        
        disk: {
          enabled: this.environment === 'production',
          maxSize: '1gb',
          directory: 'cache/disk',
          ttl: config.cacheTTL * 10
        }
      },
      
      // Cache policies
      policies: {
        tools: {
          enabled: true,
          ttl: config.cacheTTL,
          strategy: 'lru',
          maxSize: 500,
          compression: true
        },
        
        api: {
          enabled: true,
          ttl: config.cacheTTL / 2,
          strategy: 'lru',
          maxSize: 1000,
          compression: false
        },
        
        integration: {
          enabled: true,
          ttl: config.cacheTTL * 2,
          strategy: 'lru',
          maxSize: 200,
          compression: true
        },
        
        session: {
          enabled: true,
          ttl: 3600000, // 1 hour
          strategy: 'lru',
          maxSize: 1000,
          compression: false
        }
      },
      
      // Cache optimization
      optimization: {
        enablePrefetching: this.environment === 'production',
        enableWarmup: this.environment === 'production',
        enableCompression: config.enableCompression,
        enableMetrics: true,
        enableInvalidation: true
      }
    };
  }

  /**
   * Build optimization configuration
   */
  buildOptimizationConfiguration() {
    const config = this.config;
    
    return {
      // Request optimization
      request: {
        enableCompression: config.enableCompression,
        compressionLevel: config.compressionLevel,
        compressionThreshold: config.compressionThreshold,
        enableKeepAlive: true,
        enablePipelining: this.environment === 'production',
        enableBatching: this.environment === 'production'
      },
      
      // Response optimization
      response: {
        enableStreaming: true,
        enableChunking: true,
        enableETag: true,
        enableLastModified: true,
        enableConditionalRequests: true
      },
      
      // Database optimization
      database: {
        enableConnectionPooling: config.enableConnectionPooling,
        poolSize: config.connectionPoolSize,
        enableQueryOptimization: true,
        enableIndexOptimization: this.environment === 'production',
        enableQueryCache: true,
        enablePreparedStatements: true
      },
      
      // Tool optimization
      tools: {
        enableConcurrentExecution: true,
        maxConcurrentTools: config.maxConcurrentTools,
        enableToolCaching: config.enableCaching,
        enableToolPipelining: this.environment === 'production',
        enableAsyncExecution: true
      },
      
      // Integration optimization
      integration: {
        enableConnectionReuse: true,
        enableRequestBatching: this.environment === 'production',
        enableResponseCaching: config.enableCaching,
        enableCircuitBreaker: this.environment === 'production',
        enableRetryOptimization: true
      },
      
      // Static asset optimization
      staticAssets: {
        enableCompression: config.enableCompression,
        enableCaching: true,
        enableCDN: false, // Enable when CDN is available
        enableVersioning: this.environment === 'production',
        enableMinification: this.environment === 'production'
      }
    };
  }

  /**
   * Build scaling configuration
   */
  buildScalingConfiguration() {
    const config = this.config;
    
    return {
      // Horizontal scaling
      horizontal: {
        enabled: config.enableAutoScaling || false,
        minInstances: 1,
        maxInstances: this.environment === 'production' ? 10 : 3,
        targetCPU: 70,
        targetMemory: 80,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        scaleUpCooldown: 300000, // 5 minutes
        scaleDownCooldown: 600000 // 10 minutes
      },
      
      // Vertical scaling
      vertical: {
        enabled: true,
        maxMemory: config.maxMemoryUsage,
        maxCPU: config.maxCPUUsage,
        enableDynamicAllocation: this.environment === 'production',
        allocationStep: '512mb',
        maxAllocation: '8gb'
      },
      
      // Load balancing
      loadBalancing: {
        enabled: config.enableLoadBalancing,
        strategy: config.loadBalancingStrategy,
        healthCheckInterval: 30000, // 30 seconds
        healthCheckTimeout: 5000,
        enableSessionAffinity: false,
        enableWeightedRouting: false
      },
      
      // Auto-scaling policies
      policies: {
        cpu: {
          scaleUp: { threshold: 80, duration: 300000 }, // 80% for 5 minutes
          scaleDown: { threshold: 30, duration: 600000 } // 30% for 10 minutes
        },
        memory: {
          scaleUp: { threshold: 85, duration: 180000 }, // 85% for 3 minutes
          scaleDown: { threshold: 40, duration: 900000 } // 40% for 15 minutes
        },
        requests: {
          scaleUp: { threshold: 1000, duration: 60000 }, // 1000 req/min for 1 minute
          scaleDown: { threshold: 100, duration: 300000 } // 100 req/min for 5 minutes
        }
      }
    };
  }

  /**
   * Build monitoring configuration
   */
  buildMonitoringConfiguration() {
    const config = this.config;
    
    return {
      // Performance monitoring
      enabled: true,
      interval: config.profileInterval,
      retentionDays: this.environment === 'production' ? 30 : 7,
      
      // Metrics collection
      metrics: {
        cpu: true,
        memory: true,
        disk: true,
        network: true,
        requests: true,
        responses: true,
        errors: true,
        latency: true
      },
      
      // Profiling
      profiling: {
        enabled: config.enableProfiling,
        cpu: config.enableCPUProfiling || false,
        memory: config.enableMemoryProfiling || false,
        heap: this.environment !== 'production',
        sampling: this.environment === 'production' ? 0.1 : 1.0
      },
      
      // Benchmarking
      benchmarking: {
        enabled: this.environment === 'testing',
        baseline: this.environment === 'testing',
        regression: this.environment === 'testing',
        loadTesting: this.environment === 'testing'
      },
      
      // Alerting thresholds
      alerts: {
        cpu: config.maxCPUUsage * 0.9, // 90% of max
        memory: 90, // 90%
        responseTime: config.requestTimeout * 0.8, // 80% of timeout
        errorRate: 5, // 5%
        availability: 99 // 99%
      }
    };
  }

  /**
   * Build tuning configuration
   */
  buildTuningConfiguration() {
    const config = this.config;
    
    return {
      // Node.js tuning
      nodejs: {
        maxOldSpaceSize: this.environment === 'production' ? 3072 : 2048,
        maxNewSpaceSize: this.environment === 'production' ? 1024 : 512,
        enableInspector: this.environment === 'development',
        inspectorPort: 9229,
        enableDebug: this.environment === 'development'
      },
      
      // V8 tuning
      v8: {
        optimizeForSize: this.environment === 'production',
        enableJITLessMode: false,
        enableCodeCache: this.environment === 'production',
        enableLazyCompilation: true,
        maxOldGenerationSize: this.environment === 'production' ? 3072 : 2048
      },
      
      // UV loop tuning
      uvLoop: {
        enableMetrics: this.environment !== 'production',
        poolSize: config.workerPoolSize,
        enableIOPoller: true,
        enableTimerReset: true
      },
      
      // HTTP tuning
      http: {
        maxHeaderSize: 16384, // 16KB
        maxRequestSize: config.requestBufferSize,
        keepAliveTimeout: config.keepAliveTimeout,
        headersTimeout: 60000, // 1 minute
        enableHttp2: false, // Enable when needed
        enableHttps: this.environment === 'production'
      },
      
      // OS tuning recommendations
      os: {
        enableRecommendations: true,
        recommendations: {
          fileDescriptors: config.maxFileDescriptors * 2,
          tcpBufferSizes: '64k',
          tcpCongestionControl: 'bbr',
          kernelParameters: {
            'net.core.somaxconn': 65535,
            'net.ipv4.tcp_max_syn_backlog': 65535,
            'net.core.netdev_max_backlog': 5000
          }
        }
      }
    };
  }

  /**
   * Validate performance configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Memory validation
    const memoryMB = parseInt(this.config.maxMemoryUsage.replace(/[^\d]/g, ''));
    if (memoryMB < 512) {
      errors.push('Maximum memory usage should be at least 512MB');
    }
    
    // CPU validation
    if (this.config.maxCPUUsage < 10 || this.config.maxCPUUsage > 100) {
      errors.push('Maximum CPU usage should be between 10% and 100%');
    }
    
    // Concurrency validation
    if (this.config.maxConcurrentRequests < 1) {
      errors.push('Maximum concurrent requests must be at least 1');
    }
    
    if (this.config.maxConcurrentTools < 1) {
      errors.push('Maximum concurrent tools must be at least 1');
    }
    
    // Timeout validation
    if (this.config.requestTimeout < 1000) {
      warnings.push('Request timeout should be at least 1000ms');
    }
    
    // Environment-specific validation
    if (this.environment === 'production') {
      if (!this.config.enableCompression) {
        warnings.push('Compression should be enabled in production');
      }
      
      if (!this.config.enableConnectionPooling) {
        warnings.push('Connection pooling should be enabled in production');
      }
      
      if (this.config.enableProfiling) {
        warnings.push('Profiling should be disabled in production for better performance');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration for performance optimization
   */
  exportConfig() {
    return {
      // Basic settings
      environment: this.environment,
      
      // Component configs
      resource: this.config.resourceConfig,
      caching: this.config.cachingConfig,
      optimization: this.config.optimizationConfig,
      scaling: this.config.scalingConfig,
      monitoring: this.config.monitoringConfig,
      tuning: this.config.tuningConfig
    };
  }

  /**
   * Get Node.js startup arguments
   */
  getNodeArgs() {
    const tuning = this.config.tuningConfig;
    const args = [];
    
    if (tuning.nodejs.maxOldSpaceSize) {
      args.push(`--max-old-space-size=${tuning.nodejs.maxOldSpaceSize}`);
    }
    
    if (tuning.nodejs.maxNewSpaceSize) {
      args.push(`--max-new-space-size=${tuning.nodejs.maxNewSpaceSize}`);
    }
    
    if (tuning.v8.optimizeForSize) {
      args.push('--optimize-for-size');
    }
    
    if (tuning.nodejs.enableInspector && this.environment === 'development') {
      args.push(`--inspect=${tuning.nodejs.inspectorPort}`);
    }
    
    return args;
  }
}

/**
 * Create performance configuration for current environment
 */
export function createPerformanceConfig(environment = process.env.NODE_ENV) {
  return new PerformanceConfig(environment);
}

/**
 * Get performance configuration
 */
export function getPerformanceConfig(environment = process.env.NODE_ENV) {
  const performanceConfig = new PerformanceConfig(environment);
  return performanceConfig.exportConfig();
}

/**
 * Validate performance configuration
 */
export function validatePerformanceConfig(environment = process.env.NODE_ENV) {
  const performanceConfig = new PerformanceConfig(environment);
  return performanceConfig.validate();
}

/**
 * Get recommended Node.js startup arguments
 */
export function getNodeStartupArgs(environment = process.env.NODE_ENV) {
  const performanceConfig = new PerformanceConfig(environment);
  return performanceConfig.getNodeArgs();
}

export default PerformanceConfig;