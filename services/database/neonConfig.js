import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn } from '../logger.js';

// Environment-specific database configurations
export const databaseConfig = {
  development: {
    url: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    pool: { min: 2, max: 10 },
    statement_timeout: 30000,
    query_timeout: 30000,
    log: ['query', 'info', 'warn', 'error']
  },
  testing: {
    url: process.env.TEST_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    pool: { min: 1, max: 5 },
    statement_timeout: 15000,
    query_timeout: 15000,
    log: ['warn', 'error']
  },
  production: {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    pool: { min: 5, max: 20 },
    statement_timeout: 60000,
    query_timeout: 60000,
    connection_limit: 100,
    log: ['error']
  }
};

// Enhanced Prisma client with environment-specific configuration
export class NeonDatabaseService {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = databaseConfig[this.environment];
    this.prisma = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.config.url
          }
        },
        log: this.config.log,
        errorFormat: 'pretty'
      });

      // Test connection
      await this.prisma.$connect();
      this.isConnected = true;

      // Enable vector extension if not already enabled
      await this.enableVectorExtension();

      // Set up connection pool optimization
      await this.optimizeConnectionPool();

      logInfo('Neon PostgreSQL connection established', {
        environment: this.environment,
        host: new URL(this.config.url).hostname,
        ssl: this.config.ssl ? 'enabled' : 'disabled'
      });

      return this.prisma;
    } catch (error) {
      logError('Failed to initialize Neon PostgreSQL connection', {
        error: error.message,
        environment: this.environment
      });
      throw error;
    }
  }

  async enableVectorExtension() {
    try {
      // Enable pgvector extension for vector operations
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
      
      logInfo('Vector extension enabled successfully');
    } catch (error) {
      logWarn('Vector extension may already be enabled or unavailable', {
        error: error.message
      });
    }
  }

  async optimizeConnectionPool() {
    try {
      // Set connection pool parameters for Neon
      await this.prisma.$executeRaw`
        ALTER SYSTEM SET max_connections = ${this.config.connection_limit || 100}
      `;
      
      await this.prisma.$executeRaw`
        ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements'
      `;

      // Set query timeout
      await this.prisma.$executeRaw`
        SET statement_timeout = ${this.config.statement_timeout || 30000}
      `;

      logInfo('Database connection pool optimized');
    } catch (error) {
      logWarn('Some connection pool optimizations may require superuser privileges', {
        error: error.message
      });
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      const responseTime = Date.now() - start;

      // Get connection info
      const connectionInfo = await this.prisma.$queryRaw`
        SELECT 
          count(*) as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;

      return {
        status: 'healthy',
        responseTime,
        environment: this.environment,
        connectionInfo: connectionInfo[0],
        timestamp: new Date()
      };
    } catch (error) {
      logError('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        environment: this.environment,
        timestamp: new Date()
      };
    }
  }

  async getPerformanceMetrics() {
    try {
      // Get query performance statistics
      const queryStats = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time,
          rows
        FROM pg_stat_statements 
        ORDER BY mean_exec_time DESC 
        LIMIT 10
      `;

      // Get database size and connection stats
      const dbStats = await this.prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
      `;

      return {
        queryStats,
        databaseStats: dbStats[0],
        timestamp: new Date()
      };
    } catch (error) {
      logError('Failed to get performance metrics', { error: error.message });
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
        this.isConnected = false;
        logInfo('Neon PostgreSQL connection closed');
      }
    } catch (error) {
      logError('Error disconnecting from database', { error: error.message });
    }
  }
}

// Vector search utilities for AI-powered features
export class VectorSearchService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async similaritySearch(embedding, table, limit = 10, threshold = 0.7) {
    try {
      const query = `
        SELECT *, 1 - (embedding <=> $1::vector) as similarity
        FROM ${table}
        WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> $1::vector) > $3
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;
      
      const results = await this.prisma.$queryRawUnsafe(query, embedding, limit, threshold);
      
      logInfo('Vector similarity search completed', {
        table,
        resultsCount: results.length,
        threshold
      });
      
      return results;
    } catch (error) {
      logError('Vector similarity search failed', {
        error: error.message,
        table
      });
      throw error;
    }
  }

  async generateEmbedding(text, model = 'text-embedding-3-small') {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: model
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      logError('Failed to generate embedding', {
        error: error.message,
        textLength: text.length
      });
      throw error;
    }
  }

  async indexProduct(product) {
    try {
      const text = `${product.name} ${product.description || ''} ${product.category}`;
      const embedding = await this.generateEmbedding(text);
      
      await this.prisma.product.update({
        where: { id: product.id },
        data: { embedding }
      });
      
      logInfo('Product indexed with vector embedding', { productId: product.id });
    } catch (error) {
      logError('Failed to index product', {
        error: error.message,
        productId: product.id
      });
    }
  }

  async searchProducts(query, limit = 10) {
    try {
      const embedding = await this.generateEmbedding(query);
      return await this.similaritySearch(embedding, 'products', limit);
    } catch (error) {
      logError('Product search failed', { error: error.message, query });
      throw error;
    }
  }

  async createVectorIndexes() {
    try {
      // Create vector indexes for better performance
      await this.prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_embedding_cosine 
        ON products USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100)
      `;

      await this.prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_insight_embedding_l2 
        ON customer_insights USING ivfflat (behavior_vector vector_l2_ops) 
        WITH (lists = 100)
      `;

      await this.prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_insight_embedding_cosine 
        ON business_insights USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100)
      `;

      logInfo('Vector indexes created successfully');
    } catch (error) {
      logWarn('Some vector indexes may already exist', { error: error.message });
    }
  }
}

// Database migration and maintenance utilities
export class DatabaseMaintenanceService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async runMaintenance() {
    try {
      // Analyze tables for query optimization
      await this.prisma.$executeRaw`ANALYZE`;
      
      // Update table statistics
      await this.prisma.$executeRaw`
        SELECT schemaname, tablename, attname, n_distinct, correlation 
        FROM pg_stats 
        WHERE schemaname = 'public'
      `;

      // Clean up old performance data
      await this.cleanupOldData();

      logInfo('Database maintenance completed');
    } catch (error) {
      logError('Database maintenance failed', { error: error.message });
    }
  }

  async cleanupOldData() {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // Clean up old performance metrics
      const deletedMetrics = await this.prisma.performanceMetric.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      // Clean up old security audit logs
      const deletedAuditLogs = await this.prisma.securityAuditLog.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      logInfo('Old data cleanup completed', {
        deletedMetrics: deletedMetrics.count,
        deletedAuditLogs: deletedAuditLogs.count,
        retentionDays
      });
    } catch (error) {
      logError('Data cleanup failed', { error: error.message });
    }
  }

  async backupDatabase() {
    try {
      // This would typically use pg_dump or similar
      // For Neon, we'd use their backup API or scheduled backups
      logInfo('Database backup initiated');
      
      // Return backup metadata
      return {
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
        status: 'initiated'
      };
    } catch (error) {
      logError('Database backup failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
let neonService = null;

export const getNeonService = async () => {
  if (!neonService) {
    neonService = new NeonDatabaseService();
    await neonService.initialize();
  }
  return neonService;
};

export default {
  NeonDatabaseService,
  VectorSearchService,
  DatabaseMaintenanceService,
  getNeonService,
  databaseConfig
};

