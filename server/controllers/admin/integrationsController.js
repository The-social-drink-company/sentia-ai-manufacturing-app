/**
 * Integrations Controller
 *
 * Handles HTTP requests for integration management
 *
 * Endpoints:
 * - GET /admin/integrations - List integrations with health status
 * - GET /admin/integrations/:id - Get integration details
 * - POST /admin/integrations/:id/test - Test integration connection
 * - POST /admin/integrations/:id/sync - Trigger sync job
 * - POST /admin/integrations/:id/pause - Pause scheduled syncs
 * - POST /admin/integrations/:id/resume - Resume scheduled syncs
 *
 * @module controllers/admin/integrationsController
 */

import IntegrationService from '../../services/admin/IntegrationService.js'
import logger from '../../utils/logger.js'

/**
 * List integrations with filters and pagination
 *
 * GET /admin/integrations
 *
 * Query params:
 * - type: Filter by integration type (XERO, SHOPIFY, AMAZON_SP_API, UNLEASHED)
 * - isActive: Filter by active status (true/false)
 * - healthStatus: Filter by health status (HEALTHY, DEGRADED, DOWN, UNKNOWN)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function getIntegrations(req, res) {
  try {
    const { type, isActive, healthStatus, page = 1, limit = 20 } = req.query

    const filters = {}
    if (type) filters.type = type
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (healthStatus) filters.healthStatus = healthStatus

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    }

    const result = await IntegrationService.getIntegrations(filters, options)

    logger.info(`[IntegrationsController] Listed ${result.integrations.length} integrations`)

    res.json({
      success: true,
      integrations: result.integrations,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('[IntegrationsController] Error listing integrations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve integrations',
      error: error.message,
    })
  }
}

/**
 * Get integration by ID with sync history and health metrics
 *
 * GET /admin/integrations/:id
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function getIntegrationById(req, res) {
  try {
    const { id } = req.params

    const integration = await IntegrationService.getIntegrationById(id)
    const health = await IntegrationService.getIntegrationHealth(id)

    logger.info(`[IntegrationsController] Retrieved integration ${id}`)

    res.json({
      success: true,
      integration,
      health,
    })
  } catch (error) {
    logger.error('[IntegrationsController] Error getting integration:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve integration',
      error: error.message,
    })
  }
}

/**
 * Test integration connection (health check)
 *
 * POST /admin/integrations/:id/test
 *
 * Performs connection test and updates health metrics
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function testIntegration(req, res) {
  try {
    const { id } = req.params

    const result = await IntegrationService.testConnection(id)

    logger.info(`[IntegrationsController] Tested integration ${id}: ${result.healthy ? 'HEALTHY' : 'FAILED'}`)

    res.json({
      success: true,
      health: result,
      message: result.healthy ? 'Connection test successful' : 'Connection test failed',
    })
  } catch (error) {
    logger.error('[IntegrationsController] Error testing integration:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to test integration connection',
      error: error.message,
    })
  }
}

/**
 * Trigger integration sync job
 *
 * POST /admin/integrations/:id/sync
 *
 * Creates AdminSyncJob and enqueues to syncJobQueue
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function syncIntegration(req, res) {
  try {
    const { id } = req.params

    // Get user ID from authenticated user
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const result = await IntegrationService.syncIntegration(id, userId)

    logger.info(`[IntegrationsController] Triggered sync for integration ${id} by user ${userId}`)

    res.json({
      success: true,
      syncJob: result.syncJob,
      queueJobId: result.queueJobId,
      message: 'Sync job queued successfully',
    })
  } catch (error) {
    logger.error('[IntegrationsController] Error syncing integration:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to trigger integration sync',
      error: error.message,
    })
  }
}

/**
 * Pause integration scheduled syncs
 *
 * POST /admin/integrations/:id/pause
 *
 * Sets isActive=false to stop scheduled syncs
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function pauseIntegration(req, res) {
  try {
    const { id } = req.params

    // Get user ID from authenticated user
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const integration = await IntegrationService.pauseIntegration(id, userId)

    logger.info(`[IntegrationsController] Paused integration ${id} by user ${userId}`)

    res.json({
      success: true,
      integration,
      message: 'Integration paused successfully',
    })
  } catch (error) {
    logger.error('[IntegrationsController] Error pausing integration:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to pause integration',
      error: error.message,
    })
  }
}

/**
 * Resume integration scheduled syncs
 *
 * POST /admin/integrations/:id/resume
 *
 * Sets isActive=true to restart scheduled syncs
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function resumeIntegration(req, res) {
  try {
    const { id } = req.params

    // Get user ID from authenticated user
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const integration = await IntegrationService.resumeIntegration(id, userId)

    logger.info(`[IntegrationsController] Resumed integration ${id} by user ${userId}`)

    res.json({
      success: true,
      integration,
      message: 'Integration resumed successfully',
    })
  } catch (error) {
    logger.error('[IntegrationsController] Error resuming integration:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to resume integration',
      error: error.message,
    })
  }
}
