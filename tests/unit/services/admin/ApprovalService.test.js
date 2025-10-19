/**
 * ApprovalService Unit Tests
 *
 * Tests approval workflow state machine, auto-approval logic, and risk scoring
 *
 * Coverage:
 * - Approval creation and state transitions
 * - Auto-approval evaluation
 * - Risk scoring algorithm
 * - Approval/rejection flows
 * - History tracking
 * - Error handling
 *
 * @module tests/unit/services/admin/ApprovalService.test.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import ApprovalService from '../../../../server/services/admin/ApprovalService.js'
import prisma from '../../../../server/lib/prisma.js'

// Mock Prisma
vi.mock('../../../../server/lib/prisma.js', () => ({
  default: {
    adminApproval: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    adminApprovalHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Mock logger
vi.mock('../../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock approval queue (dynamic import)
vi.mock('../../../../server/queues/approvalQueue.js', () => ({
  addApprovalJob: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
}))

describe('ApprovalService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createApprovalRequest', () => {
    it('should create a pending approval request', async () => {
      const mockApproval = {
        id: 'approval-123',
        status: 'PENDING',
        type: 'FEATURE_FLAG',
        category: 'OPERATIONAL',
        priority: 'MEDIUM',
        title: 'Test Approval',
        description: 'Test description',
        requestedChanges: { flag: 'test-flag', enabled: true },
        rationale: 'Testing purposes',
        requesterId: 'user-123',
        mfaRequired: true,
        expiresAt: expect.any(Date),
        requester: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      }

      prisma.adminApproval.create.mockResolvedValue(mockApproval)
      prisma.adminApprovalHistory.create.mockResolvedValue({
        id: 'history-123',
        approvalId: 'approval-123',
        fromStatus: 'NULL',
        toStatus: 'PENDING',
        changedBy: 'user-123',
        comment: 'Approval request created',
      })

      const result = await ApprovalService.createApprovalRequest({
        type: 'FEATURE_FLAG',
        category: 'OPERATIONAL',
        priority: 'MEDIUM',
        title: 'Test Approval',
        description: 'Test description',
        requestedChanges: { flag: 'test-flag', enabled: true },
        rationale: 'Testing purposes',
        requesterId: 'user-123',
      })

      expect(result).toMatchObject({
        id: 'approval-123',
        status: 'PENDING',
        type: 'FEATURE_FLAG',
      })

      expect(prisma.adminApproval.create).toHaveBeenCalledWith({
        data: {
          requesterId: 'user-123',
          type: 'FEATURE_FLAG',
          category: 'OPERATIONAL',
          priority: 'MEDIUM',
          title: 'Test Approval',
          description: 'Test description',
          requestedChanges: { flag: 'test-flag', enabled: true },
          rationale: 'Testing purposes',
          status: 'PENDING',
          mfaRequired: true,
          expiresAt: expect.any(Date),
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

      expect(prisma.adminApprovalHistory.create).toHaveBeenCalled()
    })

    it('should auto-approve low-risk, low-amount, low-priority requests', async () => {
      const mockApproval = {
        id: 'approval-456',
        status: 'PENDING',
        type: 'QUEUE_OPERATION',
        category: 'OPERATIONAL',
        priority: 'LOW',
        requestedChanges: { amount: 5000, action: 'retry' },
        requester: { id: 'user-123', email: 'test@example.com' },
      }

      prisma.adminApproval.create.mockResolvedValue(mockApproval)
      prisma.adminApproval.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce({ ...mockApproval, status: 'APPROVED' })
      prisma.adminApproval.update.mockResolvedValue({ ...mockApproval, status: 'APPROVED' })
      prisma.adminApprovalHistory.create.mockResolvedValue({ id: 'history-456' })

      const result = await ApprovalService.createApprovalRequest({
        type: 'QUEUE_OPERATION',
        category: 'OPERATIONAL',
        priority: 'LOW',
        title: 'Auto-approve test',
        description: 'Low risk operation',
        requestedChanges: { amount: 5000, action: 'retry' },
        rationale: 'Testing auto-approval',
        requesterId: 'user-123',
      })

      expect(result.status).toBe('APPROVED')
    })
  })

  describe('evaluateAutoApproval', () => {
    it('should return true for low-risk, low-amount, low-priority requests', () => {
      const request = {
        type: 'QUEUE_OPERATION',
        category: 'OPERATIONAL',
        priority: 'LOW',
        requestedChanges: { amount: 5000 },
      }

      const result = ApprovalService.evaluateAutoApproval(request)

      expect(result).toBe(true)
    })

    it('should return false for high-amount requests', () => {
      const request = {
        type: 'QUEUE_OPERATION',
        category: 'OPERATIONAL',
        priority: 'LOW',
        requestedChanges: { amount: 15000 }, // Above £10k threshold
      }

      const result = ApprovalService.evaluateAutoApproval(request)

      expect(result).toBe(false)
    })

    it('should return false for high-risk categories', () => {
      const request = {
        type: 'CONFIG_CHANGE',
        category: 'SECURITY', // High risk (0.8)
        priority: 'LOW',
        requestedChanges: { amount: 5000 },
      }

      const result = ApprovalService.evaluateAutoApproval(request)

      expect(result).toBe(false)
    })

    it('should return false for high-priority requests', () => {
      const request = {
        type: 'QUEUE_OPERATION',
        category: 'OPERATIONAL',
        priority: 'HIGH', // Not LOW
        requestedChanges: { amount: 5000 },
      }

      const result = ApprovalService.evaluateAutoApproval(request)

      expect(result).toBe(false)
    })
  })

  describe('calculateRiskScore', () => {
    it('should calculate risk score correctly for SECURITY category', () => {
      const request = {
        type: 'CONFIG_CHANGE',
        category: 'SECURITY',
        priority: 'CRITICAL',
      }

      const score = ApprovalService.calculateRiskScore(request)

      // SECURITY: 0.8, CRITICAL: 0.9, CONFIG_CHANGE: 0.7
      // Average: (0.8 + 0.9 + 0.7) / 3 = 0.8
      expect(score).toBeCloseTo(0.8, 1)
    })

    it('should calculate risk score correctly for OPERATIONAL category', () => {
      const request = {
        type: 'QUEUE_OPERATION',
        category: 'OPERATIONAL',
        priority: 'LOW',
      }

      const score = ApprovalService.calculateRiskScore(request)

      // OPERATIONAL: 0.3, LOW: 0.2, QUEUE_OPERATION: 0.3
      // Average: (0.3 + 0.2 + 0.3) / 3 = 0.267
      expect(score).toBeCloseTo(0.267, 2)
    })

    it('should normalize risk score to maximum 1.0', () => {
      const request = {
        type: 'USER_MGMT', // 0.8
        category: 'SECURITY', // 0.8
        priority: 'CRITICAL', // 0.9
      }

      const score = ApprovalService.calculateRiskScore(request)

      expect(score).toBeLessThanOrEqual(1.0)
      expect(score).toBeGreaterThan(0.8) // High risk
    })
  })

  describe('approve', () => {
    it('should approve request with MFA verification', async () => {
      const mockApproval = {
        id: 'approval-789',
        status: 'MFA_REQUIRED',
        mfaRequired: true,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      }

      prisma.adminApproval.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce({ ...mockApproval, status: 'APPROVED' })
      prisma.adminApproval.update.mockResolvedValue({
        ...mockApproval,
        status: 'APPROVED',
        approvedBy: 'admin-123',
        approvedAt: new Date(),
      })
      prisma.adminApprovalHistory.create.mockResolvedValue({ id: 'history-789' })

      const result = await ApprovalService.approve('approval-789', 'admin-123', true)

      expect(result.status).toBe('APPROVED')
      expect(result.approvedBy).toBe('admin-123')

      expect(prisma.adminApproval.update).toHaveBeenCalledWith({
        where: { id: 'approval-789' },
        data: {
          status: 'APPROVED',
          approvedBy: 'admin-123',
          approvedAt: expect.any(Date),
          mfaVerifiedAt: expect.any(Date),
        },
        include: {
          requester: true,
          approver: true,
        },
      })
    })

    it('should reject approval without MFA verification', async () => {
      const mockApproval = {
        id: 'approval-999',
        status: 'PENDING',
        mfaRequired: true,
        expiresAt: new Date(Date.now() + 86400000),
      }

      prisma.adminApproval.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce({ ...mockApproval, status: 'APPROVED' })

      await expect(ApprovalService.approve('approval-999', 'admin-123', false)).rejects.toThrow(
        'MFA verification required for approval'
      )
    })

    it('should reject approval of already processed requests', async () => {
      const mockApproval = {
        id: 'approval-completed',
        status: 'COMPLETED',
        mfaRequired: true,
        expiresAt: new Date(Date.now() + 86400000),
      }

      prisma.adminApproval.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce({ ...mockApproval, status: 'APPROVED' })

      await expect(
        ApprovalService.approve('approval-completed', 'admin-123', true)
      ).rejects.toThrow('Cannot approve request with status: COMPLETED')
    })

    it('should reject expired approval requests', async () => {
      const mockApproval = {
        id: 'approval-expired',
        status: 'PENDING',
        mfaRequired: true,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      }

      prisma.adminApproval.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce({ ...mockApproval, status: 'APPROVED' })
      prisma.adminApproval.update.mockResolvedValue({ ...mockApproval, status: 'EXPIRED' })
      prisma.adminApprovalHistory.create.mockResolvedValue({ id: 'history-expired' })

      await expect(
        ApprovalService.approve('approval-expired', 'admin-123', true)
      ).rejects.toThrow('Approval request has expired')

      expect(prisma.adminApproval.update).toHaveBeenCalledWith({
        where: { id: 'approval-expired' },
        data: { status: 'EXPIRED' },
      })
    })
  })

  describe('reject', () => {
    it('should reject approval request with reason', async () => {
      const mockApproval = {
        id: 'approval-reject',
        status: 'PENDING',
      }

      prisma.adminApproval.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce({ ...mockApproval, status: 'APPROVED' })
      prisma.adminApproval.update.mockResolvedValue({
        ...mockApproval,
        status: 'REJECTED',
        rejectedBy: 'admin-456',
        rejectedAt: new Date(),
        rejectionReason: 'Insufficient justification',
      })
      prisma.adminApprovalHistory.create.mockResolvedValue({ id: 'history-reject' })

      const result = await ApprovalService.reject(
        'approval-reject',
        'admin-456',
        'Insufficient justification'
      )

      expect(result.status).toBe('REJECTED')
      expect(result.rejectionReason).toBe('Insufficient justification')

      expect(prisma.adminApprovalHistory.create).toHaveBeenCalledWith({
        data: {
          approvalId: 'approval-reject',
          fromStatus: 'PENDING',
          toStatus: 'REJECTED',
          changedBy: 'admin-456',
          changedAt: expect.any(Date),
          comment: 'Rejection reason: Insufficient justification',
        },
      })
    })

    it('should require rejection reason', async () => {
      const mockApproval = {
        id: 'approval-no-reason',
        status: 'PENDING',
      }

      prisma.adminApproval.findUnique
        .mockResolvedValueOnce(mockApproval)
        .mockResolvedValueOnce({ ...mockApproval, status: 'APPROVED' })

      await expect(ApprovalService.reject('approval-no-reason', 'admin-456', '')).rejects.toThrow(
        'Rejection reason is required'
      )
    })
  })

  describe('getApprovalRequests', () => {
    it('should return paginated approval requests with filters', async () => {
      const mockApprovals = [
        { id: 'approval-1', status: 'PENDING', type: 'FEATURE_FLAG' },
        { id: 'approval-2', status: 'PENDING', type: 'CONFIG_CHANGE' },
      ]

      prisma.adminApproval.count.mockResolvedValue(25)
      prisma.adminApproval.findMany.mockResolvedValue(mockApprovals)

      const result = await ApprovalService.getApprovalRequests(
        { status: 'PENDING' },
        { page: 1, limit: 20 }
      )

      expect(result.approvals).toHaveLength(2)
      expect(result.pagination).toEqual({
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
      })

      expect(prisma.adminApproval.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })
  })

  describe('getApprovalHistory', () => {
    it('should return approval history in chronological order', async () => {
      const mockHistory = [
        {
          id: 'hist-1',
          approvalId: 'approval-123',
          fromStatus: 'NULL',
          toStatus: 'PENDING',
          changedBy: 'user-123',
          changedAt: new Date('2025-10-19T10:00:00Z'),
        },
        {
          id: 'hist-2',
          approvalId: 'approval-123',
          fromStatus: 'PENDING',
          toStatus: 'MFA_REQUIRED',
          changedBy: 'SYSTEM',
          changedAt: new Date('2025-10-19T10:05:00Z'),
        },
        {
          id: 'hist-3',
          approvalId: 'approval-123',
          fromStatus: 'MFA_REQUIRED',
          toStatus: 'APPROVED',
          changedBy: 'admin-456',
          changedAt: new Date('2025-10-19T10:10:00Z'),
        },
      ]

      prisma.adminApprovalHistory.findMany.mockResolvedValue(mockHistory)

      const result = await ApprovalService.getApprovalHistory('approval-123')

      expect(result).toHaveLength(3)
      expect(result[0].toStatus).toBe('PENDING')
      expect(result[2].toStatus).toBe('APPROVED')

      expect(prisma.adminApprovalHistory.findMany).toHaveBeenCalledWith({
        where: { approvalId: 'approval-123' },
        orderBy: { changedAt: 'asc' },
      })
    })
  })
})

