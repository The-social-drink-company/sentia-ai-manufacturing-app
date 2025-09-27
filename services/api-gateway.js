import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import redisCacheService from './redis-cache.js';
import { logInfo, logWarn, logError } from './observability/structuredLogger.js';

class APIGateway {
  constructor() {
    this.app = express();
    this.services = new Map();
    this.routes = new Map();
    this.middleware = new Map();
    this.isInitialized = false;
    this.healthChecks = new Map();
    this.circuitBreakers = new Map();
    
    this.setupSecurityMiddleware();
    this.setupRateLimiting();
    this.setupLogging();
    this.setupHealthChecks();
  }

  setupSecurityMiddleware() {
    // Advanced security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS with enterprise configuration
    this.app.use(cors({
      origin: _(origin, _callback) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5000',
          'https://sentia-manufacturing.railway.app',
          'https://sentia-manufacturing-dashboard-production.up.railway.app',
          process.env.FRONTEND_URL
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 
        'Authorization', 'X-API-Key', 'X-Client-Version',
        'X-Request-ID', 'X-Forwarded-For'
      ]
    }));

    // Compression
    this.app.use(compression({
      level: _6,
      threshold: _1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  setupRateLimiting() {
    // Enterprise rate limiting tiers
    const createRateLimit = (windowMs, max, message, keyGenerator = null) => 
      rateLimit({
        windowMs,
        max,
        message: { error: message, retryAfter: windowMs },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: keyGenerator || ((req) => req.ip),
        skip: (req) => {
          // Skip rate limiting for health checks and internal requests
          return req.path === '/health' || req.headers['x-internal-request'];
        },
        onLimitReached: async (req, res, options) => {
          logWarn('Rate limit exceeded', { ip: req.ip, path: req.path });
          await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
            ip: req.ip,
            path: req.path,
            userAgent: req.headers['user-agent']
          });
        }
      });

    // Different rate limits for different endpoints
    this.middleware.set('auth', createRateLimit(
      15 * 60 * 1000, // 15 minutes
      100, // requests
      'Too many authentication requests'
    ));

    this.middleware.set('api', createRateLimit(
      15 * 60 * 1000, // 15 minutes
      500, // requests
      'Too many API requests'
    ));

    this.middleware.set('heavy', createRateLimit(
      15 * 60 * 1000, // 15 minutes
      50, // requests
      'Too many resource-intensive requests'
    ));

    this.middleware.set('upload', createRateLimit(
      60 * 60 * 1000, // 1 hour
      20, // requests
      'Too many upload requests'
    ));
  }

  setupLogging() {
    // Request logging middleware
    this.app.use((req, res, _next) => {
      const requestId = this.generateRequestId();
      req.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);

      const start = Date.now();
      
      res.on(_'finish', _() => {
        const duration = Date.now() - start;
        this.logRequest(req, res, duration);
      });

      next();
    });
  }

  setupHealthChecks() {
    // Gateway health endpoint
    this.app.get('/health', async (req, res) => {
      const health = await this.getHealthStatus();
      res.status(health.overall === 'healthy' ? 200 : 503).json(health);
    });

    // Service-specific health endpoints
    this.app.get(_'/health/:service', async (req, res) => {
      const { service } = req.params;
      const health = await this.getServiceHealth(service);
      
      if (!health) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });
  }

  // Authentication middleware
  authenticateRequest = async (req, res, _next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      // Check token in cache for revocation
      const isRevoked = await redisCacheService.get(`revoked_token:${token}`);
      if (isRevoked) {
        return res.status(401).json({ error: 'Token has been revoked' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      logError('Authentication error', error);
      res.status(401).json({ error: 'Invalid authentication token' });
    }
  };

  // API Key authentication
  authenticateAPIKey = async (req, res, _next) => {
    try {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
      }

      // Check API key validity (could be cached in Redis)
      const cachedKey = await redisCacheService.get(`api_key:${apiKey}`);
      
      if (!cachedKey) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      req.apiKeyInfo = cachedKey;
      next();
    } catch (error) {
      logError('API key authentication error', error);
      res.status(401).json({ error: 'API key authentication failed' });
    }
  };

  // Service registration
  registerService(name, config) {
    this.services.set(name, {
      name,
      baseUrl: config.baseUrl,
      healthEndpoint: config.healthEndpoint || '/health',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      circuitBreaker: {
        failureThreshold: config.circuitBreaker?.failureThreshold || 5,
        resetTimeout: config.circuitBreaker?.resetTimeout || 60000,
        state: 'closed', // closed, open, half-open
        failures: 0,
        nextAttempt: null
      }
    });

    logInfo('Service registered', { service: name });
  }

  // Route registration with middleware
  registerRoute(method, path, serviceName, options = {}) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    const route = {
      method: method.toLowerCase(),
      path,
      service: serviceName,
      timeout: options.timeout || service.timeout,
      middleware: options.middleware || [],
      transform: options.transform || null,
      cache: options.cache || null
    };

    const routeKey = `${method.toUpperCase()} ${path}`;
    this.routes.set(routeKey, route);

    // Apply middleware and create express route
    const middlewares = [
      ...route.middleware.map(name => this.middleware.get(name)).filter(Boolean),
      this.handleServiceRequest(route)
    ];

    this.app[route.method](path, ...middlewares);
    logInfo('Route registered', { route: routeKey, service: serviceName });
  }

  // Service request handler
  handleServiceRequest = (route) => async (req, res, _next) => {
    try {
      const service = this.services.get(route.service);
      
      // Circuit breaker check
      if (this.isCircuitOpen(service)) {
        return res.status(503).json({ 
          error: 'Service temporarily unavailable',
          service: route.service 
        });
      }

      // Check cache first
      if (route.cache) {
        const cacheKey = this.generateCacheKey(req, route);
        const cached = await redisCacheService.get(cacheKey);
        
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          return res.json(cached);
        }
      }

      // Forward request to service
      const response = await this.forwardRequest(req, service, route);
      
      // Cache response if configured
      if (route.cache && response.status === 200) {
        const cacheKey = this.generateCacheKey(req, route);
        await redisCacheService.set(cacheKey, response.data, route.cache.ttl || 300);
      }

      // Transform response if needed
      const responseData = route.transform 
        ? route.transform(response.data, req) 
        : response.data;

      res.status(response.status).json(responseData);
      
      // Reset circuit breaker on success
      this.recordSuccess(service);

    } catch (error) {
      logError(`Gateway error for ${route.service}`, error);
      
      // Record failure for circuit breaker
      this.recordFailure(this.services.get(route.service));
      
      res.status(error.status || 500).json({
        error: 'Service request failed',
        message: error.message,
        service: route.service,
        requestId: req.requestId
      });
    }
  };

  async forwardRequest(req, service, route) {
    // Implementation would use http client to forward to actual service
    // For now, return mock response
    return {
      status: 200,
      data: {
        message: `Mock response from ${service.name}`,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Circuit breaker logic
  isCircuitOpen(service) {
    const cb = service.circuitBreaker;
    
    if (cb.state === 'closed') return false;
    if (cb.state === 'half-open') return false;
    
    // Check if reset timeout has passed
    if (cb.state === 'open' && Date.now() > cb.nextAttempt) {
      cb.state = 'half-open';
      return false;
    }
    
    return cb.state === 'open';
  }

  recordFailure(service) {
    const cb = service.circuitBreaker;
    cb.failures++;
    
    if (cb.failures >= cb.failureThreshold && cb.state === 'closed') {
      cb.state = 'open';
      cb.nextAttempt = Date.now() + cb.resetTimeout;
      logWarn('Circuit breaker opened', { service: service.name });
    }
  }

  recordSuccess(service) {
    const cb = service.circuitBreaker;
    
    if (cb.state === 'half-open') {
      cb.state = 'closed';
      cb.failures = 0;
      logInfo('Circuit breaker closed', { service: service.name });
    } else if (cb.state === 'closed') {
      cb.failures = Math.max(0, cb.failures - 1);
    }
  }

  // Utility methods
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return req.headers['x-access-token'] || req.query.token;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCacheKey(req, route) {
    const parts = [
      route.service,
      req.method,
      req.path,
      JSON.stringify(req.query),
      req.user?.id || 'anonymous'
    ];
    return `gateway_cache:${parts.join(':')}`;
  }

  async getHealthStatus() {
    const services = {};
    let healthyCount = 0;
    
    for (const [name, service] of this.services) {
      const health = await this.checkServiceHealth(service);
      services[name] = health;
      if (health.status === 'healthy') healthyCount++;
    }

    return {
      overall: healthyCount === this.services.size ? 'healthy' : 'degraded',
      services,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requestsProcessed: this.getRequestCount()
    };
  }

  async getServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return null;
    
    return await this.checkServiceHealth(service);
  }

  async checkServiceHealth(service) {
    try {
      // Mock health check - would make actual HTTP request
      return {
        status: 'healthy',
        responseTime: Math.random() * 100,
        circuitBreaker: service.circuitBreaker.state,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        circuitBreaker: service.circuitBreaker.state,
        lastCheck: new Date().toISOString()
      };
    }
  }

  async logRequest(req, res, duration) {
    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    // Log to console and optionally to external service
    logInfo('Request processed', { method: logData.method, path: logData.path, statusCode: logData.statusCode, duration: `${duration}ms` });
    
    // Store in Redis for monitoring
    await redisCacheService.set(
      `request_log:${req.requestId}`,
      logData,
      3600 // 1 hour retention
    );
  }

  async logSecurityEvent(event, data) {
    const securityLog = {
      event,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getEventSeverity(event)
    };

    logWarn(`Security event: ${event}`, data);
    
    // Store security events with longer retention
    await redisCacheService.set(
      `security_event:${Date.now()}`,
      securityLog,
      86400 // 24 hours retention
    );
  }

  getEventSeverity(event) {
    const severityMap = {
      'RATE_LIMIT_EXCEEDED': 'medium',
      'INVALID_TOKEN': 'high',
      'UNAUTHORIZED_ACCESS': 'high',
      'SUSPICIOUS_ACTIVITY': 'high'
    };
    
    return severityMap[event] || 'low';
  }

  getRequestCount() {
    // Mock implementation - would track actual request counts
    return Math.floor(Math.random() * 10000);
  }

  async initialize() {
    if (this.isInitialized) return;

    // Register default routes and services
    await this.registerDefaultServices();
    
    this.isInitialized = true;
    logInfo('API Gateway initialized successfully');
  }

  async registerDefaultServices() {
    // Register enterprise services
    this.registerService('amazon-api', {
      baseUrl: 'http://localhost:5000/api/integrations/amazon-sp-api',
      timeout: 15000
    });

    this.registerService('shopify-api', {
      baseUrl: 'http://localhost:5000/api/integrations/shopify-multistore',
      timeout: 15000
    });

    this.registerService('unleashed-api', {
      baseUrl: 'http://localhost:5000/api/integrations/unleashed-erp',
      timeout: 15000
    });

    // Register routes with appropriate middleware
    this.registerRoute('GET', '/api/v2/amazon/*', 'amazon-api', {
      middleware: ['api'],
      cache: { ttl: 300 }
    });

    this.registerRoute('GET', '/api/v2/shopify/*', 'shopify-api', {
      middleware: ['api'],
      cache: { ttl: 300 }
    });

    this.registerRoute('GET', '/api/v2/unleashed/*', 'unleashed-api', {
      middleware: ['api'],
      cache: { ttl: 300 }
    });
  }

  getApp() {
    return this.app;
  }
}

const apiGateway = new APIGateway();

export default apiGateway;