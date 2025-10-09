/**
 * Advanced Performance Optimization Engine
 * 
 * Comprehensive performance optimization system for the Sentia MCP Server:
 * - Request/Response compression and optimization
 * - Database connection pooling and query optimization
 * - API call batching and rate limit management
 * - Lazy loading and async processing
 * - Memory management and garbage collection optimization
 * - Network optimization and connection management
 * 
 * @version 4.0.0
 */

import { EventEmitter } from 'events';
import { promisify } from 'util';
import zlib from 'zlib';
import cluster from 'cluster';
import os from 'os';
import crypto from 'crypto';
import { createLogger } from './logger.js';
import { monitoring } from './monitoring.js';
import { cacheManager } from './cache.js';

const logger = createLogger();
const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

/**
 * Performance Optimization Engine
 */
export class PerformanceOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Compression settings
      compression: {
        enabled: config.compression?.enabled !== false,
        threshold: config.compression?.threshold || 1024, // 1KB
        level: config.compression?.level || 6,
        algorithm: config.compression?.algorithm || 'gzip' // 'gzip' or 'brotli'
      },
      
      // Connection pooling
      connectionPool: {
        enabled: config.connectionPool?.enabled !== false,
        min: config.connectionPool?.min || 2,
        max: config.connectionPool?.max || 10,
        idleTimeoutMillis: config.connectionPool?.idleTimeoutMillis || 30000,
        acquireTimeoutMillis: config.connectionPool?.acquireTimeoutMillis || 60000
      },
      
      // API batching
      apiBatching: {
        enabled: config.apiBatching?.enabled !== false,
        batchSize: config.apiBatching?.batchSize || 10,
        batchTimeout: config.apiBatching?.batchTimeout || 100, // ms
        maxConcurrent: config.apiBatching?.maxConcurrent || 5
      },
      
      // Memory optimization
      memory: {
        gcInterval: config.memory?.gcInterval || 300000, // 5 minutes
        heapThreshold: config.memory?.heapThreshold || 80, // 80%
        enableGCOptimization: config.memory?.enableGCOptimization !== false
      },
      
      // Network optimization
      network: {
        keepAlive: config.network?.keepAlive !== false,
        keepAliveMsecs: config.network?.keepAliveMsecs || 1000,
        timeout: config.network?.timeout || 30000,
        maxSockets: config.network?.maxSockets || 256
      },
      
      ...config
    };

    // Performance components
    this.compressionEngine = new CompressionEngine(this.config.compression);
    this.connectionPoolManager = new ConnectionPoolManager(this.config.connectionPool);
    this.batchProcessor = new BatchProcessor(this.config.apiBatching);
    this.memoryOptimizer = new MemoryOptimizer(this.config.memory);
    this.networkOptimizer = new NetworkOptimizer(this.config.network);
    this.lazyLoader = new LazyLoader();
    
    // Performance metrics
    this.metrics = {
      compression: { operations: 0, bytesReduced: 0, timeReduced: 0 },
      batching: { operations: 0, batchesSent: 0, requestsReduced: 0 },
      memory: { gcOperations: 0, heapOptimizations: 0 },
      network: { connectionsReused: 0, timeoutsPrevented: 0 }
    };

    this.initialize();
  }

  /**
   * Initialize performance optimization engine
   */
  async initialize() {
    try {
      // Initialize components
      await this.compressionEngine.initialize();
      await this.connectionPoolManager.initialize();
      await this.batchProcessor.initialize();
      await this.memoryOptimizer.initialize();
      await this.networkOptimizer.initialize();
      await this.lazyLoader.initialize();
      
      // Setup monitoring
      this.setupPerformanceMonitoring();
      
      // Setup optimization intervals
      this.setupOptimizationIntervals();
      
      this.emit('performance:initialized');
      
      logger.info('Performance optimization engine initialized', {
        compression: this.config.compression.enabled,
        connectionPool: this.config.connectionPool.enabled,
        apiBatching: this.config.apiBatching.enabled,
        memoryOptimization: this.config.memory.enableGCOptimization
      });

    } catch (error) {
      logger.error('Performance optimizer initialization failed', { error });
      throw error;
    }
  }

  /**
   * Optimize HTTP response
   */
  async optimizeResponse(response, request) {
    try {
      const startTime = process.hrtime.bigint();
      
      // Apply compression if beneficial
      const compressed = await this.compressionEngine.compressResponse(response, request);
      
      // Add performance headers
      const optimized = this.addPerformanceHeaders(compressed, request);
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms
      
      this.metrics.compression.operations++;
      this.metrics.compression.timeReduced += duration;
      
      this.emit('performance:response_optimized', {
        originalSize: response.length || 0,
        optimizedSize: optimized.length || 0,
        duration,
        compressionRatio: compressed.compressionRatio || 1
      });
      
      return optimized;

    } catch (error) {
      logger.error('Response optimization failed', { error: error.message });
      return response;
    }
  }

  /**
   * Optimize database query
   */
  async optimizeQuery(query, params = {}) {
    try {
      // Get connection from pool
      const connection = await this.connectionPoolManager.getConnection();
      
      // Apply query optimizations
      const optimizedQuery = this.optimizeQueryStructure(query);
      
      // Execute with performance tracking
      const result = await this.executeOptimizedQuery(connection, optimizedQuery, params);
      
      // Return connection to pool
      await this.connectionPoolManager.releaseConnection(connection);
      
      return result;

    } catch (error) {
      logger.error('Query optimization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Batch API requests
   */
  async batchApiRequests(requests, options = {}) {
    try {
      const batchConfig = { ...this.config.apiBatching, ...options };
      
      const batches = await this.batchProcessor.createBatches(requests, batchConfig);
      const results = await this.batchProcessor.executeBatches(batches, batchConfig);
      
      this.metrics.batching.operations++;
      this.metrics.batching.batchesSent += batches.length;
      this.metrics.batching.requestsReduced += requests.length - batches.length;
      
      this.emit('performance:requests_batched', {
        originalRequests: requests.length,
        batches: batches.length,
        reduction: requests.length - batches.length
      });
      
      return results;

    } catch (error) {
      logger.error('API batching failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Lazy load resource
   */
  async lazyLoad(resourceKey, loader, options = {}) {
    try {
      return await this.lazyLoader.load(resourceKey, loader, options);
    } catch (error) {
      logger.error('Lazy loading failed', { resourceKey, error: error.message });
      throw error;
    }
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory() {
    try {
      const result = await this.memoryOptimizer.optimize();
      
      this.metrics.memory.gcOperations++;
      if (result.heapOptimized) {
        this.metrics.memory.heapOptimizations++;
      }
      
      this.emit('performance:memory_optimized', result);
      
      return result;

    } catch (error) {
      logger.error('Memory optimization failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Optimize network connection
   */
  async optimizeNetworkConnection(url, options = {}) {
    try {
      return await this.networkOptimizer.getOptimizedConnection(url, options);
    } catch (error) {
      logger.error('Network optimization failed', { url, error: error.message });
      throw error;
    }
  }

  /**
   * Add performance headers to response
   */
  addPerformanceHeaders(response, request) {
    const headers = {
      'X-Performance-Optimized': 'true',
      'X-Cache-Status': request.cacheHit ? 'HIT' : 'MISS',
      'X-Response-Time': request.responseTime || 0,
      'X-Compression-Ratio': response.compressionRatio || 1
    };

    if (typeof response === 'object' && response.headers) {
      response.headers = { ...response.headers, ...headers };
    }

    return response;
  }

  /**
   * Optimize query structure
   */
  optimizeQueryStructure(query) {
    // Basic query optimizations
    let optimized = query.trim();
    
    // Add common optimizations
    if (optimized.toLowerCase().includes('select') && !optimized.toLowerCase().includes('limit')) {
      // Add reasonable limits to prevent large result sets
      optimized += ' LIMIT 1000';
    }
    
    // Cache query if it's a common pattern
    const queryHash = this.hashQuery(optimized);
    cacheManager.set(`query_plan:${queryHash}`, { query: optimized, optimized: true }, 'api_response');
    
    return optimized;
  }

  /**
   * Execute optimized query with performance tracking
   */
  async executeOptimizedQuery(connection, query, params) {
    const startTime = process.hrtime.bigint();
    
    try {
      // Execute query
      const result = await connection.query(query, params);
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms
      
      // Track query performance
      monitoring.setMetric('performance.query.duration', duration, {
        operation: this.extractQueryOperation(query)
      });
      
      return result;

    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      monitoring.setMetric('performance.query.error', 1, {
        operation: this.extractQueryOperation(query),
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Hash query for caching
   */
  hashQuery(query) {
    return crypto.createHash('md5').update(query).digest('hex');
  }

  /**
   * Extract query operation type
   */
  extractQueryOperation(query) {
    const firstWord = query.trim().split(/\s+/)[0]?.toLowerCase();
    return ['select', 'insert', 'update', 'delete', 'create', 'drop', 'alter'].includes(firstWord) 
      ? firstWord 
      : 'other';
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor metrics every minute
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60000);

    // Advanced monitoring every 5 minutes
    setInterval(() => {
      this.performAdvancedAnalysis();
    }, 300000);
  }

  /**
   * Setup optimization intervals
   */
  setupOptimizationIntervals() {
    // Memory optimization every 5 minutes
    setInterval(() => {
      this.optimizeMemory();
    }, this.config.memory.gcInterval);

    // Connection pool optimization every 10 minutes
    setInterval(() => {
      this.connectionPoolManager.optimize();
    }, 600000);

    // Network optimization every 15 minutes
    setInterval(() => {
      this.networkOptimizer.optimize();
    }, 900000);
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    try {
      // Compression metrics
      monitoring.setMetric('performance.compression.operations', this.metrics.compression.operations);
      monitoring.setMetric('performance.compression.bytes_reduced', this.metrics.compression.bytesReduced);
      
      // Batching metrics
      monitoring.setMetric('performance.batching.operations', this.metrics.batching.operations);
      monitoring.setMetric('performance.batching.requests_reduced', this.metrics.batching.requestsReduced);
      
      // Memory metrics
      monitoring.setMetric('performance.memory.gc_operations', this.metrics.memory.gcOperations);
      monitoring.setMetric('performance.memory.heap_optimizations', this.metrics.memory.heapOptimizations);
      
      // System metrics
      const memUsage = process.memoryUsage();
      monitoring.setMetric('performance.system.heap_used_mb', memUsage.heapUsed / 1024 / 1024);
      monitoring.setMetric('performance.system.heap_total_mb', memUsage.heapTotal / 1024 / 1024);
      monitoring.setMetric('performance.system.external_mb', memUsage.external / 1024 / 1024);

      this.emit('performance:metrics_collected', {
        metrics: this.metrics,
        systemMemory: memUsage,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Performance metrics collection failed', { error: error.message });
    }
  }

  /**
   * Perform advanced performance analysis
   */
  async performAdvancedAnalysis() {
    try {
      const analysis = {
        compression: await this.compressionEngine.getAnalysis(),
        connectionPool: await this.connectionPoolManager.getAnalysis(),
        batching: await this.batchProcessor.getAnalysis(),
        memory: await this.memoryOptimizer.getAnalysis(),
        network: await this.networkOptimizer.getAnalysis()
      };

      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(analysis);

      this.emit('performance:analysis_complete', {
        analysis,
        recommendations,
        timestamp: Date.now()
      });

      logger.info('Advanced performance analysis completed', {
        recommendationsCount: recommendations.length
      });

    } catch (error) {
      logger.error('Advanced performance analysis failed', { error: error.message });
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(analysis) {
    const recommendations = [];

    // Compression recommendations
    if (analysis.compression.compressionRatio < 0.7) {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        message: 'Consider using Brotli compression for better compression ratios',
        impact: 'Reduce bandwidth usage by 10-20%'
      });
    }

    // Connection pool recommendations
    if (analysis.connectionPool.averageWaitTime > 100) {
      recommendations.push({
        type: 'connection_pool',
        priority: 'high',
        message: 'Increase connection pool size to reduce wait times',
        impact: 'Improve query response times by 20-30%'
      });
    }

    // Memory recommendations
    if (analysis.memory.heapUsagePercent > 85) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'High memory usage detected. Consider implementing more aggressive garbage collection',
        impact: 'Prevent memory-related performance degradation'
      });
    }

    // Batching recommendations
    if (analysis.batching.batchEfficiency < 0.8) {
      recommendations.push({
        type: 'batching',
        priority: 'medium',
        message: 'Optimize API batching parameters for better efficiency',
        impact: 'Reduce API calls by 15-25%'
      });
    }

    return recommendations;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      metrics: this.metrics,
      config: this.config,
      components: {
        compression: this.compressionEngine.getStats(),
        connectionPool: this.connectionPoolManager.getStats(),
        batching: this.batchProcessor.getStats(),
        memory: this.memoryOptimizer.getStats(),
        network: this.networkOptimizer.getStats(),
        lazyLoader: this.lazyLoader.getStats()
      }
    };
  }
}

/**
 * Compression Engine
 */
class CompressionEngine {
  constructor(config) {
    this.config = config;
    this.stats = {
      operations: 0,
      bytesOriginal: 0,
      bytesCompressed: 0,
      timeSpent: 0
    };
  }

  async initialize() {
    logger.info('Compression engine initialized', {
      algorithm: this.config.algorithm,
      threshold: this.config.threshold
    });
  }

  async compressResponse(response, request) {
    if (!this.config.enabled) return response;

    const startTime = process.hrtime.bigint();
    const acceptEncoding = request.headers?.['accept-encoding'] || '';
    
    try {
      let responseData = response;
      let compressed = false;
      let compressionRatio = 1;
      
      if (typeof response === 'string' || Buffer.isBuffer(response)) {
        const dataSize = typeof response === 'string' ? Buffer.byteLength(response) : response.length;
        
        if (dataSize > this.config.threshold) {
          if (this.config.algorithm === 'brotli' && acceptEncoding.includes('br')) {
            responseData = await brotliCompress(response);
            compressed = true;
          } else if (acceptEncoding.includes('gzip')) {
            responseData = await gzip(response);
            compressed = true;
          }
          
          if (compressed) {
            compressionRatio = responseData.length / dataSize;
            this.stats.bytesOriginal += dataSize;
            this.stats.bytesCompressed += responseData.length;
          }
        }
      }

      const endTime = process.hrtime.bigint();
      this.stats.operations++;
      this.stats.timeSpent += Number(endTime - startTime) / 1000000;

      return {
        ...response,
        data: responseData,
        compressed,
        compressionRatio,
        encoding: compressed ? (this.config.algorithm === 'brotli' ? 'br' : 'gzip') : null
      };

    } catch (error) {
      logger.error('Compression failed', { error: error.message });
      return response;
    }
  }

  async getAnalysis() {
    return {
      totalOperations: this.stats.operations,
      compressionRatio: this.stats.bytesOriginal > 0 
        ? this.stats.bytesCompressed / this.stats.bytesOriginal 
        : 1,
      averageCompressionTime: this.stats.operations > 0 
        ? this.stats.timeSpent / this.stats.operations 
        : 0,
      bytesSaved: this.stats.bytesOriginal - this.stats.bytesCompressed
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

/**
 * Connection Pool Manager
 */
class ConnectionPoolManager {
  constructor(config) {
    this.config = config;
    this.pools = new Map();
    this.stats = {
      connectionsCreated: 0,
      connectionsReused: 0,
      averageWaitTime: 0,
      totalWaitTime: 0,
      waitOperations: 0
    };
  }

  async initialize() {
    logger.info('Connection pool manager initialized', {
      min: this.config.min,
      max: this.config.max
    });
  }

  async getConnection(poolName = 'default') {
    const startTime = Date.now();
    
    try {
      // This would be implemented with actual database connection pooling
      // For now, return a mock connection
      const connection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created: new Date(),
        query: async (query, params) => {
          // Mock query execution
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return { rows: [], rowCount: 0 };
        }
      };
      
      const waitTime = Date.now() - startTime;
      this.stats.totalWaitTime += waitTime;
      this.stats.waitOperations++;
      this.stats.averageWaitTime = this.stats.totalWaitTime / this.stats.waitOperations;
      
      if (waitTime < 10) {
        this.stats.connectionsReused++;
      } else {
        this.stats.connectionsCreated++;
      }
      
      return connection;

    } catch (error) {
      logger.error('Failed to get database connection', { error: error.message });
      throw error;
    }
  }

  async releaseConnection(connection) {
    // Mock connection release
    return true;
  }

  async optimize() {
    // Connection pool optimization logic
    logger.debug('Connection pool optimization completed');
  }

  async getAnalysis() {
    return {
      totalConnections: this.stats.connectionsCreated + this.stats.connectionsReused,
      reuseRatio: this.stats.connectionsReused / (this.stats.connectionsCreated + this.stats.connectionsReused || 1),
      averageWaitTime: this.stats.averageWaitTime
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

/**
 * Batch Processor
 */
class BatchProcessor {
  constructor(config) {
    this.config = config;
    this.stats = {
      batchesCreated: 0,
      requestsBatched: 0,
      batchEfficiency: 0
    };
  }

  async initialize() {
    logger.info('Batch processor initialized', {
      batchSize: this.config.batchSize,
      batchTimeout: this.config.batchTimeout
    });
  }

  async createBatches(requests, config) {
    const batches = [];
    const batchSize = config.batchSize || this.config.batchSize;
    
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }
    
    this.stats.batchesCreated += batches.length;
    this.stats.requestsBatched += requests.length;
    this.stats.batchEfficiency = this.stats.requestsBatched / this.stats.batchesCreated;
    
    return batches;
  }

  async executeBatches(batches, config) {
    const results = [];
    const maxConcurrent = config.maxConcurrent || this.config.maxConcurrent;
    
    // Execute batches with concurrency limit
    for (let i = 0; i < batches.length; i += maxConcurrent) {
      const batchGroup = batches.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batchGroup.map(batch => this.executeBatch(batch))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  async executeBatch(batch) {
    // Mock batch execution
    await new Promise(resolve => setTimeout(resolve, this.config.batchTimeout));
    return batch.map(request => ({ success: true, data: request }));
  }

  async getAnalysis() {
    return {
      totalBatches: this.stats.batchesCreated,
      batchEfficiency: this.stats.batchEfficiency,
      averageBatchSize: this.stats.requestsBatched / (this.stats.batchesCreated || 1)
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

/**
 * Memory Optimizer
 */
class MemoryOptimizer {
  constructor(config) {
    this.config = config;
    this.stats = {
      gcOperations: 0,
      heapOptimizations: 0,
      memoryFreed: 0
    };
  }

  async initialize() {
    if (this.config.enableGCOptimization) {
      this.setupGCOptimization();
    }
    
    logger.info('Memory optimizer initialized', {
      gcInterval: this.config.gcInterval,
      heapThreshold: this.config.heapThreshold
    });
  }

  setupGCOptimization() {
    // Monitor memory usage and trigger GC when needed
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsedPercent > this.config.heapThreshold) {
      this.optimize();
    }
  }

  async optimize() {
    const beforeMemory = process.memoryUsage();
    
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.stats.gcOperations++;
      }
      
      const afterMemory = process.memoryUsage();
      const memoryFreed = beforeMemory.heapUsed - afterMemory.heapUsed;
      
      if (memoryFreed > 0) {
        this.stats.heapOptimizations++;
        this.stats.memoryFreed += memoryFreed;
      }
      
      return {
        success: true,
        memoryFreed,
        heapOptimized: memoryFreed > 0,
        beforeMemory: beforeMemory.heapUsed,
        afterMemory: afterMemory.heapUsed
      };

    } catch (error) {
      logger.error('Memory optimization failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getAnalysis() {
    const memUsage = process.memoryUsage();
    return {
      heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      totalGCOperations: this.stats.gcOperations,
      totalMemoryFreed: this.stats.memoryFreed,
      heapOptimizations: this.stats.heapOptimizations
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

/**
 * Network Optimizer
 */
class NetworkOptimizer {
  constructor(config) {
    this.config = config;
    this.connections = new Map();
    this.stats = {
      connectionsCreated: 0,
      connectionsReused: 0,
      timeoutsPrevented: 0
    };
  }

  async initialize() {
    logger.info('Network optimizer initialized', {
      keepAlive: this.config.keepAlive,
      maxSockets: this.config.maxSockets
    });
  }

  async getOptimizedConnection(url, options = {}) {
    const connectionKey = this.getConnectionKey(url);
    
    if (this.connections.has(connectionKey)) {
      this.stats.connectionsReused++;
      return this.connections.get(connectionKey);
    }
    
    const connection = this.createOptimizedConnection(url, options);
    this.connections.set(connectionKey, connection);
    this.stats.connectionsCreated++;
    
    return connection;
  }

  createOptimizedConnection(url, options) {
    // Mock optimized connection
    return {
      url,
      keepAlive: this.config.keepAlive,
      timeout: this.config.timeout,
      created: Date.now(),
      ...options
    };
  }

  getConnectionKey(url) {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  }

  async optimize() {
    // Clean up old connections
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    for (const [key, connection] of this.connections.entries()) {
      if (now - connection.created > maxAge) {
        this.connections.delete(key);
      }
    }
  }

  async getAnalysis() {
    return {
      activeConnections: this.connections.size,
      connectionsReused: this.stats.connectionsReused,
      reuseRatio: this.stats.connectionsReused / (this.stats.connectionsCreated || 1),
      timeoutsPrevented: this.stats.timeoutsPrevented
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

/**
 * Lazy Loader
 */
class LazyLoader {
  constructor() {
    this.loadedResources = new Map();
    this.loadingPromises = new Map();
    this.stats = {
      resourcesLoaded: 0,
      cacheHits: 0,
      loadTime: 0
    };
  }

  async initialize() {
    logger.info('Lazy loader initialized');
  }

  async load(resourceKey, loader, options = {}) {
    // Check if already loaded
    if (this.loadedResources.has(resourceKey)) {
      this.stats.cacheHits++;
      return this.loadedResources.get(resourceKey);
    }
    
    // Check if currently loading
    if (this.loadingPromises.has(resourceKey)) {
      return await this.loadingPromises.get(resourceKey);
    }
    
    // Start loading
    const startTime = Date.now();
    const loadingPromise = this.performLoad(resourceKey, loader, options);
    this.loadingPromises.set(resourceKey, loadingPromise);
    
    try {
      const result = await loadingPromise;
      
      // Cache result
      this.loadedResources.set(resourceKey, result);
      this.stats.resourcesLoaded++;
      this.stats.loadTime += Date.now() - startTime;
      
      return result;
      
    } finally {
      this.loadingPromises.delete(resourceKey);
    }
  }

  async performLoad(resourceKey, loader, options) {
    try {
      return await loader(options);
    } catch (error) {
      logger.error('Lazy loading failed', { resourceKey, error: error.message });
      throw error;
    }
  }

  getStats() {
    return {
      ...this.stats,
      averageLoadTime: this.stats.resourcesLoaded > 0 
        ? this.stats.loadTime / this.stats.resourcesLoaded 
        : 0,
      cacheHitRatio: this.stats.cacheHits / (this.stats.resourcesLoaded + this.stats.cacheHits || 1)
    };
  }
}

// Create singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export utility functions
export const {
  optimizeResponse,
  optimizeQuery,
  batchApiRequests,
  lazyLoad,
  optimizeMemory,
  optimizeNetworkConnection,
  getStats: getPerformanceStats
} = performanceOptimizer;

export default PerformanceOptimizer;