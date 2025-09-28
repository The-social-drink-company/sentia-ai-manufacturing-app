import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logDebug } from '../observability/structuredLogger.js';

/**
 * Database optimization service for query performance improvements
 */
export class DbOptimizationService {
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });
    
    this.queryMetrics = new Map();
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_MS) || 100;
    
    // Set up query logging
    this.setupQueryMonitoring();
  }
  
  setupQueryMonitoring() {
    this.prisma.$on(_'query', _(e) => {
      const duration = e.duration;
      const query = e.query;
      
      // Track query metrics
      if (!this.queryMetrics.has(query)) {
        this.queryMetrics.set(query, {
          count: 0,
          totalTime: 0,
          maxTime: 0,
          avgTime: 0
        });
      }
      
      const metrics = this.queryMetrics.get(query);
      metrics.count++;
      metrics.totalTime += duration;
      metrics.maxTime = Math.max(metrics.maxTime, duration);
      metrics.avgTime = metrics.totalTime / metrics.count;
      
      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logWarn('Slow query detected', {
          query: query.substring(0, 200),
          duration,
          threshold: this.slowQueryThreshold
        });
      }
    });
  }
  
  /**
   * Create optimized indexes for common query patterns
   */
  async createOptimizedIndexes() {
    const indexes = [
      // Composite indexes for frequently queried combinations
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_date_range ON orders(created_at) WHERE status != \'cancelled\'',
      
      // Products indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON products(sku)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON products(category_id, is_active)',
      
      // Inventory indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product ON inventory(product_id, warehouse_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_low_stock ON inventory(product_id) WHERE quantity < reorder_point',
      
      // Financial indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type_date ON transactions(type, transaction_date DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_due ON invoices(due_date) WHERE status != \'paid\'',
      
      // Forecasting indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forecasts_product_date ON forecasts(product_id, forecast_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demand_history ON demand_history(product_id, date DESC)',
      
      // User activity indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user ON audit_logs(user_id, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_entity ON audit_logs(entity_type, entity_id, created_at DESC)',
      
      // Performance indexes for JOINs
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product ON order_items(product_id)',
      
      // Text search indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector(\'english\', name || \' \' || coalesce(description, \'\')))',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector(\'english\', name || \' \' || coalesce(email, \'\')))'
    ];
    
    const results = [];
    
    for (const indexSql of indexes) {
      try {
        await this.prisma.$executeRawUnsafe(indexSql);
        const indexName = indexSql.match(/idx_\w+/)[0];
        logInfo(`Index created: ${indexName}`);
        results.push({ index: indexName, status: 'created' });
      } catch (error) {
        if (error.message.includes('already exists')) {
          const indexName = indexSql.match(/idx_\w+/)[0];
          logDebug(`Index already exists: ${indexName}`);
          results.push({ index: indexName, status: 'exists' });
        } else {
          logError('Failed to create index', error, { sql: indexSql.substring(0, 100) });
          results.push({ index: indexSql.match(/idx_\w+/)[0], status: 'failed', error: error.message });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Analyze table statistics and update if needed
   */
  async analyzeTableStatistics() {
    const tables = [
      'orders', 'order_items', 'products', 'inventory',
      'customers', 'invoices', 'transactions', 'forecasts'
    ];
    
    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(`ANALYZE ${table}`);
        logDebug(`Table statistics updated: ${table}`);
      } catch (error) {
        logError(`Failed to analyze table: ${table}`, error);
      }
    }
  }
  
  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const stats = [];
    
    for (const [query, metrics] of this.queryMetrics.entries()) {
      if (metrics.count > 5 || metrics.maxTime > this.slowQueryThreshold) {
        stats.push({
          query: query.substring(0, 100),
          ...metrics,
          avgTime: Math.round(metrics.avgTime * 100) / 100,
          isSlow: metrics.avgTime > this.slowQueryThreshold
        });
      }
    }
    
    return stats.sort((a, b) => b.avgTime - a.avgTime);
  }
  
  /**
   * Optimize connection pool settings
   */
  async optimizeConnectionPool() {
    // Connection pool is configured in PrismaClient initialization
    // These are recommendations for the connection string
    return {
      recommendations: {
        connection_limit: 10,
        pool_timeout: 10,
        statement_cache_size: 100,
        pgbouncer: true,
        prepare_threshold: 5
      },
      currentSettings: {
        // These would come from the actual connection
        connection_limit: process.env.DATABASE_CONNECTION_LIMIT || 10,
        pool_timeout: process.env.DATABASE_POOL_TIMEOUT || 10
      }
    };
  }
  
  /**
   * Run vacuum to reclaim storage and update statistics
   */
  async performMaintenance(options = {}) {
    const { vacuum = true, reindex = false, full = false } = options;
    const results = [];
    
    if (vacuum) {
      try {
        const vacuumCmd = full ? 'VACUUM FULL ANALYZE' : 'VACUUM ANALYZE';
        await this.prisma.$executeRawUnsafe(vacuumCmd);
        logInfo('Database vacuum completed');
        results.push({ operation: 'vacuum', status: 'completed' });
      } catch (error) {
        logError('Vacuum failed', error);
        results.push({ operation: 'vacuum', status: 'failed', error: error.message });
      }
    }
    
    if (reindex) {
      const tables = ['orders', 'products', 'inventory'];
      for (const table of tables) {
        try {
          await this.prisma.$executeRawUnsafe(`REINDEX TABLE ${table}`);
          logInfo(`Table reindexed: ${table}`);
          results.push({ operation: `reindex_${table}`, status: 'completed' });
        } catch (error) {
          logError(`Reindex failed for ${table}`, error);
          results.push({ operation: `reindex_${table}`, status: 'failed', error: error.message });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics() {
    try {
      // Get table sizes
      const tableSizes = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;
      
      // Get index usage statistics
      const indexStats = await this.prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE idx_scan > 0
        ORDER BY idx_scan DESC
        LIMIT 20
      `;
      
      // Get cache hit ratio
      const cacheStats = await this.prisma.$queryRaw`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
        FROM pg_statio_user_tables
      `;
      
      return {
        tableSizes,
        indexStats,
        cacheHitRatio: cacheStats[0]?.cache_hit_ratio || 0,
        queryMetrics: this.getQueryStats()
      };
    } catch (error) {
      logError('Failed to get database metrics', error);
      return null;
    }
  }
  
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Create singleton instance
export const dbOptimizationService = new DbOptimizationService();

export default {
  DbOptimizationService,
  dbOptimizationService
};