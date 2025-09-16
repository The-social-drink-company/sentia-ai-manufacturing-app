/**
 * Health Monitoring Service
 * Comprehensive health checking for all system components
 */

import renderMCPService from './renderMCPService.js';
import xeroService from './xeroService.js';
import aiAnalyticsService from './aiAnalyticsService.js';

class HealthMonitorService {
  constructor() {
    this.checkTimeout = 5000; // 5 second timeout for health checks
    this.lastChecked = null;
    this.cachedResults = null;
    this.cacheValidMs = 30000; // Cache for 30 seconds
  }

  async getComprehensiveHealth() {
    // Use cache if available and valid
    if (this.cachedResults && this.lastChecked && 
        (Date.now() - this.lastChecked) < this.cacheValidMs) {
      return {
        ...this.cachedResults,
        fromCache: true,
        cacheAge: Date.now() - this.lastChecked
      };
    }

    const startTime = Date.now();
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.RENDER_SERVICE_NAME || process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      version: '2.0.0',
      components: {},
      summary: {
        total: 0,
        healthy: 0,
        degraded: 0,
        down: 0
      },
      performance: {
        checkDuration: 0,
        memoryUsage: process.memoryUsage()
      }
    };

    // Check all components concurrently with timeout
    const checks = [
      this.checkComponent('database', () => this.checkDatabase()),
      this.checkComponent('xero', () => this.checkXero()),
      this.checkComponent('mcp_server', () => this.checkMCPServer()),
      this.checkComponent('ai_analytics', () => this.checkAIAnalytics()),
      this.checkComponent('external_apis', () => this.checkExternalAPIs())
    ];

    const checkResults = await Promise.allSettled(checks);
    
    // Process results
    checkResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const [componentName, componentHealth] = result.value;
        results.components[componentName] = componentHealth;
        results.summary.total++;

        switch (componentHealth.status) {
          case 'healthy':
            results.summary.healthy++;
            break;
          case 'degraded':
            results.summary.degraded++;
            if (results.status === 'healthy') results.status = 'degraded';
            break;
          case 'down':
            results.summary.down++;
            results.status = 'unhealthy';
            break;
        }
      } else {
        // Handle failed health checks
        const componentNames = ['database', 'xero', 'mcp_server', 'ai_analytics', 'external_apis'];
        const componentName = componentNames[index];
        results.components[componentName] = {
          status: 'down',
          error: 'Health check failed',
          details: result.reason?.message || 'Unknown error'
        };
        results.summary.total++;
        results.summary.down++;
        results.status = 'unhealthy';
      }
    });

    results.performance.checkDuration = Date.now() - startTime;

    // Cache results
    this.cachedResults = results;
    this.lastChecked = Date.now();

    return results;
  }

  async checkComponent(name, checkFunction) {
    try {
      const health = await Promise.race([
        checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.checkTimeout)
        )
      ]);
      return [name, health];
    } catch (error) {
      return [name, {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      }];
    }
  }

  async checkDatabase() {
    try {
      if (!process.env.DATABASE_URL) {
        return {
          status: 'down',
          error: 'DATABASE_URL not configured',
          timestamp: new Date().toISOString()
        };
      }

      // Simple connection test would go here
      // For now, assume healthy if URL is configured
      return {
        status: 'healthy',
        type: 'neon_postgresql',
        configured: true,
        url_configured: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkXero() {
    try {
      const health = await xeroService.healthCheck();
      return {
        status: health.status === 'connected' ? 'healthy' : 'degraded',
        configured: !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET),
        details: health.message || 'Xero service check completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'down',
        configured: !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET),
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkMCPServer() {
    try {
      const health = await renderMCPService.healthCheck();
      return {
        status: health.status === 'connected' ? 'healthy' : 'degraded',
        provider: 'render-hosted',
        endpoint: renderMCPService.baseUrl,
        details: health.error || 'Render MCP server check completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'down',
        provider: 'render-hosted',
        endpoint: renderMCPService.baseUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkAIAnalytics() {
    try {
      const health = await aiAnalyticsService.healthCheck();
      return {
        status: health.status === 'connected' ? 'healthy' : 'degraded',
        details: health.message || 'AI Analytics service check completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkExternalAPIs() {
    const apiChecks = {
      openai: !!process.env.OPENAI_API_KEY,
      clerk: !!process.env.CLERK_SECRET_KEY,
      render: !!process.env.RENDER
    };

    const configuredCount = Object.values(apiChecks).filter(Boolean).length;
    const totalCount = Object.keys(apiChecks).length;

    return {
      status: configuredCount === totalCount ? 'healthy' : 
              configuredCount > 0 ? 'degraded' : 'down',
      configured: apiChecks,
      configuredCount,
      totalCount,
      details: `${configuredCount}/${totalCount} external APIs configured`,
      timestamp: new Date().toISOString()
    };
  }

  async getSimpleHealth() {
    const comprehensive = await this.getComprehensiveHealth();
    return {
      status: comprehensive.status,
      timestamp: comprehensive.timestamp,
      version: comprehensive.version,
      environment: comprehensive.environment,
      uptime: comprehensive.uptime,
      summary: comprehensive.summary
    };
  }

  clearCache() {
    this.cachedResults = null;
    this.lastChecked = null;
  }
}

export default new HealthMonitorService();