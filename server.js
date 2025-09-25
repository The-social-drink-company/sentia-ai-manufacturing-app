import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import Redis from 'ioredis';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/express';
import { createLogger, format, transports } from 'winston';

const ENV = process.env.NODE_ENV ?? 'development';
const isProduction = ENV === 'production';
const isTest = ENV === 'test';
const PORT = Number.parseInt(process.env.PORT ?? '', 10) || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const base = { ...meta };
      if (stack) {
        base.stack = stack;
      }
      const metaString = Object.keys(base).length ? ` ${JSON.stringify(base)}` : '';
      return `${timestamp} [${level}] ${message}${metaString}`;
    })
  ),
  transports: [
    new transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

logger.info('Bootstrapping Sentia Manufacturing Dashboard server', {
  env: ENV,
  port: PORT
});

const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['error', 'warn']
});

const redisUrl =
  process.env.REDIS_URL ||
  process.env.REDIS_TLS_URL ||
  process.env.KV_URL ||
  'redis://127.0.0.1:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false
});

redis.on('connect', () => {
  const display = redisUrl.includes('@') ? redisUrl.split('@').pop() : redisUrl;
  logger.info('Connected to Redis', { url: display });
});

redis.on('error', (error) => {
  logger.error('Redis connection error', { message: error.message });
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const compressionOptions = {
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.path === '/api/dashboard/realtime') {
      return false;
    }
    return compression.filter(req, res);
  }
};
app.use(compression(compressionOptions));

const helmetOptions = {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'https:', 'wss:', 'http:'],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"]
        }
      }
    : false
};
app.use(helmet(helmetOptions));

const defaultOrigins = [
  'https://deployrend.financeflo.ai',
  'https://testingrend.financeflo.ai',
  'https://prodrend.financeflo.ai',
  'http://localhost:3000'
];
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (!isProduction || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400,
  exposedHeaders: ['X-Request-Id']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] || crypto.randomUUID()).toString();
  const startTime = Date.now();

  res.setHeader('X-Request-Id', requestId);

  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.locals.logger = logger.child({ requestId });

  res.on('finish', () => {
    res.locals.logger.info('Request completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTime
    });
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      res.locals.logger.warn('Request connection closed prematurely', {
        method: req.method,
        path: req.originalUrl
      });
    }
  });

  next();
});

app.use(ClerkExpressWithAuth());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please try again shortly.',
      requestId: res.locals.requestId
    });
  }
});
app.use('/api', apiLimiter);

const ensureAuth = ClerkExpressRequireAuth();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

async function checkDatabaseHealth() {
  const result = { status: 'unknown', latencyMs: null };
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    result.status = 'up';
  } catch (error) {
    logger.error('Database health check failed', { message: error.message });
    result.status = 'down';
    result.error = error.message;
  } finally {
    result.latencyMs = Number((performance.now() - start).toFixed(2));
  }
  return result;
}

async function checkCacheHealth() {
  const result = { status: 'unknown', latencyMs: null };
  const start = performance.now();
  try {
    const response = await redis.ping();
    if (response === 'PONG') {
      result.status = 'up';
    } else {
      result.status = 'degraded';
      result.error = `Unexpected response: ${response}`;
    }
  } catch (error) {
    logger.error('Cache health check failed', { message: error.message });
    result.status = 'down';
    result.error = error.message;
  } finally {
    result.latencyMs = Number((performance.now() - start).toFixed(2));
  }
  return result;
}

app.get(
  '/api/health',
  asyncHandler(async (req, res) => {
    const [database, cacheState] = await Promise.all([checkDatabaseHealth(), checkCacheHealth()]);
    res.status(200).json({
      status: database.status === 'up' && cacheState.status === 'up' ? 'ok' : 'degraded',
      environment: ENV,
      timestamp: new Date().toISOString(),
      database,
      cache: cacheState,
      version: process.env.VITE_APP_VERSION || process.env.APP_VERSION || 'unknown'
    });
  })
);

app.get(
  '/api/health/enterprise',
  asyncHandler(async (req, res) => {
    const [database, cacheState] = await Promise.all([checkDatabaseHealth(), checkCacheHealth()]);
    const memory = process.memoryUsage();
    res.status(200).json({
      service: 'Sentia Manufacturing Dashboard',
      environment: ENV,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed
      },
      database,
      cache: cacheState,
      timestamp: new Date().toISOString()
    });
  })
);

const cache = {
  async get(key) {
    if (redis.status !== 'ready') {
      return null;
    }
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },
  async set(key, value, ttlSeconds = 60) {
    if (redis.status !== 'ready') {
      return;
    }
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }
};

const sseClients = new Map();
let sseClientId = 0;
let io;

const emitRealtime = (event, payload) => {
  const envelope = {
    event,
    payload,
    timestamp: new Date().toISOString()
  };

  for (const [clientId, client] of sseClients.entries()) {
    if (client.res.writableEnded) {
      sseClients.delete(clientId);
      continue;
    }
    try {
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(envelope)}\n\n`);
    } catch (error) {
      client.logger?.warn('Failed to dispatch SSE payload', {
        event,
        message: error.message
      });
      sseClients.delete(clientId);
    }
  }

  if (io) {
    io.emit(event, envelope);
  } else {
    logger.warn('Socket server not initialised; skipped WebSocket broadcast', { event });
  }
};

app.get('/api/dashboard/realtime', ensureAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const clientId = ++sseClientId;
  const clientLogger = res.locals.logger.child({ clientId });

  sseClients.set(clientId, { res, logger: clientLogger });
  clientLogger.info('SSE client connected');

  res.write(`event: connected\ndata: ${JSON.stringify({ requestId: res.locals.requestId })}\n\n`);

  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    res.write('event: heartbeat\ndata: {}\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
    clientLogger.info('SSE client disconnected');
  });
});

const dashboardRouter = express.Router();

dashboardRouter.use(ensureAuth);

dashboardRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const cacheKey = 'dashboard:summary';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      metrics: {
        productionEfficiency: 0.93,
        onTimeDeliveryRate: 0.97,
        inventoryTurns: 8.2,
        workingCapitalRatio: 1.4
      }
    };

    await cache.set(cacheKey, summary, 60);
    res.json(summary);
  })
);

dashboardRouter.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    const alerts = (await cache.get('dashboard:alerts')) || [];
    res.json(alerts);
  })
);

dashboardRouter.post(
  '/alerts',
  asyncHandler(async (req, res) => {
    const alert = {
      ...req.body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      createdBy: req.auth?.userId || 'system'
    };

    const alerts = (await cache.get('dashboard:alerts')) || [];
    alerts.unshift(alert);
    await cache.set('dashboard:alerts', alerts, 300);

    emitRealtime('alert:new', alert);

    res.status(201).json(alert);
  })
);

app.use('/api/dashboard', dashboardRouter);

const workingCapitalRouter = express.Router();

workingCapitalRouter.use(ensureAuth);

workingCapitalRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const cacheKey = 'working-capital:overview';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const overview = {
      generatedAt: new Date().toISOString(),
      liquidity: 3250000,
      payables: 1450000,
      receivables: 2100000,
      netWorkingCapital: 1800000
    };

    await cache.set(cacheKey, overview, 120);
    res.json(overview);
  })
);

app.use('/api/working-capital', workingCapitalRouter);

const financialRouter = express.Router();

financialRouter.use(ensureAuth);

financialRouter.get(
  '/reports',
  asyncHandler(async (req, res) => {
    res.json({
      generatedAt: new Date().toISOString(),
      period: req.query.period || 'MTD',
      revenue: 12500000,
      expenses: 8300000,
      ebitda: 4200000
    });
  })
);

financialRouter.get(
  '/forecasts',
  asyncHandler(async (req, res) => {
    res.json({
      horizon: req.query.horizon || '90d',
      updatedAt: new Date().toISOString(),
      cashFlow: {
        best: 5800000,
        expected: 5100000,
        worst: 4200000
      }
    });
  })
);

app.use('/api/financial', financialRouter);

const inventoryRouter = express.Router();

inventoryRouter.use(ensureAuth);

inventoryRouter.get(
  '/levels',
  asyncHandler(async (req, res) => {
    const levels = {
      generatedAt: new Date().toISOString(),
      facilities: [
        { location: 'Barnsley', utilization: 0.81 },
        { location: 'Essen', utilization: 0.74 }
      ]
    };

    res.json(levels);
  })
);

inventoryRouter.post(
  '/adjustment',
  asyncHandler(async (req, res) => {
    const adjustment = {
      ...req.body,
      id: crypto.randomUUID(),
      approved: false,
      submittedAt: new Date().toISOString(),
      submittedBy: req.auth?.userId || 'system'
    };

    emitRealtime('inventory:change', adjustment);

    res.status(202).json(adjustment);
  })
);

app.use('/api/inventory', inventoryRouter);

const productionRouter = express.Router();

productionRouter.use(ensureAuth);

productionRouter.get(
  '/schedule',
  asyncHandler(async (req, res) => {
    const schedule = {
      generatedAt: new Date().toISOString(),
      shifts: [
        { id: 'shift-A', status: 'running', outputTarget: 1200, outputActual: 1184 },
        { id: 'shift-B', status: 'planned', outputTarget: 1300 }
      ]
    };
    res.json(schedule);
  })
);

productionRouter.post(
  '/events',
  asyncHandler(async (req, res) => {
    const event = {
      ...req.body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      createdBy: req.auth?.userId || 'system'
    };

    emitRealtime('production:update', event);

    res.status(201).json(event);
  })
);

app.use('/api/production', productionRouter);

const analyticsRouter = express.Router();

analyticsRouter.use(ensureAuth);

analyticsRouter.get(
  '/insights',
  asyncHandler(async (req, res) => {
    res.json({
      generatedAt: new Date().toISOString(),
      insights: [
        {
          id: crypto.randomUUID(),
          message: 'Predictive maintenance window approaching for line 4.',
          severity: 'warning'
        }
      ]
    });
  })
);

analyticsRouter.post(
  '/metrics',
  asyncHandler(async (req, res) => {
    const metric = {
      ...req.body,
      id: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),
      capturedBy: req.auth?.userId || 'system'
    };

    emitRealtime('metric:update', metric);

    res.status(201).json(metric);
  })
);

app.use('/api/analytics', analyticsRouter);

const aiRouter = express.Router();



aiRouter.use(ensureAuth);

aiRouter.post(
  '/prompt',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        requestId: res.locals.requestId
      });
    }

    const response = {
      prompt,
      response: 'AI response placeholder. Integrate with Anthropic/OpenAI services.',
      generatedAt: new Date().toISOString()
    };

    emitRealtime('ai:response', response);

    res.status(201).json(response);
  })
);

aiRouter.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const insights = {
      generatedAt: new Date().toISOString(),
      items: [
        {
          id: crypto.randomUUID(),
          summary: 'AI flagged supply chain risk due to shipping delays in APAC.',
          priority: 'high'
        }
      ]
    };

    emitRealtime('ai:insight', insights);

    res.json(insights);
  })
);

app.use('/api/ai', aiRouter);

const integrationStatusRouter = (serviceName) => {
  const router = express.Router();
  router.use(ensureAuth);
  router.get(
    '/status',
    asyncHandler(async (req, res) => {
      const status = {
        service: serviceName,
        lastSyncAt: new Date().toISOString(),
        state: 'operational'
      };

      res.json(status);
    })
  );
  return router;
};

app.use('/api/xero', integrationStatusRouter('xero'));
app.use('/api/shopify', integrationStatusRouter('shopify'));
app.use('/api/amazon', integrationStatusRouter('amazon'));
app.use('/api/unleashed', integrationStatusRouter('unleashed'));

const adminRouter = express.Router();

adminRouter.use(ensureAuth);

adminRouter.get(
  '/environment',
  asyncHandler(async (req, res) => {
    res.json({
      environment: ENV,
      releaseId: process.env.RAILWAY_GIT_COMMIT || process.env.RENDER_GIT_COMMIT || null,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime())
    });
  })
);

adminRouter.post(
  '/cache/flush',
  asyncHandler(async (req, res) => {
    if (redis.status !== 'ready') {
      return res.status(503).json({
        error: 'Cache is not connected',
        requestId: res.locals.requestId
      });
    }

    await redis.flushall('ASYNC');
    res.status(202).json({ message: 'Cache flush scheduled' });
  })
);

app.use('/api/admin', adminRouter);

const server = createServer(app);

io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (!isProduction || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
});

io.on('connection', (socket) => {
  const socketLogger = logger.child({ socketId: socket.id });
  socketLogger.info('Socket connected', {
    ip: socket.handshake.address
  });

  const forward = (eventName) => {
    socket.on(eventName, (payload) => {
      socketLogger.debug(`Received ${eventName}`, { payload });
      emitRealtime(eventName, payload);
    });
  };

  forward('production:update');
  forward('inventory:change');
  forward('alert:new');
  forward('metric:update');
  forward('ai:response');
  forward('ai:insight');

  socket.on('disconnect', (reason) => {
    socketLogger.info('Socket disconnected', { reason });
  });
});

if (fs.existsSync(distDir)) {
  app.use(
    express.static(distDir, {
      maxAge: isProduction ? '1y' : '1h',
      index: false
    })
  );

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    return next();
  });
} else {
  logger.warn('Static dist folder not found. Skipping static file serving.', { distDir });
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Not Found',
      requestId: res.locals.requestId
    });
  }
  return next();
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isServerError = statusCode >= 500;

  res.locals.logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    statusCode
  });

  res.status(statusCode).json({
    error: isServerError ? 'Internal Server Error' : err.message,
    requestId: res.locals.requestId
  });
});

async function start() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL', { message: error.message });
    throw error;
  }

  if (redis.status === 'end' || redis.status === 'wait') {
    redis.connect().catch((error) => {
      logger.error('Redis connection failure', { message: error.message });
    });
  }

  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      logger.error('HTTP server failed to start', { message: error.message });
      reject(error);
    });

    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`, { env: ENV });
      resolve();
    });
  });
}

let serverStarted = false;

if (!isTest) {
  start()
    .then(() => {
      serverStarted = true;
    })
    .catch((error) => {
      logger.error('Fatal startup error', { message: error.message });
      process.exit(1);
    });
}

async function shutdown(signal) {
  logger.info('Received shutdown signal', { signal });

  if (serverStarted) {
    await new Promise((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }

  io?.close();

  await prisma
    .$disconnect()
    .then(() => logger.info('Disconnected Prisma client'))
    .catch((error) => logger.error('Error disconnecting Prisma', { message: error.message }));

  if (redis.status === 'ready') {
    await redis
      .quit()
      .then(() => logger.info('Redis connection closed'))
      .catch((error) => logger.error('Error closing Redis connection', { message: error.message }));
  }

  process.exit(0);
}

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      logger.error('Error during shutdown', { message: error.message });
      process.exit(1);
    });
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

export { app, server, io, prisma, redis, emitRealtime };

