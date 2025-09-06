/**
 * Bulletproof Neon Database Connection Layer
 * Handles connection pooling, retries, health checks, and graceful degradation
 */

import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

class NeonDatabaseConnection {
  constructor() {
    this.pools = new Map();
    this.prismaClients = new Map();
    this.connectionStats = new Map();
    this.isWarmingUp = false;
    this.retryConfig = {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2
    };
    
    // Branch-specific connection strings
    this.connectionStrings = {
      production: process.env.DATABASE_URL,
      test: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      development: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL,
      local: process.env.LOCAL_DATABASE_URL || 'postgresql://localhost:5432/sentia'
    };
    
    // Initialize connections on startup
    this.initializeConnections();
  }

  /**
   * Initialize database connections for all environments
   */
  async initializeConnections() {
    const branch = this.getCurrentBranch();
    console.log(`[NeonDB] Initializing connections for branch: ${branch}`);
    
    // Warmup primary connection
    await this.warmupConnection(branch);
    
    // Setup health check interval
    this.startHealthChecks();
  }

  /**
   * Get current branch based on environment
   */
  getCurrentBranch() {
    const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
    const nodeEnv = process.env.NODE_ENV;
    
    if (railwayEnv) return railwayEnv.toLowerCase();
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'test') return 'test';
    return 'development';
  }

  /**
   * Create connection pool with Neon-optimized settings
   */
  createPool(branch) {
    const connectionString = this.connectionStrings[branch];
    
    if (!connectionString) {
      console.error(`[NeonDB] No connection string for branch: ${branch}`);
      return null;
    }

    const poolConfig = {
      connectionString,
      max: 25, // Neon serverless recommended max
      min: 0,  // Allow scale to zero
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      query_timeout: 30000,
      ssl: {
        rejectUnauthorized: true,
        sslmode: 'require'
      },
      // Neon-specific optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      application_name: `sentia-${branch}`
    };

    const pool = new Pool(poolConfig);
    
    // Add event listeners
    pool.on('error', (err) => {
      console.error(`[NeonDB] Pool error for ${branch}:`, err);
      this.handlePoolError(branch, err);
    });

    pool.on('connect', () => {
      this.updateConnectionStats(branch, 'connect');
    });

    pool.on('acquire', () => {
      this.updateConnectionStats(branch, 'acquire');
    });

    pool.on('remove', () => {
      this.updateConnectionStats(branch, 'remove');
    });

    return pool;
  }

  /**
   * Get or create pool with retry logic
   */
  async getPool(branch = null) {
    branch = branch || this.getCurrentBranch();
    
    if (!this.pools.has(branch)) {
      const pool = await this.createPoolWithRetry(branch);
      if (pool) {
        this.pools.set(branch, pool);
      }
    }
    
    return this.pools.get(branch);
  }

  /**
   * Create pool with exponential backoff retry
   */
  async createPoolWithRetry(branch) {
    let retries = 0;
    let delay = this.retryConfig.baseDelay;
    
    while (retries < this.retryConfig.maxRetries) {
      try {
        const pool = this.createPool(branch);
        if (!pool) throw new Error('Failed to create pool');
        
        // Test connection
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        
        console.log(`[NeonDB] Pool created successfully for ${branch}`);
        return pool;
      } catch (error) {
        retries++;
        console.error(`[NeonDB] Pool creation attempt ${retries} failed:`, error.message);
        
        if (retries >= this.retryConfig.maxRetries) {
          console.error(`[NeonDB] Max retries reached for ${branch}`);
          return null;
        }
        
        await this.sleep(delay);
        delay = Math.min(delay * this.retryConfig.backoffFactor, this.retryConfig.maxDelay);
      }
    }
    
    return null;
  }

  /**
   * Get or create Prisma client with retry logic
   */
  async getPrismaClient(branch = null) {
    branch = branch || this.getCurrentBranch();
    
    if (!this.prismaClients.has(branch)) {
      const client = await this.createPrismaWithRetry(branch);
      if (client) {
        this.prismaClients.set(branch, client);
      }
    }
    
    return this.prismaClients.get(branch);
  }

  /**
   * Create Prisma client with retry logic
   */
  async createPrismaWithRetry(branch) {
    const datasourceUrl = this.connectionStrings[branch];
    if (!datasourceUrl) return null;
    
    let retries = 0;
    let delay = this.retryConfig.baseDelay;
    
    while (retries < this.retryConfig.maxRetries) {
      try {
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: datasourceUrl
            }
          },
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        
        // Test connection
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        
        console.log(`[NeonDB] Prisma client created for ${branch}`);
        return prisma;
      } catch (error) {
        retries++;
        console.error(`[NeonDB] Prisma creation attempt ${retries} failed:`, error.message);
        
        if (retries >= this.retryConfig.maxRetries) {
          console.error(`[NeonDB] Max Prisma retries reached for ${branch}`);
          return null;
        }
        
        await this.sleep(delay);
        delay = Math.min(delay * this.retryConfig.backoffFactor, this.retryConfig.maxDelay);
      }
    }
    
    return null;
  }

  /**
   * Execute query with automatic retry and timeout handling
   */
  async executeQuery(query, params = [], options = {}) {
    const branch = options.branch || this.getCurrentBranch();
    const timeout = options.timeout || 30000;
    const retries = options.retries || 3;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const pool = await this.getPool(branch);
        if (!pool) {
          throw new Error('No database connection available');
        }
        
        const client = await pool.connect();
        
        try {
          // Execute query
          const result = await client.query(query, params);
          return { success: true, data: result.rows };
        } finally {
          client.release();
        }
      } catch (error) {
        console.error(`[NeonDB] Query attempt ${attempt} failed:`, error.message);
        
        if (attempt >= retries) {
          // Graceful degradation - return cached or default data
          return this.handleQueryFailure(query, error);
        }
        
        await this.sleep(1000 * attempt);
      }
    }
  }

  /**
   * Handle query failure with graceful degradation
   */
  handleQueryFailure(query, error) {
    console.error('[NeonDB] Query failed, using graceful degradation');
    
    // Return appropriate default data based on query type
    if (query.toLowerCase().includes('select')) {
      return { 
        success: false, 
        data: [], 
        error: error.message,
        degraded: true 
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      degraded: true 
    };
  }

  /**
   * Warmup connection on cold starts
   */
  async warmupConnection(branch = null) {
    branch = branch || this.getCurrentBranch();
    
    if (this.isWarmingUp) return;
    this.isWarmingUp = true;
    
    console.log(`[NeonDB] Warming up connection for ${branch}`);
    
    try {
      // Create pool
      const pool = await this.getPool(branch);
      if (!pool) throw new Error('Failed to create pool during warmup');
      
      // Execute warmup queries
      const warmupQueries = [
        'SELECT 1',
        'SELECT NOW()',
        'SELECT version()',
        "SELECT current_database()"
      ];
      
      for (const query of warmupQueries) {
        await this.executeQuery(query, [], { branch, retries: 1 });
      }
      
      console.log(`[NeonDB] Connection warmup complete for ${branch}`);
    } catch (error) {
      console.error('[NeonDB] Warmup failed:', error.message);
    } finally {
      this.isWarmingUp = false;
    }
  }

  /**
   * Health check for database connections
   */
  async healthCheck(branch = null) {
    branch = branch || this.getCurrentBranch();
    
    const health = {
      branch,
      timestamp: new Date().toISOString(),
      pool: false,
      prisma: false,
      query: false,
      stats: null,
      latency: null
    };
    
    try {
      const startTime = Date.now();
      
      // Check pool
      const pool = await this.getPool(branch);
      health.pool = !!pool;
      
      if (pool) {
        // Check query execution
        const result = await this.executeQuery('SELECT 1 as health', [], { 
          branch, 
          retries: 1,
          timeout: 5000 
        });
        health.query = result.success;
        
        // Get pool stats
        health.stats = {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        };
      }
      
      // Check Prisma
      const prisma = await this.getPrismaClient(branch);
      if (prisma) {
        try {
          await prisma.$queryRaw`SELECT 1`;
          health.prisma = true;
        } catch (e) {
          health.prisma = false;
        }
      }
      
      health.latency = Date.now() - startTime;
      health.healthy = health.pool && health.query;
      
    } catch (error) {
      health.error = error.message;
      health.healthy = false;
    }
    
    return health;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    // Initial health check
    this.healthCheck();
    
    // Periodic health checks every 30 seconds
    setInterval(async () => {
      const health = await this.healthCheck();
      
      if (!health.healthy) {
        console.warn('[NeonDB] Health check failed:', health);
        // Attempt reconnection
        await this.reconnect();
      }
    }, 30000);
  }

  /**
   * Reconnect to database
   */
  async reconnect(branch = null) {
    branch = branch || this.getCurrentBranch();
    
    console.log(`[NeonDB] Attempting reconnection for ${branch}`);
    
    // Close existing connections
    await this.closeConnections(branch);
    
    // Recreate connections
    await this.warmupConnection(branch);
  }

  /**
   * Close connections for a branch
   */
  async closeConnections(branch) {
    // Close pool
    if (this.pools.has(branch)) {
      try {
        await this.pools.get(branch).end();
        this.pools.delete(branch);
      } catch (error) {
        console.error('[NeonDB] Error closing pool:', error.message);
      }
    }
    
    // Disconnect Prisma
    if (this.prismaClients.has(branch)) {
      try {
        await this.prismaClients.get(branch).$disconnect();
        this.prismaClients.delete(branch);
      } catch (error) {
        console.error('[NeonDB] Error disconnecting Prisma:', error.message);
      }
    }
  }

  /**
   * Close all connections
   */
  async closeAll() {
    console.log('[NeonDB] Closing all connections');
    
    for (const branch of this.pools.keys()) {
      await this.closeConnections(branch);
    }
  }

  /**
   * Update connection statistics
   */
  updateConnectionStats(branch, event) {
    if (!this.connectionStats.has(branch)) {
      this.connectionStats.set(branch, {
        connects: 0,
        acquires: 0,
        removes: 0,
        errors: 0
      });
    }
    
    const stats = this.connectionStats.get(branch);
    
    switch (event) {
      case 'connect':
        stats.connects++;
        break;
      case 'acquire':
        stats.acquires++;
        break;
      case 'remove':
        stats.removes++;
        break;
      case 'error':
        stats.errors++;
        break;
    }
  }

  /**
   * Handle pool errors
   */
  handlePoolError(branch, error) {
    this.updateConnectionStats(branch, 'error');
    
    // Log error details
    console.error(`[NeonDB] Pool error for ${branch}:`, {
      message: error.message,
      code: error.code,
      severity: error.severity
    });
    
    // Attempt reconnection after delay
    setTimeout(() => {
      this.reconnect(branch);
    }, 5000);
  }

  /**
   * Get connection statistics
   */
  getStats(branch = null) {
    if (branch) {
      return this.connectionStats.get(branch);
    }
    
    const allStats = {};
    for (const [b, stats] of this.connectionStats.entries()) {
      allStats[b] = stats;
    }
    return allStats;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
const neonDB = new NeonDatabaseConnection();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[NeonDB] Shutting down connections');
  await neonDB.closeAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[NeonDB] Shutting down connections');
  await neonDB.closeAll();
  process.exit(0);
});

export default neonDB;
export { neonDB, NeonDatabaseConnection };