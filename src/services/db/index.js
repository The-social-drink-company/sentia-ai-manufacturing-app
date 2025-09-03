import { PrismaClient } from '@prisma/client';
import logger, { logInfo, logError, logWarn } from '../../../services/logger.js';

class DatabaseService {
  constructor() {
    this.prisma = null;
    this.connected = false;
  }

  /**
   * Initialize database connection with error handling
   */
  async initialize() {
    try {
      this.prisma = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
        errorFormat: 'pretty',
      });

      // Set up logging for Prisma events
      this.prisma.$on('query', (e) => {
        logInfo('Database Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          target: e.target,
        });
      });

      this.prisma.$on('error', (e) => {
        logError('Database Error', {
          target: e.target,
          message: e.message,
        });
      });

      this.prisma.$on('warn', (e) => {
        logWarn('Database Warning', {
          target: e.target,
          message: e.message,
        });
      });

      // Test connection
      await this.prisma.$connect();
      await this.healthCheck();
      
      this.connected = true;
      logInfo('Database connected successfully', {
        provider: 'postgresql',
        environment: process.env.NODE_ENV || 'development',
      });

      return this.prisma;
    } catch (error) {
      logError('Failed to initialize database connection', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Get Prisma client instance
   */
  getClient() {
    if (!this.prisma) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.prisma;
  }

  /**
   * Check if database is connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Perform database health check
   */
  async healthCheck() {
    try {
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      
      // Get basic database info
      const result = await this.prisma.$queryRaw`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as version,
          NOW() as current_time
      `;

      logInfo('Database health check passed', {
        database: result[0].database_name,
        user: result[0].current_user,
        time: result[0].current_time,
      });

      return {
        status: 'healthy',
        database: result[0].database_name,
        user: result[0].current_user,
        version: result[0].version,
        timestamp: result[0].current_time,
      };
    } catch (error) {
      logError('Database health check failed', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `;

      return stats;
    } catch (error) {
      logError('Failed to get database statistics', error);
      throw error;
    }
  }

  /**
   * Execute transaction with retry logic
   */
  async executeTransaction(operations, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.prisma.$transaction(operations);
        
        if (attempt > 1) {
          logInfo(`Transaction succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          logError(`Transaction failed after ${maxRetries} attempts`, error);
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000;
        logWarn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
        this.connected = false;
        logInfo('Database disconnected successfully');
      } catch (error) {
        logError('Error during database disconnect', error);
        throw error;
      }
    }
  }
}

// Create singleton instance
const dbService = new DatabaseService();

export default dbService;
export { DatabaseService };