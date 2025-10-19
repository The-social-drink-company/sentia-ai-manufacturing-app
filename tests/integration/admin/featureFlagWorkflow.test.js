/**
 * Feature Flag Workflow Integration Tests
 *
 * End-to-end tests for complete feature flag workflows:
 * 1. Create feature flag in development
 * 2. Toggle flag (immediate in dev, approval required in production)
 * 3. Evaluate targeting logic
 * 4. Update flag metadata
 * 5. Deprecate flag
 *
 * Tests integration between FeatureFlagService, ApprovalService, and database
 *
 * @module tests/integration/admin/featureFlagWorkflow.test.js
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import FeatureFlagService from '../../../server/services/admin/FeatureFlagService.js'
import ApprovalService from '../../../server/services/admin/ApprovalService.js'
import prisma from '../../../server/lib/prisma.js'

// Mock logger
vi.mock('../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock approval queue
vi.mock('../../../server/queues/approvalQueue.js', () => ({
  addApprovalJob: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
}))

describe('Feature Flag Workflow Integration Tests', () => {
  let testUser
  let testFlag

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'flag-test@example.com',
        firstName: 'Flag',
        lastName: 'Tester',
        role: 'ADMIN',
        twoFactorEnabled: false,
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (testFlag) {
      await prisma.adminFeatureFlagHistory.deleteMany({
        where: { flagId: testFlag.id },
      })
      await prisma.adminFeatureFlag.delete({
        where: { id: testFlag.id },
      })
    }

    await prisma.user.delete({
      where: { id: testUser.id },
    })

    await prisma.$disconnect()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Development Feature Flag Workflow', () => {
    it('should create, toggle, evaluate, update, and deprecate flag in development', async () => {
      // Step 1: Create feature flag
      testFlag = await FeatureFlagService.createFeatureFlag({
        key: 'integration-test-flag',
        name: 'Integration Test Flag',
        description: 'Testing complete workflow',
        category: 'FEATURE',
        environment: 'development',
        rolloutPercentage: 0,
        targetUsers: [],
        targetRoles: [],
        tags: ['test', 'integration'],
        owner: testUser.id,
        lastModifiedBy: testUser.id,
      })

      expect(testFlag.id).toBeDefined()
      expect(testFlag.key).toBe('integration-test-flag')
      expect(testFlag.isEnabled).toBe(false)

      // Verify history entry
      let history = await FeatureFlagService.getFeatureFlagHistory(testFlag.id)
      expect(history.length).toBe(1)
      expect(history[0].action).toBe('CREATED')

      // Step 2: Toggle flag (should be immediate in development)
      const toggleResult = await FeatureFlagService.toggleFeatureFlag(
        testFlag.id,
        true,
        testUser.id
      )

      expect(toggleResult.approvalRequired).toBe(false)
      expect(toggleResult.flag.isEnabled).toBe(true)

      // Verify history updated
      history = await FeatureFlagService.getFeatureFlagHistory(testFlag.id)
      expect(history.length).toBe(2)
      expect(history[1].action).toBe('TOGGLED')

      // Step 3: Evaluate targeting (should be enabled for all since 0% rollout but flag is enabled)
      const evalResult1 = await FeatureFlagService.evaluateFeatureFlag(
        'integration-test-flag',
        {
          userId: testUser.id,
          environment: 'development',
        }
      )

      // With 0% rollout, flag should be disabled unless user is targeted
      expect(evalResult1.enabled).toBe(false)
      expect(evalResult1.reason).toBe('percentage_excluded')

      // Step 4: Update to 100% rollout
      const updatedFlag = await FeatureFlagService.updateFeatureFlag(
        testFlag.id,
        {
          rolloutPercentage: 100,
          description: 'Updated to 100% rollout',
        },
        testUser.id
      )

      expect(updatedFlag.rolloutPercentage).toBe(100)

      // Verify history
      history = await FeatureFlagService.getFeatureFlagHistory(testFlag.id)
      expect(history.length).toBe(3)
      expect(history[2].action).toBe('UPDATED')

      // Step 5: Re-evaluate (should now be enabled)
      const evalResult2 = await FeatureFlagService.evaluateFeatureFlag(
        'integration-test-flag',
        {
          userId: testUser.id,
          environment: 'development',
        }
      )

      expect(evalResult2.enabled).toBe(true)
      expect(evalResult2.reason).toBe('percentage_included')

      // Step 6: Deprecate flag
      const deprecatedFlag = await FeatureFlagService.deleteFeatureFlag(testFlag.id, testUser.id)

      expect(deprecatedFlag.deprecatedAt).toBeDefined()

      // Verify history
      history = await FeatureFlagService.getFeatureFlagHistory(testFlag.id)
      expect(history.length).toBe(4)
      expect(history[3].action).toBe('DELETED')

      // Cleanup
      await prisma.adminFeatureFlagHistory.deleteMany({
        where: { flagId: testFlag.id },
      })
      await prisma.adminFeatureFlag.delete({
        where: { id: testFlag.id },
      })
      testFlag = null
    })
  })

  describe('Production Feature Flag Approval Workflow', () => {
    it('should require approval for production flag toggle', async () => {
      // Create production flag
      const prodFlag = await FeatureFlagService.createFeatureFlag({
        key: 'production-test-flag',
        name: 'Production Test Flag',
        description: 'Testing production approval',
        category: 'FEATURE',
        environment: 'production',
        rolloutPercentage: 0,
        owner: testUser.id,
        lastModifiedBy: testUser.id,
      })

      // Attempt to toggle (should create approval request)
      const toggleResult = await FeatureFlagService.toggleFeatureFlag(
        prodFlag.id,
        true,
        testUser.id
      )

      expect(toggleResult.approvalRequired).toBe(true)
      expect(toggleResult.approval).toBeDefined()
      expect(toggleResult.approval.type).toBe('FEATURE_FLAG')
      expect(toggleResult.approval.status).toBe('PENDING')

      // Verify flag is NOT enabled yet
      const flagCheck = await prisma.adminFeatureFlag.findUnique({
        where: { id: prodFlag.id },
      })
      expect(flagCheck.isEnabled).toBe(false)

      // Cleanup
      await prisma.adminApprovalHistory.deleteMany({
        where: { approvalId: toggleResult.approval.id },
      })
      await prisma.adminApproval.delete({
        where: { id: toggleResult.approval.id },
      })
      await prisma.adminFeatureFlagHistory.deleteMany({
        where: { flagId: prodFlag.id },
      })
      await prisma.adminFeatureFlag.delete({
        where: { id: prodFlag.id },
      })
    })
  })

  describe('User Targeting Workflow', () => {
    it('should evaluate user targeting correctly', async () => {
      // Create flag with specific user targeting
      const targetedFlag = await FeatureFlagService.createFeatureFlag({
        key: 'user-targeted-flag',
        name: 'User Targeted Flag',
        description: 'Testing user targeting',
        category: 'FEATURE',
        environment: 'production',
        rolloutPercentage: 0,
        targetUsers: [testUser.id],
        owner: testUser.id,
        lastModifiedBy: testUser.id,
      })

      // Enable flag
      await prisma.adminFeatureFlag.update({
        where: { id: targetedFlag.id },
        data: { isEnabled: true },
      })

      // Evaluate for targeted user
      const evalTargeted = await FeatureFlagService.evaluateFeatureFlag('user-targeted-flag', {
        userId: testUser.id,
        environment: 'production',
      })

      expect(evalTargeted.enabled).toBe(true)
      expect(evalTargeted.reason).toBe('user_targeted')

      // Evaluate for non-targeted user
      const evalNonTargeted = await FeatureFlagService.evaluateFeatureFlag('user-targeted-flag', {
        userId: 'other-user-id',
        environment: 'production',
      })

      expect(evalNonTargeted.enabled).toBe(false)
      expect(evalNonTargeted.reason).toBe('percentage_excluded')

      // Cleanup
      await prisma.adminFeatureFlagHistory.deleteMany({
        where: { flagId: targetedFlag.id },
      })
      await prisma.adminFeatureFlag.delete({
        where: { id: targetedFlag.id },
      })
    })
  })

  describe('Role Targeting Workflow', () => {
    it('should evaluate role targeting correctly', async () => {
      // Create flag with role targeting
      const roleFlag = await FeatureFlagService.createFeatureFlag({
        key: 'admin-only-flag',
        name: 'Admin Only Flag',
        description: 'Testing role targeting',
        category: 'FEATURE',
        environment: 'production',
        rolloutPercentage: 0,
        targetRoles: ['ADMIN'],
        owner: testUser.id,
        lastModifiedBy: testUser.id,
      })

      // Enable flag
      await prisma.adminFeatureFlag.update({
        where: { id: roleFlag.id },
        data: { isEnabled: true },
      })

      // Evaluate for ADMIN role
      const evalAdmin = await FeatureFlagService.evaluateFeatureFlag('admin-only-flag', {
        userId: testUser.id,
        userRole: 'ADMIN',
        environment: 'production',
      })

      expect(evalAdmin.enabled).toBe(true)
      expect(evalAdmin.reason).toBe('role_targeted')

      // Evaluate for non-ADMIN role
      const evalUser = await FeatureFlagService.evaluateFeatureFlag('admin-only-flag', {
        userId: 'user-123',
        userRole: 'USER',
        environment: 'production',
      })

      expect(evalUser.enabled).toBe(false)
      expect(evalUser.reason).toBe('percentage_excluded')

      // Cleanup
      await prisma.adminFeatureFlagHistory.deleteMany({
        where: { flagId: roleFlag.id },
      })
      await prisma.adminFeatureFlag.delete({
        where: { id: roleFlag.id },
      })
    })
  })

  describe('Percentage Rollout Workflow', () => {
    it('should distribute users deterministically based on percentage', async () => {
      // Create flag with 50% rollout
      const rolloutFlag = await FeatureFlagService.createFeatureFlag({
        key: 'gradual-rollout-flag',
        name: 'Gradual Rollout Flag',
        description: 'Testing percentage rollout',
        category: 'FEATURE',
        environment: 'production',
        rolloutPercentage: 50,
        owner: testUser.id,
        lastModifiedBy: testUser.id,
      })

      // Enable flag
      await prisma.adminFeatureFlag.update({
        where: { id: rolloutFlag.id },
        data: { isEnabled: true },
      })

      // Test with multiple users (deterministic results)
      const users = Array.from({ length: 100 }, (_, i) => `user-${i}`)
      const evaluations = await Promise.all(
        users.map((userId) =>
          FeatureFlagService.evaluateFeatureFlag('gradual-rollout-flag', {
            userId,
            environment: 'production',
          })
        )
      )

      const enabledCount = evaluations.filter((e) => e.enabled).length

      // Should be approximately 50% (allow 20% variance due to hash distribution)
      expect(enabledCount).toBeGreaterThan(30)
      expect(enabledCount).toBeLessThan(70)

      // Verify deterministic behavior (same user, same result)
      const eval1 = await FeatureFlagService.evaluateFeatureFlag('gradual-rollout-flag', {
        userId: 'user-stable',
        environment: 'production',
      })

      const eval2 = await FeatureFlagService.evaluateFeatureFlag('gradual-rollout-flag', {
        userId: 'user-stable',
        environment: 'production',
      })

      expect(eval1.enabled).toBe(eval2.enabled)

      // Cleanup
      await prisma.adminFeatureFlagHistory.deleteMany({
        where: { flagId: rolloutFlag.id },
      })
      await prisma.adminFeatureFlag.delete({
        where: { id: rolloutFlag.id },
      })
    })
  })
})
