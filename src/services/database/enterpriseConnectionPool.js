// Enterprise Database Connection Pool Manager
// High-performance PostgreSQL connection management with monitoring and optimization

import { Pool } from 'pg';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

class EnterpriseConnectionPool {
  constructor() {
    this.pools = new Map();
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingCount: 0,
      totalQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      slowQueries: []
    };
    this.initialized = false;
  }

  // Initialize connection pools for different databases
  async initialize() {
    if (this.initialized) return;

    try {
      // Primary database pool
      await this.createPool('primary', {
        connectionString: process.env.DATABASE_URL,
        max: 20, // Maximum connections
        min: 2,  // Minimum connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        maxUses: 7500, // Rotate connections after 7500 uses
        allowExitOnIdle: false,
        application_name: 'sentia-manufacturing-main'
      });

      // Read-only replica pool (if available)
      if (process.env.DATABASE_READ_URL) {
        await this.createPool('readonly', {
          connectionString: process.env.DATABASE_READ_URL,
          max: 10,
          min: 1,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          application_name: 'sentia-manufacturing-readonly'
        });
      }

      // Analytics database pool (if available)
      if (process.env.ANALYTICS_DATABASE_URL) {
        await this.createPool('analytics', {
          connectionString: process.env.ANALYTICS_DATABASE_URL,
          max: 5,
          min: 1,
          idleTimeoutMillis: 60000,
          connectionTimeoutMillis: 15000,
          application_name: 'sentia-manufacturing-analytics'
        });
      }

      // Start monitoring
      this.startMonitoring();
      this.initialized = true;

      logInfo('Enterprise database connection pools initialized', {
        pools: Array.from(this.pools.keys()),
        totalMaxConnections: this.getTotalMaxConnections()
      });

    } catch (error) {
      logError('Failed to initialize database connection pools', { error: error.message });
      throw error;
    }
  }

  // Create a specific connection pool
  async createPool(name, config) {
    try {
      const pool = new Pool(config);

      // Connection pool event listeners
      pool.on('connect', (client) => {
        logInfo('Database connection established', { pool: name, totalCount: pool.totalCount });
        this.metrics.totalConnections++;
        client.query('SET statement_timeout = 30000'); // 30 second statement timeout
        client.query('SET idle_in_transaction_session_timeout = 60000'); // 1 minute idle timeout
      });

      pool.on('acquire', (client) => {
        this.metrics.activeConnections++;
      });

      pool.on('release', (client) => {
        this.metrics.activeConnections--;
        this.metrics.idleConnections++;
      });

      pool.on('remove', (client) => {
        logInfo('Database connection removed', { pool: name, totalCount: pool.totalCount });
        this.metrics.totalConnections--;
      });

      pool.on('error', (err, client) => {
        logError('Database pool error', { pool: name, error: err.message });
        this.metrics.failedQueries++;
      });

      // Test the connection
      const testClient = await pool.connect();
      await testClient.query('SELECT NOW()');
      testClient.release();

      this.pools.set(name, pool);
      logInfo('Database connection pool created', { 
        name, 
        maxConnections: config.max,
        minConnections: config.min 
      });

    } catch (error) {
      logError('Failed to create database pool', { name, error: error.message });
      throw error;
    }
  }

  // Get a connection pool by name
  getPool(name = 'primary') {
    const pool = this.pools.get(name);
    if (!pool) {
      logWarn('Requested pool not found, using primary', { requested: name });
      return this.pools.get('primary');
    }
    return pool;
  }

  // Execute query with automatic pool selection and monitoring
  async query(sql, params = [], options = {}) {
    const {
      pool = 'primary',
      timeout = 30000,
      retries = 3,
      readOnly = false
    } = options;

    const startTime = Date.now();
    let attempt = 0;
    let lastError;

    // Auto-select pool based on query type
    let selectedPool = pool;
    if (readOnly && this.pools.has('readonly')) {
      selectedPool = 'readonly';
    }

    while (attempt < retries) {
      try {
        const dbPool = this.getPool(selectedPool);
        const client = await dbPool.connect();

        try {
          // Set statement timeout
          await client.query(`SET statement_timeout = ${timeout}`);
          
          const result = await client.query(sql, params);
          const duration = Date.now() - startTime;

          // Update metrics
          this.metrics.totalQueries++;
          this.updateAverageQueryTime(duration);

          // Log slow queries
          if (duration > 1000) {
            this.metrics.slowQueries.push({
              sql: sql.substring(0, 100) + '...',
              duration,
              timestamp: new Date().toISOString(),
              pool: selectedPool
            });

            // Keep only last 100 slow queries
            if (this.metrics.slowQueries.length > 100) {
              this.metrics.slowQueries = this.metrics.slowQueries.slice(-100);
            }

            logWarn('Slow query detected', {
              duration,
              pool: selectedPool,
              queryPreview: sql.substring(0, 100)
            });
          }

          client.release();
          return result;

        } catch (queryError) {
          client.release();
          throw queryError;
        }

      } catch (error) {
        attempt++;
        lastError = error;
        this.metrics.failedQueries++;

        logWarn('Database query failed', {
          attempt,
          retries,
          pool: selectedPool,
          error: error.message,
          queryPreview: sql.substring(0, 50)
        });

        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    logError('Database query failed after retries', {
      retries,
      pool: selectedPool,
      error: lastError.message,
      queryPreview: sql.substring(0, 100)
    });

    throw lastError;
  }

  // Transaction support with retry logic
  async transaction(callback, options = {}) {
    const { pool = 'primary', timeout = 60000, retries = 2 } = options;
    let attempt = 0;
    let lastError;

    while (attempt < retries) {
      const dbPool = this.getPool(pool);
      const client = await dbPool.connect();

      try {
        await client.query('BEGIN');
        await client.query(`SET statement_timeout = ${timeout}`);
        
        const result = await callback(client);
        
        await client.query('COMMIT');
        client.release();
        
        return result;

      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          logError('Failed to rollback transaction', { error: rollbackError.message });
        }
        
        client.release();
        attempt++;
        lastError = error;

        logWarn('Transaction failed', {
          attempt,
          retries,
          pool,
          error: error.message
        });

        if (attempt < retries && this.isRetriableError(error)) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 200));
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  // Check if error is retriable
  isRetriableError(error) {
    const retriableErrors = [
      'connection closed',
      'connection terminated',
      'connection lost',
      'server closed the connection',
      'timeout',
      'ECONNRESET',
      'ECONNREFUSED'
    ];

    return retriableErrors.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  // Update average query time
  updateAverageQueryTime(duration) {
    if (this.metrics.totalQueries === 1) {
      this.metrics.averageQueryTime = duration;
    } else {
      this.metrics.averageQueryTime = 
        (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + duration) / 
        this.metrics.totalQueries;
    }
  }

  // Get pool statistics
  getStats() {
    const poolStats = {};
    
    for (const [name, pool] of this.pools) {
      poolStats[name] = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
        maxConnections: pool.options.max,
        minConnections: pool.options.min
      };
    }

    return {
      pools: poolStats,
      metrics: { ...this.metrics },
      health: this.getHealthStatus()
    };
  }

  // Health check
  async healthCheck() {
    const results = {};
    
    for (const [name, pool] of this.pools) {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW(), version()');
        client.release();
        
        results[name] = {
          status: 'healthy',
          version: result.rows[0].version,
          timestamp: result.rows[0].now,
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingCount: pool.waitingCount
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingCount: pool.waitingCount
        };
      }
    }

    return results;
  }

  // Get overall health status
  getHealthStatus() {
    let totalIssues = 0;
    let totalPools = this.pools.size;

    for (const [name, pool] of this.pools) {
      // Check for potential issues
      if (pool.waitingCount > 5) totalIssues++; // Too many waiting connections
      if (pool.idleCount === 0 && pool.totalCount >= pool.options.max) totalIssues++; // Pool exhausted
    }

    if (this.metrics.failedQueries > this.metrics.totalQueries * 0.1) totalIssues++; // High error rate
    if (this.metrics.averageQueryTime > 1000) totalIssues++; // Slow queries

    if (totalIssues === 0) return 'healthy';
    if (totalIssues <= totalPools / 2) return 'degraded';
    return 'unhealthy';
  }

  // Get total maximum connections across all pools
  getTotalMaxConnections() {
    let total = 0;
    for (const [name, pool] of this.pools) {
      total += pool.options.max;
    }
    return total;
  }

  // Start monitoring and maintenance
  startMonitoring() {
    // Log statistics every 5 minutes
    setInterval(() => {
      const stats = this.getStats();
      logInfo('Database connection pool stats', stats);
    }, 5 * 60 * 1000);

    // Clean up slow queries every hour
    setInterval(() => {
      if (this.metrics.slowQueries.length > 50) {
        this.metrics.slowQueries = this.metrics.slowQueries.slice(-50);
      }
    }, 60 * 60 * 1000);

    // Health check every minute
    setInterval(async () => {
      try {
        const health = await this.healthCheck();
        const unhealthyPools = Object.entries(health)
          .filter(([name, status]) => status.status !== 'healthy')
          .map(([name]) => name);

        if (unhealthyPools.length > 0) {
          logWarn('Unhealthy database pools detected', { 
            unhealthyPools,
            health 
          });
        }
      } catch (error) {
        logError('Health check failed', { error: error.message });
      }
    }, 60 * 1000);
  }

  // Graceful shutdown
  async shutdown() {
    logInfo('Shutting down database connection pools...');
    
    const shutdownPromises = [];
    for (const [name, pool] of this.pools) {
      shutdownPromises.push(
        pool.end().then(() => {
          logInfo('Database pool closed', { pool: name });
        }).catch(error => {
          logError('Error closing database pool', { pool: name, error: error.message });
        })
      );
    }

    await Promise.all(shutdownPromises);
    this.pools.clear();
    this.initialized = false;
    
    logInfo('Database connection pools shutdown complete');
  }
}

// Singleton instance
const enterpriseConnectionPool = new EnterpriseConnectionPool();

export default enterpriseConnectionPool;