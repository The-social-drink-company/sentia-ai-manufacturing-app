/**
 * System Health Controller
 *
 * REST API endpoints for system health monitoring
 *
 * Endpoints (3):
 * - GET /admin/system-health - Overall system health status
 * - GET /admin/system-health/process - Node.js process metrics
 * - GET /admin/system-health/alerts - Active health alerts
 *
 * @module controllers/admin/systemHealthController
 */

import SystemHealthService from '../../services/admin/SystemHealthService.js'
import logger from '../../utils/logger.js'

/**
 * GET /admin/system-health
 * Get overall system health status
 *
 * Returns complete health report including:
 * - Overall health status (HEALTHY, DEGRADED, UNHEALTHY)
 * - Health score (0-100)
 * - Component statuses (process, database, redis, integrations)
 * - Active alerts
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getSystemHealth(req, res) {
  try {
    const health = await SystemHealthService.getSystemHealth()

    res.json({
      success: true,
      health,
    })
  } catch (error) {
    logger.error('[SystemHealthController] Failed to get system health:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * GET /admin/system-health/process
 * Get Node.js process metrics
 *
 * Returns:
 * - CPU usage and load average
 * - Memory usage (total, free, heap, RSS)
 * - Uptime
 * - Platform information
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getProcessMetrics(req, res) {
  try {
    const metrics = await SystemHealthService.getProcessMetrics()

    res.json({
      success: true,
      metrics,
    })
  } catch (error) {
    logger.error('[SystemHealthController] Failed to get process metrics:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * GET /admin/system-health/alerts
 * Get active health alerts
 *
 * Returns array of alerts based on threshold breaches:
 * - HIGH_CPU_USAGE (> 80%)
 * - HIGH_MEMORY_USAGE (> 85%)
 * - DATABASE_DISCONNECTED
 * - SLOW_DATABASE_RESPONSE (> 1000ms)
 * - REDIS_DISCONNECTED
 * - SLOW_REDIS_RESPONSE (> 500ms)
 * - INTEGRATIONS_DOWN
 * - INTEGRATIONS_DEGRADED
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getHealthAlerts(req, res) {
  try {
    const alerts = await SystemHealthService.getHealthAlerts()

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    })
  } catch (error) {
    logger.error('[SystemHealthController] Failed to get health alerts:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
