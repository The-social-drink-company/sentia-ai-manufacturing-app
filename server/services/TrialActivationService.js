/**
 * Trial Activation Service
 *
 * Tracks trial user engagement and activation metrics.
 * Captures key milestones in the trial journey to optimize conversion.
 *
 * @module server/services/TrialActivationService
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 1 (Trial Signup Flow)
 */

import { tenantPrisma } from './tenantPrisma.js'

export class TrialActivationService {
  /**
   * Track trial activation (first login)
   *
   * @param {string} tenantId - Tenant UUID
   * @param {string} clerkUserId - Clerk user ID
   * @returns {Promise<Object>} Updated tenant with activation timestamp
   */
  async activateTrial(tenantId, clerkUserId) {
    console.log(`[TrialActivation] Activating trial for tenant: ${tenantId}`)

    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const tenant = await globalClient.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`)
      }

      // Only activate once (idempotent)
      if (tenant.trialActivated) {
        console.log(`[TrialActivation] Trial already activated for tenant: ${tenantId}`)
        return tenant
      }

      const updatedTenant = await globalClient.tenant.update({
        where: { id: tenantId },
        data: {
          trialActivated: true,
          trialStartedAt: tenant.trialStartedAt || new Date(),
          firstLoginAt: new Date(),
          lastActiveAt: new Date(),
          sessionsCount: 1
        }
      })

      console.log(`[TrialActivation] ✅ Trial activated for tenant: ${tenantId}`)

      // Log activation event
      await this.logActivationEvent(tenantId, clerkUserId, 'trial.activated')

      return updatedTenant
    } catch (error) {
      console.error(`[TrialActivation] Activation failed:`, error)
      throw new Error(`Trial activation failed: ${error.message}`)
    }
  }

  /**
   * Track trial onboarding completion
   *
   * @param {string} tenantId - Tenant UUID
   * @param {string} clerkUserId - Clerk user ID
   * @returns {Promise<Object>} Updated tenant
   */
  async completeOnboarding(tenantId, clerkUserId) {
    console.log(`[TrialActivation] Completing onboarding for tenant: ${tenantId}`)

    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const updatedTenant = await globalClient.tenant.update({
        where: { id: tenantId },
        data: {
          trialOnboarded: true,
          lastActiveAt: new Date()
        }
      })

      console.log(`[TrialActivation] ✅ Onboarding completed for tenant: ${tenantId}`)

      // Log onboarding event
      await this.logActivationEvent(tenantId, clerkUserId, 'trial.onboarded')

      return updatedTenant
    } catch (error) {
      console.error(`[TrialActivation] Onboarding completion failed:`, error)
      throw new Error(`Onboarding completion failed: ${error.message}`)
    }
  }

  /**
   * Track session activity
   *
   * @param {string} tenantId - Tenant UUID
   * @returns {Promise<Object>} Updated tenant with incremented session count
   */
  async trackSession(tenantId) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const updatedTenant = await globalClient.tenant.update({
        where: { id: tenantId },
        data: {
          lastActiveAt: new Date(),
          sessionsCount: { increment: 1 }
        }
      })

      return updatedTenant
    } catch (error) {
      console.error(`[TrialActivation] Session tracking failed:`, error)
      // Non-fatal - don't throw
      return null
    }
  }

  /**
   * Track feature exploration
   *
   * @param {string} tenantId - Tenant UUID
   * @param {string} featureSlug - Feature identifier (e.g., 'ai_forecasting', 'what_if_analysis')
   * @returns {Promise<Object>} Updated tenant
   */
  async trackFeatureExploration(tenantId, featureSlug) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const tenant = await globalClient.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) return null

      // Get existing explored features
      const featuresExplored = tenant.featuresExplored || []

      // Add feature if not already explored
      if (!featuresExplored.includes(featureSlug)) {
        const updatedTenant = await globalClient.tenant.update({
          where: { id: tenantId },
          data: {
            featuresExplored: [...featuresExplored, featureSlug],
            lastActiveAt: new Date()
          }
        })

        console.log(`[TrialActivation] Feature explored: ${featureSlug} (tenant: ${tenantId})`)

        return updatedTenant
      }

      return tenant
    } catch (error) {
      console.error(`[TrialActivation] Feature tracking failed:`, error)
      // Non-fatal - don't throw
      return null
    }
  }

  /**
   * Track upgrade prompt shown
   *
   * @param {string} tenantId - Tenant UUID
   * @param {string} promptType - Prompt type (e.g., 'banner', 'modal_day_7', 'modal_day_11')
   * @returns {Promise<Object>} Updated tenant
   */
  async trackUpgradePrompt(tenantId, promptType) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const updatedTenant = await globalClient.tenant.update({
        where: { id: tenantId },
        data: {
          upgradePromptShown: { increment: 1 },
          lastActiveAt: new Date()
        }
      })

      console.log(`[TrialActivation] Upgrade prompt shown: ${promptType} (tenant: ${tenantId})`)

      return updatedTenant
    } catch (error) {
      console.error(`[TrialActivation] Upgrade prompt tracking failed:`, error)
      // Non-fatal - don't throw
      return null
    }
  }

  /**
   * Track upgrade click (first time user clicks upgrade)
   *
   * @param {string} tenantId - Tenant UUID
   * @param {string} source - Click source (e.g., 'banner', 'modal', 'email')
   * @returns {Promise<Object>} Updated tenant
   */
  async trackUpgradeClick(tenantId, source) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const tenant = await globalClient.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) return null

      // Only track first click
      if (!tenant.upgradeClickedAt) {
        const updatedTenant = await globalClient.tenant.update({
          where: { id: tenantId },
          data: {
            upgradeClickedAt: new Date(),
            lastActiveAt: new Date()
          }
        })

        console.log(`[TrialActivation] First upgrade click tracked: ${source} (tenant: ${tenantId})`)

        // Log upgrade click event
        await this.logActivationEvent(tenantId, null, 'trial.upgrade_clicked', { source })

        return updatedTenant
      }

      return tenant
    } catch (error) {
      console.error(`[TrialActivation] Upgrade click tracking failed:`, error)
      // Non-fatal - don't throw
      return null
    }
  }

  /**
   * Track trial conversion (trial → paid)
   *
   * @param {string} tenantId - Tenant UUID
   * @param {string} clerkUserId - Clerk user ID
   * @param {string} tier - Subscription tier (starter, professional, enterprise)
   * @param {string} cycle - Billing cycle (monthly, annual)
   * @returns {Promise<Object>} Updated tenant
   */
  async trackConversion(tenantId, clerkUserId, tier, cycle) {
    console.log(`[TrialActivation] Tracking conversion for tenant: ${tenantId}`)

    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const tenant = await globalClient.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`)
      }

      // Calculate conversion time
      const trialStartedAt = tenant.trialStartedAt || tenant.createdAt
      const conversionDays = Math.floor(
        (Date.now() - new Date(trialStartedAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      const updatedTenant = await globalClient.tenant.update({
        where: { id: tenantId },
        data: {
          convertedAt: new Date(),
          conversionDays,
          lastActiveAt: new Date()
        }
      })

      console.log(`[TrialActivation] ✅ Conversion tracked: ${tenantId} (${conversionDays} days, ${tier}/${cycle})`)

      // Log conversion event
      await this.logActivationEvent(tenantId, clerkUserId, 'trial.converted', {
        tier,
        cycle,
        conversionDays
      })

      return updatedTenant
    } catch (error) {
      console.error(`[TrialActivation] Conversion tracking failed:`, error)
      throw new Error(`Conversion tracking failed: ${error.message}`)
    }
  }

  /**
   * Get trial engagement summary for tenant
   *
   * @param {string} tenantId - Tenant UUID
   * @returns {Promise<Object>} Engagement metrics
   */
  async getEngagementSummary(tenantId) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      const tenant = await globalClient.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`)
      }

      const now = new Date()
      const trialStartedAt = tenant.trialStartedAt || tenant.createdAt
      const daysInTrial = Math.floor((now - new Date(trialStartedAt)) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, Math.floor((new Date(tenant.trialEndsAt) - now) / (1000 * 60 * 60 * 24)))

      return {
        tenantId,
        subscriptionStatus: tenant.subscriptionStatus,
        subscriptionTier: tenant.subscriptionTier,
        trialActivated: tenant.trialActivated,
        trialOnboarded: tenant.trialOnboarded,
        daysInTrial,
        daysRemaining,
        sessionsCount: tenant.sessionsCount || 0,
        featuresExplored: tenant.featuresExplored || [],
        upgradePromptShown: tenant.upgradePromptShown || 0,
        upgradeClickedAt: tenant.upgradeClickedAt,
        convertedAt: tenant.convertedAt,
        conversionDays: tenant.conversionDays,
        engagementScore: this.calculateEngagementScore(tenant)
      }
    } catch (error) {
      console.error(`[TrialActivation] Get engagement summary failed:`, error)
      throw new Error(`Get engagement summary failed: ${error.message}`)
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Log activation event to audit log
   * @private
   */
  async logActivationEvent(tenantId, clerkUserId, action, metadata = {}) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      await globalClient.auditLog.create({
        data: {
          tenantId,
          userId: clerkUserId,
          action,
          resourceType: 'trial',
          resourceId: tenantId,
          ipAddress: null,
          userAgent: 'TrialActivationService',
          metadata
        }
      })
    } catch (error) {
      console.error(`[TrialActivation] Failed to log event:`, error)
      // Non-fatal error - continue processing
    }
  }

  /**
   * Calculate engagement score (0-100)
   * @private
   */
  calculateEngagementScore(tenant) {
    let score = 0

    // Trial activated (20 points)
    if (tenant.trialActivated) score += 20

    // Onboarding completed (20 points)
    if (tenant.trialOnboarded) score += 20

    // Session activity (up to 30 points)
    const sessionPoints = Math.min(30, tenant.sessionsCount * 3)
    score += sessionPoints

    // Feature exploration (up to 20 points)
    const featuresExplored = tenant.featuresExplored || []
    const featurePoints = Math.min(20, featuresExplored.length * 4)
    score += featurePoints

    // Upgrade clicked (10 points)
    if (tenant.upgradeClickedAt) score += 10

    return Math.min(100, score)
  }
}

// Singleton instance
export const trialActivationService = new TrialActivationService()
