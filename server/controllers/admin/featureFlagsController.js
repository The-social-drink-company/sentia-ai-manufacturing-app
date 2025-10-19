/**
 * Feature Flags Controller
 *
 * Handles HTTP requests for feature flag management
 *
 * Endpoints:
 * - GET /admin/feature-flags - List feature flags with filters
 * - POST /admin/feature-flags - Create new feature flag
 * - POST /admin/feature-flags/:id/toggle - Toggle feature flag on/off
 *
 * @module controllers/admin/featureFlagsController
 */

import FeatureFlagService from '../../services/admin/FeatureFlagService.js'
import logger from '../../utils/logger.js'

/**
 * List feature flags with filters and pagination
 *
 * GET /admin/feature-flags
 *
 * Query params:
 * - environment: Filter by environment (development, test, production)
 * - isEnabled: Filter by enabled status (true/false)
 * - category: Filter by category
 * - deprecated: Include deprecated flags (true/false, default: false)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function getFeatureFlags(req, res) {
  try {
    const { environment, isEnabled, category, deprecated, page = 1, limit = 20 } = req.query

    const filters = {}
    if (environment) filters.environment = environment
    if (isEnabled !== undefined) filters.isEnabled = isEnabled === 'true'
    if (category) filters.category = category
    if (deprecated !== undefined) filters.deprecated = deprecated === 'true'

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    }

    const result = await FeatureFlagService.getFeatureFlags(filters, options)

    logger.info(`[FeatureFlagsController] Listed ${result.flags.length} feature flags`)

    res.json({
      success: true,
      flags: result.flags,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('[FeatureFlagsController] Error listing feature flags:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feature flags',
      error: error.message,
    })
  }
}

/**
 * Create new feature flag
 *
 * POST /admin/feature-flags
 *
 * Body:
 * - key: Unique flag key (required)
 * - name: Display name (required)
 * - description: Flag description
 * - category: Category (required) - FEATURE, EXPERIMENT, OPERATIONAL, SECURITY
 * - environment: Environment (default: development)
 * - rolloutPercentage: Percentage rollout (0-100, default: 0)
 * - targetUsers: Array of target user IDs
 * - targetRoles: Array of target roles
 * - conditions: Custom conditions (JSON)
 * - tags: Array of tags
 * - owner: Owner user ID
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function createFeatureFlag(req, res) {
  try {
    const {
      key,
      name,
      description,
      category,
      environment = 'development',
      rolloutPercentage = 0,
      targetUsers,
      targetRoles,
      conditions,
      tags,
      owner,
    } = req.body

    // Validation
    if (!key || !name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: key, name, category',
      })
    }

    // Get user ID from authenticated user
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const flag = await FeatureFlagService.createFeatureFlag({
      key,
      name,
      description,
      category,
      environment,
      rolloutPercentage,
      targetUsers,
      targetRoles,
      conditions,
      tags,
      owner: owner || userId,
      lastModifiedBy: userId,
    })

    logger.info(
      `[FeatureFlagsController] Created feature flag ${flag.id} (${flag.key}) by user ${userId}`
    )

    res.status(201).json({
      success: true,
      flag,
      message: 'Feature flag created successfully',
    })
  } catch (error) {
    logger.error('[FeatureFlagsController] Error creating feature flag:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create feature flag',
      error: error.message,
    })
  }
}

/**
 * Toggle feature flag on/off
 *
 * POST /admin/feature-flags/:id/toggle
 *
 * Body:
 * - enabled: Boolean (required) - New enabled state
 *
 * Production environment toggles create approval request
 * Non-production environments toggle immediately
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function toggleFeatureFlag(req, res) {
  try {
    const { id } = req.params
    const { enabled } = req.body

    // Validation
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled must be a boolean value',
      })
    }

    // Get user ID from authenticated user
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const result = await FeatureFlagService.toggleFeatureFlag(id, enabled, userId)

    if (result.approvalRequired) {
      logger.info(`[FeatureFlagsController] Created approval request for feature flag toggle ${id}`)

      return res.json({
        success: true,
        approvalRequired: true,
        approval: result.approval,
        flag: result.flag,
        message: 'Production feature flag toggle requires approval. Approval request created.',
      })
    }

    logger.info(
      `[FeatureFlagsController] Toggled feature flag ${id} to ${enabled} by user ${userId}`
    )

    res.json({
      success: true,
      approvalRequired: false,
      flag: result.flag,
      message: `Feature flag ${enabled ? 'enabled' : 'disabled'} successfully`,
    })
  } catch (error) {
    logger.error('[FeatureFlagsController] Error toggling feature flag:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to toggle feature flag',
      error: error.message,
    })
  }
}
