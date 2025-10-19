/**
 * System Health Service
 *
 * Monitors overall system health including process metrics, database, Redis, and integrations
 *
 * Features:
 * - Node.js process metrics (CPU, memory, uptime)
 * - Database connection health (PostgreSQL)
 * - Redis health monitoring
 * - Integration health aggregation from AdminIntegration table
 * - Health scoring algorithm (0-100)
 * - Alert generation based on thresholds
 *
 * Health Score Algorithm:
 * - Start: 100 points
 * - CPU > 80%: -30 points
 * - Memory > 85%: -30 points
 * - Database unhealthy: -40 points
 * - Redis unhealthy: -20 points
 * - Down integrations: -20 points
 * - Degraded integrations: -10 points
 *
 * Alert Thresholds:
 * - CPU: 80%
 * - Memory: 85%
 * - Database response: 1000ms
 * - Redis response: 500ms
 *
 * @module services/admin/SystemHealthService
 */

import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'
import os from 'os'

class SystemHealthService {
  constructor() {
    this.ALERT_THRESHOLDS = {
      CPU_PERCENTAGE: 0.8, // 80%
      MEMORY_PERCENTAGE: 0.85, // 85%
      DATABASE_RESPONSE_TIME: 1000, // 1 second
      REDIS_RESPONSE_TIME: 500, // 500ms
    }

    // Track CPU usage over time
    this.lastCpuUsage = null
    this.lastCpuCheck = null
  }

  /**
   * Get overall system health status
   *
   * @returns {Promise<Object>} Complete system health report
   */
  async getSystemHealth() {
    try {
      logger.info('[SystemHealthService] Collecting system health metrics')

      const [processMetrics, databaseHealth, redisHealth, integrationHealth] = await Promise.all([
        this.getProcessMetrics(),
        this.getDatabaseHealth(),
        this.getRedisHealth(),
        this.getIntegrationHealth(),
      ])

      const healthScore = this._calculateHealthScore({
        processMetrics,
        databaseHealth,
        redisHealth,
        integrationHealth,
      })

      const alerts = await this.getHealthAlerts()

      const overallStatus =
        healthScore >= 80 ? 'HEALTHY' : healthScore >= 60 ? 'DEGRADED' : 'UNHEALTHY'

      return {
        status: overallStatus,
        healthScore,
        timestamp: new Date().toISOString(),
        components: {
          process: {
            status: processMetrics.status,
            cpu: processMetrics.cpu,
            memory: processMetrics.memory,
            uptime: processMetrics.uptime,
          },
          database: {
            status: databaseHealth.status,
            connected: databaseHealth.connected,
            responseTime: databaseHealth.responseTime,
          },
          redis: {
            status: redisHealth.status,
            connected: redisHealth.connected,
            responseTime: redisHealth.responseTime,
            memory: redisHealth.memory,
          },
          integrations: {
            status: integrationHealth.status,
            total: integrationHealth.total,
            healthy: integrationHealth.healthy,
            degraded: integrationHealth.degraded,
            down: integrationHealth.down,
          },
        },
        alerts,
      }
    } catch (error) {
      logger.error('[SystemHealthService] Failed to get system health:', error)
      throw new Error(`Failed to retrieve system health: ${error.message}`)
    }
  }

  /**
   * Get Node.js process metrics
   *
   * @returns {Promise<Object>} Process metrics
   */
  async getProcessMetrics() {
    try {
      const cpuUsage = process.cpuUsage()
      const memoryUsage = process.memoryUsage()
      const uptime = process.uptime()

      // Calculate CPU percentage (requires comparison over time)
      let cpuPercentage = null
      if (this.lastCpuUsage && this.lastCpuCheck) {
        const elapsedTime = Date.now() - this.lastCpuCheck
        const elapsedCpu =
          cpuUsage.user - this.lastCpuUsage.user + (cpuUsage.system - this.lastCpuUsage.system)

        // Convert microseconds to percentage
        cpuPercentage = (elapsedCpu / (elapsedTime * 1000 * os.cpus().length)) * 100
      }

      this.lastCpuUsage = cpuUsage
      this.lastCpuCheck = Date.now()

      // Memory metrics
      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      const usedMemory = totalMemory - freeMemory
      const memoryPercentage = (usedMemory / totalMemory) * 100

      // Process-specific memory
      const heapUsed = memoryUsage.heapUsed
      const heapTotal = memoryUsage.heapTotal
      const heapPercentage = (heapUsed / heapTotal) * 100

      const status =
        (cpuPercentage !== null && cpuPercentage > this.ALERT_THRESHOLDS.CPU_PERCENTAGE * 100) ||
        memoryPercentage > this.ALERT_THRESHOLDS.MEMORY_PERCENTAGE * 100
          ? 'DEGRADED'
          : 'HEALTHY'

      return {
        status,
        cpu: {
          percentage: cpuPercentage !== null ? parseFloat(cpuPercentage.toFixed(2)) : null,
          cores: os.cpus().length,
          loadAverage: os.loadavg(),
        },
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          percentage: parseFloat(memoryPercentage.toFixed(2)),
          heap: {
            used: heapUsed,
            total: heapTotal,
            percentage: parseFloat(heapPercentage.toFixed(2)),
          },
          rss: memoryUsage.rss,
          external: memoryUsage.external,
        },
        uptime: {
          seconds: uptime,
          formatted: this._formatUptime(uptime),
        },
        platform: {
          type: os.type(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
        },
      }
    } catch (error) {
      logger.error('[SystemHealthService] Failed to get process metrics:', error)
      throw new Error(`Failed to retrieve process metrics: ${error.message}`)
    }
  }

  /**
   * Get database health status
   *
   * @returns {Promise<Object>} Database health metrics
   */
  async getDatabaseHealth() {
    try {
      const startTime = Date.now()

      // Test database connection with simple query
      await prisma.$queryRaw`SELECT 1 as health_check`

      const responseTime = Date.now() - startTime

      const status =
        responseTime > this.ALERT_THRESHOLDS.DATABASE_RESPONSE_TIME ? 'DEGRADED' : 'HEALTHY'

      return {
        status,
        connected: true,
        responseTime,
        message: status === 'HEALTHY' ? 'Database is healthy' : 'Database response is slow',
      }
    } catch (error) {
      logger.error('[SystemHealthService] Database health check failed:', error)

      return {
        status: 'UNHEALTHY',
        connected: false,
        responseTime: null,
        error: error.message,
        message: 'Database connection failed',
      }
    }
  }

  /**
   * Get Redis health status
   *
   * @returns {Promise<Object>} Redis health metrics
   */
  async getRedisHealth() {
    try {
      // Get Redis client
      const { getRedisClient } = await import('../config/redis.js')
      const redis = await getRedisClient()

      const startTime = Date.now()

      // Test Redis connection with PING
      await redis.ping()

      const responseTime = Date.now() - startTime

      // Get Redis info
      const info = await redis.info('memory')

      // Parse memory info
      const memoryLines = info.split('\r\n')
      const usedMemoryLine = memoryLines.find((line) => line.startsWith('used_memory:'))
      const maxMemoryLine = memoryLines.find((line) => line.startsWith('maxmemory:'))

      const usedMemory = usedMemoryLine
        ? parseInt(usedMemoryLine.split(':')[1], 10)
        : null

      const maxMemory = maxMemoryLine
        ? parseInt(maxMemoryLine.split(':')[1], 10)
        : null

      const status =
        responseTime > this.ALERT_THRESHOLDS.REDIS_RESPONSE_TIME ? 'DEGRADED' : 'HEALTHY'

      return {
        status,
        connected: true,
        responseTime,
        memory: {
          used: usedMemory,
          max: maxMemory,
          percentage:
            usedMemory && maxMemory && maxMemory > 0
              ? parseFloat(((usedMemory / maxMemory) * 100).toFixed(2))
              : null,
        },
        message: status === 'HEALTHY' ? 'Redis is healthy' : 'Redis response is slow',
      }
    } catch (error) {
      logger.error('[SystemHealthService] Redis health check failed:', error)

      return {
        status: 'UNHEALTHY',
        connected: false,
        responseTime: null,
        memory: null,
        error: error.message,
        message: 'Redis connection failed',
      }
    }
  }

  /**
   * Get integration health status
   *
   * Aggregates health from AdminIntegration table
   *
   * @returns {Promise<Object>} Integration health metrics
   */
  async getIntegrationHealth() {
    try {
      const integrations = await prisma.adminIntegration.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          healthStatus: true,
          isActive: true,
          lastSyncStatus: true,
          consecutiveFailures: true,
          healthCheckedAt: true,
        },
      })

      const total = integrations.length
      const healthy = integrations.filter((i) => i.healthStatus === 'HEALTHY').length
      const degraded = integrations.filter((i) => i.healthStatus === 'DEGRADED').length
      const down = integrations.filter((i) => i.healthStatus === 'DOWN').length
      const unknown = integrations.filter((i) => i.healthStatus === 'UNKNOWN').length

      const status = down > 0 ? 'UNHEALTHY' : degraded > 0 ? 'DEGRADED' : 'HEALTHY'

      return {
        status,
        total,
        healthy,
        degraded,
        down,
        unknown,
        integrations: integrations.map((i) => ({
          name: i.name,
          type: i.type,
          status: i.healthStatus,
          isActive: i.isActive,
          lastSyncStatus: i.lastSyncStatus,
          consecutiveFailures: i.consecutiveFailures,
          lastChecked: i.healthCheckedAt,
        })),
      }
    } catch (error) {
      logger.error('[SystemHealthService] Failed to get integration health:', error)
      throw new Error(`Failed to retrieve integration health: ${error.message}`)
    }
  }

  /**
   * Get health alerts based on threshold breaches
   *
   * @returns {Promise<Object[]>} Array of active alerts
   */
  async getHealthAlerts() {
    try {
      const alerts = []

      const [processMetrics, databaseHealth, redisHealth, integrationHealth] = await Promise.all([
        this.getProcessMetrics(),
        this.getDatabaseHealth(),
        this.getRedisHealth(),
        this.getIntegrationHealth(),
      ])

      // CPU alert
      if (
        processMetrics.cpu.percentage !== null &&
        processMetrics.cpu.percentage > this.ALERT_THRESHOLDS.CPU_PERCENTAGE * 100
      ) {
        alerts.push({
          type: 'HIGH_CPU_USAGE',
          severity: 'WARNING',
          component: 'process',
          message: `CPU usage ${processMetrics.cpu.percentage.toFixed(2)}% exceeds threshold ${(this.ALERT_THRESHOLDS.CPU_PERCENTAGE * 100).toFixed(2)}%`,
          value: processMetrics.cpu.percentage,
          threshold: this.ALERT_THRESHOLDS.CPU_PERCENTAGE * 100,
        })
      }

      // Memory alert
      if (processMetrics.memory.percentage > this.ALERT_THRESHOLDS.MEMORY_PERCENTAGE * 100) {
        alerts.push({
          type: 'HIGH_MEMORY_USAGE',
          severity: 'WARNING',
          component: 'process',
          message: `Memory usage ${processMetrics.memory.percentage.toFixed(2)}% exceeds threshold ${(this.ALERT_THRESHOLDS.MEMORY_PERCENTAGE * 100).toFixed(2)}%`,
          value: processMetrics.memory.percentage,
          threshold: this.ALERT_THRESHOLDS.MEMORY_PERCENTAGE * 100,
        })
      }

      // Database alert
      if (!databaseHealth.connected) {
        alerts.push({
          type: 'DATABASE_DISCONNECTED',
          severity: 'CRITICAL',
          component: 'database',
          message: 'Database connection failed',
          error: databaseHealth.error,
        })
      } else if (databaseHealth.responseTime > this.ALERT_THRESHOLDS.DATABASE_RESPONSE_TIME) {
        alerts.push({
          type: 'SLOW_DATABASE_RESPONSE',
          severity: 'WARNING',
          component: 'database',
          message: `Database response time ${databaseHealth.responseTime}ms exceeds threshold ${this.ALERT_THRESHOLDS.DATABASE_RESPONSE_TIME}ms`,
          value: databaseHealth.responseTime,
          threshold: this.ALERT_THRESHOLDS.DATABASE_RESPONSE_TIME,
        })
      }

      // Redis alert
      if (!redisHealth.connected) {
        alerts.push({
          type: 'REDIS_DISCONNECTED',
          severity: 'CRITICAL',
          component: 'redis',
          message: 'Redis connection failed',
          error: redisHealth.error,
        })
      } else if (redisHealth.responseTime > this.ALERT_THRESHOLDS.REDIS_RESPONSE_TIME) {
        alerts.push({
          type: 'SLOW_REDIS_RESPONSE',
          severity: 'WARNING',
          component: 'redis',
          message: `Redis response time ${redisHealth.responseTime}ms exceeds threshold ${this.ALERT_THRESHOLDS.REDIS_RESPONSE_TIME}ms`,
          value: redisHealth.responseTime,
          threshold: this.ALERT_THRESHOLDS.REDIS_RESPONSE_TIME,
        })
      }

      // Integration alerts
      if (integrationHealth.down > 0) {
        alerts.push({
          type: 'INTEGRATIONS_DOWN',
          severity: 'CRITICAL',
          component: 'integrations',
          message: `${integrationHealth.down} integration(s) are down`,
          value: integrationHealth.down,
        })
      }

      if (integrationHealth.degraded > 0) {
        alerts.push({
          type: 'INTEGRATIONS_DEGRADED',
          severity: 'WARNING',
          component: 'integrations',
          message: `${integrationHealth.degraded} integration(s) are degraded`,
          value: integrationHealth.degraded,
        })
      }

      return alerts
    } catch (error) {
      logger.error('[SystemHealthService] Failed to get health alerts:', error)
      throw new Error(`Failed to retrieve health alerts: ${error.message}`)
    }
  }

  /**
   * Record health snapshot to database (optional)
   *
   * Note: Requires AdminSystemHealth model (not in current schema)
   * This is a placeholder for future implementation
   *
   * @returns {Promise<Object>} Snapshot result
   */
  async recordHealthSnapshot() {
    try {
      const health = await this.getSystemHealth()

      logger.info('[SystemHealthService] Health snapshot recorded (in-memory only)')

      // TODO: Implement AdminSystemHealth model and persist snapshots
      // await prisma.adminSystemHealth.create({
      //   data: {
      //     status: health.status,
      //     healthScore: health.healthScore,
      //     metrics: health.components,
      //     alerts: health.alerts,
      //   },
      // })

      return {
        success: true,
        message: 'Health snapshot recorded (in-memory)',
        snapshot: health,
      }
    } catch (error) {
      logger.error('[SystemHealthService] Failed to record health snapshot:', error)
      throw new Error(`Failed to record health snapshot: ${error.message}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate overall health score (0-100)
   *
   * @private
   * @param {Object} components - Health components
   * @returns {number} Health score (0-100)
   */
  _calculateHealthScore(components) {
    let score = 100

    const { processMetrics, databaseHealth, redisHealth, integrationHealth } = components

    // CPU penalty (-30 points)
    if (
      processMetrics.cpu.percentage !== null &&
      processMetrics.cpu.percentage > this.ALERT_THRESHOLDS.CPU_PERCENTAGE * 100
    ) {
      score -= 30
    }

    // Memory penalty (-30 points)
    if (processMetrics.memory.percentage > this.ALERT_THRESHOLDS.MEMORY_PERCENTAGE * 100) {
      score -= 30
    }

    // Database penalty (-40 points if disconnected)
    if (!databaseHealth.connected) {
      score -= 40
    }

    // Redis penalty (-20 points if disconnected)
    if (!redisHealth.connected) {
      score -= 20
    }

    // Integration penalties
    if (integrationHealth.down > 0) {
      score -= 20
    } else if (integrationHealth.degraded > 0) {
      score -= 10
    }

    // Ensure score doesn't go below 0
    return Math.max(0, score)
  }

  /**
   * Format uptime duration
   *
   * @private
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime string
   */
  _formatUptime(seconds) {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(' ')
  }
}

// Singleton instance
let systemHealthServiceInstance

/**
 * Get SystemHealthService singleton instance
 *
 * @returns {SystemHealthService} Service instance
 */
export function getSystemHealthService() {
  if (!systemHealthServiceInstance) {
    systemHealthServiceInstance = new SystemHealthService()
  }
  return systemHealthServiceInstance
}

export default getSystemHealthService()
