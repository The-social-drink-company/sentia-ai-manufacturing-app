import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


/**
 * Enterprise Database Query Optimizer
 * 
 * Provides intelligent query optimization, performance monitoring,
 * and automatic index management for Neon PostgreSQL.
 */
export class DatabaseQueryOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      monitoring: {
        enabled: config.monitoring?.enabled || true,
        slowQueryThreshold: config.monitoring?.slowQueryThreshold || 1000, // 1 second
        sampleRate: config.monitoring?.sampleRate || 0.1, // 10% sampling
        maxQueryHistory: config.monitoring?.maxQueryHistory || 10000
      },
      optimization: {
        autoIndexing: config.optimization?.autoIndexing || true,
        queryRewriting: config.optimization?.queryRewriting || true,
        connectionPooling: config.optimization?.connectionPooling || true,
        preparedStatements: config.optimization?.preparedStatements || true
      },
      indexing: {
        autoCreateThreshold: config.indexing?.autoCreateThreshold || 100, // queries per hour
        maxIndexesPerTable: config.indexing?.maxIndexesPerTable || 10,
        indexMaintenanceInterval: config.indexing?.indexMaintenanceInterval || 3600000 // 1 hour
      }
    };

    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
      ]
    });

    // Query performance tracking
    this.queryStats = new Map();
    this.slowQueries = [];
    this.queryHistory = [];
    this.indexSuggestions = new Map();
    
    // Performance metrics
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      indexUsage: new Map(),
      connectionPoolStats: {
        active: 0,
        idle: 0,
        waiting: 0
      }
    };

    this.initializeMonitoring();
    this.startIndexMaintenance();
  }

  /**
   * Initialize query monitoring and logging
   */
  initializeMonitoring() {
    if (!this.config.monitoring.enabled) return;

    // Monitor query events
    this.prisma.$on('query', (event) => {
      this.handleQueryEvent(event);
    });

    this.prisma.$on('error', (event) => {
      this.handleErrorEvent(event);
    });

    // Start periodic metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute
  }

  /**
   * Handle query execution events
   */
  handleQueryEvent(event) {
    const { query, params, duration, target } = event;
    
    // Sample queries based on configuration
    if (Math.random() > this.config.monitoring.sampleRate) {
      return;
    }

    const queryInfo = {
      query: this.sanitizeQuery(query),
      params: params ? JSON.stringify(params) : null,
      duration,
      target,
      timestamp: new Date(),
      hash: this.hashQuery(query)
    };

    // Update query statistics
    this.updateQueryStats(queryInfo);

    // Check for slow queries
    if (duration >= this.config.monitoring.slowQueryThreshold) {
      this.handleSlowQuery(queryInfo);
    }

    // Add to query history
    this.addToQueryHistory(queryInfo);

    // Analyze for optimization opportunities
    this.analyzeQueryForOptimization(queryInfo);

    this.emit('queryExecuted', queryInfo);
  }

  /**
   * Handle database error events
   */
  handleErrorEvent(event) {
    logError('Database error:', event);
    this.emit('databaseError', event);
  }

  /**
   * Update query statistics
   */
  updateQueryStats(queryInfo) {
    const { hash, duration } = queryInfo;
    
    if (!this.queryStats.has(hash)) {
      this.queryStats.set(hash, {
        query: queryInfo.query,
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastExecuted: null
      });
    }

    const stats = this.queryStats.get(hash);
    stats.count++;
    stats.totalDuration += duration;
    stats.averageDuration = stats.totalDuration / stats.count;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.lastExecuted = queryInfo.timestamp;

    this.metrics.totalQueries++;
  }

  /**
   * Handle slow query detection
   */
  handleSlowQuery(queryInfo) {
    this.slowQueries.push(queryInfo);
    this.metrics.slowQueries++;

    // Keep only recent slow queries
    if (this.slowQueries.length > 1000) {
      this.slowQueries = this.slowQueries.slice(-1000);
    }

    // Generate optimization suggestions
    this.generateOptimizationSuggestions(queryInfo);

    this.emit('slowQuery', queryInfo);
    
    logWarn(`Slow query detected (${queryInfo.duration}ms):`, queryInfo.query);
  }

  /**
   * Add query to history for analysis
   */
  addToQueryHistory(queryInfo) {
    this.queryHistory.push(queryInfo);

    // Maintain history size limit
    if (this.queryHistory.length > this.config.monitoring.maxQueryHistory) {
      this.queryHistory = this.queryHistory.slice(-this.config.monitoring.maxQueryHistory);
    }
  }

  /**
   * Analyze query for optimization opportunities
   */
  analyzeQueryForOptimization(queryInfo) {
    const { query, duration } = queryInfo;
    
    // Check for missing indexes
    if (this.shouldSuggestIndex(query, duration)) {
      this.suggestIndex(query);
    }

    // Check for inefficient patterns
    this.checkForInefficiencies(query, duration);
  }

  /**
   * Check if an index should be suggested
   */
  shouldSuggestIndex(query, duration) {
    // Suggest index for slow queries with WHERE clauses
    return duration > this.config.monitoring.slowQueryThreshold && 
           (query.includes('WHERE') || query.includes('JOIN') || query.includes('ORDER BY'));
  }

  /**
   * Suggest index creation for query optimization
   */
  async suggestIndex(query) {
    try {
      // Parse query to identify potential index columns
      const suggestions = this.parseQueryForIndexSuggestions(query);
      
      for (const suggestion of suggestions) {
        const key = `${suggestion.table}_${suggestion.columns.join('_')}`;
        
        if (!this.indexSuggestions.has(key)) {
          this.indexSuggestions.set(key, {
            ...suggestion,
            frequency: 1,
            firstSeen: new Date(),
            lastSeen: new Date()
          });
        } else {
          const existing = this.indexSuggestions.get(key);
          existing.frequency++;
          existing.lastSeen = new Date();
        }

        // Auto-create index if threshold is met
        if (this.config.optimization.autoIndexing) {
          await this.considerAutoIndexCreation(key, this.indexSuggestions.get(key));
        }
      }
    } catch (error) {
      logError('Error suggesting index:', error);
    }
  }

  /**
   * Parse query to identify index suggestions
   */
  parseQueryForIndexSuggestions(query) {
    const suggestions = [];
    const normalizedQuery = query.toLowerCase();

    // Simple pattern matching for common scenarios
    // In a real implementation, you'd use a proper SQL parser

    // WHERE clause patterns
    const whereMatches = normalizedQuery.match(/where\s+(\w+)\.(\w+)\s*[=<>]/g);
    if (whereMatches) {
      whereMatches.forEach(match => {
        const parts = match.match(/(\w+)\.(\w+)/);
        if (parts) {
          suggestions.push({
            table: parts[1],
            columns: [parts[2]],
            type: 'btree',
            reason: 'WHERE clause filter'
          });
        }
      });
    }

    // JOIN patterns
    const joinMatches = normalizedQuery.match(/join\s+(\w+)\s+on\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/g);
    if (joinMatches) {
      joinMatches.forEach(match => {
        const parts = match.match(/join\s+(\w+)\s+on\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/);
        if (parts) {
          suggestions.push({
            table: parts[1],
            columns: [parts[2]],
            type: 'btree',
            reason: 'JOIN condition'
          });
        }
      });
    }

    // ORDER BY patterns
    const orderMatches = normalizedQuery.match(/order\s+by\s+(\w+)\.(\w+)/g);
    if (orderMatches) {
      orderMatches.forEach(match => {
        const parts = match.match(/(\w+)\.(\w+)/);
        if (parts) {
          suggestions.push({
            table: parts[1],
            columns: [parts[2]],
            type: 'btree',
            reason: 'ORDER BY clause'
          });
        }
      });
    }

    return suggestions;
  }

  /**
   * Consider automatic index creation
   */
  async considerAutoIndexCreation(key, suggestion) {
    // Check if suggestion meets threshold for auto-creation
    if (suggestion.frequency >= this.config.indexing.autoCreateThreshold) {
      try {
        await this.createIndex(suggestion);
        this.indexSuggestions.delete(key); // Remove after creation
        
        this.emit('indexCreated', suggestion);
        logDebug(`Auto-created index on ${suggestion.table}(${suggestion.columns.join(', ')})`);
      } catch (error) {
        logError('Failed to auto-create index:', error);
      }
    }
  }

  /**
   * Create database index
   */
  async createIndex(suggestion) {
    const { table, columns, type = 'btree' } = suggestion;
    const indexName = `idx_${table}_${columns.join('_')}_auto`;
    
    // Check if index already exists
    const existingIndexes = await this.getTableIndexes(table);
    if (existingIndexes.some(idx => idx.name === indexName)) {
      return; // Index already exists
    }

    // Check index limit per table
    if (existingIndexes.length >= this.config.indexing.maxIndexesPerTable) {
      logWarn(`Index limit reached for table ${table}`);
      return;
    }

    const columnList = columns.join(', ');
    const createIndexSQL = `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName} ON ${table} USING ${type} (${columnList})`;
    
    await this.prisma.$executeRawUnsafe(createIndexSQL);
  }

  /**
   * Get existing indexes for a table
   */
  async getTableIndexes(tableName) {
    try {
      const result = await this.prisma.$queryRawUnsafe(`
        SELECT 
          indexname as name,
          indexdef as definition
        FROM pg_indexes 
        WHERE tablename = $1
      `, tableName);
      
      return result;
    } catch (error) {
      logError('Error fetching table indexes:', error);
      return [];
    }
  }

  /**
   * Check for query inefficiencies
   */
  checkForInefficiencies(query, duration) {
    const inefficiencies = [];
    const normalizedQuery = query.toLowerCase();

    // Check for SELECT *
    if (normalizedQuery.includes('select *')) {
      inefficiencies.push({
        type: 'select_star',
        message: 'Avoid SELECT * - specify only needed columns',
        severity: 'medium'
      });
    }

    // Check for missing LIMIT on potentially large result sets
    if (normalizedQuery.includes('select') && !normalizedQuery.includes('limit') && 
        !normalizedQuery.includes('count(')) {
      inefficiencies.push({
        type: 'missing_limit',
        message: 'Consider adding LIMIT clause for large result sets',
        severity: 'low'
      });
    }

    // Check for N+1 query patterns
    if (duration < 50 && this.detectNPlusOnePattern(query)) {
      inefficiencies.push({
        type: 'n_plus_one',
        message: 'Potential N+1 query pattern detected',
        severity: 'high'
      });
    }

    // Check for inefficient JOINs
    if (normalizedQuery.includes('join') && duration > 500) {
      inefficiencies.push({
        type: 'slow_join',
        message: 'Slow JOIN detected - consider indexing join columns',
        severity: 'high'
      });
    }

    if (inefficiencies.length > 0) {
      this.emit('queryInefficiency', { query, inefficiencies, duration });
    }
  }

  /**
   * Detect N+1 query patterns
   */
  detectNPlusOnePattern(query) {
    // Simple heuristic: multiple similar queries in short time window
    const recentQueries = this.queryHistory.slice(-50);
    const similarQueries = recentQueries.filter(q => 
      this.calculateQuerySimilarity(q.query, query) > 0.8
    );
    
    return similarQueries.length > 5;
  }

  /**
   * Calculate similarity between two queries
   */
  calculateQuerySimilarity(query1, query2) {
    // Simple similarity based on structure (ignoring parameter values)
    const normalize = (q) => q.replace(/\$\d+/g, '?').replace(/\d+/g, 'N');
    const norm1 = normalize(query1);
    const norm2 = normalize(query2);
    
    if (norm1 === norm2) return 1.0;
    
    // Levenshtein distance approximation
    const maxLen = Math.max(norm1.length, norm2.length);
    const distance = this.levenshteinDistance(norm1, norm2);
    
    return 1 - (distance / maxLen);
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics() {
    try {
      // Database statistics
      const dbStats = await this.getDatabaseStatistics();
      
      // Connection pool statistics
      const poolStats = await this.getConnectionPoolStats();
      
      // Index usage statistics
      const indexStats = await this.getIndexUsageStats();
      
      // Update metrics
      this.metrics = {
        ...this.metrics,
        ...dbStats,
        connectionPoolStats: poolStats,
        indexUsage: indexStats,
        timestamp: new Date()
      };

      this.emit('metricsCollected', this.metrics);
    } catch (error) {
      logError('Error collecting metrics:', error);
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStatistics() {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
          (SELECT sum(calls) FROM pg_stat_statements) as total_queries,
          (SELECT avg(mean_exec_time) FROM pg_stat_statements) as avg_query_time
      `;
      
      return stats[0] || {};
    } catch (error) {
      logError('Error getting database statistics:', error);
      return {};
    }
  }

  /**
   * Get connection pool statistics
   */
  async getConnectionPoolStats() {
    // This would integrate with your connection pool implementation
    // For now, return mock data
    return {
      active: Math.floor(Math.random() * 10),
      idle: Math.floor(Math.random() * 5),
      waiting: Math.floor(Math.random() * 3)
    };
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats() {
    try {
      const indexStats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read DESC
        LIMIT 20
      `;
      
      const statsMap = new Map();
      indexStats.forEach(stat => {
        statsMap.set(stat.indexname, {
          table: stat.tablename,
          reads: stat.idx_tup_read,
          fetches: stat.idx_tup_fetch
        });
      });
      
      return statsMap;
    } catch (error) {
      logError('Error getting index statistics:', error);
      return new Map();
    }
  }

  /**
   * Start index maintenance tasks
   */
  startIndexMaintenance() {
    setInterval(async () => {
      await this.performIndexMaintenance();
    }, this.config.indexing.indexMaintenanceInterval);
  }

  /**
   * Perform index maintenance
   */
  async performIndexMaintenance() {
    try {
      // Analyze table statistics
      await this.updateTableStatistics();
      
      // Check for unused indexes
      await this.identifyUnusedIndexes();
      
      // Reindex if necessary
      await this.performReindexing();
      
      this.emit('indexMaintenanceCompleted');
    } catch (error) {
      logError('Index maintenance error:', error);
      this.emit('indexMaintenanceError', error);
    }
  }

  /**
   * Update table statistics
   */
  async updateTableStatistics() {
    try {
      await this.prisma.$executeRaw`ANALYZE`;
      logDebug('Table statistics updated');
    } catch (error) {
      logError('Error updating table statistics:', error);
    }
  }

  /**
   * Identify unused indexes
   */
  async identifyUnusedIndexes() {
    try {
      const unusedIndexes = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
        AND indexname NOT LIKE '%_pkey'
      `;
      
      if (unusedIndexes.length > 0) {
        this.emit('unusedIndexesFound', unusedIndexes);
        logDebug(`Found ${unusedIndexes.length} unused indexes`);
      }
    } catch (error) {
      logError('Error identifying unused indexes:', error);
    }
  }

  /**
   * Perform reindexing for fragmented indexes
   */
  async performReindexing() {
    try {
      // This is a simplified version - in production, you'd want more sophisticated logic
      const fragmentedIndexes = await this.identifyFragmentedIndexes();
      
      for (const index of fragmentedIndexes) {
        await this.prisma.$executeRawUnsafe(`REINDEX INDEX CONCURRENTLY ${index.indexname}`);
        logDebug(`Reindexed ${index.indexname}`);
      }
    } catch (error) {
      logError('Error performing reindexing:', error);
    }
  }

  /**
   * Identify fragmented indexes
   */
  async identifyFragmentedIndexes() {
    // Simplified fragmentation detection
    // In production, you'd use more sophisticated metrics
    return [];
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  sanitizeQuery(query) {
    // Remove potential sensitive data patterns
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
      .replace(/token\s*=\s*'[^']*'/gi, "token = '[REDACTED]'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret = '[REDACTED]'");
  }

  /**
   * Generate hash for query identification
   */
  hashQuery(query) {
    // Simple hash function for query identification
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get optimization report
   */
  getOptimizationReport() {
    const topSlowQueries = this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const topFrequentQueries = Array.from(this.queryStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const pendingIndexSuggestions = Array.from(this.indexSuggestions.entries())
      .map(([key, suggestion]) => ({ key, ...suggestion }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: this.metrics.totalQueries,
        slowQueries: this.metrics.slowQueries,
        averageResponseTime: this.calculateAverageResponseTime(),
        indexSuggestions: pendingIndexSuggestions.length
      },
      topSlowQueries,
      topFrequentQueries,
      indexSuggestions: pendingIndexSuggestions,
      metrics: this.metrics
    };
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    if (this.queryHistory.length === 0) return 0;
    
    const totalDuration = this.queryHistory.reduce((sum, query) => sum + query.duration, 0);
    return totalDuration / this.queryHistory.length;
  }

  /**
   * Get health status
   */
  async getHealth() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        metrics: {
          totalQueries: this.metrics.totalQueries,
          slowQueries: this.metrics.slowQueries,
          averageResponseTime: this.calculateAverageResponseTime()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default DatabaseQueryOptimizer;

