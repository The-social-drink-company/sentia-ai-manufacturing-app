/**
 * Approval Service
 *
 * Manages approval workflow with state machine for sensitive admin operations
 *
 * State Machine:
 * PENDING → MFA_REQUIRED → APPROVED → COMPLETED
 *                       → REJECTED
 *                       → EXPIRED
 *
 * @module services/admin/ApprovalService
 */

import prisma from '../../lib/prisma.js'
import logger from '../../utils/logger.js'

class ApprovalService {
  constructor() {
    this.AUTO_APPROVE_THRESHOLD = 10000 // £10,000
    this.HIGH_RISK_THRESHOLD = 0.7
    this.MEDIUM_RISK_THRESHOLD = 0.4
    this.DEFAULT_EXPIRY_HOURS = 24
  }

  /**
   * Create new approval request
   *
   * @param {Object} data - Approval request data
   * @returns {Promise<Object>} Created approval request
   */
  async createApprovalRequest(data) {
    const {
      type,
      category,
      priority = 'MEDIUM',
      title,
      description,
      requestedChanges,
      rationale,
      requesterId,
    } = data

    try {
      // Calculate expiration (24 hours by default)
      const expiresAt = new Date(Date.now() + this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000)

      // Create approval request
      const approval = await prisma.adminApproval.create({
        data: {
          requesterId,
          type,
          category,
          priority,
          title,
          description,
          requestedChanges,
          rationale,
          status: 'PENDING',
          mfaRequired: true,
          expiresAt,
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      // Create history entry
      await this._createHistoryEntry(
        approval.id,
        null,
        'PENDING',
        requesterId,
        'Approval request created'
      )

      // Check if auto-approval is possible
      if (this.evaluateAutoApproval(data)) {
        logger.info(`[ApprovalService] Auto-approving request ${approval.id}`)
        return await this.approve(approval.id, 'SYSTEM', true)
      }

      logger.info(`[ApprovalService] Created approval request: ${approval.id}`)
      return approval
    } catch (error) {
      logger.error('[ApprovalService] Error creating approval:', error)
      throw error
    }
  }

  /**
   * Transition approval to MFA_REQUIRED state
   *
   * @param {string} approvalId - Approval ID
   * @returns {Promise<Object>} Updated approval
   */
  async transitionToMfaRequired(approvalId) {
    try {
      const approval = await this._getApproval(approvalId)

      if (approval.status !== 'PENDING') {
        throw new Error(`Cannot transition from ${approval.status} to MFA_REQUIRED`)
      }

      const updated = await prisma.adminApproval.update({
        where: { id: approvalId },
        data: { status: 'MFA_REQUIRED' },
      })

      await this._createHistoryEntry(
        approvalId,
        'PENDING',
        'MFA_REQUIRED',
        'SYSTEM',
        'Waiting for MFA verification'
      )

      logger.info(`[ApprovalService] Transitioned ${approvalId} to MFA_REQUIRED`)
      return updated
    } catch (error) {
      logger.error('[ApprovalService] Error transitioning to MFA_REQUIRED:', error)
      throw error
    }
  }

  /**
   * Approve request (requires MFA verification)
   *
   * @param {string} approvalId - Approval ID
   * @param {string} approverId - Approver user ID
   * @param {boolean} mfaVerified - MFA verification status
   * @returns {Promise<Object>} Updated approval
   */
  async approve(approvalId, approverId, mfaVerified) {
    try {
      const approval = await this._getApproval(approvalId)

      // Check MFA requirement
      if (approval.mfaRequired && !mfaVerified && approverId !== 'SYSTEM') {
        throw new Error('MFA verification required for approval')
      }

      // Check if already processed
      if (['APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(approval.status)) {
        throw new Error(`Cannot approve request with status: ${approval.status}`)
      }

      // Check expiration
      if (new Date() > new Date(approval.expiresAt)) {
        await this._expireRequest(approvalId)
        throw new Error('Approval request has expired')
      }

      const updated = await prisma.adminApproval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          approvedBy: approverId,
          approvedAt: new Date(),
          mfaVerifiedAt: mfaVerified ? new Date() : null,
        },
        include: {
          requester: true,
          approver: true,
        },
      })

      await this._createHistoryEntry(
        approvalId,
        approval.status,
        'APPROVED',
        approverId,
        'Approval granted'
      )

      // Enqueue for execution
      logger.info(`[ApprovalService] Enqueueing approval ${approvalId} for execution`)
      await this.execute(approvalId)

      logger.info(`[ApprovalService] Approved request: ${approvalId}`)
      return updated
    } catch (error) {
      logger.error('[ApprovalService] Error approving request:', error)
      throw error
    }
  }

  /**
   * Reject request
   *
   * @param {string} approvalId - Approval ID
   * @param {string} rejectorId - Rejector user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated approval
   */
  async reject(approvalId, rejectorId, reason) {
    try {
      const approval = await this._getApproval(approvalId)

      if (!reason) {
        throw new Error('Rejection reason is required')
      }

      // Check if already processed
      if (['APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(approval.status)) {
        throw new Error(`Cannot reject request with status: ${approval.status}`)
      }

      const updated = await prisma.adminApproval.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          rejectedBy: rejectorId,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
        include: {
          requester: true,
          rejector: true,
        },
      })

      await this._createHistoryEntry(
        approvalId,
        approval.status,
        'REJECTED',
        rejectorId,
        `Rejection reason: ${reason}`
      )

      logger.info(`[ApprovalService] Rejected request: ${approvalId}`)
      return updated
    } catch (error) {
      logger.error('[ApprovalService] Error rejecting request:', error)
      throw error
    }
  }

  /**
   * Execute approved action (enqueue to BullMQ)
   *
   * @param {string} approvalId - Approval ID
   * @returns {Promise<Object>} Job info
   */
  async execute(approvalId) {
    try {
      const approval = await this._getApproval(approvalId)

      if (approval.status !== 'APPROVED') {
        throw new Error(`Cannot execute approval with status: ${approval.status}`)
      }

      // Dynamic import to avoid circular dependency
      const { addApprovalJob } = await import('../../queues/approvalQueue.js')

      const job = await addApprovalJob(approvalId, approval.requestedChanges)

      logger.info(`[ApprovalService] Enqueued approval ${approvalId} for execution: job ${job.id}`)
      return { jobId: job.id, approvalId }
    } catch (error) {
      logger.error('[ApprovalService] Error executing approval:', error)
      throw error
    }
  }

  /**
   * Mark approval as completed
   *
   * @param {string} approvalId - Approval ID
   * @param {Object} result - Execution result
   * @returns {Promise<Object>} Updated approval
   */
  async markCompleted(approvalId, result) {
    try {
      const approval = await this._getApproval(approvalId)

      const updated = await prisma.adminApproval.update({
        where: { id: approvalId },
        data: {
          status: 'COMPLETED',
          executedAt: new Date(),
          executionResult: result,
        },
      })

      await this._createHistoryEntry(
        approvalId,
        approval.status,
        'COMPLETED',
        'SYSTEM',
        'Execution successful'
      )

      logger.info(`[ApprovalService] Marked approval ${approvalId} as completed`)
      return updated
    } catch (error) {
      logger.error('[ApprovalService] Error marking as completed:', error)
      throw error
    }
  }

  /**
   * Mark approval as failed
   *
   * @param {string} approvalId - Approval ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} Updated approval
   */
  async markFailed(approvalId, errorMessage) {
    try {
      const approval = await this._getApproval(approvalId)

      const updated = await prisma.adminApproval.update({
        where: { id: approvalId },
        data: {
          status: 'FAILED',
          executedAt: new Date(),
          executionError: errorMessage,
        },
      })

      await this._createHistoryEntry(
        approvalId,
        approval.status,
        'FAILED',
        'SYSTEM',
        `Execution failed: ${errorMessage}`
      )

      logger.error(`[ApprovalService] Marked approval ${approvalId} as failed: ${errorMessage}`)
      return updated
    } catch (error) {
      logger.error('[ApprovalService] Error marking as failed:', error)
      throw error
    }
  }

  /**
   * Expire old requests (cron job)
   *
   * @returns {Promise<number>} Number of expired requests
   */
  async expireOldRequests() {
    try {
      const now = new Date()

      const expiredApprovals = await prisma.adminApproval.findMany({
        where: {
          expiresAt: { lt: now },
          status: { in: ['PENDING', 'MFA_REQUIRED'] },
        },
      })

      for (const approval of expiredApprovals) {
        await this._expireRequest(approval.id)
      }

      logger.info(`[ApprovalService] Expired ${expiredApprovals.length} old requests`)
      return expiredApprovals.length
    } catch (error) {
      logger.error('[ApprovalService] Error expiring old requests:', error)
      throw error
    }
  }

  /**
   * Get approval requests with filters and pagination
   *
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated approvals
   */
  async getApprovalRequests(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 20 } = options
      const skip = (page - 1) * limit

      const where = {}

      if (filters.status) {
        where.status = filters.status
      }

      if (filters.type) {
        where.type = filters.type
      }

      if (filters.requesterId) {
        where.requesterId = filters.requesterId
      }

      const [total, approvals] = await Promise.all([
        prisma.adminApproval.count({ where }),
        prisma.adminApproval.findMany({
          where,
          include: {
            requester: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            approver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            rejector: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
      ])

      return {
        approvals,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      logger.error('[ApprovalService] Error getting approvals:', error)
      throw error
    }
  }

  /**
   * Get single approval by ID
   *
   * @param {string} approvalId - Approval ID
   * @returns {Promise<Object>} Approval
   */
  async getApprovalById(approvalId) {
    return await this._getApproval(approvalId)
  }

  /**
   * Get approval history
   *
   * @param {string} approvalId - Approval ID
   * @returns {Promise<Array>} History entries
   */
  async getApprovalHistory(approvalId) {
    try {
      const history = await prisma.adminApprovalHistory.findMany({
        where: { approvalId },
        orderBy: { changedAt: 'asc' },
      })

      return history
    } catch (error) {
      logger.error('[ApprovalService] Error getting approval history:', error)
      throw error
    }
  }

  /**
   * Evaluate if request can be auto-approved
   *
   * @param {Object} request - Request data
   * @returns {boolean} True if auto-approved
   */
  evaluateAutoApproval(request) {
    const riskScore = this.calculateRiskScore(request)

    // Auto-approve only low-risk, low-amount requests
    const amount = request.requestedChanges?.amount || 0
    const isLowAmount = amount < this.AUTO_APPROVE_THRESHOLD
    const isLowRisk = riskScore < this.MEDIUM_RISK_THRESHOLD
    const isLowPriority = request.priority === 'LOW'

    return isLowAmount && isLowRisk && isLowPriority
  }

  /**
   * Calculate risk score (0-1)
   *
   * @param {Object} request - Request data
   * @returns {number} Risk score
   */
  calculateRiskScore(request) {
    let score = 0

    // Category risk
    const categoryRisk = {
      SECURITY: 0.8,
      CONFIGURATION: 0.6,
      OPERATIONAL: 0.3,
    }
    score += categoryRisk[request.category] || 0.5

    // Priority risk
    const priorityRisk = {
      CRITICAL: 0.9,
      HIGH: 0.7,
      MEDIUM: 0.5,
      LOW: 0.2,
    }
    score += priorityRisk[request.priority] || 0.5

    // Type risk
    const typeRisk = {
      CONFIG_CHANGE: 0.7,
      FEATURE_FLAG: 0.5,
      INTEGRATION_SYNC: 0.4,
      QUEUE_OPERATION: 0.3,
      USER_MGMT: 0.8,
    }
    score += typeRisk[request.type] || 0.5

    // Normalize (0-1)
    return Math.min(score / 3, 1)
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get approval with error handling
   *
   * @private
   * @param {string} approvalId - Approval ID
   * @returns {Promise<Object>} Approval
   */
  async _getApproval(approvalId) {
    const approval = await prisma.adminApproval.findUnique({
      where: { id: approvalId },
      include: {
        requester: true,
        approver: true,
        rejector: true,
      },
    })

    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`)
    }

    return approval
  }

  /**
   * Expire a request
   *
   * @private
   * @param {string} approvalId - Approval ID
   * @returns {Promise<Object>} Updated approval
   */
  async _expireRequest(approvalId) {
    const approval = await prisma.adminApproval.update({
      where: { id: approvalId },
      data: { status: 'EXPIRED' },
    })

    await this._createHistoryEntry(
      approvalId,
      'PENDING',
      'EXPIRED',
      'SYSTEM',
      'Request expired'
    )

    logger.info(`[ApprovalService] Expired request: ${approvalId}`)
    return approval
  }

  /**
   * Create approval history entry
   *
   * @private
   * @param {string} approvalId - Approval ID
   * @param {string} fromStatus - Previous status
   * @param {string} toStatus - New status
   * @param {string} changedBy - User ID who made the change
   * @param {string} comment - Optional comment
   * @returns {Promise<Object>} History entry
   */
  async _createHistoryEntry(approvalId, fromStatus, toStatus, changedBy, comment = null) {
    return await prisma.adminApprovalHistory.create({
      data: {
        approvalId,
        fromStatus: fromStatus || 'NULL',
        toStatus,
        changedBy,
        changedAt: new Date(),
        comment,
      },
    })
  }
}

// Export singleton instance
export default new ApprovalService()
