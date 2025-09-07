/**
 * Comprehensive Health Check System
 * Monitors all critical services and dependencies
 */

import logger from '../logger.js';
import forecastingService from '../ai/openAIForecastingService.js';

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.history = [];
    this.maxHistorySize = 100;
    this.checkInterval = 30000; // 30 seconds
    this.isRunning = false;
    this.alertThresholds = {
      critical: 2, // 2 consecutive failures
      warning: 5,  // 5 consecutive failures
      timeout: 10000 // 10 second timeout
    };
    
    this.initializeChecks();
  }

  initializeChecks() {
    // Database health check
    this.registerCheck('database', {
      name: 'PostgreSQL Database',
      description: 'Check database connection and basic operations',
      critical: true,
      timeout: 5000,
      check: this.checkDatabase.bind(this)
    });

    // Redis cache health check
    this.registerCheck('redis', {
      name: 'Redis Cache',
      description: 'Check Redis connection and operations',
      critical: false,
      timeout: 3000,
      check: this.checkRedis.bind(this)
    });

    // OpenAI API health check
    this.registerCheck('openai', {
      name: 'OpenAI API',
      description: 'Check OpenAI API connectivity and quota',
      critical: false,
      timeout: 10000,
      check: this.checkOpenAI.bind(this)
    });

    // External API health checks
    this.registerCheck('unleashed', {
      name: 'Unleashed API',
      description: 'Check Unleashed Software API connectivity',
      critical: false,
      timeout: 5000,
      check: this.checkUnleashedAPI.bind(this)
    });

    // System resources health check
    this.registerCheck('system', {
      name: 'System Resources',
      description: 'Check memory, CPU, and disk usage',
      critical: true,
      timeout: 2000,
      check: this.checkSystemResources.bind(this)
    });

    // Application health check
    this.registerCheck('application', {
      name: 'Application Health',
      description: 'Check core application functionality',
      critical: true,
      timeout: 5000,
      check: this.checkApplication.bind(this)
    });

    // Security health check
    this.registerCheck('security', {
      name: 'Security Status',
      description: 'Check security configurations and threats',
      critical: true,
      timeout: 3000,
      check: this.checkSecurity.bind(this)
    });
  }

  registerCheck(id, config) {
    this.checks.set(id, {
      ...config,
      id,
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      consecutiveFailures: 0,
      responseTime: 0,
      error: null
    });
  }

  async runHealthChecks() {
    const results = new Map();
    const startTime = Date.now();

    logger.info('Starting health check cycle');

    // Run all checks in parallel
    const promises = Array.from(this.checks.entries()).map(async ([id, check]) => {
      const result = await this.runSingleCheck(check);
      results.set(id, result);
      return { id, result };
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error('Error during health check cycle:', error);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Update check results
    results.forEach((result, id) => {
      const check = this.checks.get(id);
      
      check.status = result.healthy ? 'healthy' : 'unhealthy';
      check.lastCheck = new Date().toISOString();
      check.responseTime = result.responseTime;
      check.error = result.error;

      if (result.healthy) {
        check.lastSuccess = check.lastCheck;
        check.consecutiveFailures = 0;
      } else {
        check.consecutiveFailures++;
        
        // Trigger alerts based on thresholds
        if (check.critical && check.consecutiveFailures >= this.alertThresholds.critical) {
          this.triggerAlert('critical', check);
        } else if (check.consecutiveFailures >= this.alertThresholds.warning) {
          this.triggerAlert('warning', check);
        }
      }
    });

    // Store in history
    const healthReport = {
      timestamp: new Date().toISOString(),
      duration: totalTime,
      overall: this.getOverallHealth(),
      checks: Object.fromEntries(
        Array.from(results.entries()).map(([id, result]) => [
          id,
          {
            healthy: result.healthy,
            responseTime: result.responseTime,
            error: result.error
          }
        ])
      )
    };

    this.addToHistory(healthReport);
    logger.info(`Health check cycle completed in ${totalTime}ms`);

    return healthReport;
  }

  async runSingleCheck(check) {
    const startTime = Date.now();
    
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
      });

      await Promise.race([check.check(), timeoutPromise]);
      
      const responseTime = Date.now() - startTime;
      return {
        healthy: true,
        responseTime,
        error: null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.warn(`Health check failed for ${check.name}: ${error.message}`);
      
      return {
        healthy: false,
        responseTime,
        error: error.message
      };
    }
  }

  // Individual health checks
  async checkDatabase() {
    const { Pool } = await import('pg');
    
    // Check if database connection exists
    if (!process.env.DATABASE_URL && !process.env.DEV_DATABASE_URL) {
      throw new Error('No database configuration found');
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.DEV_DATABASE_URL,
      connectionTimeoutMillis: 5000
    });

    try {
      // Test basic query
      const result = await pool.query('SELECT NOW() as current_time');
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Database query returned no results');
      }

      // Test connection pool
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      await pool.end();
    } catch (error) {
      await pool.end();
      throw error;
    }
  }

  async checkRedis() {
    if (!process.env.REDIS_URL) {
      throw new Error('Redis not configured');
    }

    const Redis = await import('ioredis');
    const redis = new Redis.default(process.env.REDIS_URL);

    try {
      // Test basic operations
      await redis.ping();
      await redis.set('health-check', 'test', 'EX', 60);
      const value = await redis.get('health-check');
      
      if (value !== 'test') {
        throw new Error('Redis read/write test failed');
      }

      await redis.del('health-check');
    } finally {
      redis.disconnect();
    }
  }

  async checkOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Simple API test - check if service is responding
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response from OpenAI API');
    }
  }

  async checkUnleashedAPI() {
    if (!process.env.UNLEASHED_API_ID || !process.env.UNLEASHED_API_KEY) {
      throw new Error('Unleashed API credentials not configured');
    }

    // Test Unleashed API connectivity
    const testUrl = `https://api.unleashedsoftware.com/Products/1?api-auth-id=${process.env.UNLEASHED_API_ID}`;
    
    const response = await fetch(testUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-auth-signature': 'test-signature' // Simplified for health check
      },
      timeout: 5000
    });

    // Even 401/403 means the API is responding
    if (response.status >= 500) {
      throw new Error(`Unleashed API server error: ${response.status}`);
    }
  }

  async checkSystemResources() {
    // Memory check
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      const memoryUsageMB = memory.heapUsed / 1024 / 1024;
      const memoryLimitMB = 1024; // 1GB limit
      
      if (memoryUsageMB > memoryLimitMB) {
        throw new Error(`High memory usage: ${memoryUsageMB.toFixed(2)}MB`);
      }
    }

    // CPU check (simplified)
    const cpuUsage = process.cpuUsage();
    if (cpuUsage.system > 1000000) { // High CPU usage threshold
      logger.warn('High CPU usage detected');
    }

    // Event loop lag check
    const start = process.hrtime.bigint();
    await new Promise(resolve => setImmediate(resolve));
    const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
    
    if (lag > 100) { // 100ms lag threshold
      throw new Error(`High event loop lag: ${lag.toFixed(2)}ms`);
    }
  }

  async checkApplication() {
    // Test core application components
    
    // Check if forecasting service is functional
    try {
      const testData = [
        { date: '2024-01-01', quantity: 100, revenue: 3500 },
        { date: '2024-01-02', quantity: 120, revenue: 4200 }
      ];

      const forecast = await forecastingService.generateForecast({
        market: 'UK',
        product: 'GABA Spirit',
        historicalData: testData,
        timeHorizon: 7
      });

      if (!forecast || !forecast.daily_forecast || forecast.daily_forecast.length === 0) {
        throw new Error('Forecasting service returned invalid data');
      }
    } catch (error) {
      throw new Error(`Forecasting service health check failed: ${error.message}`);
    }

    // Check critical routes
    try {
      const healthResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/health`, {
        timeout: 3000
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Health endpoint returned ${healthResponse.status}`);
      }
    } catch (error) {
      throw new Error(`Health endpoint check failed: ${error.message}`);
    }
  }

  async checkSecurity() {
    // Security configuration checks
    const securityIssues = [];

    // Check environment variables for security
    if (!process.env.CLERK_SECRET_KEY) {
      securityIssues.push('Missing CLERK_SECRET_KEY');
    }

    if (!process.env.JWT_SECRET && !process.env.SESSION_SECRET) {
      securityIssues.push('Missing JWT or session secret');
    }

    // Check HTTPS in production
    if (process.env.NODE_ENV === 'production' && !process.env.FORCE_HTTPS) {
      logger.warn('HTTPS not enforced in production');
    }

    // Check for common security headers
    const requiredHeaders = ['helmet', 'cors', 'rate-limiting'];
    // This would check if security middleware is loaded

    if (securityIssues.length > 0) {
      throw new Error(`Security issues detected: ${securityIssues.join(', ')}`);
    }
  }

  getOverallHealth() {
    const allChecks = Array.from(this.checks.values());
    const criticalChecks = allChecks.filter(check => check.critical);
    const failedCritical = criticalChecks.filter(check => check.status === 'unhealthy');
    const failedNonCritical = allChecks.filter(check => !check.critical && check.status === 'unhealthy');

    if (failedCritical.length > 0) {
      return {
        status: 'unhealthy',
        level: 'critical',
        message: `${failedCritical.length} critical service(s) failing`
      };
    }

    if (failedNonCritical.length > allChecks.length * 0.5) {
      return {
        status: 'degraded',
        level: 'warning',
        message: `${failedNonCritical.length} non-critical service(s) failing`
      };
    }

    if (failedNonCritical.length > 0) {
      return {
        status: 'healthy',
        level: 'warning',
        message: `${failedNonCritical.length} non-critical service(s) degraded`
      };
    }

    return {
      status: 'healthy',
      level: 'good',
      message: 'All services operational'
    };
  }

  addToHistory(report) {
    this.history.push(report);
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  triggerAlert(level, check) {
    const alert = {
      level,
      service: check.name,
      message: `${check.name} has failed ${check.consecutiveFailures} consecutive times`,
      error: check.error,
      timestamp: new Date().toISOString()
    };

    logger.error(`Health check alert [${level}]:`, alert);

    // Could integrate with external alerting systems
    this.sendAlert(alert);
  }

  async sendAlert(alert) {
    // Integration points for alerting systems
    
    // Email alerts
    if (process.env.ALERT_EMAIL) {
      // Send email alert
    }

    // Slack alerts
    if (process.env.SLACK_WEBHOOK) {
      try {
        await fetch(process.env.SLACK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 ${alert.level.toUpperCase()}: ${alert.message}`,
            attachments: [{
              color: alert.level === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Service', value: alert.service, short: true },
                { title: 'Error', value: alert.error || 'Unknown', short: true },
                { title: 'Time', value: alert.timestamp, short: true }
              ]
            }]
          })
        });
      } catch (error) {
        logger.error('Failed to send Slack alert:', error);
      }
    }

    // Sentry alerts
    if (typeof Sentry !== 'undefined') {
      Sentry.captureMessage(`Health check alert: ${alert.message}`, alert.level);
    }
  }

  startMonitoring() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Starting health check monitoring');

    // Initial check
    this.runHealthChecks();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.checkInterval);
  }

  stopMonitoring() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    logger.info('Stopped health check monitoring');
  }

  getStatus() {
    return {
      overall: this.getOverallHealth(),
      checks: Object.fromEntries(
        Array.from(this.checks.entries()).map(([id, check]) => [
          id,
          {
            name: check.name,
            status: check.status,
            lastCheck: check.lastCheck,
            lastSuccess: check.lastSuccess,
            consecutiveFailures: check.consecutiveFailures,
            responseTime: check.responseTime,
            error: check.error,
            critical: check.critical
          }
        ])
      ),
      history: this.history.slice(-10), // Last 10 reports
      monitoring: this.isRunning
    };
  }

  getMetrics() {
    const allChecks = Array.from(this.checks.values());
    const recentHistory = this.history.slice(-20);
    
    return {
      uptime: this.calculateUptime(recentHistory),
      averageResponseTime: this.calculateAverageResponseTime(allChecks),
      failureRate: this.calculateFailureRate(recentHistory),
      criticalServices: allChecks.filter(c => c.critical).length,
      healthyServices: allChecks.filter(c => c.status === 'healthy').length,
      totalServices: allChecks.length
    };
  }

  calculateUptime(history) {
    if (history.length === 0) return 100;
    
    const healthyReports = history.filter(report => 
      report.overall.status === 'healthy'
    ).length;
    
    return Math.round((healthyReports / history.length) * 100 * 100) / 100;
  }

  calculateAverageResponseTime(checks) {
    const responseTimes = checks
      .filter(check => check.responseTime > 0)
      .map(check => check.responseTime);
    
    if (responseTimes.length === 0) return 0;
    
    return Math.round(
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    );
  }

  calculateFailureRate(history) {
    if (history.length === 0) return 0;
    
    const failedReports = history.filter(report => 
      report.overall.status === 'unhealthy'
    ).length;
    
    return Math.round((failedReports / history.length) * 100 * 100) / 100;
  }
}

// Export singleton instance
const healthCheckService = new HealthCheckService();
export default healthCheckService;