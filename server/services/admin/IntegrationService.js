/**
 * IntegrationService
 *
 * Manages external API integrations with health monitoring and sync job orchestration
 *
 * Features:
 * - Integration CRUD operations
 * - Health check monitoring (connection tests, uptime tracking)
 * - Sync job creation and BullMQ queuing
 * - Pause/resume scheduled syncs
 * - Credential rotation with approval workflow
 * - Integration health metrics (uptime, avgResponseTime, consecutiveFailures)
 *
 * Supported Integrations:
 * - XERO: Financial data (AP, AR, bank accounts)
 * - SHOPIFY: Sales data (orders, products, inventory)
 * - AMAZON_SP_API: Marketplace orders and fulfillment
 * - UNLEASHED: ERP inventory and manufacturing data
 *
 * @module services/admin/IntegrationService
 */

import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'
import ApprovalService from './ApprovalService.js'

class IntegrationService {
  constructor() {
    this.INTEGRATION_TYPES = ['XERO', 'SHOPIFY', 'AMAZON_SP_API', 'UNLEASHED']
    this.HEALTH_CHECK_TIMEOUT = 10000 // 10 seconds
    this.MAX_CONSECUTIVE_FAILURES = 5
    this.UPTIME_CALCULATION_DAYS = 30
  }

  /**
   * Get integrations with filters and pagination
   *
   * @param {Object} filters - Filter criteria
   * @param {string} filters.type - Integration type
   * @param {boolean} filters.isActive - Active status
   * @param {string} filters.healthStatus - Health status
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} { integrations, pagination }
   */
  async getIntegrations(filters = {}, options = {}) {
    try {
      const { type, isActive, healthStatus } = filters
      const { page = 1, limit = 20 } = options

      const where = {}

      if (type) where.type = type
      if (isActive !== undefined) where.isActive = isActive
      if (healthStatus) where.healthStatus = healthStatus

      const [total, integrations] = await Promise.all([
        prisma.adminIntegration.count({ where }),
        prisma.adminIntegration.findMany({
          where,
          include: {
            syncJobs: {
              orderBy: { createdAt: 'desc' },
              take: 5, // Last 5 sync jobs
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      logger.info(`[IntegrationService] Retrieved ${integrations.length} integrations`)

      return {
        integrations,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      logger.error('[IntegrationService] Error getting integrations:', error)
      throw error
    }
  }

  /**
   * Get integration by ID
   *
   * @param {string} id - Integration ID
   * @returns {Promise<Object>} Integration with sync history
   */
  async getIntegrationById(id) {
    try {
      const integration = await prisma.adminIntegration.findUnique({
        where: { id },
        include: {
          syncJobs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!integration) {
        throw new Error(`Integration not found: ${id}`)
      }

      return integration
    } catch (error) {
      logger.error('[IntegrationService] Error getting integration:', error)
      throw error
    }
  }

  /**
   * Create new integration
   *
   * @param {Object} data - Integration data
   * @param {string} data.name - Unique integration name
   * @param {string} data.displayName - Display name
   * @param {string} data.type - Integration type (XERO, SHOPIFY, AMAZON_SP_API, UNLEASHED)
   * @param {Object} data.config - Integration configuration
   * @param {string} data.endpoint - API endpoint URL
   * @param {string} data.authMethod - Auth method (OAUTH2, API_KEY, BASIC)
   * @param {Object} data.credentials - API credentials (encrypted)
   * @returns {Promise<Object>} Created integration
   */
  async createIntegration(data) {
    try {
      const {
        name,
        displayName,
        type,
        config,
        endpoint,
        authMethod,
        apiKey,
        apiSecret,
        accessToken,
        refreshToken,
        owner,
      } = data

      // Validate required fields
      if (!name || !displayName || !type || !authMethod) {
        throw new Error('Missing required fields: name, displayName, type, authMethod')
      }

      // Validate integration type
      if (!this.INTEGRATION_TYPES.includes(type)) {
        throw new Error(
          `Invalid integration type: ${type}. Must be one of: ${this.INTEGRATION_TYPES.join(', ')}`
        )
      }

      // Create integration
      const integration = await prisma.adminIntegration.create({
        data: {
          name,
          displayName,
          type,
          config: config || {},
          endpoint,
          authMethod,
          apiKey,
          apiSecret,
          accessToken,
          refreshToken,
          owner,
          isActive: true,
          healthStatus: 'UNKNOWN',
        },
      })

      logger.info(
        `[IntegrationService] Created integration ${integration.id} (${integration.name})`
      )

      return integration
    } catch (error) {
      logger.error('[IntegrationService] Error creating integration:', error)
      throw error
    }
  }

  /**
   * Update integration
   *
   * Note: Use rotateCredentials() to update credentials
   *
   * @param {string} id - Integration ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated integration
   */
  async updateIntegration(id, updates) {
    try {
      // Disallow credential updates (use rotateCredentials instead)
      const disallowedFields = ['apiKey', 'apiSecret', 'accessToken', 'refreshToken']
      const hasDisallowedField = disallowedFields.some(field => field in updates)

      if (hasDisallowedField) {
        throw new Error(
          'Cannot update credentials via updateIntegration. Use rotateCredentials instead.'
        )
      }

      const updatedIntegration = await prisma.adminIntegration.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      })

      logger.info(`[IntegrationService] Updated integration ${id}`)

      return updatedIntegration
    } catch (error) {
      logger.error('[IntegrationService] Error updating integration:', error)
      throw error
    }
  }

  /**
   * Delete integration (soft delete via isActive=false)
   *
   * @param {string} id - Integration ID
   * @param {string} userId - User performing deletion
   * @returns {Promise<Object>} Deactivated integration
   */
  async deleteIntegration(id, userId) {
    try {
      const deactivatedIntegration = await prisma.adminIntegration.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      })

      // Create deactivation sync job
      await prisma.adminSyncJob.create({
        data: {
          integrationId: id,
          type: 'DEACTIVATION',
          operation: 'DEACTIVATE',
          status: 'COMPLETED',
          triggeredBy: userId,
          completedAt: new Date(),
          createdAt: new Date(),
        },
      })

      logger.info(`[IntegrationService] Deactivated integration ${id}`)

      return deactivatedIntegration
    } catch (error) {
      logger.error('[IntegrationService] Error deleting integration:', error)
      throw error
    }
  }

  /**
   * Test integration connection (health check)
   *
   * Dynamically loads integration module and calls healthCheck()
   *
   * @param {string} id - Integration ID
   * @returns {Promise<Object>} { healthy, responseTime, message }
   */
  async testConnection(id) {
    try {
      const integration = await this._getIntegration(id)

      const startTime = Date.now()

      try {
        // Dynamic import of integration module
        const integrationModule = await import(
          `../../integrations/${integration.type.toLowerCase()}.js`
        )

        // Call health check function
        if (typeof integrationModule.healthCheck !== 'function') {
          throw new Error(`Integration ${integration.type} does not implement healthCheck()`)
        }

        const result = await Promise.race([
          integrationModule.healthCheck(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), this.HEALTH_CHECK_TIMEOUT)
          ),
        ])

        const responseTime = Date.now() - startTime

        // Record successful health check
        await this._recordHealthCheck(id, responseTime, true)

        logger.info(
          `[IntegrationService] Health check successful for ${integration.name} (${responseTime}ms)`
        )

        return {
          healthy: true,
          responseTime,
          message: result.message || 'Health check successful',
        }
      } catch (healthError) {
        const responseTime = Date.now() - startTime

        // Record failed health check
        await this._recordHealthCheck(id, responseTime, false, healthError.message)

        logger.error(
          `[IntegrationService] Health check failed for ${integration.name}:`,
          healthError
        )

        return {
          healthy: false,
          responseTime,
          message: healthError.message || 'Health check failed',
        }
      }
    } catch (error) {
      logger.error('[IntegrationService] Error testing connection:', error)
      throw error
    }
  }

  /**
   * Sync integration (create sync job and enqueue to BullMQ)
   *
   * @param {string} id - Integration ID
   * @param {string} userId - User triggering sync
   * @returns {Promise<Object>} { syncJob, queueJobId }
   */
  async syncIntegration(id, userId) {
    try {
      const integration = await this._getIntegration(id)

      if (!integration.isActive) {
        throw new Error(`Cannot sync inactive integration: ${integration.name}`)
      }

      // Create AdminSyncJob
      const syncJob = await prisma.adminSyncJob.create({
        data: {
          integrationId: id,
          type: integration.type,
          operation: 'FULL_SYNC',
          status: 'PENDING',
          triggeredBy: userId,
          createdAt: new Date(),
        },
      })

      // Enqueue to syncJobQueue (dynamic import to avoid circular dependency)
      const { addSyncJob } = await import('../../queues/syncJobQueue.js')
      const queueJob = await addSyncJob(id, integration.type, { syncJobId: syncJob.id })

      // Update integration lastSyncAt
      await prisma.adminIntegration.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
        },
      })

      logger.info(
        `[IntegrationService] Created sync job ${syncJob.id} for integration ${integration.name}`
      )

      return {
        syncJob,
        queueJobId: queueJob.id,
      }
    } catch (error) {
      logger.error('[IntegrationService] Error syncing integration:', error)
      throw error
    }
  }

  /**
   * Pause integration (stop scheduled syncs)
   *
   * @param {string} id - Integration ID
   * @param {string} userId - User pausing integration
   * @returns {Promise<Object>} Paused integration
   */
  async pauseIntegration(id, userId) {
    try {
      const pausedIntegration = await prisma.adminIntegration.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      })

      // Create pause sync job
      await prisma.adminSyncJob.create({
        data: {
          integrationId: id,
          type: pausedIntegration.type,
          operation: 'PAUSE_SYNC',
          status: 'COMPLETED',
          triggeredBy: userId,
          completedAt: new Date(),
          createdAt: new Date(),
        },
      })

      logger.info(`[IntegrationService] Paused integration ${id}`)

      return pausedIntegration
    } catch (error) {
      logger.error('[IntegrationService] Error pausing integration:', error)
      throw error
    }
  }

  /**
   * Resume integration (restart scheduled syncs)
   *
   * @param {string} id - Integration ID
   * @param {string} userId - User resuming integration
   * @returns {Promise<Object>} Resumed integration
   */
  async resumeIntegration(id, userId) {
    try {
      const resumedIntegration = await prisma.adminIntegration.update({
        where: { id },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      })

      // Create resume sync job
      await prisma.adminSyncJob.create({
        data: {
          integrationId: id,
          type: resumedIntegration.type,
          operation: 'RESUME_SYNC',
          status: 'COMPLETED',
          triggeredBy: userId,
          completedAt: new Date(),
          createdAt: new Date(),
        },
      })

      logger.info(`[IntegrationService] Resumed integration ${id}`)

      return resumedIntegration
    } catch (error) {
      logger.error('[IntegrationService] Error resuming integration:', error)
      throw error
    }
  }

  /**
   * Get integration health metrics
   *
   * @param {string} id - Integration ID
   * @returns {Promise<Object>} Health metrics
   */
  async getIntegrationHealth(id) {
    try {
      const integration = await this._getIntegration(id)

      // Calculate uptime for last 30 days
      const uptime = await this._calculateUptime(id)

      return {
        uptime,
        avgResponseTime: integration.avgResponseTime,
        consecutiveFailures: integration.consecutiveFailures,
        healthStatus: integration.healthStatus,
        healthCheckedAt: integration.healthCheckedAt,
        lastError: integration.lastError,
      }
    } catch (error) {
      logger.error('[IntegrationService] Error getting integration health:', error)
      throw error
    }
  }

  /**
   * Get integration logs (sync job history)
   *
   * @param {string} id - Integration ID
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status
   * @param {string} options.type - Filter by type
   * @param {Date} options.startDate - Filter by date range
   * @param {Date} options.endDate - Filter by date range
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} { logs, pagination }
   */
  async getIntegrationLogs(id, options = {}) {
    try {
      const { status, type, startDate, endDate, page = 1, limit = 50 } = options

      const where = { integrationId: id }

      if (status) where.status = status
      if (type) where.type = type
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
      }

      const [total, logs] = await Promise.all([
        prisma.adminSyncJob.count({ where }),
        prisma.adminSyncJob.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      logger.error('[IntegrationService] Error getting integration logs:', error)
      throw error
    }
  }

  /**
   * Rotate integration credentials (requires approval)
   *
   * @param {string} id - Integration ID
   * @param {Object} newCredentials - New credentials
   * @param {string} newCredentials.apiKey - New API key
   * @param {string} newCredentials.apiSecret - New API secret
   * @param {string} newCredentials.accessToken - New access token
   * @param {string} newCredentials.refreshToken - New refresh token
   * @param {string} userId - User requesting rotation
   * @returns {Promise<Object>} { approval, approvalRequired }
   */
  async rotateCredentials(id, newCredentials, userId) {
    try {
      const integration = await this._getIntegration(id)

      // Create approval request (SECURITY category)
      const approval = await ApprovalService.createApprovalRequest({
        type: 'INTEGRATION_SYNC',
        category: 'SECURITY',
        priority: 'HIGH',
        title: `Rotate credentials for ${integration.displayName}`,
        description: `Rotate API credentials for integration "${integration.displayName}" (${integration.type})`,
        requestedChanges: {
          integrationId: id,
          integrationName: integration.name,
          integrationType: integration.type,
          action: 'ROTATE_CREDENTIALS',
          credentials: newCredentials, // TODO: Encrypt before storing
        },
        rationale: `Credential rotation requested by user ${userId} for security compliance`,
        requesterId: userId,
      })

      logger.info(`[IntegrationService] Created approval request for credential rotation ${id}`)

      return {
        approval,
        approvalRequired: true,
      }
    } catch (error) {
      logger.error('[IntegrationService] Error rotating credentials:', error)
      throw error
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate uptime percentage for last N days
   *
   * @private
   * @param {string} integrationId - Integration ID
   * @returns {Promise<number>} Uptime percentage (0-100)
   */
  async _calculateUptime(integrationId) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - this.UPTIME_CALCULATION_DAYS)

      const syncJobs = await prisma.adminSyncJob.findMany({
        where: {
          integrationId,
          createdAt: {
            gte: startDate,
          },
          operation: {
            in: ['FULL_SYNC', 'HEALTH_CHECK'],
          },
        },
      })

      if (syncJobs.length === 0) {
        return 0
      }

      const successCount = syncJobs.filter(job => job.status === 'COMPLETED').length
      const uptime = (successCount / syncJobs.length) * 100

      return Math.round(uptime * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      logger.error('[IntegrationService] Error calculating uptime:', error)
      return 0
    }
  }

  /**
   * Record health check result
   *
   * @private
   * @param {string} integrationId - Integration ID
   * @param {number} responseTime - Response time in ms
   * @param {boolean} success - Health check success
   * @param {string} errorMessage - Error message if failed
   * @returns {Promise<void>}
   */
  async _recordHealthCheck(integrationId, responseTime, success, errorMessage = null) {
    try {
      const integration = await this._getIntegration(integrationId)

      // Determine health status
      let healthStatus = 'HEALTHY'
      let consecutiveFailures = success ? 0 : (integration.consecutiveFailures || 0) + 1

      if (consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        healthStatus = 'DOWN'
      } else if (consecutiveFailures > 0 && consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES) {
        healthStatus = 'DEGRADED'
      }

      // Calculate rolling average response time
      const currentAvg = integration.avgResponseTime || 0
      const newAvg = currentAvg === 0 ? responseTime : Math.round((currentAvg + responseTime) / 2)

      // Update integration
      await prisma.adminIntegration.update({
        where: { id: integrationId },
        data: {
          healthStatus,
          healthCheckedAt: new Date(),
          avgResponseTime: newAvg,
          consecutiveFailures,
          lastError: errorMessage,
          updatedAt: new Date(),
        },
      })

      // Create health check sync job
      await prisma.adminSyncJob.create({
        data: {
          integrationId,
          type: integration.type,
          operation: 'HEALTH_CHECK',
          status: success ? 'COMPLETED' : 'FAILED',
          duration: responseTime,
          errors: errorMessage ? { message: errorMessage } : null,
          completedAt: new Date(),
          createdAt: new Date(),
        },
      })
    } catch (error) {
      logger.error('[IntegrationService] Error recording health check:', error)
    }
  }

  /**
   * Get integration or throw error
   *
   * @private
   * @param {string} id - Integration ID
   * @returns {Promise<Object>} Integration
   * @throws {Error} If not found
   */
  async _getIntegration(id) {
    const integration = await prisma.adminIntegration.findUnique({
      where: { id },
    })

    if (!integration) {
      throw new Error(`Integration not found: ${id}`)
    }

    return integration
  }
}

export default new IntegrationService()
