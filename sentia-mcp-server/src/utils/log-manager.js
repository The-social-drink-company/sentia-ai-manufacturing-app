/**
 * Centralized Log Management System
 * 
 * Provides comprehensive log aggregation, retention, search, and analysis
 * capabilities for the Sentia Manufacturing MCP Server.
 * 
 * Features:
 * - Log aggregation from multiple sources
 * - Retention policy enforcement
 * - Log search and filtering
 * - Compliance logging
 * - Analysis and insights
 */

import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createLogger } from './logger.js';
import { SERVER_CONFIG } from '../config/server-config.js';

const logger = createLogger();

/**
 * Centralized Log Manager
 */
export class LogManager {
  constructor(config = {}) {
    this.config = {
      logDirectory: config.logDirectory || SERVER_CONFIG.logging.file.directory || 'logs',
      retentionDays: config.retentionDays || SERVER_CONFIG.security.audit.retention.days || 90,
      maxSizeMB: config.maxSizeMB || SERVER_CONFIG.security.audit.retention.maxSizeMB || 1000,
      compressionEnabled: config.compressionEnabled !== false,
      searchIndexEnabled: config.searchIndexEnabled !== false,
      ...config
    };
    
    this.searchIndex = new Map(); // Simple in-memory search index
    this.logSources = new Map(); // Track different log sources
    this.retentionManager = new RetentionManager(this.config);
    this.logAnalyzer = new LogAnalyzer();
    
    this.initialize();
  }

  /**
   * Initialize the log manager
   */
  async initialize() {
    try {
      await this.ensureLogDirectory();
      await this.registerDefaultSources();
      await this.startRetentionProcess();
      
      logger.info('Log Manager initialized successfully', {
        logDirectory: this.config.logDirectory,
        retentionDays: this.config.retentionDays,
        compressionEnabled: this.config.compressionEnabled
      });
    } catch (error) {
      logger.error('Failed to initialize Log Manager', { error });
      throw error;
    }
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Register default log sources
   */
  async registerDefaultSources() {
    // Register standard log files
    const sources = [
      { name: 'application', file: 'combined.log', type: 'application' },
      { name: 'error', file: 'error.log', type: 'error' },
      { name: 'audit', file: 'audit.log', type: 'audit' },
      { name: 'security', file: 'security.log', type: 'security' },
      { name: 'performance', file: 'performance.log', type: 'performance' }
    ];

    for (const source of sources) {
      this.registerLogSource(source.name, {
        filePath: join(this.config.logDirectory, source.file),
        type: source.type,
        enabled: true
      });
    }
  }

  /**
   * Register a log source
   */
  registerLogSource(name, config) {
    this.logSources.set(name, {
      name,
      filePath: config.filePath,
      type: config.type || 'application',
      enabled: config.enabled !== false,
      lastProcessed: null,
      totalLines: 0,
      ...config
    });

    logger.debug('Log source registered', { 
      name, 
      filePath: config.filePath,
      type: config.type 
    });
  }

  /**
   * Aggregate logs from all sources
   */
  async aggregateLogs(options = {}) {
    const {
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endDate = new Date(),
      sources = Array.from(this.logSources.keys()),
      level = null,
      correlationId = null
    } = options;

    const aggregatedLogs = [];

    for (const sourceName of sources) {
      const source = this.logSources.get(sourceName);
      if (!source || !source.enabled) continue;

      try {
        const logs = await this.readLogsFromSource(source, {
          startDate,
          endDate,
          level,
          correlationId
        });
        
        aggregatedLogs.push(...logs.map(log => ({
          ...log,
          source: sourceName,
          sourceType: source.type
        })));
      } catch (error) {
        logger.warn('Failed to read logs from source', { 
          source: sourceName, 
          error: error.message 
        });
      }
    }

    // Sort by timestamp
    aggregatedLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    logger.info('Log aggregation completed', {
      totalLogs: aggregatedLogs.length,
      sources: sources.length,
      timeRange: { startDate, endDate }
    });

    return aggregatedLogs;
  }

  /**
   * Read logs from a specific source
   */
  async readLogsFromSource(source, filters = {}) {
    const logs = [];
    
    try {
      const content = await fs.readFile(source.filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          
          // Apply filters
          if (this.matchesFilters(logEntry, filters)) {
            logs.push(logEntry);
          }
        } catch (parseError) {
          // Handle non-JSON log lines
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
            raw: true
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return logs;
  }

  /**
   * Check if log entry matches filters
   */
  matchesFilters(logEntry, filters) {
    const { startDate, endDate, level, correlationId } = filters;
    const logTime = new Date(logEntry.timestamp);

    // Date range filter
    if (startDate && logTime < startDate) return false;
    if (endDate && logTime > endDate) return false;

    // Level filter
    if (level && logEntry.level !== level) return false;

    // Correlation ID filter
    if (correlationId && logEntry.correlationId !== correlationId) return false;

    return true;
  }

  /**
   * Search logs with advanced filtering
   */
  async searchLogs(query, options = {}) {
    const {
      sources = Array.from(this.logSources.keys()),
      startDate,
      endDate,
      level,
      limit = 1000,
      offset = 0
    } = options;

    logger.info('Log search initiated', { query, options });

    const searchResults = [];
    let totalMatches = 0;

    // Get aggregated logs
    const logs = await this.aggregateLogs({
      sources,
      startDate,
      endDate,
      level
    });

    // Search through logs
    for (const log of logs) {
      if (this.matchesQuery(log, query)) {
        totalMatches++;
        
        if (totalMatches > offset && searchResults.length < limit) {
          searchResults.push({
            ...log,
            score: this.calculateRelevanceScore(log, query)
          });
        }
      }
    }

    // Sort by relevance score
    searchResults.sort((a, b) => b.score - a.score);

    logger.info('Log search completed', {
      query,
      totalMatches,
      returnedResults: searchResults.length,
      sources: sources.length
    });

    return {
      results: searchResults,
      totalMatches,
      query,
      pagination: {
        limit,
        offset,
        hasMore: totalMatches > (offset + limit)
      }
    };
  }

  /**
   * Check if log matches search query
   */
  matchesQuery(log, query) {
    if (!query || query.trim() === '') return true;

    const searchText = JSON.stringify(log).toLowerCase();
    const queryLower = query.toLowerCase();

    // Support for simple phrase search and field-specific search
    if (query.includes(':')) {
      // Field-specific search (e.g., "level:error", "correlationId:abc123")
      const [field, value] = query.split(':', 2);
      const fieldValue = log[field.trim()];
      return fieldValue && fieldValue.toString().toLowerCase().includes(value.trim().toLowerCase());
    }

    // General text search
    return searchText.includes(queryLower);
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevanceScore(log, query) {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Higher score for exact matches in important fields
    if (log.message && log.message.toLowerCase().includes(queryLower)) score += 10;
    if (log.level && log.level.toLowerCase() === queryLower) score += 5;
    if (log.correlationId && log.correlationId.toLowerCase().includes(queryLower)) score += 8;

    // Lower score for matches in other fields
    const otherFields = Object.keys(log).filter(key => 
      !['message', 'level', 'correlationId', 'timestamp'].includes(key)
    );
    
    for (const field of otherFields) {
      const value = log[field];
      if (value && value.toString().toLowerCase().includes(queryLower)) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Generate log analysis and insights
   */
  async generateInsights(options = {}) {
    const {
      timeRange = 24 * 60 * 60 * 1000, // 24 hours
      sources = Array.from(this.logSources.keys())
    } = options;

    const startDate = new Date(Date.now() - timeRange);
    const endDate = new Date();

    const logs = await this.aggregateLogs({ sources, startDate, endDate });
    
    return this.logAnalyzer.analyze(logs, { timeRange, sources });
  }

  /**
   * Start retention process
   */
  async startRetentionProcess() {
    // Run retention cleanup every 24 hours
    setInterval(async () => {
      try {
        await this.retentionManager.cleanup();
      } catch (error) {
        logger.error('Retention cleanup failed', { error });
      }
    }, 24 * 60 * 60 * 1000);

    // Run initial cleanup
    setTimeout(async () => {
      try {
        await this.retentionManager.cleanup();
      } catch (error) {
        logger.error('Initial retention cleanup failed', { error });
      }
    }, 5000); // 5 seconds after startup
  }

  /**
   * Get log manager status
   */
  async getStatus() {
    const sources = Array.from(this.logSources.values()).map(source => ({
      name: source.name,
      type: source.type,
      enabled: source.enabled,
      filePath: source.filePath,
      lastProcessed: source.lastProcessed
    }));

    const directoryStats = await this.getDirectoryStats();

    return {
      config: this.config,
      sources,
      directoryStats,
      searchIndexSize: this.searchIndex.size,
      uptime: process.uptime()
    };
  }

  /**
   * Get log directory statistics
   */
  async getDirectoryStats() {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      let totalSize = 0;
      const fileStats = [];

      for (const file of files) {
        try {
          const filePath = join(this.config.logDirectory, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          fileStats.push({
            name: file,
            size: stats.size,
            modified: stats.mtime,
            isCompressed: file.endsWith('.gz')
          });
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return {
        totalFiles: files.length,
        totalSizeMB: Math.round(totalSize / 1024 / 1024),
        files: fileStats.sort((a, b) => b.modified - a.modified)
      };
    } catch (error) {
      logger.error('Failed to get directory stats', { error });
      return {
        totalFiles: 0,
        totalSizeMB: 0,
        files: [],
        error: error.message
      };
    }
  }
}

/**
 * Log Retention Manager
 */
class RetentionManager {
  constructor(config) {
    this.config = config;
    this.logger = createLogger();
  }

  async cleanup() {
    this.logger.info('Starting log retention cleanup', {
      retentionDays: this.config.retentionDays,
      maxSizeMB: this.config.maxSizeMB
    });

    await this.cleanupByAge();
    await this.cleanupBySize();
    await this.compressOldLogs();

    this.logger.info('Log retention cleanup completed');
  }

  async cleanupByAge() {
    const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
    
    try {
      const files = await fs.readdir(this.config.logDirectory);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = join(this.config.logDirectory, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          this.logger.debug('Deleted old log file', { file, age: stats.mtime });
        }
      }

      if (deletedCount > 0) {
        this.logger.info('Cleaned up old log files', { deletedCount, cutoffDate });
      }
    } catch (error) {
      this.logger.error('Failed to cleanup logs by age', { error });
    }
  }

  async cleanupBySize() {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const fileStats = [];
      let totalSize = 0;

      // Get file stats
      for (const file of files) {
        const filePath = join(this.config.logDirectory, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileStats.push({ file, filePath, size: stats.size, mtime: stats.mtime });
      }

      const totalSizeMB = totalSize / 1024 / 1024;
      
      if (totalSizeMB > this.config.maxSizeMB) {
        // Sort by modification time (oldest first)
        fileStats.sort((a, b) => a.mtime - b.mtime);
        
        let deletedSize = 0;
        let deletedCount = 0;
        
        for (const fileInfo of fileStats) {
          if (totalSizeMB - (deletedSize / 1024 / 1024) <= this.config.maxSizeMB) {
            break;
          }
          
          await fs.unlink(fileInfo.filePath);
          deletedSize += fileInfo.size;
          deletedCount++;
          
          this.logger.debug('Deleted log file for size limit', { 
            file: fileInfo.file, 
            size: fileInfo.size 
          });
        }

        if (deletedCount > 0) {
          this.logger.info('Cleaned up log files for size limit', {
            deletedCount,
            deletedSizeMB: Math.round(deletedSize / 1024 / 1024),
            remainingSizeMB: Math.round((totalSize - deletedSize) / 1024 / 1024)
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup logs by size', { error });
    }
  }

  async compressOldLogs() {
    if (!this.config.compressionEnabled) return;

    const compressionAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoffDate = new Date(Date.now() - compressionAge);

    try {
      const files = await fs.readdir(this.config.logDirectory);
      let compressedCount = 0;

      for (const file of files) {
        if (file.endsWith('.gz')) continue; // Already compressed

        const filePath = join(this.config.logDirectory, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate && stats.size > 1024 * 1024) { // > 1MB
          try {
            await this.compressFile(filePath);
            compressedCount++;
          } catch (error) {
            this.logger.warn('Failed to compress log file', { file, error: error.message });
          }
        }
      }

      if (compressedCount > 0) {
        this.logger.info('Compressed old log files', { compressedCount });
      }
    } catch (error) {
      this.logger.error('Failed to compress old logs', { error });
    }
  }

  async compressFile(filePath) {
    const compressedPath = `${filePath}.gz`;
    
    await pipeline(
      createReadStream(filePath),
      createGzip(),
      createWriteStream(compressedPath)
    );

    // Verify compression was successful
    const originalStats = await fs.stat(filePath);
    const compressedStats = await fs.stat(compressedPath);

    if (compressedStats.size < originalStats.size) {
      await fs.unlink(filePath); // Delete original
      this.logger.debug('File compressed successfully', {
        file: filePath,
        originalSize: originalStats.size,
        compressedSize: compressedStats.size,
        compressionRatio: Math.round((1 - compressedStats.size / originalStats.size) * 100)
      });
    } else {
      await fs.unlink(compressedPath); // Delete failed compression
      throw new Error('Compression did not reduce file size');
    }
  }
}

/**
 * Log Analyzer for generating insights
 */
class LogAnalyzer {
  analyze(logs, context = {}) {
    const insights = {
      summary: this.generateSummary(logs),
      levelDistribution: this.analyzeLevelDistribution(logs),
      timeDistribution: this.analyzeTimeDistribution(logs),
      errorPatterns: this.analyzeErrorPatterns(logs),
      performanceMetrics: this.analyzePerformanceMetrics(logs),
      topSources: this.analyzeTopSources(logs),
      correlationPatterns: this.analyzeCorrelationPatterns(logs),
      anomalies: this.detectAnomalies(logs),
      recommendations: []
    };

    // Generate recommendations based on analysis
    insights.recommendations = this.generateRecommendations(insights);

    return insights;
  }

  generateSummary(logs) {
    return {
      totalLogs: logs.length,
      timeRange: {
        start: logs.length > 0 ? logs[0].timestamp : null,
        end: logs.length > 0 ? logs[logs.length - 1].timestamp : null
      },
      uniqueCorrelationIds: new Set(logs.map(log => log.correlationId).filter(Boolean)).size,
      uniqueSources: new Set(logs.map(log => log.source).filter(Boolean)).size
    };
  }

  analyzeLevelDistribution(logs) {
    const distribution = {};
    logs.forEach(log => {
      distribution[log.level] = (distribution[log.level] || 0) + 1;
    });
    return distribution;
  }

  analyzeTimeDistribution(logs) {
    const hourlyDistribution = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });
    return hourlyDistribution;
  }

  analyzeErrorPatterns(logs) {
    const errorLogs = logs.filter(log => log.level === 'error');
    const patterns = {};

    errorLogs.forEach(log => {
      const errorType = log.error?.name || 'Unknown';
      if (!patterns[errorType]) {
        patterns[errorType] = {
          count: 0,
          examples: [],
          correlationIds: new Set()
        };
      }
      
      patterns[errorType].count++;
      patterns[errorType].correlationIds.add(log.correlationId);
      
      if (patterns[errorType].examples.length < 3) {
        patterns[errorType].examples.push({
          message: log.message,
          timestamp: log.timestamp,
          correlationId: log.correlationId
        });
      }
    });

    // Convert sets to arrays for JSON serialization
    Object.values(patterns).forEach(pattern => {
      pattern.uniqueCorrelations = pattern.correlationIds.size;
      delete pattern.correlationIds;
    });

    return patterns;
  }

  analyzePerformanceMetrics(logs) {
    const performanceLogs = logs.filter(log => log.duration !== undefined);
    
    if (performanceLogs.length === 0) {
      return { message: 'No performance data available' };
    }

    const durations = performanceLogs.map(log => log.duration).sort((a, b) => a - b);
    
    return {
      count: performanceLogs.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      min: durations[0],
      max: durations[durations.length - 1]
    };
  }

  analyzeTopSources(logs) {
    const sourceCount = {};
    logs.forEach(log => {
      if (log.source) {
        sourceCount[log.source] = (sourceCount[log.source] || 0) + 1;
      }
    });

    return Object.entries(sourceCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));
  }

  analyzeCorrelationPatterns(logs) {
    const correlationStats = {};
    
    logs.forEach(log => {
      if (log.correlationId) {
        if (!correlationStats[log.correlationId]) {
          correlationStats[log.correlationId] = {
            count: 0,
            sources: new Set(),
            levels: new Set(),
            duration: null
          };
        }
        
        const stats = correlationStats[log.correlationId];
        stats.count++;
        if (log.source) stats.sources.add(log.source);
        if (log.level) stats.levels.add(log.level);
      }
    });

    const patterns = Object.entries(correlationStats)
      .map(([correlationId, stats]) => ({
        correlationId,
        logCount: stats.count,
        sourceCount: stats.sources.size,
        levelCount: stats.levels.size,
        sources: Array.from(stats.sources),
        levels: Array.from(stats.levels)
      }))
      .sort((a, b) => b.logCount - a.logCount)
      .slice(0, 10);

    return patterns;
  }

  detectAnomalies(logs) {
    const anomalies = [];

    // Detect error spikes
    const errorCount = logs.filter(log => log.level === 'error').length;
    const totalCount = logs.length;
    const errorRate = errorCount / totalCount;

    if (errorRate > 0.1) { // More than 10% errors
      anomalies.push({
        type: 'high_error_rate',
        severity: 'high',
        description: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        value: errorRate,
        threshold: 0.1
      });
    }

    // Detect performance anomalies
    const performanceLogs = logs.filter(log => log.duration !== undefined);
    if (performanceLogs.length > 0) {
      const durations = performanceLogs.map(log => log.duration);
      const average = durations.reduce((a, b) => a + b, 0) / durations.length;
      const slowOperations = durations.filter(d => d > average * 3).length;
      
      if (slowOperations > performanceLogs.length * 0.05) { // More than 5% slow operations
        anomalies.push({
          type: 'performance_degradation',
          severity: 'medium',
          description: `${slowOperations} operations significantly slower than average`,
          value: slowOperations,
          threshold: Math.ceil(performanceLogs.length * 0.05)
        });
      }
    }

    return anomalies;
  }

  generateRecommendations(insights) {
    const recommendations = [];

    // Error rate recommendations
    if (insights.levelDistribution.error > 0) {
      const errorRate = insights.levelDistribution.error / insights.summary.totalLogs;
      if (errorRate > 0.05) {
        recommendations.push({
          type: 'error_reduction',
          priority: 'high',
          description: 'High error rate detected. Review error patterns and implement fixes.',
          action: 'Review top error patterns in the errorPatterns section'
        });
      }
    }

    // Performance recommendations
    if (insights.performanceMetrics.p95 > 5000) { // 5 seconds
      recommendations.push({
        type: 'performance_optimization',
        priority: 'medium',
        description: '95th percentile response time is high. Consider optimization.',
        action: 'Review slow operations and implement caching or optimization'
      });
    }

    // Anomaly recommendations
    insights.anomalies.forEach(anomaly => {
      recommendations.push({
        type: 'anomaly_investigation',
        priority: anomaly.severity,
        description: `Investigate ${anomaly.type}: ${anomaly.description}`,
        action: 'Review logs and system metrics for the detected anomaly'
      });
    });

    return recommendations;
  }
}

// Create singleton instance
export const logManager = new LogManager();

// Export utility functions
export const {
  aggregateLogs,
  searchLogs,
  generateInsights,
  getStatus
} = logManager;