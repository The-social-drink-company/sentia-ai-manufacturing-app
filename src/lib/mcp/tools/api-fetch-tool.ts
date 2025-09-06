import { MCPTool, MCPContext } from '../protocol';
import { logInfo, logError, logWarn } from '../../logger';

export interface APIFetchParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export interface APIFetchResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  executionTime: number;
  cached: boolean;
  retryCount: number;
}

/**
 * API Fetch Tool for MCP
 * Provides secure API access with retry logic and caching
 */
export class APIFetchTool implements MCPTool {
  name = 'api_fetch';
  description = 'Fetch data from external APIs with security and reliability';
  version = '1.0.0';
  permissions = ['api:fetch'];
  
  rateLimit = {
    maxRequests: 100,
    windowMs: 60000
  };

  private cache: Map<string, { result: APIFetchResult; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  private allowedDomains = new Set([
    'api.sentia.com',
    'api.shopify.com',
    'api.unleashed.com',
    'api.amazon.com',
    'api.xero.com',
    'localhost'
  ]);

  private sensitiveHeaders = new Set([
    'authorization',
    'x-api-key',
    'x-secret-key',
    'cookie'
  ]);

  async execute(params: APIFetchParams, context: MCPContext): Promise<APIFetchResult> {
    const startTime = Date.now();
    
    try {
      // Validate URL
      this.validateURL(params.url, context);
      
      // Check cache for GET requests
      if (params.method === 'GET' || !params.method) {
        const cacheKey = this.getCacheKey(params);
        const cached = this.getFromCache(cacheKey);
        if (cached && params.cache !== false) {
          logInfo('API fetch served from cache', { 
            sessionId: context.sessionId,
            url: this.sanitizeURL(params.url)
          });
          return cached;
        }
      }

      // Execute request with retries
      const result = await this.executeWithRetry(params, context);
      
      // Cache successful GET requests
      if ((params.method === 'GET' || !params.method) && result.status < 400) {
        const cacheKey = this.getCacheKey(params);
        this.addToCache(cacheKey, result);
      }

      // Log execution
      logInfo('API fetch completed', {
        sessionId: context.sessionId,
        url: this.sanitizeURL(params.url),
        status: result.status,
        executionTime: result.executionTime,
        cached: result.cached
      });

      return result;

    } catch (error: any) {
      logError('API fetch failed', {
        sessionId: context.sessionId,
        url: this.sanitizeURL(params.url),
        error: error.message
      });
      throw error;
    }
  }

  validate(params: any): boolean | string {
    if (!params.url || typeof params.url !== 'string') {
      return 'URL parameter is required and must be a string';
    }

    try {
      new URL(params.url);
    } catch {
      return 'Invalid URL format';
    }

    if (params.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(params.method)) {
      return 'Invalid HTTP method';
    }

    if (params.timeout && (typeof params.timeout !== 'number' || params.timeout < 0)) {
      return 'Timeout must be a positive number';
    }

    return true;
  }

  private validateURL(url: string, context: MCPContext): void {
    const parsedURL = new URL(url);
    
    // Check if domain is allowed
    const hostname = parsedURL.hostname;
    let isAllowed = false;
    
    for (const domain of this.allowedDomains) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed && !context.securityContext.permissions.includes('api:fetch:any')) {
      throw new Error(`Access denied to domain: ${hostname}`);
    }

    // Prevent SSRF attacks
    if (parsedURL.hostname === 'localhost' || 
        parsedURL.hostname === '127.0.0.1' ||
        parsedURL.hostname.startsWith('192.168.') ||
        parsedURL.hostname.startsWith('10.')) {
      
      if (!context.securityContext.permissions.includes('api:fetch:internal')) {
        throw new Error('Access to internal networks denied');
      }
    }

    // Check for file:// protocol
    if (parsedURL.protocol === 'file:') {
      throw new Error('File protocol is not allowed');
    }
  }

  private async executeWithRetry(
    params: APIFetchParams, 
    context: MCPContext
  ): Promise<APIFetchResult> {
    const maxRetries = params.retries || 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.executeRequest(params);
        
        // Don't retry on client errors (4xx)
        if (result.status >= 400 && result.status < 500) {
          return { ...result, retryCount: attempt };
        }
        
        // Retry on server errors (5xx) or network errors
        if (result.status >= 500) {
          lastError = new Error(`Server error: ${result.status} ${result.statusText}`);
          
          // Exponential backoff
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        return { ...result, retryCount: attempt };
        
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          logWarn('API fetch retry', {
            url: this.sanitizeURL(params.url),
            attempt: attempt + 1,
            delay,
            error: error.message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('API fetch failed after retries');
  }

  private async executeRequest(params: APIFetchParams): Promise<APIFetchResult> {
    const startTime = Date.now();
    
    // Mock implementation - in production, use actual fetch
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    // Generate mock response based on URL
    let data: any = {};
    let status = 200;
    
    if (params.url.includes('inventory')) {
      data = {
        items: [
          { id: 1, name: 'Item 1', quantity: 100 },
          { id: 2, name: 'Item 2', quantity: 200 }
        ],
        total: 2
      };
    } else if (params.url.includes('supplier')) {
      data = {
        suppliers: [
          { id: 'S001', name: 'Supplier A', rating: 4.5 },
          { id: 'S002', name: 'Supplier B', rating: 4.2 }
        ]
      };
    } else if (params.url.includes('error')) {
      status = 500;
      data = { error: 'Internal server error' };
    } else {
      data = { 
        message: 'Success',
        timestamp: new Date().toISOString()
      };
    }

    const executionTime = Date.now() - startTime;

    return {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {
        'content-type': 'application/json',
        'x-response-time': executionTime.toString()
      },
      data,
      executionTime,
      cached: false,
      retryCount: 0
    };
  }

  private sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove sensitive query parameters
      const sensitiveParams = ['api_key', 'token', 'secret'];
      
      for (const param of sensitiveParams) {
        if (parsed.searchParams.has(param)) {
          parsed.searchParams.set(param, '***');
        }
      }
      
      return parsed.toString();
    } catch {
      return 'invalid-url';
    }
  }

  private getCacheKey(params: APIFetchParams): string {
    return JSON.stringify({
      url: params.url,
      method: params.method || 'GET',
      headers: this.sanitizeHeaders(params.headers),
      body: params.body
    });
  }

  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};
    
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (this.sensitiveHeaders.has(key.toLowerCase())) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private getFromCache(key: string): APIFetchResult | null {
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

  private addToCache(key: string, result: APIFetchResult): void {
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
    logInfo('API fetch tool cache cleared');
  }
}

export const apiFetchTool = new APIFetchTool();