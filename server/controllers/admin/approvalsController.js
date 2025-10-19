/**
 * Admin Approvals Controller
 *
 * Handles HTTP requests for approval workflow management
 *
 * Endpoints:
 * - GET /admin/approvals - List approval requests with filters
 * - POST /admin/approvals - Create new approval request
 * - POST /admin/approvals/:id/approve - Approve request (requires MFA)
 * - POST /admin/approvals/:id/reject - Reject request
 * - GET /admin/approvals/:id/history - Get approval history
 *
 * @module controllers/admin/approvalsController
 */

import ApprovalService from '../../services/admin/ApprovalService.js'
import logger from '../../utils/logger.js'

/**
 * List approval requests with filters and pagination
 *
 * GET /admin/approvals
 *
 * Query params:
 * - status: Filter by status (PENDING, MFA_REQUIRED, APPROVED, REJECTED, etc.)
 * - type: Filter by type (FEATURE_FLAG, CONFIG_CHANGE, etc.)
 * - requesterId: Filter by requester user ID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function getApprovalRequests(req, res) {
  try {
    const { status, type, requesterId, page = 1, limit = 20 } = req.query

    const filters = {}
    if (status) filters.status = status
    if (type) filters.type = type
    if (requesterId) filters.requesterId = requesterId

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    }

    const result = await ApprovalService.getApprovalRequests(filters, options)

    logger.info(`[ApprovalsController] Listed ${result.approvals.length} approvals`)

    res.json({
      success: true,
      approvals: result.approvals,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('[ApprovalsController] Error listing approvals:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve approval requests',
      error: error.message,
    })
  }
}

/**
 * Create new approval request
 *
 * POST /admin/approvals
 *
 * Body:
 * - type: Approval type (FEATURE_FLAG, CONFIG_CHANGE, etc.)
 * - category: Category (SECURITY, CONFIGURATION, OPERATIONAL)
 * - priority: Priority (CRITICAL, HIGH, MEDIUM, LOW)
 * - title: Request title
 * - description: Detailed description
 * - requestedChanges: JSON object with changes to apply
 * - rationale: Business justification
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function createApprovalRequest(req, res) {
  try {
    const {
      type,
      category,
      priority = 'MEDIUM',
      title,
      description,
      requestedChanges,
      rationale,
    } = req.body

    // Validation
    if (!type || !category || !title || !description || !requestedChanges) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, category, title, description, requestedChanges',
      })
    }

    // Get requester ID from authenticated user
    const requesterId = req.user?.id || req.user?.userId

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const approval = await ApprovalService.createApprovalRequest({
      type,
      category,
      priority,
      title,
      description,
      requestedChanges,
      rationale,
      requesterId,
    })

    logger.info(
      `[ApprovalsController] Created approval request ${approval.id} by user ${requesterId}`
    )

    res.status(201).json({
      success: true,
      approval,
      message:
        approval.status === 'APPROVED'
          ? 'Request auto-approved and queued for execution'
          : 'Approval request created successfully',
    })
  } catch (error) {
    logger.error('[ApprovalsController] Error creating approval request:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create approval request',
      error: error.message,
    })
  }
}

/**
 * Approve approval request (requires MFA verification)
 *
 * POST /admin/approvals/:id/approve
 *
 * Body:
 * - mfaToken: MFA verification token (from MfaService.verifyMFACode)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function approveRequest(req, res) {
  try {
    const { id } = req.params
    const { mfaToken } = req.body

    // Get approver ID from authenticated user
    const approverId = req.user?.id || req.user?.userId

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    // Check MFA verification
    // MFA token should have been verified by middleware, but double-check
    const mfaVerified = req.user?.mfaVerified || req.session?.mfaVerified || !!mfaToken

    if (!mfaVerified) {
      return res.status(401).json({
        success: false,
        message: 'MFA verification required. Please verify MFA code first.',
      })
    }

    const approval = await ApprovalService.approve(id, approverId, mfaVerified)

    logger.info(`[ApprovalsController] Approval ${id} approved by user ${approverId}`)

    res.json({
      success: true,
      approval,
      message: 'Approval request approved and queued for execution',
    })
  } catch (error) {
    logger.error('[ApprovalsController] Error approving request:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to approve request',
      error: error.message,
    })
  }
}

/**
 * Reject approval request
 *
 * POST /admin/approvals/:id/reject
 *
 * Body:
 * - reason: Rejection reason (required)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function rejectRequest(req, res) {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      })
    }

    // Get rejector ID from authenticated user
    const rejectorId = req.user?.id || req.user?.userId

    if (!rejectorId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const approval = await ApprovalService.reject(id, rejectorId, reason)

    logger.info(`[ApprovalsController] Approval ${id} rejected by user ${rejectorId}`)

    res.json({
      success: true,
      approval,
      message: 'Approval request rejected',
    })
  } catch (error) {
    logger.error('[ApprovalsController] Error rejecting request:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reject request',
      error: error.message,
    })
  }
}

/**
 * Get approval history
 *
 * GET /admin/approvals/:id/history
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function getApprovalHistory(req, res) {
  try {
    const { id } = req.params

    const history = await ApprovalService.getApprovalHistory(id)

    logger.info(`[ApprovalsController] Retrieved history for approval ${id}`)

    res.json({
      success: true,
      history,
    })
  } catch (error) {
    logger.error('[ApprovalsController] Error retrieving approval history:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve approval history',
      error: error.message,
    })
  }
}

// Legacy function names for backward compatibility
export function listApprovals(req, res) {
  return getApprovalRequests(req, res)
}

export function submitApproval(req, res) {
  return createApprovalRequest(req, res)
}
