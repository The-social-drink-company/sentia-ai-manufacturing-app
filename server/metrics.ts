/**
 * Prometheus Metrics for Multi-Tenant Middleware
 *
 * BMAD-MULTITENANT-003 Story 6: Monitoring & Alerts
 *
 * Custom metrics for monitoring tenant middleware performance,
 * feature flag usage, RBAC enforcement, and system health.
 *
 * @module server/metrics
 */

import { register, Counter, Histogram, Gauge } from 'prom-client'

// Enable default metrics (CPU, memory, event loop, etc.)
register.setDefaultLabels({
  app: 'capliquify-backend',
  environment: process.env.NODE_ENV || 'development',
})

// ==================== TENANT METRICS ====================

/**
 * Total requests per tenant
 * Labels: tenant_id, method, route, status
 */
export const tenantRequestsTotal = new Counter({
  name: 'tenant_requests_total',
  help: 'Total HTTP requests per tenant',
  labelNames: ['tenant_id', 'tenant_slug', 'method', 'route', 'status'],
})

/**
 * Active tenants gauge
 */
export const tenantActive = new Gauge({
  name: 'tenant_active',
  help: 'Number of active tenants in last 5 minutes',
})

/**
 * Tenant creation duration
 */
export const tenantCreationDuration = new Histogram({
  name: 'tenant_creation_duration_seconds',
  help: 'Time to create tenant + provision schema',
  buckets: [0.1, 0.5, 1, 2, 5, 10], // seconds
})

// ==================== MIDDLEWARE METRICS ====================

/**
 * Middleware processing time
 * Labels: middleware_name (tenant, feature, rbac)
 */
export const middlewareLatency = new Histogram({
  name: 'middleware_latency_seconds',
  help: 'Middleware processing time in seconds',
  labelNames: ['middleware_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5], // milliseconds to seconds
})

/**
 * Middleware errors
 * Labels: middleware_name, error_type
 */
export const middlewareErrors = new Counter({
  name: 'middleware_errors_total',
  help: 'Total middleware errors',
  labelNames: ['middleware_name', 'error_type'],
})

// ==================== FEATURE FLAG METRICS ====================

/**
 * Feature flag checks
 * Labels: feature_name, tenant_tier, allowed
 */
export const featureFlagChecks = new Counter({
  name: 'feature_flag_checks_total',
  help: 'Total feature flag checks',
  labelNames: ['feature_name', 'tenant_tier', 'allowed'],
})

/**
 * Feature flag blocks (403 responses)
 * Labels: feature_name, tenant_tier
 */
export const featureFlagBlocks = new Counter({
  name: 'feature_flag_blocks_total',
  help: 'Total feature flag blocks (upgrade required)',
  labelNames: ['feature_name', 'tenant_tier'],
})

// ==================== RBAC METRICS ====================

/**
 * RBAC permission checks
 * Labels: user_role, required_role, allowed
 */
export const rbacChecks = new Counter({
  name: 'rbac_checks_total',
  help: 'Total RBAC permission checks',
  labelNames: ['user_role', 'required_role', 'allowed'],
})

/**
 * RBAC permission denials (403)
 * Labels: user_role, required_role, route
 */
export const rbacDenials = new Counter({
  name: 'rbac_denials_total',
  help: 'Total RBAC permission denials',
  labelNames: ['user_role', 'required_role', 'route'],
})

// ==================== DATABASE METRICS ====================

/**
 * Database queries per tenant schema
 * Labels: tenant_id, table_name, operation
 */
export const tenantSchemaQueries = new Counter({
  name: 'tenant_schema_queries_total',
  help: 'Total queries executed per tenant schema',
  labelNames: ['tenant_id', 'table_name', 'operation'],
})

/**
 * Database query duration
 * Labels: operation (SELECT, INSERT, UPDATE, DELETE)
 */
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query execution time',
  labelNames: ['operation', 'table_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
})

/**
 * Database connection pool metrics
 */
export const databaseConnectionsActive = new Gauge({
  name: 'database_connections_active',
  help: 'Active database connections',
})

export const databaseConnectionsIdle = new Gauge({
  name: 'database_connections_idle',
  help: 'Idle database connections in pool',
})

export const databaseConnectionsWaiting = new Gauge({
  name: 'database_connections_waiting',
  help: 'Clients waiting for database connection',
})

// ==================== AUTHENTICATION METRICS ====================

/**
 * Clerk session verifications
 * Labels: status (success, expired, invalid)
 */
export const clerkSessionVerifications = new Counter({
  name: 'clerk_session_verifications_total',
  help: 'Total Clerk session verification attempts',
  labelNames: ['status'],
})

/**
 * Failed authentication attempts
 * Labels: error_type
 */
export const authenticationFailures = new Counter({
  name: 'authentication_failures_total',
  help: 'Total failed authentication attempts',
  labelNames: ['error_type'],
})

// ==================== SUBSCRIPTION METRICS ====================

/**
 * Active subscriptions by tier
 * Labels: tier (starter, professional, enterprise)
 */
export const subscriptionsByTier = new Gauge({
  name: 'subscriptions_by_tier',
  help: 'Active subscriptions by tier',
  labelNames: ['tier'],
})

/**
 * Trial expirations
 */
export const trialExpirations = new Counter({
  name: 'trial_expirations_total',
  help: 'Total trial expirations',
})

// ==================== HTTP METRICS ====================

/**
 * HTTP request duration
 * Labels: method, route, status
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
})

/**
 * HTTP requests total
 * Labels: method, route, status
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
})

// ==================== SYSTEM METRICS ====================

/**
 * Node.js event loop lag
 */
export const eventLoopLag = new Histogram({
  name: 'nodejs_eventloop_lag_seconds',
  help: 'Event loop lag in seconds',
  buckets: [0.001, 0.01, 0.1, 1],
})

/**
 * Memory heap usage
 */
export const heapUsageBytes = new Gauge({
  name: 'nodejs_heap_usage_bytes',
  help: 'Node.js heap memory usage in bytes',
})

// ==================== METRICS ENDPOINT ====================

/**
 * Express middleware to expose metrics at /metrics
 */
export function metricsMiddleware(req: any, res: any) {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
}

/**
 * Update system metrics (call periodically, e.g., every 5 seconds)
 */
export function updateSystemMetrics() {
  const memUsage = process.memoryUsage()
  heapUsageBytes.set(memUsage.heapUsed)

  // Event loop lag measurement
  const start = Date.now()
  setImmediate(() => {
    const lag = (Date.now() - start) / 1000
    eventLoopLag.observe(lag)
  })
}

// Start system metrics collection
setInterval(updateSystemMetrics, 5000)

// Export Prometheus registry
export { register }
