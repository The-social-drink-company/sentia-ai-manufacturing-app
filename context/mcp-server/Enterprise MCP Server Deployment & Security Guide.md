# Enterprise MCP Server Deployment & Security Guide

## 🏢 **Enterprise-Grade Deployment Strategies**

### **Production Architecture Recommendations**

#### **1. Multi-Environment Setup**
```yaml
# render.yaml - Production Configuration
services:
  - type: web
    name: sentia-mcp-prod
    env: node
    plan: pro  # Use Pro plan for production
    region: oregon  # Choose region closest to your users
    buildCommand: |
      npm ci --only=production
      npm run build
      npm run test:production
    startCommand: node dist/server.js
    healthCheckPath: /health
    autoDeploy: false  # Manual deploys for production
    
    # Environment-specific configurations
    envVars:
      - key: NODE_ENV
        value: production
      - key: LOG_LEVEL
        value: info
      - key: RATE_LIMIT_MAX
        value: 1000
      - key: CACHE_TTL
        value: 300
    
    # Resource allocation
    scaling:
      minInstances: 2
      maxInstances: 10
      targetCPU: 70
      targetMemory: 80

  # Staging environment
  - type: web
    name: sentia-mcp-staging
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: node dist/server.js
    envVars:
      - key: NODE_ENV
        value: staging
      - key: LOG_LEVEL
        value: debug
```

#### **2. Database & Caching Strategy**
```javascript
// src/config/database.js
import { Pool } from 'pg';
import Redis from 'ioredis';

export class DatabaseManager {
  constructor() {
    // PostgreSQL for persistent data
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL_PRODUCTION,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Redis for caching and sessions
    this.redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });
  }

  async cacheSet(key, value, ttl = 300) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async cacheGet(key) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async executeQuery(query, params) {
    const client = await this.db.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

---

## 🔒 **Enterprise Security Implementation**

### **1. Advanced Authentication & Authorization**
```javascript
// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import crypto from 'crypto';

export class EnterpriseAuth {
  constructor(redisClient) {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'mcp_rate_limit',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 60 seconds if limit exceeded
    });

    this.apiKeyLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'api_key_limit',
      points: 1000, // Higher limit for API keys
      duration: 60,
      blockDuration: 300,
    });
  }

  // Multi-factor API key validation
  async validateApiKey(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if API key is revoked
      const isRevoked = await this.checkRevokedKey(decoded.keyId);
      if (isRevoked) {
        return res.status(401).json({ error: 'API key has been revoked' });
      }

      // Rate limiting per API key
      await this.apiKeyLimiter.consume(decoded.keyId);

      // Add user context to request
      req.user = {
        id: decoded.userId,
        keyId: decoded.keyId,
        permissions: decoded.permissions || [],
        organization: decoded.organization,
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'API key expired' });
      }
      return res.status(401).json({ error: 'Invalid API key' });
    }
  }

  // Permission-based access control
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('admin')) {
        return res.status(403).json({ error: `Insufficient permissions. Required: ${permission}` });
      }
      next();
    };
  }

  // Audit logging
  async logAccess(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      
      await this.auditLog({
        userId: req.user?.id,
        keyId: req.user?.keyId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
    });

    next();
  }

  async checkRevokedKey(keyId) {
    // Check against revoked keys database
    const result = await this.db.executeQuery(
      'SELECT revoked_at FROM revoked_api_keys WHERE key_id = $1',
      [keyId]
    );
    return result.length > 0;
  }

  async auditLog(logEntry) {
    await this.db.executeQuery(
      `INSERT INTO audit_logs (user_id, key_id, method, path, status_code, duration, ip, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        logEntry.userId,
        logEntry.keyId,
        logEntry.method,
        logEntry.path,
        logEntry.statusCode,
        logEntry.duration,
        logEntry.ip,
        logEntry.userAgent,
        logEntry.timestamp,
      ]
    );
  }
}
```

### **2. Data Encryption & Secure Storage**
```javascript
// src/utils/encryption.js
import crypto from 'crypto';
import { promisify } from 'util';

export class EncryptionManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.masterKey = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'hex');
  }

  // Encrypt sensitive data with authentication
  encrypt(plaintext) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  // Decrypt with authentication verification
  decrypt(encryptedData) {
    const { encrypted, iv, tag } = encryptedData;
    
    const decipher = crypto.createDecipher(
      this.algorithm,
      this.masterKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Secure credential storage
  async storeCredentials(userId, service, credentials) {
    const encrypted = this.encrypt(JSON.stringify(credentials));
    
    await this.db.executeQuery(
      `INSERT INTO encrypted_credentials (user_id, service, encrypted_data, iv, tag, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, service) 
       DO UPDATE SET encrypted_data = $3, iv = $4, tag = $5, updated_at = NOW()`,
      [userId, service, encrypted.encrypted, encrypted.iv, encrypted.tag]
    );
  }

  async retrieveCredentials(userId, service) {
    const result = await this.db.executeQuery(
      'SELECT encrypted_data, iv, tag FROM encrypted_credentials WHERE user_id = $1 AND service = $2',
      [userId, service]
    );

    if (result.length === 0) {
      throw new Error('Credentials not found');
    }

    const { encrypted_data, iv, tag } = result[0];
    const decrypted = this.decrypt({
      encrypted: encrypted_data,
      iv,
      tag,
    });

    return JSON.parse(decrypted);
  }
}
```

---

## 📊 **Monitoring & Observability**

### **1. Comprehensive Logging Strategy**
```javascript
// src/utils/monitoring.js
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export class MonitoringManager {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
      ),
      defaultMeta: {
        service: 'sentia-mcp-server',
        version: process.env.APP_VERSION,
        environment: process.env.NODE_ENV,
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 5,
        }),
      ],
    });

    // Add Elasticsearch transport for production
    if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
      this.logger.add(new ElasticsearchTransport({
        level: 'info',
        clientOpts: { node: process.env.ELASTICSEARCH_URL },
        index: 'sentia-mcp-logs',
      }));
    }
  }

  // Structured logging methods
  logToolExecution(toolName, userId, duration, success, error = null) {
    this.logger.info('Tool execution', {
      event: 'tool_execution',
      toolName,
      userId,
      duration,
      success,
      error: error?.message,
      stack: error?.stack,
    });
  }

  logApiCall(endpoint, method, userId, statusCode, duration) {
    this.logger.info('API call', {
      event: 'api_call',
      endpoint,
      method,
      userId,
      statusCode,
      duration,
    });
  }

  logSecurityEvent(event, userId, details) {
    this.logger.warn('Security event', {
      event: 'security_event',
      securityEvent: event,
      userId,
      details,
      severity: 'high',
    });
  }
}
```

### **2. Health Checks & Metrics**
```javascript
// src/routes/health.js
import express from 'express';
import { DatabaseManager } from '../config/database.js';

const router = express.Router();
const db = new DatabaseManager();

// Comprehensive health check
router.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
    checks: {},
  };

  try {
    // Database connectivity
    await db.executeQuery('SELECT 1');
    healthCheck.checks.database = { status: 'healthy', responseTime: Date.now() };
  } catch (error) {
    healthCheck.checks.database = { status: 'unhealthy', error: error.message };
    healthCheck.status = 'unhealthy';
  }

  try {
    // Redis connectivity
    await db.redis.ping();
    healthCheck.checks.redis = { status: 'healthy' };
  } catch (error) {
    healthCheck.checks.redis = { status: 'unhealthy', error: error.message };
    healthCheck.status = 'degraded';
  }

  // External API health checks
  const externalServices = ['xero', 'shopify', 'anthropic', 'openai'];
  for (const service of externalServices) {
    try {
      const startTime = Date.now();
      await checkExternalService(service);
      healthCheck.checks[service] = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      healthCheck.checks[service] = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    activeConnections: await getActiveConnections(),
    toolExecutions: await getToolExecutionMetrics(),
    errorRates: await getErrorRates(),
  };

  res.json(metrics);
});

async function checkExternalService(service) {
  // Implement service-specific health checks
  switch (service) {
    case 'xero':
      // Check Xero API connectivity
      break;
    case 'shopify':
      // Check Shopify API connectivity
      break;
    // Add other services...
  }
}

export default router;
```

---

## 🚀 **Deployment Automation**

### **1. CI/CD Pipeline Configuration**
```yaml
# .github/workflows/deploy.yml
name: Deploy MCP Server

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
      
      - name: Run security audit
        run: npm audit --audit-level moderate
      
      - name: Run linting
        run: npm run lint

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render Staging
        uses: render-deploy/github-action@v1
        with:
          service-id: ${{ secrets.RENDER_STAGING_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-deploy: true

  deploy-production:
    needs: [test, deploy-staging]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render Production
        uses: render-deploy/github-action@v1
        with:
          service-id: ${{ secrets.RENDER_PRODUCTION_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-deploy: true
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          API_BASE_URL: ${{ secrets.PRODUCTION_API_URL }}
          API_KEY: ${{ secrets.PRODUCTION_API_KEY }}
```

### **2. Environment Management**
```javascript
// src/config/environment.js
export class EnvironmentManager {
  static getConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    const baseConfig = {
      port: process.env.PORT || 3000,
      logLevel: process.env.LOG_LEVEL || 'info',
      jwtSecret: process.env.JWT_SECRET,
      encryptionKey: process.env.MASTER_ENCRYPTION_KEY,
    };

    const envConfigs = {
      development: {
        ...baseConfig,
        database: {
          url: process.env.DATABASE_URL_DEVELOPMENT,
          ssl: false,
        },
        redis: {
          url: process.env.REDIS_URL_DEVELOPMENT,
        },
        rateLimits: {
          windowMs: 15 * 60 * 1000,
          max: 1000,
        },
      },
      
      staging: {
        ...baseConfig,
        database: {
          url: process.env.DATABASE_URL_TESTING,
          ssl: true,
        },
        redis: {
          url: process.env.REDIS_URL_TESTING,
        },
        rateLimits: {
          windowMs: 15 * 60 * 1000,
          max: 500,
        },
      },
      
      production: {
        ...baseConfig,
        database: {
          url: process.env.DATABASE_URL_PRODUCTION,
          ssl: true,
          pool: {
            min: 2,
            max: 20,
          },
        },
        redis: {
          url: process.env.REDIS_URL_PRODUCTION,
          cluster: true,
        },
        rateLimits: {
          windowMs: 15 * 60 * 1000,
          max: 100,
        },
      },
    };

    return envConfigs[env];
  }

  static validateConfig() {
    const requiredVars = [
      'JWT_SECRET',
      'MASTER_ENCRYPTION_KEY',
      'DATABASE_URL_PRODUCTION',
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
```

---

## 🔧 **Performance Optimization**

### **1. Caching Strategy**
```javascript
// src/utils/cache.js
export class CacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = 300; // 5 minutes
  }

  // Multi-level caching
  async get(key, fetchFunction, ttl = this.defaultTTL) {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from source
    const data = await fetchFunction();
    
    // Cache the result
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Warm cache for frequently accessed data
  async warmCache() {
    const warmupTasks = [
      this.warmXeroData(),
      this.warmShopifyData(),
      this.warmUnleashedData(),
    ];

    await Promise.allSettled(warmupTasks);
  }

  async warmXeroData() {
    // Pre-load frequently accessed Xero data
    const tenantIds = await this.getActiveTenantIds();
    for (const tenantId of tenantIds) {
      await this.get(`xero:financial:${tenantId}`, () => 
        this.fetchXeroFinancialData(tenantId), 3600
      );
    }
  }
}
```

### **2. Connection Pooling & Resource Management**
```javascript
// src/utils/connectionPool.js
export class ConnectionPoolManager {
  constructor() {
    this.pools = new Map();
    this.maxConnections = 50;
    this.connectionTimeout = 5000;
  }

  getPool(service) {
    if (!this.pools.has(service)) {
      this.pools.set(service, this.createPool(service));
    }
    return this.pools.get(service);
  }

  createPool(service) {
    switch (service) {
      case 'xero':
        return new XeroConnectionPool({
          max: 10,
          min: 2,
          acquireTimeoutMillis: this.connectionTimeout,
        });
      
      case 'shopify':
        return new ShopifyConnectionPool({
          max: 15,
          min: 3,
          acquireTimeoutMillis: this.connectionTimeout,
        });
      
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }

  async closeAllPools() {
    for (const [service, pool] of this.pools) {
      await pool.drain();
      await pool.clear();
    }
  }
}
```

---

## 📈 **Scaling Considerations**

### **1. Horizontal Scaling Strategy**
```yaml
# render.yaml - Auto-scaling configuration
services:
  - type: web
    name: sentia-mcp-prod
    scaling:
      minInstances: 3
      maxInstances: 20
      targetCPU: 70
      targetMemory: 80
      
    # Load balancer configuration
    healthCheckPath: /health
    healthCheckInterval: 30
    healthCheckTimeout: 10
    
    # Resource allocation
    plan: pro-plus
    region: oregon
    
    # Environment optimization
    envVars:
      - key: NODE_OPTIONS
        value: "--max-old-space-size=2048"
      - key: UV_THREADPOOL_SIZE
        value: "16"
```

### **2. Database Optimization**
```sql
-- Database indexes for performance
CREATE INDEX CONCURRENTLY idx_audit_logs_user_timestamp 
ON audit_logs (user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_encrypted_credentials_user_service 
ON encrypted_credentials (user_id, service);

CREATE INDEX CONCURRENTLY idx_api_keys_key_id 
ON api_keys (key_id) WHERE revoked_at IS NULL;

-- Partitioning for large tables
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

This enterprise deployment guide provides you with production-ready strategies for deploying, securing, and scaling your MCP server in a real-world business environment.
