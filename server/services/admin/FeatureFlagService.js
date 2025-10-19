/**
 * FeatureFlagService
 *
 * Manages feature flags with targeting logic and production approval workflow
 *
 * Features:
 * - Feature flag CRUD operations
 * - Production toggle requires approval (via ApprovalService)
 * - Targeting logic: percentage rollout, user targeting, role targeting, environment filtering
 * - Soft delete with deprecatedAt timestamp
 * - Complete audit trail via AdminFeatureFlagHistory
 *
 * Targeting Types:
 * - Percentage: Rollout to X% of users (deterministic hashing)
 * - Users: Target specific user IDs (targetUsers JSON array)
 * - Roles: Target specific roles (targetRoles JSON array)
 * - Environment: Environment-specific flags (development, test, production)
 *
 * @module services/admin/FeatureFlagService
 */

import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'
import ApprovalService from './ApprovalService.js'

class FeatureFlagService {
  constructor() {
    this.AUTO_APPROVE_ENVIRONMENTS = ['development', 'test']
    this.PRODUCTION_ENVIRONMENT = 'production'
  }

  /**
   * Create new feature flag
   *
   * @param {Object} data - Flag data
   * @param {string} data.key - Unique flag key
   * @param {string} data.name - Display name
   * @param {string} data.description - Flag description
   * @param {string} data.category - Category (FEATURE, EXPERIMENT, OPERATIONAL, SECURITY)
   * @param {string} data.environment - Environment (development, test, production)
   * @param {string} data.lastModifiedBy - User ID
   * @param {Object} data.targetUsers - Target user IDs array
   * @param {Object} data.targetRoles - Target roles array
   * @param {Object} data.conditions - Custom conditions
   * @param {number} data.rolloutPercentage - Percentage rollout (0-100)
   * @returns {Promise<Object>} Created flag
   */
  async createFeatureFlag(data) {
    try {
      const {
        key,
        name,
        description,
        category,
        environment = 'development',
        lastModifiedBy,
        targetUsers,
        targetRoles,
        conditions,
        rolloutPercentage = 0,
        tags,
        owner,
      } = data

      // Validate required fields
      if (!key || !name || !category || !lastModifiedBy) {
        throw new Error('Missing required fields: key, name, category, lastModifiedBy')
      }

      // Validate targeting data
      if (targetUsers) this._validateTargeting({ targetUsers })
      if (targetRoles) this._validateTargeting({ targetRoles })

      // Create feature flag
      const flag = await prisma.adminFeatureFlag.create({
        data: {
          key,
          name,
          description,
          category,
          environment,
          isEnabled: false, // Always start disabled
          rolloutPercentage,
          targetUsers,
          targetRoles,
          conditions,
          tags,
          owner,
          lastModifiedBy,
        },
      })

      // Create history entry
      await this._createHistoryEntry(flag.id, 'CREATED', null, flag, lastModifiedBy, 'Feature flag created')

      logger.info(`[FeatureFlagService] Created feature flag ${flag.id} (${flag.key})`)

      return flag
    } catch (error) {
      logger.error('[FeatureFlagService] Error creating feature flag:', error)
      throw error
    }
  }

  /**
   * Get feature flags with filters and pagination
   *
   * @param {Object} filters - Filter criteria
   * @param {string} filters.environment - Filter by environment
   * @param {boolean} filters.isEnabled - Filter by enabled status
   * @param {string} filters.category - Filter by category
   * @param {boolean} filters.deprecated - Include deprecated flags
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} { flags, pagination }
   */
  async getFeatureFlags(filters = {}, options = {}) {
    try {
      const { environment, isEnabled, category, deprecated = false } = filters
      const { page = 1, limit = 20 } = options

      const where = {}

      if (environment) where.environment = environment
      if (isEnabled !== undefined) where.isEnabled = isEnabled
      if (category) where.category = category
      if (!deprecated) where.deprecatedAt = null

      const [total, flags] = await Promise.all([
        prisma.adminFeatureFlag.count({ where }),
        prisma.adminFeatureFlag.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      logger.info(`[FeatureFlagService] Retrieved ${flags.length} feature flags`)

      return {
        flags,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      logger.error('[FeatureFlagService] Error getting feature flags:', error)
      throw error
    }
  }

  /**
   * Get feature flag by ID
   *
   * @param {string} id - Flag ID
   * @returns {Promise<Object>} Flag with history
   */
  async getFeatureFlagById(id) {
    try {
      const flag = await prisma.adminFeatureFlag.findUnique({
        where: { id },
        include: {
          history: {
            orderBy: { changedAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!flag) {
        throw new Error(`Feature flag not found: ${id}`)
      }

      return flag
    } catch (error) {
      logger.error('[FeatureFlagService] Error getting feature flag:', error)
      throw error
    }
  }

  /**
   * Update feature flag
   *
   * Note: Cannot update isEnabled via this method - use toggleFeatureFlag instead
   *
   * @param {string} id - Flag ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated flag
   */
  async updateFeatureFlag(id, updates) {
    try {
      // Disallow isEnabled updates (use toggleFeatureFlag instead)
      if ('isEnabled' in updates) {
        throw new Error('Cannot update isEnabled via updateFeatureFlag. Use toggleFeatureFlag instead.')
      }

      const existingFlag = await this._getFlag(id)

      const updatedFlag = await prisma.adminFeatureFlag.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      })

      // Create history entry
      await this._createHistoryEntry(id, 'UPDATED', existingFlag, updatedFlag, updates.lastModifiedBy || 'SYSTEM', 'Feature flag updated')

      logger.info(`[FeatureFlagService] Updated feature flag ${id}`)

      return updatedFlag
    } catch (error) {
      logger.error('[FeatureFlagService] Error updating feature flag:', error)
      throw error
    }
  }

  /**
   * Delete feature flag (soft delete)
   *
   * @param {string} id - Flag ID
   * @param {string} userId - User performing deletion
   * @returns {Promise<Object>} Deprecated flag
   */
  async deleteFeatureFlag(id, userId) {
    try {
      const existingFlag = await this._getFlag(id)

      const deprecatedFlag = await prisma.adminFeatureFlag.update({
        where: { id },
        data: {
          deprecatedAt: new Date(),
          lastModifiedBy: userId,
        },
      })

      // Create history entry
      await this._createHistoryEntry(id, 'DEPRECATED', existingFlag, deprecatedFlag, userId, 'Feature flag deprecated')

      logger.info(`[FeatureFlagService] Deprecated feature flag ${id}`)

      return deprecatedFlag
    } catch (error) {
      logger.error('[FeatureFlagService] Error deleting feature flag:', error)
      throw error
    }
  }

  /**
   * Toggle feature flag on/off
   *
   * Production toggles require approval via ApprovalService
   * Non-production toggles are immediate
   *
   * @param {string} id - Flag ID
   * @param {boolean} enabled - New enabled state
   * @param {string} userId - User performing toggle
   * @returns {Promise<Object>} { flag, approvalRequired, approval }
   */
  async toggleFeatureFlag(id, enabled, userId) {
    try {
      const flag = await this._getFlag(id)

      // Check if approval required (production environment)
      const approvalRequired = this._checkApprovalRequired(flag.environment)

      if (approvalRequired) {
        // Create approval request
        const approval = await ApprovalService.createApprovalRequest({
          type: 'FEATURE_FLAG',
          category: 'OPERATIONAL',
          priority: 'HIGH',
          title: `Toggle feature flag: ${flag.name}`,
          description: `Toggle feature flag "${flag.name}" (${flag.key}) to ${enabled ? 'ENABLED' : 'DISABLED'} in production environment`,
          requestedChanges: {
            flagId: id,
            flagKey: flag.key,
            action: 'TOGGLE',
            currentState: flag.isEnabled,
            newState: enabled,
            environment: flag.environment,
          },
          rationale: `Production feature flag toggle requested by user ${userId}`,
          requesterId: userId,
        })

        logger.info(`[FeatureFlagService] Created approval request for feature flag toggle ${id}`)

        return {
          flag,
          approvalRequired: true,
          approval,
        }
      }

      // Non-production: Toggle immediately
      const previousValue = flag.isEnabled

      const updatedFlag = await prisma.adminFeatureFlag.update({
        where: { id },
        data: {
          isEnabled: enabled,
          lastModifiedBy: userId,
          updatedAt: new Date(),
        },
      })

      // Create history entry
      await this._createHistoryEntry(
        id,
        'TOGGLED',
        { isEnabled: previousValue },
        { isEnabled: enabled },
        userId,
        `Feature flag ${enabled ? 'enabled' : 'disabled'}`
      )

      logger.info(`[FeatureFlagService] Toggled feature flag ${id} to ${enabled}`)

      return {
        flag: updatedFlag,
        approvalRequired: false,
      }
    } catch (error) {
      logger.error('[FeatureFlagService] Error toggling feature flag:', error)
      throw error
    }
  }

  /**
   * Evaluate feature flag for a given context
   *
   * Returns true if flag is enabled for this specific context
   *
   * @param {string} flagKey - Flag key
   * @param {Object} context - Evaluation context
   * @param {string} context.userId - User ID
   * @param {string} context.userRole - User role
   * @param {string} context.environment - Environment
   * @returns {Promise<boolean>} True if flag is enabled for this context
   */
  async evaluateFeatureFlag(flagKey, context) {
    try {
      const { userId, userRole, environment } = context

      const flag = await prisma.adminFeatureFlag.findUnique({
        where: { key: flagKey },
      })

      if (!flag) {
        logger.warn(`[FeatureFlagService] Feature flag not found: ${flagKey}`)
        return false
      }

      // Check if flag is enabled globally
      if (!flag.isEnabled) {
        return false
      }

      // Check environment match
      if (flag.environment && flag.environment !== environment) {
        return false
      }

      // Check if deprecated
      if (flag.deprecatedAt) {
        return false
      }

      // Evaluate targeting rules

      // 1. Target users (exact match)
      if (flag.targetUsers && Array.isArray(flag.targetUsers)) {
        if (flag.targetUsers.includes(userId)) {
          logger.info(`[FeatureFlagService] Flag ${flagKey} enabled for user ${userId} (target user)`)
          return true
        }
      }

      // 2. Target roles (exact match)
      if (flag.targetRoles && Array.isArray(flag.targetRoles)) {
        if (flag.targetRoles.includes(userRole)) {
          logger.info(`[FeatureFlagService] Flag ${flagKey} enabled for role ${userRole} (target role)`)
          return true
        }
      }

      // 3. Percentage rollout (deterministic hashing)
      if (flag.rolloutPercentage > 0) {
        const userHash = this._hashUserId(userId)
        const enabled = userHash < flag.rolloutPercentage

        if (enabled) {
          logger.info(`[FeatureFlagService] Flag ${flagKey} enabled for user ${userId} (percentage rollout: ${flag.rolloutPercentage}%)`)
          return true
        }
      }

      // 4. Custom conditions (future extension point)
      if (flag.conditions) {
        // TODO: Implement custom condition evaluation engine
        logger.warn(`[FeatureFlagService] Custom conditions not yet implemented for flag ${flagKey}`)
      }

      return false
    } catch (error) {
      logger.error('[FeatureFlagService] Error evaluating feature flag:', error)
      return false // Fail closed
    }
  }

  /**
   * Get feature flag history
   *
   * @param {string} id - Flag ID
   * @returns {Promise<Array>} History entries
   */
  async getFeatureFlagHistory(id) {
    try {
      const history = await prisma.adminFeatureFlagHistory.findMany({
        where: { flagId: id },
        orderBy: { changedAt: 'desc' },
      })

      return history
    } catch (error) {
      logger.error('[FeatureFlagService] Error getting feature flag history:', error)
      throw error
    }
  }

  /**
   * Get feature flags by environment
   *
   * @param {string} environment - Environment name
   * @returns {Promise<Array>} Flags
   */
  async getFlagsByEnvironment(environment) {
    try {
      const flags = await prisma.adminFeatureFlag.findMany({
        where: {
          environment,
          deprecatedAt: null,
        },
        orderBy: { name: 'asc' },
      })

      return flags
    } catch (error) {
      logger.error('[FeatureFlagService] Error getting flags by environment:', error)
      throw error
    }
  }

  /**
   * Create flag override (update targeting)
   *
   * @param {string} flagId - Flag ID
   * @param {Object} overrideData - Override data
   * @param {Array} overrideData.targetUsers - Target user IDs
   * @param {Array} overrideData.targetRoles - Target roles
   * @param {string} userId - User performing override
   * @returns {Promise<Object>} Updated flag
   */
  async createFlagOverride(flagId, overrideData, userId) {
    try {
      const existingFlag = await this._getFlag(flagId)

      const { targetUsers, targetRoles } = overrideData

      const updates = {}
      if (targetUsers !== undefined) {
        this._validateTargeting({ targetUsers })
        updates.targetUsers = targetUsers
      }
      if (targetRoles !== undefined) {
        this._validateTargeting({ targetRoles })
        updates.targetRoles = targetRoles
      }

      const updatedFlag = await prisma.adminFeatureFlag.update({
        where: { id: flagId },
        data: {
          ...updates,
          lastModifiedBy: userId,
          updatedAt: new Date(),
        },
      })

      // Create history entry
      await this._createHistoryEntry(
        flagId,
        'OVERRIDE_CREATED',
        existingFlag,
        updatedFlag,
        userId,
        'Targeting override created'
      )

      logger.info(`[FeatureFlagService] Created override for flag ${flagId}`)

      return updatedFlag
    } catch (error) {
      logger.error('[FeatureFlagService] Error creating flag override:', error)
      throw error
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate targeting data structure
   *
   * @private
   * @param {Object} targeting - Targeting data
   * @throws {Error} If invalid
   * @returns {boolean} True if valid
   */
  _validateTargeting(targeting) {
    const { targetUsers, targetRoles } = targeting

    if (targetUsers && !Array.isArray(targetUsers)) {
      throw new Error('targetUsers must be an array')
    }

    if (targetRoles && !Array.isArray(targetRoles)) {
      throw new Error('targetRoles must be an array')
    }

    return true
  }

  /**
   * Check if approval is required for this flag operation
   *
   * @private
   * @param {string} environment - Flag environment
   * @returns {boolean} True if approval required
   */
  _checkApprovalRequired(environment) {
    return environment === this.PRODUCTION_ENVIRONMENT
  }

  /**
   * Hash user ID to deterministic 0-99 value for percentage rollout
   *
   * Simple hash function for consistent user bucketing
   *
   * @private
   * @param {string} userId - User ID
   * @returns {number} Hash value (0-99)
   */
  _hashUserId(userId) {
    if (!userId) return 0

    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    // Convert to 0-99 range
    return Math.abs(hash) % 100
  }

  /**
   * Get flag or throw error
   *
   * @private
   * @param {string} id - Flag ID
   * @returns {Promise<Object>} Flag
   * @throws {Error} If not found
   */
  async _getFlag(id) {
    const flag = await prisma.adminFeatureFlag.findUnique({
      where: { id },
    })

    if (!flag) {
      throw new Error(`Feature flag not found: ${id}`)
    }

    return flag
  }

  /**
   * Create history entry
   *
   * @private
   * @param {string} flagId - Flag ID
   * @param {string} action - Action type
   * @param {Object} previousValue - Previous state
   * @param {Object} newValue - New state
   * @param {string} changedBy - User ID
   * @param {string} reason - Change reason
   * @returns {Promise<Object>} History entry
   */
  async _createHistoryEntry(flagId, action, previousValue, newValue, changedBy, reason) {
    return await prisma.adminFeatureFlagHistory.create({
      data: {
        flagId,
        action,
        previousValue,
        newValue,
        changedBy,
        reason,
        changedAt: new Date(),
      },
    })
  }
}

export default new FeatureFlagService()
