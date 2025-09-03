import client from 'prom-client'

// Create a Registry to register the metrics
const register = new client.Registry()

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  app: 'sentia-manufacturing-dashboard',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register: register,
})

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['route', 'method', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000]
})

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['route', 'method', 'status_code']
})

const unleashed_api_requests = new client.Counter({
  name: 'unleashed_api_requests_total',
  help: 'Total number of Unleashed API requests',
  labelNames: ['endpoint', 'status']
})

const unleashed_api_duration = new client.Histogram({
  name: 'unleashed_api_duration_ms',
  help: 'Duration of Unleashed API requests in ms',
  labelNames: ['endpoint'],
  buckets: [100, 500, 1000, 2000, 5000]
})

const database_queries = new client.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table']
})

const active_connections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
})

// Register custom metrics
register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestsTotal)
register.registerMetric(unleashed_api_requests)
register.registerMetric(unleashed_api_duration)
register.registerMetric(database_queries)
register.registerMetric(active_connections)

// Middleware to track HTTP requests
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now()
  
  // Track when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start
    const route = req.route?.path || req.path || 'unknown'
    const method = req.method
    const statusCode = res.statusCode
    
    // Record metrics
    httpRequestDuration
      .labels(route, method, statusCode)
      .observe(duration)
    
    httpRequestsTotal
      .labels(route, method, statusCode)
      .inc()
  })
  
  next()
}

// Helper functions for custom metrics
export const recordUnleashedApiRequest = (endpoint, status, duration = null) => {
  unleashed_api_requests.labels(endpoint, status).inc()
  
  if (duration !== null) {
    unleashed_api_duration.labels(endpoint).observe(duration)
  }
}

export const recordDatabaseQuery = (operation, table) => {
  database_queries.labels(operation, table).inc()
}

export const setActiveConnections = (count) => {
  active_connections.set(count)
}

// Export metrics endpoint handler
export const getMetrics = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    const metrics = await register.metrics()
    res.end(metrics)
  } catch (error) {
    res.status(500).end(error.message)
  }
}

// Application-specific metrics
export const applicationMetrics = {
  // Track manufacturing job metrics
  jobsCreated: new client.Counter({
    name: 'manufacturing_jobs_created_total',
    help: 'Total number of manufacturing jobs created',
    labelNames: ['type', 'priority']
  }),
  
  // Track schedule optimization
  scheduleOptimizations: new client.Counter({
    name: 'schedule_optimizations_total',
    help: 'Total number of schedule optimizations performed',
    labelNames: ['result']
  }),
  
  // Track inventory levels
  inventoryLevels: new client.Gauge({
    name: 'inventory_levels',
    help: 'Current inventory levels by product',
    labelNames: ['product_code', 'warehouse']
  })
}

// Register application metrics
Object.values(applicationMetrics).forEach(metric => {
  register.registerMetric(metric)
})

export { register }
export default register