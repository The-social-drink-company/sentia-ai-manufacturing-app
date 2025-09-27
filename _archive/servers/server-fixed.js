import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { ClerkExpressWithAuth, clerkClient } from '@clerk/clerk-sdk-node';

// Note: NODE_OPTIONS should be set via environment or npm scripts
// e.g., cross-env NODE_OPTIONS=--max-old-space-size=128 node server-fixed.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const DATABASE_URL = process.env.DATABASE_URL || '';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL?.trim() || 'https://mcp-server-tkyu.onrender.com';

const DEPLOYMENT = {
  isRender: Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL),
  isRailway: Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN)
};

const allowedStaticPath = path.resolve(__dirname, 'dist');

const renderWsHost = process.env.RENDER_EXTERNAL_URL?.replace(/^https?:\/\//, '') || '';
const wsConnectHosts = ['ws://localhost:5000', 'wss://localhost:5000'];
if (renderWsHost) {
  wsConnectHosts.push(`wss://${renderWsHost}`);
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const sseClients = new Map();

const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY?.trim();
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY?.trim();
const ALLOW_MOCK_AUTH = process.env.ALLOW_MOCK_AUTH === 'true';
const HAS_CLERK_CONFIG = Boolean(CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY);

const log = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

// Log authentication configuration status
if (HAS_CLERK_CONFIG) {
  log.info('🔐 Clerk authentication enabled - All API requests require valid authentication');
} else {
  const isLocalDevelopment = !process.env.RENDER && !process.env.RAILWAY_ENVIRONMENT && NODE_ENV === 'development';
  if (isLocalDevelopment && ALLOW_MOCK_AUTH) {
    log.warn('⚠️  Mock authentication enabled for local development only');
  } else if (isLocalDevelopment) {
    log.error('❌ Authentication not configured - Set CLERK keys or ALLOW_MOCK_AUTH=true');
  } else {
    log.error('🚨 CRITICAL: Deployed environment without authentication - All API requests will be rejected');
  }
}

app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.id = randomUUID();
  res.locals.requestId = req.id;
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - started;
    log.info(`${req.id} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.use((req, res, next) => {
  res.success = (payload = {}, meta = {}) => {
    res.json({
      success: true,
      data: payload,
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
        ...meta
      }
    });
  };

  res.fail = (status, message, details) => {
    res.status(status).json({
      success: false,
      error: {
        message,
        details
      },
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString()
      }
    });
  };

  next();
});

const generateCorsOptions = () => {
  const staticOrigins = [
    process.env.RENDER_EXTERNAL_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN,
    process.env.CLIENT_URL,
    process.env.DEPLOYMENT_URL,
    process.env.FRONTEND_URL
  ].filter(Boolean);

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (staticOrigins.includes(origin)) return callback(null, true);
      if (/\.onrender\.com$/i.test(origin)) return callback(null, true);
      if (/\.railway\.app$/i.test(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    optionsSuccessStatus: 204
  };
};

const connectSrc = [
  "'self'",
  MCP_SERVER_URL,
  'https://*.onrender.com',
  'https://*.railway.app',
  ...wsConnectHosts
];

const cspDirectives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  blockAllMixedContent: [],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  frameAncestors: ["'self'"],
  imgSrc: ["'self'", 'data:', 'https://*.onrender.com'],
  objectSrc: ["'none'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  connectSrc
};

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: cspDirectives
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors(generateCorsOptions()));

app.use(
  compression({
    level: 6,
    threshold: 1024
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  express.static(allowedStaticPath, {
    index: false,
    maxAge: '365d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  })
);

// Clerk Authentication Middleware
const mockAuthMiddleware = (req, res, next) => {
  if (!ALLOW_MOCK_AUTH) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Mock authentication disabled. Configure Clerk or enable ALLOW_MOCK_AUTH=true for non-production use.'
      }
    });
  }

  req.user = {
    id: 'mock-user',
    role: 'administrator',
    email: 'mock@sentia-manufacturing.local',
    authProvider: 'mock'
  };
  next();
};

// SECURITY: Require explicit Clerk configuration for all environments except local development
const requireClerkAuth = HAS_CLERK_CONFIG
  ? ClerkExpressWithAuth({ secretKey: CLERK_SECRET_KEY })
  : (req, res, next) => {
      // Only allow mock auth in local development (not Render/Railway deployments)
      const isLocalDevelopment = !process.env.RENDER && !process.env.RAILWAY_ENVIRONMENT && NODE_ENV === 'development';

      if (!isLocalDevelopment) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'Authentication service not configured. CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY environment variables are required.',
            environment: NODE_ENV,
            deployment: DEPLOYMENT.isRender ? 'render' : DEPLOYMENT.isRailway ? 'railway' : 'local'
          }
        });
      }

      // Local development fallback only
      if (ALLOW_MOCK_AUTH) {
        req.user = {
          id: 'local-dev-user',
          role: 'administrator',
          email: 'dev@sentia-manufacturing.local',
          authProvider: 'local-development-only'
        };
        console.warn('[SECURITY] Using mock authentication for local development only');
        next();
      } else {
        return res.status(503).json({
          success: false,
          error: {
            message: 'Authentication required. Set ALLOW_MOCK_AUTH=true for local development or configure Clerk keys.'
          }
        });
      }
    };

const enrichUserFromClerk = async (req, res, next) => {
  try {
    if (!HAS_CLERK_CONFIG) {
      return next();
    }

    const sessionId = req.auth?.sessionId;
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized: Clerk session missing' }
      });
    }

    const session = await clerkClient.sessions.getSession(sessionId);
    if (!session?.userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized: Clerk session invalid' }
      });
    }

    const user = await clerkClient.users.getUser(session.userId);
    req.user = {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.publicMetadata?.role || 'viewer',
      authProvider: 'clerk'
    };
    next();
  } catch (error) {
    log.error('Clerk authentication error', error);
    next(error);
  }
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const validators = {
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && Number.isFinite(value),
  boolean: (value) => typeof value === 'boolean',
  object: (value) => isObject(value),
  array: (value) => Array.isArray(value)
};

const validateBody = (schema) => (req, res, next) => {
  const errors = [];

  Object.entries(schema).forEach(([key, rules]) => {
    const value = req.body[key];
    const { required = false, type, enum: enumValues } = rules;

    if (required && value === undefined) {
      errors.push(`${key} is required`);
      return;
    }

    if (value === undefined) return;

    if (type && !validators[type]?.(value)) {
      errors.push(`${key} must be of type ${type}`);
      return;
    }

    if (enumValues && !enumValues.includes(value)) {
      errors.push(`${key} must be one of: ${enumValues.join(', ')}`);
    }
  });

  if (errors.length > 0) {
    return res.fail(400, 'Validation failed', { issues: errors });
  }

  next();
};

const healthRouter = express.Router();

// Support both GET and HEAD requests for health checks
healthRouter.get('/health', (req, res) => {
  res.success({ status: 'ok', uptime: process.uptime() });
});

healthRouter.head('/health', (req, res) => {
  res.status(200).end();
});

healthRouter.get('/health/live', (req, res) => {
  res.success({ status: 'live', uptime: process.uptime() });
});

healthRouter.head('/health/live', (req, res) => {
  res.status(200).end();
});

const checkDatabaseConnectivity = async () => {
  if (!DATABASE_URL) {
    return { status: 'skipped', message: 'DATABASE_URL not configured' };
  }

  let Client;
  try {
    ({ Client } = await import('pg'));
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      return { status: 'skipped', message: 'pg client not installed' };
    }
    return { status: 'unhealthy', message: error.message };
  }

  try {
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: DEPLOYMENT.isRender || DEPLOYMENT.isRailway ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
};

healthRouter.get('/health/ready', async (req, res) => {
  const dbStatus = await checkDatabaseConnectivity();
  const ok = dbStatus.status === 'healthy' || dbStatus.status === 'skipped';

  if (!ok) {
    return res.fail(503, 'Service not ready', { database: dbStatus });
  }

  res.success({ status: 'ready', database: dbStatus });
});

healthRouter.get('/api/status', async (req, res) => {
  const dbStatus = await checkDatabaseConnectivity();
  res.success({
    environment: NODE_ENV,
    deployment: DEPLOYMENT.isRender ? 'render' : DEPLOYMENT.isRailway ? 'railway' : 'local',
    node: process.version,
    memory: process.memoryUsage(),
    database: dbStatus,
    time: new Date().toISOString()
  });
});

app.use(healthRouter);

const apiRouter = express.Router();
apiRouter.use(requireClerkAuth, enrichUserFromClerk);

apiRouter.get('/dashboard/overview', (req, res) => {
  res.success({
    summary: {
      productionHealth: 'stable',
      workingCapitalStatus: 'optimal',
      alerts: 2
    }
  });
});

apiRouter.get('/dashboard/widgets', (req, res) => {
  res.success({
    widgets: [
      { id: 'inventoryTurns', title: 'Inventory Turns', value: 9.4 },
      { id: 'cashRunway', title: 'Cash Runway', value: '18 months' }
    ]
  });
});

apiRouter.get('/dashboard/widgets/:id', (req, res) => {
  res.success({
    widget: {
      id: req.params.id,
      title: `Widget ${req.params.id}`,
      lastUpdated: new Date().toISOString()
    }
  });
});

apiRouter.post(
  '/dashboard/layout',
  validateBody({ layout: { required: true, type: 'array' } }),
  (req, res) => {
    res.success({ message: 'Layout saved', layout: req.body.layout });
  }
);

apiRouter.get('/dashboard/layout', (req, res) => {
  res.success({ layout: [] });
});

apiRouter.get('/dashboard/enterprise', (req, res) => {
  res.success({
    regions: ['NA', 'EMEA', 'APAC'],
    timestamp: new Date().toISOString()
  });
});

const workingCapitalRouter = express.Router();

workingCapitalRouter.get('/overview', (req, res) => {
  res.success({
    liquidityScore: 87,
    runwayDays: 245,
    trends: { weekly: 'positive' }
  });
});

workingCapitalRouter.get('/cash-runway', (req, res) => {
  res.success({ runwayMonths: 18, scenario: 'base' });
});

workingCapitalRouter.post(
  '/optimize',
  validateBody({ strategy: { required: true, type: 'string' } }),
  (req, res) => {
    res.success({
      recommendation: `Optimization strategy ${req.body.strategy} queued`,
      etaMinutes: 5
    });
  }
);

workingCapitalRouter.get('/benchmarks', (req, res) => {
  res.success({ industry: 'Manufacturing', percentile: 78 });
});

workingCapitalRouter.get('/funding-scenarios', (req, res) => {
  res.success({ scenarios: ['equity', 'credit', 'hybrid'] });
});

apiRouter.use('/working-capital', workingCapitalRouter);

const productionRouter = express.Router();

productionRouter.get('/jobs', (req, res) => {
  res.success({ jobs: [{ id: 'JOB-101', status: 'in-progress' }] });
});

productionRouter.get('/metrics', (req, res) => {
  res.success({ throughput: 92, downtimeMinutes: 14 });
});

productionRouter.post(
  '/update',
  validateBody({ jobId: { required: true, type: 'string' }, status: { required: true, type: 'string' } }),
  (req, res) => {
    res.success({ message: 'Production job updated', update: req.body });
  }
);

apiRouter.use('/production', productionRouter);

const inventoryRouter = express.Router();

inventoryRouter.get('/levels', (req, res) => {
  res.success({ levels: [{ sku: 'SKU-01', quantity: 150 }] });
});

inventoryRouter.get('/movements', (req, res) => {
  res.success({ movements: [{ sku: 'SKU-01', delta: -10, reason: 'shipment' }] });
});

inventoryRouter.post(
  '/optimize',
  validateBody({ objectives: { required: true, type: 'array' } }),
  (req, res) => {
    res.success({ message: 'Inventory optimization queued', objectives: req.body.objectives });
  }
);

apiRouter.use('/inventory', inventoryRouter);

const analyticsRouter = express.Router();

analyticsRouter.get('/forecast', (req, res) => {
  res.success({ forecast: { demand: 1230, confidence: 0.92 } });
});

analyticsRouter.post(
  '/what-if',
  validateBody({ variables: { required: true, type: 'object' } }),
  (req, res) => {
    res.success({ message: 'Scenario enqueued', variables: req.body.variables });
  }
);

analyticsRouter.get('/reports', (req, res) => {
  res.success({ reports: [{ id: 'RPT-1', generatedAt: new Date().toISOString() }] });
});

apiRouter.use('/analytics', analyticsRouter);

apiRouter.get('/dashboard/alerts', (req, res) => {
  res.success({ alerts: [] });
});

app.get('/api/dashboard/realtime', requireClerkAuth, enrichUserFromClerk, (req, res) => {
  res.fail(410, 'Realtime endpoint moved to /api/events');
});

app.get('/api/events', requireClerkAuth, enrichUserFromClerk, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = req.id;
  sseClients.set(clientId, res);

  res.write(`event: connected\ndata: ${JSON.stringify({ requestId: req.id, user: req.user })}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

app.post(
  '/api/mcp/request',
  requireClerkAuth,
  enrichUserFromClerk,
  validateBody({ endpoint: { required: true, type: 'string' }, payload: { type: 'object' } }),
  async (req, res, next) => {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });

      const result = await response.json();

      res.success({
        proxy: MCP_SERVER_URL,
        status: response.status,
        result
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get('/api/mcp/status', requireClerkAuth, enrichUserFromClerk, async (req, res, next) => {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const payload = await response.json().catch(() => ({}));

    res.success({
      proxy: MCP_SERVER_URL,
      status: response.status,
      payload
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api', apiRouter);

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.fail(404, 'API route not found');
  }
  next();
});

app.use((req, res, next) => {
  // Support both GET and HEAD for SPA routes
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api')) return next();

  // For HEAD requests, just send status without body
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  res.sendFile(path.join(allowedStaticPath, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  log.error(req.id || 'unknown', err.message, err.stack);
  res.status(status).json({
    success: false,
    error: {
      message: IS_PRODUCTION ? 'Internal server error' : err.message,
      details: !IS_PRODUCTION ? err.stack : undefined
    },
    meta: {
      requestId: req.id || 'unknown',
      timestamp: new Date().toISOString()
    }
  });
});

const broadcastSse = (event, data) => {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => client.write(message));
};

wss.on('connection', (socket) => {
  const connectionId = randomUUID();
  log.info('WebSocket connected', connectionId);

  socket.send(
    JSON.stringify({
      type: 'welcome',
      connectionId,
      timestamp: new Date().toISOString()
    })
  );

  socket.on('message', (raw) => {
    log.info('WebSocket message', connectionId, raw.toString());
  });

  socket.on('close', () => {
    log.info('WebSocket closed', connectionId);
  });
});

const gracefulShutdown = (signal) => {
  log.warn(`${signal} received. Starting graceful shutdown.`);

  wss.clients.forEach((client) => client.close(1001, 'Server shutting down'));
  sseClients.forEach((client) => client.end());

  server.close(() => {
    log.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    log.error('Force exiting after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', reason);
});

const heartbeat = setInterval(() => {
  const payload = { timestamp: new Date().toISOString(), uptime: process.uptime() };
  broadcastSse('heartbeat', payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'heartbeat', ...payload }));
    }
  });
}, 30000);
heartbeat.unref();

server.listen(PORT, '0.0.0.0', () => {
  const details = {
    port: PORT,
    environment: NODE_ENV,
    deployment: DEPLOYMENT.isRender ? 'render' : DEPLOYMENT.isRailway ? 'railway' : 'local',
    mcpServer: MCP_SERVER_URL
  };

  log.info('Server started', details);
  broadcastSse('server-ready', { port: PORT, startedAt: new Date().toISOString() });
});

export default app;

