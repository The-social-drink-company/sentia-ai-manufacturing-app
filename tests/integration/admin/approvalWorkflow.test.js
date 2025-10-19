/**
 * Approval Workflow Integration Tests
 *
 * End-to-end tests for complete approval workflow:
 * 1. Request MFA code
 * 2. Verify MFA code
 * 3. Create approval request
 * 4. Approve with MFA verification
 * 5. Queue execution
 * 6. Check approval history
 *
 * Also tests rejection flow and expiration handling
 *
 * @module tests/integration/admin/approvalWorkflow.test.js
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import ApprovalService from '../../../server/services/admin/ApprovalService.js'
import MfaService from '../../../server/services/admin/MfaService.js'
import prisma from '../../../server/lib/prisma.js'
import speakeasy from 'speakeasy'

// Mock approval queue to avoid Redis dependency in tests
vi.mock('../../../server/queues/approvalQueue.js', () => ({
  addApprovalJob: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
}))

// Mock logger
vi.mock('../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Approval Workflow Integration Tests', () => {
  let testUser
  let testApproval

  beforeAll(async () => {
    // Create test user in database
    testUser = await prisma.user.create({
      data: {
        email: 'approval-test@example.com',
        firstName: 'Approval',
        lastName: 'Tester',
        role: 'ADMIN',
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (testApproval) {
      await prisma.adminApprovalHistory.deleteMany({
        where: { approvalId: testApproval.id },
      })
      await prisma.adminApproval.delete({
        where: { id: testApproval.id },
      })
    }

    await prisma.user.delete({
      where: { id: testUser.id },
    })

    await prisma.$disconnect()
  })

  beforeEach(() => {
    MfaService.clearAllRateLimits()
  })

  describe('Complete Approval Flow with MFA', () => {
    it('should complete full approval workflow: MFA setup → request → approve → execute', async () => {
      // Step 1: Request MFA code (first-time setup)
      const mfaRequestResult = await MfaService.requestMFACode(testUser.id, 'approve_request', 'totp')

      expect(mfaRequestResult.success).toBe(true)
      expect(mfaRequestResult.qrCode).toBeDefined()
      expect(mfaRequestResult.secret).toBeDefined()

      const secret = mfaRequestResult.secret

      // Step 2: Generate valid TOTP code
      const validCode = speakeasy.totp({
        secret,
        encoding: 'base32',
      })

      // Step 3: Verify MFA code
      const mfaVerifyResult = await MfaService.verifyMFACode(testUser.id, validCode)

      expect(mfaVerifyResult.verified).toBe(true)
      expect(mfaVerifyResult.token).toBeDefined()

      // Step 4: Create approval request
      testApproval = await ApprovalService.createApprovalRequest({
        type: 'FEATURE_FLAG',
        category: 'CONFIGURATION',
        priority: 'HIGH',
        title: 'Integration Test Approval',
        description: 'Testing complete approval workflow',
        requestedChanges: {
          flag: 'test-feature-flag',
          enabled: true,
        },
        rationale: 'Integration testing purposes',
        requesterId: testUser.id,
      })

      expect(testApproval.status).toBe('PENDING')
      expect(testApproval.mfaRequired).toBe(true)

      // Step 5: Approve request with MFA verification
      const approvedRequest = await ApprovalService.approve(testApproval.id, testUser.id, true)

      expect(approvedRequest.status).toBe('APPROVED')
      expect(approvedRequest.approvedBy).toBe(testUser.id)
      expect(approvedRequest.mfaVerifiedAt).toBeDefined()

      // Step 6: Check approval history
      const history = await ApprovalService.getApprovalHistory(testApproval.id)

      expect(history.length).toBeGreaterThanOrEqual(2)
      expect(history[0].toStatus).toBe('PENDING')
      expect(history.some((h) => h.toStatus === 'APPROVED')).toBe(true)

      // Cleanup
      await prisma.adminApprovalHistory.deleteMany({
        where: { approvalId: testApproval.id },
      })
      await prisma.adminApproval.delete({
        where: { id: testApproval.id },
      })
      testApproval = null
    })
  })

  describe('Rejection Flow', () => {
    it('should reject approval request with reason', async () => {
      // Create approval request
      const approval = await ApprovalService.createApprovalRequest({
        type: 'CONFIG_CHANGE',
        category: 'OPERATIONAL',
        priority: 'MEDIUM',
        title: 'Rejection Test',
        description: 'Testing rejection flow',
        requestedChanges: { config: 'test' },
        rationale: 'Testing',
        requesterId: testUser.id,
      })

      // Reject request
      const rejectedApproval = await ApprovalService.reject(
        approval.id,
        testUser.id,
        'Insufficient business justification'
      )

      expect(rejectedApproval.status).toBe('REJECTED')
      expect(rejectedApproval.rejectedBy).toBe(testUser.id)
      expect(rejectedApproval.rejectionReason).toBe('Insufficient business justification')

      // Check history
      const history = await ApprovalService.getApprovalHistory(approval.id)
      const rejectionEntry = history.find((h) => h.toStatus === 'REJECTED')

      expect(rejectionEntry).toBeDefined()
      expect(rejectionEntry.comment).toContain('Insufficient business justification')

      // Cleanup
      await prisma.adminApprovalHistory.deleteMany({
        where: { approvalId: approval.id },
      })
      await prisma.adminApproval.delete({
        where: { id: approval.id },
      })
    })
  })

  describe('Auto-Approval Flow', () => {
    it('should auto-approve low-risk, low-amount, low-priority requests', async () => {
      const approval = await ApprovalService.createApprovalRequest({
        type: 'QUEUE_OPERATION',
        category: 'OPERATIONAL',
        priority: 'LOW',
        title: 'Auto-Approve Test',
        description: 'Low-risk operation',
        requestedChanges: {
          amount: 3000, // Below £10k threshold
          action: 'retry_jobs',
        },
        rationale: 'Routine maintenance',
        requesterId: testUser.id,
      })

      expect(approval.status).toBe('APPROVED')
      expect(approval.approvedBy).toBe('SYSTEM')

      // Check history for auto-approval
      const history = await ApprovalService.getApprovalHistory(approval.id)
      expect(history.some((h) => h.changedBy === 'SYSTEM' && h.toStatus === 'APPROVED')).toBe(true)

      // Cleanup
      await prisma.adminApprovalHistory.deleteMany({
        where: { approvalId: approval.id },
      })
      await prisma.adminApproval.delete({
        where: { id: approval.id },
      })
    })

    it('should NOT auto-approve high-risk requests', async () => {
      const approval = await ApprovalService.createApprovalRequest({
        type: 'USER_MGMT',
        category: 'SECURITY', // High risk
        priority: 'LOW',
        title: 'High Risk Test',
        description: 'User deletion request',
        requestedChanges: {
          amount: 0,
          userId: 'user-to-delete',
        },
        rationale: 'Security breach',
        requesterId: testUser.id,
      })

      expect(approval.status).toBe('PENDING')
      expect(approval.approvedBy).toBeNull()

      // Cleanup
      await prisma.adminApprovalHistory.deleteMany({
        where: { approvalId: approval.id },
      })
      await prisma.adminApproval.delete({
        where: { id: approval.id },
      })
    })
  })

  describe('MFA Rate Limiting', () => {
    it('should enforce rate limiting after 3 failed MFA attempts', async () => {
      // Request MFA (user should already have TOTP from previous test)
      await MfaService.requestMFACode(testUser.id, 'test_action', 'totp')

      // Attempt 3 invalid verifications
      await expect(MfaService.verifyMFACode(testUser.id, '111111')).rejects.toThrow()
      await expect(MfaService.verifyMFACode(testUser.id, '222222')).rejects.toThrow()
      await expect(MfaService.verifyMFACode(testUser.id, '333333')).rejects.toThrow()

      // Fourth attempt should be rate-limited
      await expect(MfaService.verifyMFACode(testUser.id, '444444')).rejects.toThrow(
        'Too many MFA verification attempts'
      )

      // Clear rate limit for subsequent tests
      MfaService.clearAllRateLimits()
    })
  })

  describe('Approval Expiration', () => {
    it('should reject approval of expired requests', async () => {
      // Create approval with short expiration
      const approval = await prisma.adminApproval.create({
        data: {
          requesterId: testUser.id,
          type: 'FEATURE_FLAG',
          category: 'OPERATIONAL',
          priority: 'MEDIUM',
          title: 'Expiration Test',
          description: 'Testing expiration handling',
          requestedChanges: { flag: 'test' },
          rationale: 'Testing',
          status: 'PENDING',
          mfaRequired: true,
          expiresAt: new Date(Date.now() - 3600000), // 1 hour ago (expired)
        },
      })

      // Attempt to approve expired request
      await expect(ApprovalService.approve(approval.id, testUser.id, true)).rejects.toThrow(
        'Approval request has expired'
      )

      // Check that approval was marked as EXPIRED
      const expiredApproval = await prisma.adminApproval.findUnique({
        where: { id: approval.id },
      })

      expect(expiredApproval.status).toBe('EXPIRED')

      // Cleanup
      await prisma.adminApprovalHistory.deleteMany({
        where: { approvalId: approval.id },
      })
      await prisma.adminApproval.delete({
        where: { id: approval.id },
      })
    })
  })

  describe('Approval Filtering and Pagination', () => {
    it('should filter and paginate approval requests correctly', async () => {
      // Create multiple test approvals
      const approvals = await Promise.all([
        ApprovalService.createApprovalRequest({
          type: 'FEATURE_FLAG',
          category: 'OPERATIONAL',
          priority: 'HIGH',
          title: 'Test 1',
          description: 'Description 1',
          requestedChanges: { test: 1 },
          rationale: 'Testing',
          requesterId: testUser.id,
        }),
        ApprovalService.createApprovalRequest({
          type: 'CONFIG_CHANGE',
          category: 'CONFIGURATION',
          priority: 'MEDIUM',
          title: 'Test 2',
          description: 'Description 2',
          requestedChanges: { test: 2 },
          rationale: 'Testing',
          requesterId: testUser.id,
        }),
      ])

      // Filter by type
      const featureFlagApprovals = await ApprovalService.getApprovalRequests(
        { type: 'FEATURE_FLAG' },
        { page: 1, limit: 10 }
      )

      expect(featureFlagApprovals.approvals.some((a) => a.type === 'FEATURE_FLAG')).toBe(true)

      // Filter by status
      const pendingApprovals = await ApprovalService.getApprovalRequests(
        { status: 'PENDING' },
        { page: 1, limit: 10 }
      )

      expect(pendingApprovals.approvals.every((a) => a.status === 'PENDING')).toBe(true)

      // Cleanup
      for (const approval of approvals) {
        await prisma.adminApprovalHistory.deleteMany({
          where: { approvalId: approval.id },
        })
        await prisma.adminApproval.delete({
          where: { id: approval.id },
        })
      }
    })
  })
})
