/**
 * Optimized Database Client with Connection Pooling
 * Enhanced Prisma client with performance optimizations and monitoring
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn, logDebug, devLog } from '../../utils/structuredLogger.js';

class OptimizedDatabaseClient {
  constructor() {
    this.client = null;
    this.connectionPool = null;
    this.queryMetrics = new Map();
    this.isConnected = false;

    // Performance thresholds
    this.slowQueryThreshold = 1000; // 1 second
    this.connectionTimeout = 10000; // 10 seconds
  }

  /**
   * Initialize optimized Prisma client
   */
  async initialize() {
    try {
      // Enhanced Prisma client configuration
      this.client = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        // Connection pool configuration
        datasourceUrl: this.buildDatabaseUrl(),
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
        // Performance optimizations
        errorFormat: 'minimal',
        transactionOptions: {
          maxWait: 5000,    // 5 seconds max wait for transaction
          timeout: 10000,   // 10 seconds timeout
          isolationLevel: 'ReadCommitted'
        }
      });

      // Set up event listeners for monitoring
      this.setupEventListeners();

      // Test connection
      await this.client.$connect();
      this.isConnected = true;

      // Optimize connection settings
      await this.optimizeConnection();

      logInfo('Optimized database client initialized');
      return true;

    } catch (error) {
      logError('Failed to initialize database client', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Build optimized database URL with connection pooling parameters
   */
  buildDatabaseUrl() {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) return baseUrl;

    // Parse existing URL
    const url = new URL(baseUrl);

    // Add connection pool parameters
    const poolParams = {
      'connection_limit': '20',           // Max connections
      'pool_timeout': '10',               // Connection timeout in seconds
      'connect_timeout': '10',            // Initial connection timeout
      'pool_max_idle_time': '300',        // Max idle time (5 minutes)
      'statement_cache_size': '100',      // Prepared statement cache
      'application_name': 'sentia-dashboard'
    };

    // Add parameters to URL
    Object.entries(poolParams).forEach(([key, value]) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  /**
   * Setup event listeners for monitoring and optimization
   */
  setupEventListeners() {
    // Query performance monitoring
    this.client.$on('query', (e) => {
      const duration = e.duration;
      const query = e.query;

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logWarn('Slow query detected', { duration: `${duration}ms`, queryPreview: query.substring(0, 100) + '...' });
      }

      // Track query metrics
      this.recordQueryMetric(query, duration);
    });

    // Error monitoring
    this.client.$on('error', (e) => {
      logError('Database error', e);
    });

    // Warning monitoring
    this.client.$on('warn', (e) => {
      logWarn('Database warning', e);
    });
  }

  /**
   * Optimize connection settings
   */
  async optimizeConnection() {
    try {
      // Set connection-level optimizations
      await this.client.$executeRaw`SET statementtimeout = '30s'`;
      await this.client.$executeRaw`SET idlein_transaction_session_timeout = '10s'`;
      await this.client.$executeRaw`SET workmem = '32MB'`;
      await this.client.$executeRaw`SET effectivecache_size = '256MB'`;
      await this.client.$executeRaw`SET randompage_cost = 1.1`; // SSD optimization

      logInfo('Database connection optimized');
    } catch (error) {
      logWarn('Failed to optimize database connection', { error: error.message });
    }
  }

  /**
   * Execute query with performance monitoring
   */
  async executeQuery(operation, params = {}) {
    const startTime = performance.now();

    try {
      const result = await operation(params);
      const duration = performance.now() - startTime;

      // Record metrics
      this.recordQueryMetric(operation.name || 'unknown', duration);

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logError('Query failed', { duration: `${duration.toFixed(2)}ms`, error });
      throw error;
    }
  }

  /**
   * Optimized transaction wrapper
   */
  async executeTransaction(operations, options = {}) {
    const config = {
      maxWait: options.maxWait || 5000,
      timeout: options.timeout || 10000,
      isolationLevel: options.isolationLevel || 'ReadCommitted',
      ...options
    };

    const startTime = performance.now();

    try {
      const result = await this.client.$transaction(operations, config);
      const duration = performance.now() - startTime;

      logDebug('Transaction completed', { duration: `${duration.toFixed(2)}ms` });
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      logError('Transaction failed', { duration: `${duration.toFixed(2)}ms`, error });
      throw error;
    }
  }

  /**
   * Bulk operations optimization
   */
  async bulkInsert(model, data, batchSize = 100) {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      try {
        const result = await this.client[model].createMany({
          data: batch,
          skipDuplicates: true
        });
        results.push(result);
      } catch (error) {
        logError('Bulk insert batch failed', { model, error });
        throw error;
      }
    }

    return results;
  }

  /**
   * Record query performance metrics
   */
  recordQueryMetric(query, duration) {
    const key = query.substring(0, 50); // First 50 chars as key
    const existing = this.queryMetrics.get(key) || { count: 0, totalTime: 0, avgTime: 0 };

    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;

    this.queryMetrics.set(key, existing);

    // Clean up old metrics (keep only last 1000)
    if (this.queryMetrics.size > 1000) {
      const entries = Array.from(this.queryMetrics.entries());
      const sorted = entries.sort((a, b) => b[1].count - a[1].count);
      this.queryMetrics.clear();
      sorted.slice(0, 500).forEach(([k, v]) => this.queryMetrics.set(k, v));
    }
  }

  /**
   * Get database performance statistics
   */
  async getStats() {
    const stats = {
      connected: this.isConnected,
      queryMetrics: Array.from(this.queryMetrics.entries())
        .map(([query, metrics]) => ({ query, ...metrics }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10), // Top 10 slowest queries
      connectionPool: null
    };

    try {
      // Get connection pool stats if available
      const poolInfo = await this.client.$queryRaw`
        SELECT
          state,
          COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;
      stats.connectionPool = poolInfo;
    } catch (error) {
      logDebug('Could not fetch connection pool stats', { error: error.message });
    }

    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = performance.now();
      await this.client.$queryRaw`SELECT 1`;
      const duration = performance.now() - startTime;

      return {
        healthy: true,
        responseTime: Math.round(duration),
        connected: this.isConnected
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        connected: false
      };
    }
  }

  /**
   * Cleanup connections and shutdown
   */
  async shutdown() {
    try {
      if (this.client) {
        await this.client.$disconnect();
      }
      this.isConnected = false;
      logInfo('Database client disconnected');
    } catch (error) {
      logError('Error during database shutdown', error);
    }
  }

  /**
   * Get the Prisma client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Execute raw SQL with performance monitoring
   */
  async raw(query, params = []) {
    const startTime = performance.now();

    try {
      const result = await this.client.$queryRaw(query, ...params);
      const duration = performance.now() - startTime;

      this.recordQueryMetric(query.toString(), duration);
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      logError('Raw query failed', { duration: `${duration.toFixed(2)}ms`, error });
      throw error;
    }
  }
}

// Export singleton instance
export const optimizedDb = new OptimizedDatabaseClient();

// Export convenience methods
export const executeQuery = (operation, params) => optimizedDb.executeQuery(operation, params);
export const executeTransaction = (operations, options) => optimizedDb.executeTransaction(operations, options);
export const bulkInsert = (model, data, batchSize) => optimizedDb.bulkInsert(model, data, batchSize);

export default OptimizedDatabaseClient;