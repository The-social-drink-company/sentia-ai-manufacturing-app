/**
 * Health Monitor Test Suite
 * Comprehensive tests for system health monitoring functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HealthMonitor } from './healthMonitor'

// Mock global APIs
global.fetch = vi.fn()
global.performance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 50, // 50MB
    totalJSHeapSize: 1024 * 1024 * 100, // 100MB
    jsHeapSizeLimit: 1024 * 1024 * 200 // 200MB
  }
}

describe('HealthMonitor', () => {
  let monitor

  beforeEach(() => {
    vi.clearAllMocks()
    monitor = new HealthMonitor({
      checkInterval: 1000, // 1 second for testing
      criticalThreshold: 2000,
      warningThreshold: 1000
    })
  })

  afterEach(() => {
    if (monitor.isMonitoring) {
      monitor.stop()
    }
  })

  describe('Initialization', () => {
    it('should create health monitor with default config', () => {
      const defaultMonitor = new HealthMonitor()
      expect(defaultMonitor.config.checkInterval).toBe(30000)
      expect(defaultMonitor.config.criticalThreshold).toBe(2000)
      expect(defaultMonitor.isMonitoring).toBe(false)
    })

    it('should create health monitor with custom config', () => {
      expect(monitor.config.checkInterval).toBe(1000)
      expect(monitor.config.criticalThreshold).toBe(2000)
      expect(monitor.healthChecks.size).toBe(0)
    })
  })

  describe('Health Check Registration', () => {
    it('should register a health check', () => {
      const checkFunction = vi.fn(() => ({ healthy: true }))

      monitor.registerHealthCheck('test-check', checkFunction, {
        timeout: 3000,
        critical: true
      })

      expect(monitor.healthChecks.size).toBe(1)
      expect(monitor.healthChecks.has('test-check')).toBe(true)
    })

    it('should unregister a health check', () => {
      const checkFunction = vi.fn(() => ({ healthy: true }))

      monitor.registerHealthCheck('test-check', checkFunction)
      expect(monitor.healthChecks.size).toBe(1)

      monitor.unregisterHealthCheck('test-check')
      expect(monitor.healthChecks.size).toBe(0)
    })

    it('should register core health checks on start', () => {
      monitor.start()

      // Should register database, api, memory, external_services, performance checks
      expect(monitor.healthChecks.size).toBeGreaterThanOrEqual(5)
      expect(monitor.healthChecks.has('database')).toBe(true)
      expect(monitor.healthChecks.has('api')).toBe(true)
      expect(monitor.healthChecks.has('memory')).toBe(true)
    })
  })

  describe('Health Check Execution', () => {
    it('should execute a successful health check', async () => {
      const checkFunction = vi.fn(() => Promise.resolve({
        healthy: true,
        status: 'good',
        responseTime: 150
      }))

      monitor.registerHealthCheck('test-check', checkFunction)

      const check = monitor.healthChecks.get('test-check')
      const result = await monitor.executeHealthCheck('test-check', check)

      expect(result.healthy).toBe(true)
      expect(result.name).toBe('test-check')
      expect(result.status).toBe('good')
      expect(checkFunction).toHaveBeenCalledTimes(1)
    })

    it('should handle failed health check', async () => {
      const checkFunction = vi.fn(() => Promise.reject(new Error('Check failed')))

      monitor.registerHealthCheck('test-check', checkFunction)

      const check = monitor.healthChecks.get('test-check')
      const result = await monitor.executeHealthCheck('test-check', check)

      expect(result.healthy).toBe(false)
      expect(result.error).toBe('Check failed')
      expect(result.status).toBe('error')
    })

    it('should handle health check timeout', async () => {
      const checkFunction = vi.fn(() => new Promise(resolve => {
        setTimeout(() => resolve({ healthy: true }), 10000) // 10 seconds
      }))

      monitor.registerHealthCheck('test-check', checkFunction, { timeout: 100 })

      const check = monitor.healthChecks.get('test-check')
      const result = await monitor.executeHealthCheck('test-check', check)

      expect(result.healthy).toBe(false)
      expect(result.error).toBe('Health check timeout')
    })
  })

  describe('Database Health Check', () => {
    it('should check database connectivity successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      })

      monitor.start()
      const dbCheck = monitor.healthChecks.get('database')
      const result = await dbCheck.checkFunction()

      expect(result.healthy).toBe(true)
      expect(result.status).toBe('connected')
      expect(result.responseTime).toBeDefined()
      expect(fetch).toHaveBeenCalledWith('/api/health/database', {
        method: 'GET',
        timeout: 3000
      })
    })

    it('should handle database connectivity failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection failed'))

      monitor.start()
      const dbCheck = monitor.healthChecks.get('database')
      const result = await dbCheck.checkFunction()

      expect(result.healthy).toBe(false)
      expect(result.status).toBe('error')
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('Memory Health Check', () => {
    it('should check memory usage successfully', async () => {
      monitor.start()
      const memoryCheck = monitor.healthChecks.get('memory')
      const result = await memoryCheck.checkFunction()

      expect(result.healthy).toBe(true)
      expect(result.usage).toBeDefined()
      expect(result.usage.used).toBe(50) // 50MB
      expect(result.usage.limit).toBe(200) // 200MB
      expect(result.usage.percentage).toBe(25) // 25%
      expect(result.status).toBe('good')
    })

    it('should alert on high memory usage', async () => {
      // Mock high memory usage
      global.performance.memory.usedJSHeapSize = 1024 * 1024 * 180 // 180MB
      global.performance.memory.jsHeapSizeLimit = 1024 * 1024 * 200 // 200MB

      monitor.start()
      const memoryCheck = monitor.healthChecks.get('memory')
      const result = await memoryCheck.checkFunction()

      expect(result.healthy).toBe(false) // Over 85% threshold
      expect(result.usage.percentage).toBe(90)
      expect(result.status).toBe('critical')
    })
  })

  describe('External Services Health Check', () => {
    it('should check external services successfully', async () => {
      // Mock successful responses
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Xero
        .mockResolvedValueOnce({ ok: true, status: 200 }) // MCP Server
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Clerk

      monitor.start()
      const servicesCheck = monitor.healthChecks.get('external_services')
      const result = await servicesCheck.checkFunction()

      expect(result.healthy).toBe(true)
      expect(result.services).toHaveLength(3)
      expect(result.summary.healthy).toBe(3)
      expect(result.summary.total).toBe(3)
      expect(result.status).toBe('all_healthy')
    })

    it('should handle partial service failures', async () => {
      // Mock mixed responses
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Xero - success
        .mockResolvedValueOnce({ ok: false, status: 500 }) // MCP Server - failure
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Clerk - success

      monitor.start()
      const servicesCheck = monitor.healthChecks.get('external_services')
      const result = await servicesCheck.checkFunction()

      expect(result.healthy).toBe(true) // 70% threshold met
      expect(result.summary.healthy).toBe(2)
      expect(result.summary.total).toBe(3)
      expect(result.status).toBe('mostly_healthy')
    })

    it('should fail when too many services are down', async () => {
      // Mock all failures
      fetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })

      monitor.start()
      const servicesCheck = monitor.healthChecks.get('external_services')
      const result = await servicesCheck.checkFunction()

      expect(result.healthy).toBe(false)
      expect(result.summary.healthy).toBe(0)
      expect(result.status).toBe('degraded')
    })
  })

  describe('System Metrics', () => {
    it('should calculate system health metrics', async () => {
      // Register test checks
      monitor.registerHealthCheck('test1', () => ({ healthy: true }), { critical: true })
      monitor.registerHealthCheck('test2', () => ({ healthy: false }))
      monitor.registerHealthCheck('test3', () => ({ healthy: true }), { critical: true })

      const results = new Map([
        ['test1', { healthy: true, name: 'test1' }],
        ['test2', { healthy: false, name: 'test2' }],
        ['test3', { healthy: true, name: 'test3' }]
      ])

      monitor.updateSystemMetrics(results)

      const systemHealth = monitor.getSystemHealth()
      expect(systemHealth.overall.percentage).toBe(67) // 2/3 healthy
      expect(systemHealth.checks.total).toBe(3)
      expect(systemHealth.checks.healthy).toBe(2)
      expect(systemHealth.checks.critical).toBe(2)
      expect(systemHealth.checks.criticalHealthy).toBe(2)
      expect(systemHealth.overall.healthy).toBe(true) // All critical checks healthy
    })

    it('should fail system health when critical checks fail', async () => {
      monitor.registerHealthCheck('critical1', () => ({ healthy: false }), { critical: true })
      monitor.registerHealthCheck('normal1', () => ({ healthy: true }))

      const results = new Map([
        ['critical1', { healthy: false, name: 'critical1' }],
        ['normal1', { healthy: true, name: 'normal1' }]
      ])

      monitor.updateSystemMetrics(results)

      const systemHealth = monitor.getSystemHealth()
      expect(systemHealth.overall.healthy).toBe(false) // Critical check failed
    })
  })

  describe('Alert Handling', () => {
    it('should trigger alert for failed critical check', () => {
      const alertHandler = vi.fn()
      monitor.onAlert(alertHandler)

      const results = new Map([
        ['critical-test', { healthy: false, error: 'Test failure' }]
      ])

      monitor.healthChecks.set('critical-test', {
        options: { critical: true },
        lastResult: { healthy: false, error: 'Test failure' }
      })

      monitor.processAlerts(results)

      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'health_check_failed',
          severity: 'critical',
          source: 'critical-test'
        })
      )
    })

    it('should trigger performance alert for slow responses', () => {
      const alertHandler = vi.fn()
      monitor.onAlert(alertHandler)

      const results = new Map([
        ['slow-check', { healthy: true, responseTime: 5000 }]
      ])

      monitor.processAlerts(results)

      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance_degradation',
          severity: 'warning'
        })
      )
    })

    it('should manage alert handlers correctly', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      monitor.onAlert(handler1)
      monitor.onAlert(handler2)
      expect(monitor.alertHandlers.size).toBe(2)

      monitor.offAlert(handler1)
      expect(monitor.alertHandlers.size).toBe(1)
    })
  })

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring correctly', () => {
      expect(monitor.isMonitoring).toBe(false)
      expect(monitor.monitoringInterval).toBeNull()

      monitor.start()
      expect(monitor.isMonitoring).toBe(true)
      expect(monitor.monitoringInterval).not.toBeNull()

      monitor.stop()
      expect(monitor.isMonitoring).toBe(false)
      expect(monitor.monitoringInterval).toBeNull()
    })

    it('should not start monitoring twice', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      monitor.start()
      monitor.start() // Second start should warn

      expect(consoleSpy).toHaveBeenCalledWith('Health monitor is already running')
      consoleSpy.mockRestore()
    })

    it('should handle stop when not running', () => {
      expect(() => monitor.stop()).not.toThrow()
    })
  })

  describe('Metrics Management', () => {
    it('should add and retrieve metrics correctly', () => {
      const testMetric = { timestamp: Date.now(), value: 100 }

      monitor.addMetric('test', 'cpu_usage', testMetric)

      const metrics = monitor.getMetrics('test', 'cpu_usage')
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toEqual({ timestamp: testMetric.timestamp, value: testMetric })
    })

    it('should limit metric buffer size', () => {
      // Set small buffer for testing
      monitor.config.maxMetricsBuffer = 3

      for (let i = 0; i < 5; i++) {
        monitor.addMetric('test', 'counter', { value: i })
      }

      const metrics = monitor.getMetrics('test', 'counter')
      expect(metrics).toHaveLength(3)
      expect(metrics[0].value.value).toBe(2) // Should keep last 3
      expect(metrics[2].value.value).toBe(4)
    })

    it('should export health data correctly', () => {
      monitor.addMetric('system', 'test', { value: 'test-data' })

      const exportData = monitor.exportHealthData()

      expect(exportData.timestamp).toBeDefined()
      expect(exportData.uptime).toBeGreaterThan(0)
      expect(exportData.version).toBe('1.0')
      expect(exportData.systemHealth).toBeDefined()
      expect(exportData.metrics).toBeDefined()
    })

    it('should clear old metrics', () => {
      const now = Date.now()
      const oldTimestamp = now - (25 * 60 * 60 * 1000) // 25 hours ago
      const recentTimestamp = now - (1 * 60 * 60 * 1000) // 1 hour ago

      // Add old and recent metrics
      monitor.metrics.set('test', new Map([
        ['old_metric', [{ timestamp: oldTimestamp, value: 'old' }]],
        ['recent_metric', [{ timestamp: recentTimestamp, value: 'recent' }]]
      ]))

      monitor.clearMetrics('test', 24 * 60 * 60 * 1000) // 24 hours

      const oldMetrics = monitor.getMetrics('test', 'old_metric')
      const recentMetrics = monitor.getMetrics('test', 'recent_metric')

      expect(oldMetrics).toHaveLength(0)
      expect(recentMetrics).toHaveLength(1)
    })
  })
})