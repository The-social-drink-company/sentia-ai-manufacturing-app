/**
 * Queues Controller
 *
 * REST API endpoints for queue monitoring and management
 *
 * Endpoints (6):
 * - GET /admin/queues - List all queues with metrics
 * - GET /admin/queues/:id - Get queue details
 * - POST /admin/queues/:id/pause - Pause queue
 * - POST /admin/queues/:id/resume - Resume queue
 * - POST /admin/queues/:id/retry - Retry failed jobs
 * - POST /admin/queues/:id/clean - Clean completed/failed jobs
 *
 * @module controllers/admin/queuesController
 */

import QueueMonitorService from '../../services/admin/QueueMonitorService.js'
import logger from '../../utils/logger.js'

/**
 * GET /admin/queues
 * List all tracked queues with current metrics
 *
 * Query params:
 * - queueType: Filter by queue type (APPROVAL, SYNC, NOTIFICATION)
 * - isHealthy: Filter by health status (true/false)
 * - isPaused: Filter by paused status (true/false)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getQueues(req, res) {
  try {
    const { queueType, isHealthy, isPaused, page, limit } = req.query

    const filters = {}
    if (queueType) filters.queueType = queueType
    if (isHealthy !== undefined) filters.isHealthy = isHealthy === 'true'
    if (isPaused !== undefined) filters.isPaused = isPaused === 'true'

    const options = {}
    if (page) options.page = parseInt(page, 10)
    if (limit) options.limit = parseInt(limit, 10)

    const result = await QueueMonitorService.getAllQueues(filters, options)

    res.json({
      success: true,
      queues: result.queues,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('[QueuesController] Failed to get queues:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * GET /admin/queues/:id
 * Get queue details with health metrics
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getQueueById(req, res) {
  try {
    const { id } = req.params

    const queue = await QueueMonitorService.getQueueById(id)

    // Also get health metrics
    const health = await QueueMonitorService.getQueueHealth(queue.queueName)

    res.json({
      success: true,
      queue,
      health,
    })
  } catch (error) {
    logger.error(`[QueuesController] Failed to get queue ${req.params.id}:`, error)

    const statusCode = error.message.includes('not found') ? 404 : 500

    res.status(statusCode).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * POST /admin/queues/:id/pause
 * Pause queue (requires approval for production)
 *
 * Body:
 * - reason: Reason for pause (optional)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function pauseQueue(req, res) {
  try {
    const { id } = req.params
    const { reason } = req.body
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      })
    }

    // Get queue to extract queueName
    const queue = await QueueMonitorService.getQueueById(id)

    const result = await QueueMonitorService.pauseQueue(queue.queueName, userId, reason)

    res.json(result)
  } catch (error) {
    logger.error(`[QueuesController] Failed to pause queue ${req.params.id}:`, error)

    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('already paused')
        ? 400
        : 500

    res.status(statusCode).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * POST /admin/queues/:id/resume
 * Resume paused queue
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function resumeQueue(req, res) {
  try {
    const { id } = req.params
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      })
    }

    // Get queue to extract queueName
    const queue = await QueueMonitorService.getQueueById(id)

    const result = await QueueMonitorService.resumeQueue(queue.queueName, userId)

    res.json({
      success: true,
      queue: result,
      message: `Queue ${queue.queueName} resumed`,
    })
  } catch (error) {
    logger.error(`[QueuesController] Failed to resume queue ${req.params.id}:`, error)

    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('not paused')
        ? 400
        : 500

    res.status(statusCode).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * POST /admin/queues/:id/retry
 * Retry failed jobs in queue
 *
 * Body:
 * - limit: Max jobs to retry (default: 10)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function retryFailedJobs(req, res) {
  try {
    const { id } = req.params
    const { limit = 10 } = req.body

    // Get queue to extract queueName
    const queue = await QueueMonitorService.getQueueById(id)

    const result = await QueueMonitorService.retryFailedJobs(queue.queueName, parseInt(limit, 10))

    res.json(result)
  } catch (error) {
    logger.error(`[QueuesController] Failed to retry jobs in queue ${req.params.id}:`, error)

    const statusCode = error.message.includes('not found') ? 404 : 500

    res.status(statusCode).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * POST /admin/queues/:id/clean
 * Clean completed/failed jobs from queue
 *
 * Body:
 * - grace: Grace period in ms (default: 86400000 = 24h)
 * - limit: Max jobs to clean (optional)
 * - status: Job status to clean ('completed' or 'failed', default: 'completed')
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function cleanQueue(req, res) {
  try {
    const { id } = req.params
    const { grace, limit, status } = req.body

    // Get queue to extract queueName
    const queue = await QueueMonitorService.getQueueById(id)

    const options = {}
    if (grace) options.grace = parseInt(grace, 10)
    if (limit) options.limit = parseInt(limit, 10)
    if (status) options.status = status

    const result = await QueueMonitorService.cleanQueue(queue.queueName, options)

    res.json(result)
  } catch (error) {
    logger.error(`[QueuesController] Failed to clean queue ${req.params.id}:`, error)

    const statusCode = error.message.includes('not found') ? 404 : 500

    res.status(statusCode).json({
      success: false,
      error: error.message,
    })
  }
}
