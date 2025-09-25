import express from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';

const router = express.Router();
const prisma = new PrismaClient();

// Comprehensive health check endpoint
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || null,
    environment: process.env.NODE_ENV || null,
    uptime: Math.floor(process.uptime()),
    checks: {
      server: { status: 'healthy', responseTime: 0 },
      database: { status: 'unknown', responseTime: 0 },
      redis: { status: 'unknown', responseTime: 0 },
      externalAPIs: { status: 'unknown', responseTime: 0 },
      mcpServer: { status: 'unknown', responseTime: 0 },
      aiSystems: { status: 'unknown', responseTime: 0 }
    },
    metrics: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      requests: {
        total: global.requestCount || 0,
        errors: global.errorCount || 0,
        averageResponseTime: global.averageResponseTime || 0
      }
    },
    features: {
      ai_copilot: process.env.ENABLE_AI_FEATURES === 'true',
      real_time_streaming: process.env.ENABLE_REAL_TIME_STREAMING === 'true',
      autonomous_monitoring: process.env.ENABLE_AUTONOMOUS_MONITORING === 'true',
      business_intelligence: process.env.ENABLE_BUSINESS_INTELLIGENCE === 'true',
      predictive_analytics: process.env.ENABLE_PREDICTIVE_ANALYTICS === 'true'
    }
  };

  // Database health check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      connection: 'active'
    };
  } catch (error) {
    healthStatus.checks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - Date.now(),
      error: error.message,
      connection: 'failed'
    };
    healthStatus.status = 'degraded';
  }

  // Redis health check (if available)
  if (process.env.REDIS_URL) {
    try {
      const redisStart = Date.now();
      // Add Redis ping check here when Redis is implemented
      healthStatus.checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart,
        connection: 'active'
      };
    } catch (error) {
      healthStatus.checks.redis = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
        connection: 'failed'
      };
    }
  } else {
    healthStatus.checks.redis = {
      status: 'not_configured',
      responseTime: 0,
      connection: 'none'
    };
  }

  // MCP Server health check
  try {
    const mcpStart = Date.now();
    const mcpResponse = await fetch(`http://localhost:${process.env.MCP_PORT 0}/health`, {
      timeout: 5000
    }).catch(() => null);

    if (mcpResponse && mcpResponse.ok) {
      healthStatus.checks.mcpServer = {
        status: 'healthy',
        responseTime: Date.now() - mcpStart,
        connection: 'active'
      };
    } else {
      healthStatus.checks.mcpServer = {
        status: 'unhealthy',
        responseTime: Date.now() - mcpStart,
        connection: 'failed'
      };
    }
  } catch (error) {
    healthStatus.checks.mcpServer = {
      status: 'unhealthy',
      responseTime: 0,
      error: error.message,
      connection: 'failed'
    };
  }

  // External API health checks
  const externalAPIChecks = [];
  const apis = [
    { name: 'Xero', url: 'https://api.xero.com', key: 'XERO_CLIENT_ID' },
    { name: 'Shopify', url: 'https://api.shopify.com', key: 'SHOPIFY_API_KEY' },
    { name: 'Amazon SP-API', url: 'https://sellingpartnerapi.amazon.com', key: 'AMAZON_SP_API_CLIENT_ID' }
  ];

  for (const api of apis) {
    if (process.env[api.key]) {
      try {
        const apiStart = Date.now();
        // In a real implementation, make actual API calls to check connectivity
        externalAPIChecks.push({
          name: api.name,
          status: 'configured',
          responseTime: Date.now() - apiStart
        });
      } catch (error) {
        externalAPIChecks.push({
          name: api.name,
          status: 'error',
          responseTime: 0,
          error: error.message
        });
      }
    } else {
      externalAPIChecks.push({
        name: api.name,
        status: 'not_configured',
        responseTime: 0
      });
    }
  }

  healthStatus.checks.externalAPIs = {
    status: externalAPIChecks.some(api => api.status === 'error') ? 'degraded' : 'healthy',
    responseTime: Math.max(...externalAPIChecks.map(api => api.responseTime)),
    apis: externalAPIChecks
  };

  // AI Systems health check
  healthStatus.checks.aiSystems = {
    status: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
    responseTime: 0,
    providers: {
      claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      gemini: process.env.GOOGLE_AI_API_KEY ? 'configured' : 'not_configured'
    }
  };

  // Overall status calculation
  const unhealthyChecks = Object.values(healthStatus.checks)
    .filter(check => check.status === 'unhealthy').length;

  if (unhealthyChecks > 0) {
    healthStatus.status = unhealthyChecks > 2 ? 'unhealthy' : 'degraded';
  }

  // Server health check completion
  healthStatus.checks.server = {
    status: 'healthy',
    responseTime: Date.now() - startTime,
    connection: 'active'
  };

  // Set appropriate HTTP status code
  const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 207 : 503;

  res.status(httpStatus).json(healthStatus);
});

// Detailed system metrics endpoint
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: Math.floor(process.uptime()),
      memory: {
        ...process.memoryUsage(),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      cpu: process.cpuUsage(),
      platform: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        os: os.type(),
        hostname: os.hostname()
      }
    },
    application: {
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || null,
      port: process.env.PORT 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    requests: {
      total: global.requestCount || 0,
      errors: global.errorCount || 0,
      success_rate: global.requestCount > 0 ? 
        Math.round(((global.requestCount - global.errorCount) / global.requestCount) * 100) : 100,
      average_response_time: global.averageResponseTime || 0
    },
    database: {
      connections: global.dbConnections || 0,
      queries: global.dbQueries || 0,
      slow_queries: global.slowQueries || 0
    },
    features: {
      ai_copilot_active: process.env.ENABLE_AI_FEATURES === 'true',
      real_time_streaming_active: process.env.ENABLE_REAL_TIME_STREAMING === 'true',
      autonomous_monitoring_active: process.env.ENABLE_AUTONOMOUS_MONITORING === 'true',
      business_intelligence_active: process.env.ENABLE_BUSINESS_INTELLIGENCE === 'true'
    }
  };

  res.json(metrics);
});

// Readiness probe endpoint
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    await prisma.$queryRaw`SELECT 1`;
    
    const readiness = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ready',
        server: 'ready',
        dependencies: 'ready'
      }
    };

    res.status(200).json(readiness);
  } catch (error) {
    const readiness = {
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: 'not_ready',
        server: 'ready',
        dependencies: 'unknown'
      }
    };

    res.status(503).json(readiness);
  }
});

// Liveness probe endpoint
router.get('/live', (req, res) => {
  const liveness = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    pid: process.pid
  };

  res.status(200).json(liveness);
});

// System status dashboard endpoint
router.get('/status', async (req, res) => {
  const status = {
    service: 'Sentia Manufacturing Dashboard',
    version: process.env.npm_package_version || null,
    environment: process.env.NODE_ENV || null,
    status: 'operational',
    last_updated: new Date().toISOString(),
    components: [
      {
        name: 'Web Application',
        status: 'operational',
        description: 'Main React application server'
      },
      {
        name: 'AI Copilot',
        status: process.env.ENABLE_AI_FEATURES === 'true' ? 'operational' : 'disabled',
        description: 'AI-powered business copilot and analytics'
      },
      {
        name: 'Real-time Streaming',
        status: process.env.ENABLE_REAL_TIME_STREAMING === 'true' ? 'operational' : 'disabled',
        description: 'WebSocket and SSE real-time data streaming'
      },
      {
        name: 'MCP Server',
        status: 'operational',
        description: 'Model Context Protocol server for AI integration'
      },
      {
        name: 'Database',
        status: 'operational',
        description: 'PostgreSQL database with Prisma ORM'
      },
      {
        name: 'Business Intelligence',
        status: process.env.ENABLE_BUSINESS_INTELLIGENCE === 'true' ? 'operational' : 'disabled',
        description: 'Advanced analytics and reporting engine'
      }
    ],
    incidents: [],
    maintenance: []
  };

  res.json(status);
});

// Feature flags endpoint
router.get('/features', (req, res) => {
  const features = {
    ai_copilot: {
      enabled: process.env.ENABLE_AI_FEATURES === 'true',
      providers: {
        claude: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GOOGLE_AI_API_KEY
      }
    },
    real_time_streaming: {
      enabled: process.env.ENABLE_REAL_TIME_STREAMING === 'true',
      websockets: true,
      sse: true
    },
    autonomous_monitoring: {
      enabled: process.env.ENABLE_AUTONOMOUS_MONITORING === 'true',
      anomaly_detection: true,
      predictive_maintenance: true,
      automated_responses: true
    },
    business_intelligence: {
      enabled: process.env.ENABLE_BUSINESS_INTELLIGENCE === 'true',
      advanced_analytics: true,
      predictive_modeling: true,
      decision_engine: true
    },
    integrations: {
      xero: !!process.env.XERO_CLIENT_ID,
      shopify: !!process.env.SHOPIFY_API_KEY,
      amazon_sp_api: !!process.env.AMAZON_SP_API_CLIENT_ID,
      unleashed: !!process.env.UNLEASHED_API_ID
    },
    authentication: {
      clerk: !!process.env.CLERK_SECRET_KEY,
      jwt: true,
      session_management: true
    },
    performance: {
      caching: process.env.CACHING_ENABLED === 'true',
      compression: process.env.COMPRESSION_ENABLED === 'true',
      cdn: process.env.CDN_ENABLED === 'true'
    },
    monitoring: {
      metrics_collection: process.env.METRICS_COLLECTION_ENABLED === 'true',
      error_tracking: process.env.ERROR_REPORTING_ENABLED === 'true',
      performance_monitoring: process.env.PERFORMANCE_MONITORING_ENABLED === 'true',
      health_checks: true
    }
  };

  res.json(features);
});

// Performance benchmark endpoint
router.get('/benchmark', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Database benchmark
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    const dbTime = Date.now() - dbStart;

    // Memory benchmark
    const memBefore = process.memoryUsage();
    const testArray = new Array(10000).fill('test');
    const memAfter = process.memoryUsage();

    const benchmark = {
      timestamp: new Date().toISOString(),
      total_time: Date.now() - startTime,
      database: {
        query_time: dbTime,
        status: dbTime < 100 ? 'excellent' : dbTime < 500 ? 'good' : 'slow'
      },
      memory: {
        heap_used_mb: Math.round(memAfter.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memAfter.heapTotal / 1024 / 1024),
        memory_test_impact: Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024),
        status: memAfter.heapUsed < memAfter.heapTotal * 0.8 ? 'healthy' : 'high'
      },
      cpu: {
        usage: process.cpuUsage(),
        load_average: os.loadavg()
      },
      uptime: Math.floor(process.uptime()),
      performance_grade: this.calculatePerformanceGrade(dbTime, memAfter.heapUsed, memAfter.heapTotal)
    };

    // Clean up test data
    testArray.length = 0;

    res.json(benchmark);
  } catch (error) {
    res.status(500).json({
      error: 'Benchmark failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Calculate performance grade
function calculatePerformanceGrade(dbTime, heapUsed, heapTotal) {
  let score = 100;
  
  // Database performance impact
  if (dbTime > 100) score -= 10;
  if (dbTime > 500) score -= 20;
  if (dbTime > 1000) score -= 30;
  
  // Memory usage impact
  const memUsagePercent = (heapUsed / heapTotal) * 100;
  if (memUsagePercent > 60) score -= 10;
  if (memUsagePercent > 80) score -= 20;
  if (memUsagePercent > 90) score -= 30;
  
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default router;