// Query Optimizer Service
// Provides intelligent query optimization, batching, and performance monitoring

import prismaEnhanced from '../../lib/prisma-enhanced.js';
import redisCache from '../cache/redis-cache.js';

class QueryOptimizer {
  constructor() {
    this.batchQueue = new Map();
    this.batchTimeout = null;
    this.metrics = {
      totalQueries: 0,
      optimizedQueries: 0,
      batchedQueries: 0,
      savedTime: 0,
      queryPatterns: new Map()
    };
  }

  // Analyze and optimize query patterns
  analyzeQuery(model, operation, args) {
    const pattern = `${model}.${operation}`;
    const patternData = this.metrics.queryPatterns.get(pattern) || {
      count: 0,
      avgTime: 0,
      suggestions: []
    };

    patternData.count++;
    this.metrics.queryPatterns.set(pattern, patternData);

    // Generate optimization suggestions
    const suggestions = [];

    // Check for N+1 queries
    if (operation === 'findUnique' && patternData.count > 10) {
      suggestions.push({
        type: 'N+1',
        message: 'Consider using findMany with includes instead of multiple findUnique calls',
        impact: 'high'
      });
    }

    // Check for missing indexes
    if (args?.where && Object.keys(args.where).length > 2) {
      suggestions.push({
        type: 'INDEX',
        message: 'Consider adding composite index for frequently queried fields',
        fields: Object.keys(args.where),
        impact: 'medium'
      });
    }

    // Check for over-fetching
    if (!args?.select && !args?.include) {
      suggestions.push({
        type: 'OVERFETCH',
        message: 'Consider using select to fetch only required fields',
        impact: 'low'
      });
    }

    patternData.suggestions = suggestions;
    return suggestions;
  }

  // Optimize findMany queries with smart batching
  async batchFindMany(model, ids, options = {}) {
    const batchKey = `${model}:${JSON.stringify(options)}`;

    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, {
        ids: new Set(),
        resolvers: []
      });
    }

    const batch = this.batchQueue.get(batchKey);
    ids.forEach(id => batch.ids.add(id));

    return new Promise((resolve) => {
      batch.resolvers.push(resolve);

      // Execute batch after a short delay to collect more queries
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), 10);
      }
    });
  }

  async executeBatch() {
    const batches = Array.from(this.batchQueue.entries());
    this.batchQueue.clear();
    this.batchTimeout = null;

    for (const [batchKey, batch] of batches) {
      const [model, optionsStr] = batchKey.split(':');
      const options = JSON.parse(optionsStr);
      const ids = Array.from(batch.ids);

      try {
        // Execute single query for all IDs
        const results = await prismaEnhanced[model].findMany({
          where: { id: { in: ids } },
          ...options
        });

        // Create ID map for quick lookup
        const resultMap = new Map(results.map(r => [r.id, r]));

        // Resolve all promises with their respective results
        batch.resolvers.forEach(resolve => {
          const requestedResults = ids.map(id => resultMap.get(id)).filter(Boolean);
          resolve(requestedResults);
        });

        this.metrics.batchedQueries++;
      } catch (error) {
        // Reject all promises on error
        batch.resolvers.forEach(resolve => resolve([]));
        console.error('Batch query error:', error);
      }
    }
  }

  // Optimize complex queries with query planning
  async optimizeComplexQuery(model, query) {
    const { where, include, select, orderBy, take, skip } = query;

    // Analyze query complexity
    const complexity = this.calculateQueryComplexity(query);

    if (complexity > 10) {
      console.warn(`High complexity query detected (score: ${complexity})`);

      // Split into multiple simpler queries if possible
      if (include && Object.keys(include).length > 3) {
        return this.splitComplexQuery(model, query);
      }
    }

    // Optimize pagination
    if (take > 100) {
      return this.optimizePagination(model, query);
    }

    // Use cursor-based pagination for large offsets
    if (skip > 1000) {
      return this.useCursorPagination(model, query);
    }

    return prismaEnhanced[model].findMany(query);
  }

  calculateQueryComplexity(query) {
    let complexity = 1;

    if (query.where) {
      complexity += Object.keys(query.where).length;
    }

    if (query.include) {
      complexity += Object.keys(query.include).length * 2;

      // Check for nested includes
      Object.values(query.include).forEach(inc => {
        if (inc?.include) {
          complexity += Object.keys(inc.include).length * 3;
        }
      });
    }

    if (query.orderBy) {
      complexity += Array.isArray(query.orderBy) ? query.orderBy.length : 1;
    }

    return complexity;
  }

  async splitComplexQuery(model, query) {
    const { include, ...baseQuery } = query;

    // First, get base results
    const baseResults = await prismaEnhanced[model].findMany(baseQuery);

    if (baseResults.length === 0) {
      return baseResults;
    }

    // Then fetch includes separately
    const ids = baseResults.map(r => r.id);
    const includePromises = [];

    for (const [relation, config] of Object.entries(include)) {
      if (config === true || config) {
        includePromises.push(
          this.fetchRelation(model, relation, ids, config)
        );
      }
    }

    const includeResults = await Promise.all(includePromises);

    // Merge results
    return this.mergeQueryResults(baseResults, includeResults);
  }

  async fetchRelation(model, relation, ids, config) {
    // Implementation depends on relation type
    // This is a simplified version
    const relationData = await prismaEnhanced[relation].findMany({
      where: { [`${model.toLowerCase()}Id`]: { in: ids } },
      ...(typeof config === 'object' ? config : {})
    });

    return { relation, data: relationData };
  }

  mergeQueryResults(baseResults, includeResults) {
    const resultMap = new Map(baseResults.map(r => [r.id, { ...r }]));

    includeResults.forEach(({ relation, data }) => {
      data.forEach(item => {
        const parentId = item[`${relation.toLowerCase()}Id`];
        const parent = resultMap.get(parentId);

        if (parent) {
          if (!parent[relation]) {
            parent[relation] = [];
          }
          parent[relation].push(item);
        }
      });
    });

    return Array.from(resultMap.values());
  }

  async optimizePagination(model, query) {
    const { take, ...restQuery } = query;

    // Use smaller chunks for better performance
    const chunkSize = 100;
    const chunks = Math.ceil(take / chunkSize);
    const results = [];

    for (let i = 0; i < chunks; i++) {
      const chunkResults = await prismaEnhanced[model].findMany({
        ...restQuery,
        take: Math.min(chunkSize, take - results.length),
        skip: (restQuery.skip || 0) + i * chunkSize
      });

      results.push(...chunkResults);

      if (chunkResults.length < chunkSize) {
        break;
      }
    }

    return results;
  }

  async useCursorPagination(model, query) {
    const { skip, take, orderBy, ...restQuery } = query;

    // Find the cursor position
    const cursorResult = await prismaEnhanced[model].findMany({
      ...restQuery,
      orderBy,
      take: 1,
      skip: skip - 1
    });

    if (cursorResult.length === 0) {
      return [];
    }

    // Use cursor-based pagination
    return prismaEnhanced[model].findMany({
      ...restQuery,
      orderBy,
      take,
      cursor: { id: cursorResult[0].id },
      skip: 1
    });
  }

  // Prefetch and warm cache for commonly accessed data
  async prefetchCommonData() {
    const prefetchQueries = [
      { model: 'User', query: { where: { isActive: true }, take: 100 } },
      { model: 'Inventory', query: { where: { quantity: { gt: 0 } }, take: 100 } },
      { model: 'Production', query: { where: { status: 'active' }, take: 50 } }
    ];

    const prefetchPromises = prefetchQueries.map(async ({ model, query }) => {
      const cacheKey = `prefetch:${model}`;
      const cached = await redisCache.get(cacheKey);

      if (!cached) {
        // Check if model exists in prismaEnhanced before accessing
        if (!prismaEnhanced[model]) {
          console.warn(`Model ${model} not found in prismaEnhanced, skipping prefetch`);
          return { model, count: 0, skipped: true };
        }

        const data = await prismaEnhanced[model].findMany(query);
        await redisCache.set(cacheKey, data, 300); // 5 minute TTL
        return { model, count: data.length };
      }

      return { model, count: cached.length, cached: true };
    });

    const results = await Promise.all(prefetchPromises);
    console.log('Prefetch complete:', results);
    return results;
  }

  // Get query optimization insights
  getOptimizationInsights() {
    const insights = [];

    // Analyze query patterns
    this.metrics.queryPatterns.forEach((pattern, key) => {
      if (pattern.count > 100 && pattern.suggestions.length > 0) {
        insights.push({
          pattern: key,
          frequency: pattern.count,
          suggestions: pattern.suggestions
        });
      }
    });

    // Calculate optimization metrics
    const optimizationRate = this.metrics.optimizedQueries / this.metrics.totalQueries || 0;
    const batchingRate = this.metrics.batchedQueries / this.metrics.totalQueries || 0;

    return {
      metrics: {
        totalQueries: this.metrics.totalQueries,
        optimizedQueries: this.metrics.optimizedQueries,
        batchedQueries: this.metrics.batchedQueries,
        savedTime: `${Math.round(this.metrics.savedTime / 1000)}s`,
        optimizationRate: `${(optimizationRate * 100).toFixed(1)}%`,
        batchingRate: `${(batchingRate * 100).toFixed(1)}%`
      },
      insights,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for N+1 query patterns
    const n1Patterns = Array.from(this.metrics.queryPatterns.entries())
      .filter(([_, data]) => data.suggestions.some(s => s.type === 'N+1'));

    if (n1Patterns.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        type: 'N+1_QUERIES',
        message: 'Detected N+1 query patterns. Consider using includes or batch loading.',
        affectedPatterns: n1Patterns.map(([pattern]) => pattern)
      });
    }

    // Check for missing indexes
    const indexPatterns = Array.from(this.metrics.queryPatterns.entries())
      .filter(([_, data]) => data.suggestions.some(s => s.type === 'INDEX'));

    if (indexPatterns.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'MISSING_INDEXES',
        message: 'Consider adding database indexes for frequently queried fields.',
        affectedPatterns: indexPatterns.map(([pattern]) => pattern)
      });
    }

    // Check cache hit rate
    const cacheStats = prismaEnhanced.getPerformanceStats();
    if (cacheStats.hitRate < 0.5) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'LOW_CACHE_HIT_RATE',
        message: `Cache hit rate is ${(cacheStats.hitRate * 100).toFixed(1)}%. Consider adjusting cache TTL or prefetching strategy.`
      });
    }

    return recommendations;
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      optimizedQueries: 0,
      batchedQueries: 0,
      savedTime: 0,
      queryPatterns: new Map()
    };
  }
}

// Create singleton instance
const queryOptimizer = new QueryOptimizer();

// Schedule periodic prefetch
setInterval(() => {
  queryOptimizer.prefetchCommonData().catch(console.error);
}, 5 * 60 * 1000); // Every 5 minutes

export { queryOptimizer, QueryOptimizer };
export default queryOptimizer;