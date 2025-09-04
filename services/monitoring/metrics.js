// Metrics Collection Service
import prometheus from 'prom-client';
import { logger } from '../logging/logger.js';

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics (CPU, memory, etc.)
prometheus.collectDefaultMetrics({ register, prefix: 'sentia_' });

// Custom Metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'sentia_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'sentia_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const dbQueryDuration = new prometheus.Histogram({
  name: 'sentia_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 2, 5]
});

const dbConnectionPool = new prometheus.Gauge({
  name: 'sentia_db_connection_pool_size',
  help: 'Number of database connections in pool',
  labelNames: ['state'] // active, idle, total
});

const queueJobsTotal = new prometheus.Counter({
  name: 'sentia_queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'] // completed, failed, retried
});

const queueJobDuration = new prometheus.Histogram({
  name: 'sentia_queue_job_duration_seconds',
  help: 'Duration of queue job execution',
  labelNames: ['queue', 'job_type'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120, 300, 600]
});

const queueDepth = new prometheus.Gauge({
  name: 'sentia_queue_depth',
  help: 'Number of jobs in queue',
  labelNames: ['queue', 'state'] // waiting, active, delayed, failed
});

const workingCapitalMetrics = new prometheus.Gauge({
  name: 'sentia_working_capital_metrics',
  help: 'Working capital metrics',
  labelNames: ['metric'] // current, limit, utilization, available
});

const forecastAccuracy = new prometheus.Gauge({
  name: 'sentia_forecast_accuracy',
  help: 'Forecast accuracy percentage',
  labelNames: ['product', 'horizon']
});

const sseConnections = new prometheus.Gauge({
  name: 'sentia_sse_connections',
  help: 'Number of active SSE connections'
});

const cacheHitRate = new prometheus.Gauge({
  name: 'sentia_cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_type'] // redis, memory
});

const authEvents = new prometheus.Counter({
  name: 'sentia_auth_events_total',
  help: 'Authentication events',
  labelNames: ['event', 'role'] // login, logout, token_refresh
});

const businessMetrics = new prometheus.Gauge({
  name: 'sentia_business_metrics',
  help: 'Business KPI metrics',
  labelNames: ['metric'] // revenue, orders, inventory_value, customer_count
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionPool);
register.registerMetric(queueJobsTotal);
register.registerMetric(queueJobDuration);
register.registerMetric(queueDepth);
register.registerMetric(workingCapitalMetrics);
register.registerMetric(forecastAccuracy);
register.registerMetric(sseConnections);
register.registerMetric(cacheHitRate);
register.registerMetric(authEvents);
register.registerMetric(businessMetrics);

// Middleware to track HTTP metrics
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });
  
  next();
};

// Database metrics helper
export const trackDbQuery = (operation, table, duration) => {
  dbQueryDuration.observe({ operation, table }, duration / 1000);
};

// Queue metrics helpers
export const trackQueueJob = (queue, jobType, status, duration = null) => {
  queueJobsTotal.inc({ queue, status });
  if (duration) {
    queueJobDuration.observe({ queue, job_type: jobType }, duration / 1000);
  }
};

export const updateQueueDepth = (queue, waiting, active, delayed, failed) => {
  queueDepth.set({ queue, state: 'waiting' }, waiting);
  queueDepth.set({ queue, state: 'active' }, active);
  queueDepth.set({ queue, state: 'delayed' }, delayed);
  queueDepth.set({ queue, state: 'failed' }, failed);
};

// Working capital metrics
export const updateWorkingCapitalMetrics = (metrics) => {
  workingCapitalMetrics.set({ metric: 'current' }, metrics.current || 0);
  workingCapitalMetrics.set({ metric: 'limit' }, metrics.limit || 0);
  workingCapitalMetrics.set({ metric: 'utilization' }, metrics.utilization || 0);
  workingCapitalMetrics.set({ metric: 'available' }, metrics.available || 0);
};

// Forecast metrics
export const updateForecastAccuracy = (product, horizon, accuracy) => {
  forecastAccuracy.set({ product, horizon }, accuracy);
};

// SSE metrics
export const updateSSEConnections = (count) => {
  sseConnections.set(count);
};

// Cache metrics
export const updateCacheHitRate = (cacheType, rate) => {
  cacheHitRate.set({ cache_type: cacheType }, rate);
};

// Auth metrics
export const trackAuthEvent = (event, role = 'unknown') => {
  authEvents.inc({ event, role });
};

// Business metrics
export const updateBusinessMetrics = (metrics) => {
  Object.entries(metrics).forEach(([key, value]) => {
    businessMetrics.set({ metric: key }, value);
  });
};

// Metrics collection endpoint
export const getMetrics = async () => {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('Error collecting metrics:', error);
    throw error;
  }
};

// Metrics endpoint handler
export const metricsHandler = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await getMetrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Error serving metrics:', error);
    res.status(500).send('Error collecting metrics');
  }
};

// Health check with detailed status
export const healthCheck = async () => {
  const checks = {
    server: 'healthy',
    database: 'unknown',
    redis: 'unknown',
    queues: 'unknown',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Check database
    const { prisma } = await import('../../prisma/client.js');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    logger.error('Database health check failed:', error);
  }
  
  try {
    // Check Redis
    const { redis } = await import('../cache/redis.js');
    await redis.ping();
    checks.redis = 'healthy';
  } catch (error) {
    checks.redis = 'unhealthy';
    logger.error('Redis health check failed:', error);
  }
  
  try {
    // Check queues
    const { checkQueuesHealth } = await import('../queues/index.js');
    const queueHealth = await checkQueuesHealth();
    checks.queues = queueHealth ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.queues = 'unhealthy';
    logger.error('Queue health check failed:', error);
  }
  
  // Overall health
  const isHealthy = Object.values(checks)
    .filter(v => typeof v === 'string' && v !== 'timestamp')
    .every(v => v === 'healthy');
  
  return {
    status: isHealthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
};

export default {
  register,
  metricsMiddleware,
  metricsHandler,
  healthCheck,
  trackDbQuery,
  trackQueueJob,
  updateQueueDepth,
  updateWorkingCapitalMetrics,
  updateForecastAccuracy,
  updateSSEConnections,
  updateCacheHitRate,
  trackAuthEvent,
  updateBusinessMetrics,
  getMetrics
};