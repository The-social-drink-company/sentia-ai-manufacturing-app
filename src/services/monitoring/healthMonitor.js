/**
 * Health Monitoring Service
 * Comprehensive system health monitoring and metrics collection
 * Integrates with external monitoring services and provides real-time status
 */

import { logInfo, logError, logWarn, logDebug, devLog } from '../../utils/structuredLogger.js';

export class HealthMonitor {
  constructor(config = {}) {
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30 seconds
      criticalThreshold: config.criticalThreshold || 2000, // 2 seconds
      warningThreshold: config.warningThreshold || 1000, // 1 second
      maxMetricsBuffer: config.maxMetricsBuffer || 1000,
      enableExternalReporting: config.enableExternalReporting !== false,
      ...config
    }

    this.metrics = {
      system: new Map(),
      performance: new Map(),
      errors: new Map(),
      uptime: new Map(),
      resources: new Map()
    }

    this.healthChecks = new Map()
    this.alertHandlers = new Set()
    this.isMonitoring = false
    this.monitoringInterval = null
    this.startTime = Date.now()
  }

  /**
   * Start health monitoring
   */
  start() {
    if (this.isMonitoring) {
      logWarn('Health monitor is already running')
      return
    }

    this.isMonitoring = true
    this.startTime = Date.now()

    // Register core health checks
    this.registerCoreHealthChecks()

    // Start monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks()
    }, this.config.checkInterval)

    // Initial health check
    this.performHealthChecks()

    logInfo('Health monitor started', { checksCount: this.healthChecks.size })
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    logInfo('Health monitor stopped')
  }

  /**
   * Register a health check
   * @param {string} name - Health check name
   * @param {function} checkFunction - Function that returns health status
   * @param {Object} options - Check options
   */
  registerHealthCheck(name, checkFunction, options = {}) {
    this.healthChecks.set(name, {
      name,
      checkFunction,
      options: {
        timeout: options.timeout || 5000,
        critical: options.critical || false,
        tags: options.tags || [],
        ...options
      },
      lastCheck: null,
      lastResult: null,
      errorCount: 0,
      successCount: 0
    })

    logInfo('Registered health check', { name })
  }

  /**
   * Remove a health check
   */
  unregisterHealthCheck(name) {
    this.healthChecks.delete(name)
    logInfo('Unregistered health check', { name })
  }

  /**
   * Register core system health checks
   */
  registerCoreHealthChecks() {
    // Database connectivity check
    this.registerHealthCheck('database', async () => {
      try {
        const start = Date.now()

        // Simulate database ping
        const response = await fetch('/api/health/database', {
          method: 'GET',
          timeout: 3000
        })

        const duration = Date.now() - start
        const isHealthy = response.ok

        return {
          healthy: isHealthy,
          responseTime: duration,
          status: isHealthy ? 'connected' : 'disconnected',
          details: {
            endpoint: '/api/health/database',
            statusCode: response.status
          }
        }
      } catch (error) {
        return {
          healthy: false,
          error: error.message,
          status: 'error'
        }
      }
    }, { critical: true, timeout: 5000 })

    // API endpoints health check
    this.registerHealthCheck('api', async () => {
      try {
        const start = Date.now()
        const response = await fetch('/api/health', {
          method: 'GET',
          timeout: 2000
        })

        const duration = Date.now() - start
        const data = await response.json()

        return {
          healthy: response.ok,
          responseTime: duration,
          status: data.status || 'unknown',
          details: data
        }
      } catch (error) {
        return {
          healthy: false,
          error: error.message,
          status: 'error'
        }
      }
    }, { critical: true })

    // Memory usage check
    this.registerHealthCheck('memory', async () => {
      try {
        if (typeof performance !== 'undefined' && performance.memory) {
          const memory = performance.memory
          const usedMB = memory.usedJSHeapSize / (1024 * 1024)
          const totalMB = memory.totalJSHeapSize / (1024 * 1024)
          const limitMB = memory.jsHeapSizeLimit / (1024 * 1024)

          const usagePercent = (usedMB / limitMB) * 100

          return {
            healthy: usagePercent < 85, // Alert if over 85%
            usage: {
              used: Math.round(usedMB),
              total: Math.round(totalMB),
              limit: Math.round(limitMB),
              percentage: Math.round(usagePercent)
            },
            status: usagePercent > 90 ? 'critical' : usagePercent > 75 ? 'warning' : 'good'
          }
        } else {
          return {
            healthy: true,
            status: 'not_available',
            message: 'Memory API not available'
          }
        }
      } catch (error) {
        return {
          healthy: false,
          error: error.message,
          status: 'error'
        }
      }
    })

    // External services health check
    this.registerHealthCheck('external_services', async () => {
      const services = [
        { name: 'Xero', endpoint: '/api/xero/status' },
        { name: 'MCP_Server', endpoint: '/api/mcp/health' },
        { name: 'Clerk', endpoint: '/api/auth/status' }
      ]

      const results = await Promise.allSettled(
        services.map(async (service) => {
          try {
            const response = await fetch(service.endpoint, { timeout: 3000 })
            return {
              name: service.name,
              healthy: response.ok,
              status: response.ok ? 'connected' : 'disconnected',
              responseCode: response.status
            }
          } catch (error) {
            return {
              name: service.name,
              healthy: false,
              status: 'error',
              error: error.message
            }
          }
        })
      )

      const serviceStatus = results.map(result => result.value)
      const healthyServices = serviceStatus.filter(s => s.healthy).length
      const totalServices = serviceStatus.length

      return {
        healthy: healthyServices >= totalServices * 0.7, // 70% of services must be healthy
        services: serviceStatus,
        summary: {
          healthy: healthyServices,
          total: totalServices,
          percentage: Math.round((healthyServices / totalServices) * 100)
        },
        status: healthyServices === totalServices ? 'all_healthy' :
               healthyServices >= totalServices * 0.7 ? 'mostly_healthy' : 'degraded'
      }
    })

    // Performance metrics check
    this.registerHealthCheck('performance', async () => {
      try {
        const now = Date.now()
        const entries = performance.getEntriesByType('navigation')

        let metrics = {
          healthy: true,
          status: 'good'
        }

        if (entries.length > 0) {
          const nav = entries[0]
          metrics = {
            healthy: nav.loadEventEnd < this.config.criticalThreshold,
            loadTime: Math.round(nav.loadEventEnd),
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            status: nav.loadEventEnd > this.config.criticalThreshold ? 'slow' : 'good'
          }
        }

        return metrics
      } catch (error) {
        return {
          healthy: false,
          error: error.message,
          status: 'error'
        }
      }
    })
  }

  /**
   * Perform all registered health checks
   */
  async performHealthChecks() {
    const checkPromises = []
    const results = new Map()

    // Execute all health checks concurrently
    for (const [name, check] of this.healthChecks) {
      checkPromises.push(
        this.executeHealthCheck(name, check).then(result => {
          results.set(name, result)
          check.lastCheck = Date.now()
          check.lastResult = result

          if (result.healthy) {
            check.successCount++
          } else {
            check.errorCount++
          }
        })
      )
    }

    await Promise.allSettled(checkPromises)

    // Update system metrics
    this.updateSystemMetrics(results)

    // Check for alerts
    this.processAlerts(results)

    return results
  }

  /**
   * Execute a single health check with timeout
   */
  async executeHealthCheck(name, check) {
    const timeout = check.options.timeout || 5000

    try {
      const result = await Promise.race([
        check.checkFunction(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        )
      ])

      return {
        name,
        timestamp: Date.now(),
        healthy: result.healthy !== false,
        duration: Date.now() - Date.now(), // Will be calculated properly in real implementation
        ...result
      }
    } catch (error) {
      return {
        name,
        timestamp: Date.now(),
        healthy: false,
        error: error.message,
        status: 'error'
      }
    }
  }

  /**
   * Update system-wide metrics
   */
  updateSystemMetrics(healthResults) {
    const now = Date.now()
    const uptime = now - this.startTime

    // Overall system health
    const totalChecks = healthResults.size
    const healthyChecks = Array.from(healthResults.values()).filter(r => r.healthy).length
    const healthPercentage = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100

    // Critical checks
    const criticalChecks = Array.from(this.healthChecks.values())
      .filter(check => check.options.critical)
    const healthyCritical = criticalChecks.filter(check =>
      check.lastResult && check.lastResult.healthy
    ).length

    const systemHealth = {
      timestamp: now,
      uptime,
      overall: {
        healthy: healthPercentage >= 80 && healthyCritical === criticalChecks.length,
        percentage: Math.round(healthPercentage),
        status: healthPercentage >= 90 ? 'excellent' :
               healthPercentage >= 80 ? 'good' :
               healthPercentage >= 60 ? 'degraded' : 'critical'
      },
      checks: {
        total: totalChecks,
        healthy: healthyChecks,
        critical: criticalChecks.length,
        criticalHealthy: healthyCritical
      }
    }

    this.addMetric('system', 'health', systemHealth)
  }

  /**
   * Add metric to buffer
   */
  addMetric(category, name, value) {
    if (!this.metrics[category]) {
      this.metrics[category] = new Map()
    }

    let metricBuffer = this.metrics[category].get(name)
    if (!metricBuffer) {
      metricBuffer = []
      this.metrics[category].set(name, metricBuffer)
    }

    metricBuffer.push({
      timestamp: Date.now(),
      value
    })

    // Trim buffer if too large
    if (metricBuffer.length > this.config.maxMetricsBuffer) {
      metricBuffer.splice(0, metricBuffer.length - this.config.maxMetricsBuffer)
    }
  }

  /**
   * Process alerts based on health check results
   */
  processAlerts(healthResults) {
    for (const [name, result] of healthResults) {
      const check = this.healthChecks.get(name)

      if (!result.healthy) {
        const alert = {
          type: 'health_check_failed',
          severity: check.options.critical ? 'critical' : 'warning',
          source: name,
          message: `Health check '${name}' failed: ${result.error || result.status}`,
          timestamp: Date.now(),
          details: result
        }

        this.triggerAlert(alert)
      }

      // Performance alerts
      if (result.responseTime && result.responseTime > this.config.criticalThreshold) {
        const alert = {
          type: 'performance_degradation',
          severity: 'warning',
          source: name,
          message: `High response time detected: ${result.responseTime}ms`,
          timestamp: Date.now(),
          details: { responseTime: result.responseTime, threshold: this.config.criticalThreshold }
        }

        this.triggerAlert(alert)
      }
    }
  }

  /**
   * Trigger alert to all registered handlers
   */
  triggerAlert(alert) {
    logWarn('Health Monitor Alert', alert)

    for (const handler of this.alertHandlers) {
      try {
        handler(alert)
      } catch (error) {
        logError('Alert handler failed', error)
      }
    }

    // Store alert in metrics
    this.addMetric('errors', 'alerts', alert)
  }

  /**
   * Register an alert handler
   */
  onAlert(handler) {
    if (typeof handler === 'function') {
      this.alertHandlers.add(handler)
    }
  }

  /**
   * Remove alert handler
   */
  offAlert(handler) {
    this.alertHandlers.delete(handler)
  }

  /**
   * Get current system health status
   */
  getSystemHealth() {
    const healthMetrics = this.metrics.system.get('health')
    const latestHealth = healthMetrics && healthMetrics.length > 0
      ? healthMetrics[healthMetrics.length - 1].value
      : null

    return {
      ...latestHealth,
      checks: Array.from(this.healthChecks.entries()).map(([name, check]) => ({
        name,
        lastCheck: check.lastCheck,
        lastResult: check.lastResult,
        successRate: check.successCount / (check.successCount + check.errorCount) * 100 || 0,
        critical: check.options.critical
      })),
      metrics: {
        uptime: Date.now() - this.startTime,
        checksRegistered: this.healthChecks.size,
        alertsTriggered: this.metrics.errors.get('alerts')?.length || 0
      }
    }
  }

  /**
   * Get metrics for specific category
   */
  getMetrics(category, name = null) {
    if (!this.metrics[category]) return null

    if (name) {
      return this.metrics[category].get(name) || []
    }

    const result = {}
    for (const [metricName, values] of this.metrics[category]) {
      result[metricName] = values
    }
    return result
  }

  /**
   * Export health data for external monitoring
   */
  exportHealthData() {
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: '1.0',
      systemHealth: this.getSystemHealth(),
      metrics: {
        system: this.getMetrics('system'),
        performance: this.getMetrics('performance'),
        errors: this.getMetrics('errors'),
        resources: this.getMetrics('resources')
      }
    }
  }

  /**
   * Get First Contentful Paint metric
   */
  getFirstContentfulPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      return fcp ? Math.round(fcp.startTime) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Clear old metrics
   */
  clearMetrics(category = null, olderThanMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - olderThanMs

    const categoriesToClear = category ? [category] : Object.keys(this.metrics)

    for (const cat of categoriesToClear) {
      if (this.metrics[cat]) {
        for (const [name, values] of this.metrics[cat]) {
          const filtered = values.filter(item => item.timestamp > cutoff)
          this.metrics[cat].set(name, filtered)
        }
      }
    }
  }
}

// Create singleton instance
export const healthMonitor = new HealthMonitor({
  checkInterval: 30000, // 30 seconds
  criticalThreshold: 2000, // 2 seconds
  warningThreshold: 1000, // 1 second
  enableExternalReporting: true
})

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  // Start monitoring when page is loaded
  if (document.readyState === 'complete') {
    healthMonitor.start()
  } else {
    window.addEventListener('load', () => {
      healthMonitor.start()
    })
  }

  // Stop monitoring on page unload
  window.addEventListener('beforeunload', () => {
    healthMonitor.stop()
  })
}

export default HealthMonitor