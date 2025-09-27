import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { EnterpriseSecurityFramework } from '../security/securityFramework.js';
import { ServiceRegistry } from './serviceRegistry.js';
import { LoadBalancer } from './loadBalancer.js';
import { CircuitBreaker } from './circuitBreaker.js';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


/**
 * Enterprise API Gateway
 * 
 * Provides centralized routing, authentication, rate limiting, load balancing,
 * and monitoring for microservices architecture.
 */
export class EnterpriseAPIGateway {
  constructor(config = {}) {
    this.app = express();
    this.config = {
      port: config.port || process.env.GATEWAY_PORT || 3000,
      redis: {
        host: config.redis?.host || process.env.REDIS_HOST || 'localhost',
        port: config.redis?.port || process.env.REDIS_PORT || 6379,
        password: config.redis?.password || process.env.REDIS_PASSWORD
      },
      jwt: {
        secret: config.jwt?.secret || process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: config.jwt?.expiresIn || '24h'
      },
      services: config.services || this.getDefaultServices(),
      monitoring: config.monitoring || true,
      circuitBreaker: config.circuitBreaker || {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
      }
    };

    this.redis = new Redis(this.config.redis);
    this.securityFramework = new EnterpriseSecurityFramework();
    this.serviceRegistry = new ServiceRegistry(this.redis);
    this.loadBalancer = new LoadBalancer();
    this.circuitBreakers = new Map();
    
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      serviceHealth: new Map()
    };

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeCircuitBreakers();
    this.startHealthChecks();
  }

  getDefaultServices() {
    return {
      auth: {
        name: 'auth-service',
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        healthCheck: '/health',
        timeout: 5000,
        retries: 3
      },
      products: {
        name: 'products-service',
        url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002',
        healthCheck: '/health',
        timeout: 10000,
        retries: 3
      },
      analytics: {
        name: 'analytics-service',
        url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',
        healthCheck: '/health',
        timeout: 15000,
        retries: 2
      },
      integrations: {
        name: 'integrations-service',
        url: process.env.INTEGRATIONS_SERVICE_URL || 'http://localhost:3004',
        healthCheck: '/health',
        timeout: 30000,
        retries: 2
      },
      forecasting: {
        name: 'forecasting-service',
        url: process.env.FORECASTING_SERVICE_URL || 'http://localhost:3005',
        healthCheck: '/health',
        timeout: 60000,
        retries: 1
      },
      notifications: {
        name: 'notifications-service',
        url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3006',
        healthCheck: '/health',
        timeout: 5000,
        retries: 3
      }
    };
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.sentiaspirits.com"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req, res, _next) => {
      req.id = req.headers['x-request-id'] || this.generateRequestId();
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Metrics middleware
    this.app.use((req, res, _next) => {
      const startTime = Date.now();
      this.metrics.requests++;

      res.on(_'finish', () => {
        const responseTime = Date.now() - startTime;
        this.metrics.responseTime.push(responseTime);
        
        // Keep only last 1000 response times
        if (this.metrics.responseTime.length > 1000) {
          this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
        }

        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }
      });

      next();
    });

    // Rate limiting
    const rateLimiters = this.createRateLimiters();
    this.app.use('/api/auth', rateLimiters.auth);
    this.app.use('/api/admin', rateLimiters.admin);
    this.app.use('/api', rateLimiters.api);

    // Security framework middleware
    this.app.use(this.securityFramework.ipBlockingMiddleware());
    this.app.use(this.securityFramework.securityHeaders());
    this.app.use(this.securityFramework.securityMonitoringMiddleware());
  }

  createRateLimiters() {
    const store = {
      incr: async (_key) => {
        const current = await this.redis.incr(key);
        if (current === 1) {
          await this.redis.expire(key, 900); // 15 minutes
        }
        return current;
      },
      decrement: async (_key) => {
        return await this.redis.decr(key);
      },
      resetKey: async (_key) => {
        return await this.redis.del(key);
      }
    };

    return {
      api: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // requests per window
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
        store: store
      }),
      auth: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50, // Stricter for auth endpoints
        message: { error: 'Too many authentication attempts' },
        standardHeaders: true,
        legacyHeaders: false,
        store: store
      }),
      admin: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200, // Moderate for admin operations
        message: { error: 'Too many admin requests' },
        standardHeaders: true,
        legacyHeaders: false,
        store: store
      })
    };
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get(_'/health', async (req, res) => {
      const health = await this.getGatewayHealth();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', this.authenticateAdmin.bind(this), (req, res) => {
      res.json(this.getMetrics());
    });

    // Service discovery endpoint
    this.app.get('/services', this.authenticateAdmin.bind(this), async (req, res) => {
      const services = await this.serviceRegistry.getAllServices();
      res.json(services);
    });

    // Authentication routes
    this.app.use('/api/auth', this.createServiceProxy('auth', {
      pathRewrite: { '^/api/auth': '' },
      timeout: this.config.services.auth.timeout
    }));

    // Products routes with authentication
    this.app.use('/api/products', 
      this.authenticate.bind(this),
      this.createServiceProxy('products', {
        pathRewrite: { '^/api/products': '' },
        timeout: this.config.services.products.timeout
      })
    );

    // Analytics routes with authentication
    this.app.use('/api/analytics',
      this.authenticate.bind(this),
      this.createServiceProxy('analytics', {
        pathRewrite: { '^/api/analytics': '' },
        timeout: this.config.services.analytics.timeout
      })
    );

    // Integrations routes with authentication and admin check
    this.app.use('/api/integrations',
      this.authenticate.bind(this),
      this.authorizeRole(['admin', 'manager']).bind(this),
      this.createServiceProxy('integrations', {
        pathRewrite: { '^/api/integrations': '' },
        timeout: this.config.services.integrations.timeout
      })
    );

    // Forecasting routes with authentication
    this.app.use('/api/forecasting',
      this.authenticate.bind(this),
      this.createServiceProxy('forecasting', {
        pathRewrite: { '^/api/forecasting': '' },
        timeout: this.config.services.forecasting.timeout
      })
    );

    // Notifications routes with authentication
    this.app.use('/api/notifications',
      this.authenticate.bind(this),
      this.createServiceProxy('notifications', {
        pathRewrite: { '^/api/notifications': '' },
        timeout: this.config.services.notifications.timeout
      })
    );

    // Catch-all error handler
    this.app.use((err, req, res, _next) => {
      logError('Gateway error:', err);
      this.metrics.errors++;
      
      res.status(err.status || 500).json({
        error: 'Gateway error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        requestId: req.id
      });
    });
  }

  createServiceProxy(serviceName, options = {}) {
    const service = this.config.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    const circuitBreaker = this.circuitBreakers.get(serviceName);

    return createProxyMiddleware({
      target: _service.url,
      changeOrigin: _true,
      timeout: options.timeout || service.timeout || _10000,
      pathRewrite: options.pathRewrite || _{},
      
      onProxyReq: _(proxyReq, req, res) => {
        // Add request headers
        proxyReq.setHeader('X-Request-ID', req.id);
        proxyReq.setHeader('X-Gateway-Version', '1.0.0');
        proxyReq.setHeader('X-Forwarded-For', req.ip);
        
        // Add user context if authenticated
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      },

      onProxyRes: (proxyRes, req, res) => {
        // Add response headers
        proxyRes.headers['X-Service'] = serviceName;
        proxyRes.headers['X-Request-ID'] = req.id;
        
        // Update service health metrics
        this.updateServiceHealth(serviceName, proxyRes.statusCode < 500);
      },

      onError: (err, req, res) => {
        logError(`Proxy error for ${serviceName}:`, err.message);
        this.updateServiceHealth(serviceName, false);
        
        // Circuit breaker logic
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
          
          if (circuitBreaker.isOpen()) {
            return res.status(503).json({
              error: 'Service temporarily unavailable',
              service: serviceName,
              message: 'Circuit breaker is open',
              requestId: req.id
            });
          }
        }

        res.status(502).json({
          error: 'Service unavailable',
          service: serviceName,
          message: 'Unable to connect to service',
          requestId: req.id
        });
      }
    });
  }

  initializeCircuitBreakers() {
    Object.keys(this.config.services).forEach(serviceName => {
      this.circuitBreakers.set(serviceName, new CircuitBreaker({
        ...this.config.circuitBreaker,
        name: serviceName
      }));
    });
  }

  async authenticate(req, res, next) {
    try {
      const token = this.extractToken(req);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ error: 'Token has been revoked' });
      }

      const decoded = jwt.verify(token, this.config.jwt.secret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  async authenticateAdmin(req, res, next) {
    await this.authenticate(req, res, () => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ error: 'Admin access required' });
      }
    });
  }

  authorizeRole(allowedRoles) {
    return (req, res, _next) => {
      if (req.user && allowedRoles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: req.user?.role
        });
      }
    };
  }

  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return req.headers['x-api-key'] || req.query.token;
  }

  updateServiceHealth(serviceName, isHealthy) {
    const current = this.metrics.serviceHealth.get(serviceName) || {
      healthy: 0,
      unhealthy: 0,
      lastCheck: Date.now()
    };

    if (isHealthy) {
      current.healthy++;
    } else {
      current.unhealthy++;
    }
    
    current.lastCheck = Date.now();
    this.metrics.serviceHealth.set(serviceName, current);
  }

  async getGatewayHealth() {
    const services = {};
    
    for (const [name, config] of Object.entries(this.config.services)) {
      const health = this.metrics.serviceHealth.get(name);
      const circuitBreaker = this.circuitBreakers.get(name);
      
      services[name] = {
        status: circuitBreaker?.isOpen() ? 'circuit_open' : 
                health?.unhealthy > health?.healthy ? 'unhealthy' : 'healthy',
        url: config.url,
        lastCheck: health?.lastCheck || null,
        circuitBreakerState: circuitBreaker?.getState() || 'closed'
      };
    }

    const overallHealthy = Object.values(services).every(s => s.status === 'healthy');

    return {
      status: overallHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services,
      metrics: {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) : 0,
        avgResponseTime: this.getAverageResponseTime()
      }
    };
  }

  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) : 0,
      responseTime: {
        avg: this.getAverageResponseTime(),
        p95: this.getPercentile(95),
        p99: this.getPercentile(99)
      },
      services: Object.fromEntries(this.metrics.serviceHealth),
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([name, cb]) => [
          name, cb.getStats()
        ])
      )
    };
  }

  getAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    return this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
  }

  getPercentile(percentile) {
    if (this.metrics.responseTime.length === 0) return 0;
    const sorted = [...this.metrics.responseTime].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startHealthChecks() {
    setInterval(async () => {
      for (const [serviceName, config] of Object.entries(this.config.services)) {
        try {
          const response = await fetch(`${config.url}${config.healthCheck}`, {
            timeout: 5000
          });
          this.updateServiceHealth(serviceName, response.ok);
          
          const circuitBreaker = this.circuitBreakers.get(serviceName);
          if (response.ok && circuitBreaker) {
            circuitBreaker.recordSuccess();
          }
        } catch (error) {
          this.updateServiceHealth(serviceName, false);
          
          const circuitBreaker = this.circuitBreakers.get(serviceName);
          if (circuitBreaker) {
            circuitBreaker.recordFailure();
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async start() {
    try {
      // Test Redis connection
      await this.redis.ping();
      logDebug('✅ Redis connection established');

      // Register services
      for (const [name, config] of Object.entries(this.config.services)) {
        await this.serviceRegistry.registerService(name, config);
      }

      this.server = this.app.listen(_this.config.port, () => {
        logDebug(`🚀 API Gateway running on port ${this.config.port}`);
        logDebug(`📊 Metrics available at http://localhost:${this.config.port}/metrics`);
        logDebug(`🏥 Health check at http://localhost:${this.config.port}/health`);
      });

      return this.server;
    } catch (error) {
      logError('Failed to start API Gateway:', error);
      throw error;
    }
  }

  async stop() {
    if (this.server) {
      this.server.close();
    }
    if (this.redis) {
      this.redis.disconnect();
    }
    logDebug('🛑 API Gateway stopped');
  }
}

export default EnterpriseAPIGateway;

