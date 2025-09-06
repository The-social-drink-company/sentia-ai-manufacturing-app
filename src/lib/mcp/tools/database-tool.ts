import { MCPTool, MCPContext } from '../protocol';
import { logInfo, logError } from '../../logger';

export interface DatabaseQueryParams {
  query: string;
  parameters?: Record<string, any>;
  database?: string;
  timeout?: number;
  limit?: number;
  offset?: number;
}

export interface DatabaseResult {
  rows: any[];
  rowCount: number;
  fields: Array<{
    name: string;
    type: string;
  }>;
  executionTime: number;
  cached: boolean;
}

/**
 * Database Query Tool for MCP
 * Provides secure database access with parameterized queries
 */
export class DatabaseTool implements MCPTool {
  name = 'database';
  description = 'Execute database queries with security and caching';
  version = '1.0.0';
  permissions = ['database:read'];
  
  private cache: Map<string, { result: DatabaseResult; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private allowedTables = new Set([
    'inventory',
    'suppliers',
    'orders',
    'products',
    'manufacturing_jobs',
    'quality_metrics',
    'financial_transactions'
  ]);
  
  private forbiddenKeywords = [
    'DROP',
    'DELETE',
    'TRUNCATE',
    'ALTER',
    'CREATE',
    'INSERT',
    'UPDATE',
    'GRANT',
    'REVOKE'
  ];

  async execute(params: DatabaseQueryParams, context: MCPContext): Promise<DatabaseResult> {
    const startTime = Date.now();
    
    try {
      // Validate query
      this.validateQuery(params.query, context);
      
      // Check cache
      const cacheKey = this.getCacheKey(params);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logInfo('Database query served from cache', { 
          sessionId: context.sessionId,
          cacheKey 
        });
        return cached;
      }

      // Execute query (mock implementation)
      const result = await this.executeQuery(params);
      
      // Cache result for SELECT queries
      if (this.isSelectQuery(params.query)) {
        this.addToCache(cacheKey, result);
      }

      // Log execution
      logInfo('Database query executed', {
        sessionId: context.sessionId,
        executionTime: result.executionTime,
        rowCount: result.rowCount
      });

      return result;

    } catch (error: any) {
      logError('Database query failed', {
        sessionId: context.sessionId,
        error: error.message
      });
      throw error;
    }
  }

  validate(params: any): boolean | string {
    if (!params.query || typeof params.query !== 'string') {
      return 'Query parameter is required and must be a string';
    }

    if (params.limit && (typeof params.limit !== 'number' || params.limit < 0)) {
      return 'Limit must be a positive number';
    }

    if (params.offset && (typeof params.offset !== 'number' || params.offset < 0)) {
      return 'Offset must be a positive number';
    }

    return true;
  }

  private validateQuery(query: string, context: MCPContext): void {
    const upperQuery = query.toUpperCase();
    
    // Check for forbidden operations
    for (const keyword of this.forbiddenKeywords) {
      if (upperQuery.includes(keyword)) {
        // Allow DELETE/UPDATE only for users with write permissions
        if ((keyword === 'DELETE' || keyword === 'UPDATE') && 
            context.securityContext.permissions.includes('database:write')) {
          continue;
        }
        throw new Error(`Forbidden operation: ${keyword}`);
      }
    }

    // Validate table access
    const tableMatches = query.match(/FROM\s+(\w+)/gi);
    if (tableMatches) {
      for (const match of tableMatches) {
        const tableName = match.replace(/FROM\s+/i, '').toLowerCase();
        if (!this.allowedTables.has(tableName)) {
          throw new Error(`Access denied to table: ${tableName}`);
        }
      }
    }

    // Check for SQL injection patterns
    const injectionPatterns = [
      /;\s*DROP/i,
      /;\s*DELETE/i,
      /UNION\s+SELECT/i,
      /OR\s+1\s*=\s*1/i,
      /--$/
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(query)) {
        throw new Error('Potential SQL injection detected');
      }
    }
  }

  private async executeQuery(params: DatabaseQueryParams): Promise<DatabaseResult> {
    // Mock implementation - in production, this would connect to actual database
    const executionTime = Math.random() * 100 + 50;
    
    await new Promise(resolve => setTimeout(resolve, executionTime));

    // Generate mock data based on query
    let rows: any[] = [];
    let fields: Array<{ name: string; type: string }> = [];

    if (params.query.toLowerCase().includes('inventory')) {
      fields = [
        { name: 'product_id', type: 'string' },
        { name: 'product_name', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'unit_cost', type: 'number' },
        { name: 'total_value', type: 'number' }
      ];
      
      rows = Array.from({ length: params.limit || 10 }, (_, i) => ({
        product_id: `PROD-${1000 + i}`,
        product_name: `Product ${i + 1}`,
        quantity: Math.floor(Math.random() * 1000),
        unit_cost: Math.random() * 100,
        total_value: Math.random() * 10000
      }));
    } else if (params.query.toLowerCase().includes('suppliers')) {
      fields = [
        { name: 'supplier_id', type: 'string' },
        { name: 'supplier_name', type: 'string' },
        { name: 'reliability_score', type: 'number' },
        { name: 'lead_time_days', type: 'number' }
      ];
      
      rows = Array.from({ length: params.limit || 5 }, (_, i) => ({
        supplier_id: `SUP-${2000 + i}`,
        supplier_name: `Supplier ${String.fromCharCode(65 + i)}`,
        reliability_score: 0.8 + Math.random() * 0.2,
        lead_time_days: Math.floor(Math.random() * 30) + 7
      }));
    } else {
      // Generic result
      fields = [
        { name: 'id', type: 'number' },
        { name: 'value', type: 'string' }
      ];
      
      rows = Array.from({ length: params.limit || 5 }, (_, i) => ({
        id: i + 1,
        value: `Row ${i + 1}`
      }));
    }

    // Apply offset if specified
    if (params.offset) {
      rows = rows.slice(params.offset);
    }

    return {
      rows,
      rowCount: rows.length,
      fields,
      executionTime: Math.round(executionTime),
      cached: false
    };
  }

  private isSelectQuery(query: string): boolean {
    return query.trim().toUpperCase().startsWith('SELECT');
  }

  private getCacheKey(params: DatabaseQueryParams): string {
    return JSON.stringify({
      query: params.query,
      parameters: params.parameters,
      database: params.database,
      limit: params.limit,
      offset: params.offset
    });
  }

  private getFromCache(key: string): DatabaseResult | null {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { ...cached.result, cached: true };
    }
    
    // Remove expired entry
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private addToCache(key: string, result: DatabaseResult): void {
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
    logInfo('Database tool cache cleared');
  }
}

export const databaseTool = new DatabaseTool();