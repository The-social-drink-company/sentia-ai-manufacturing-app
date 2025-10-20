/**
 * Trial Provisioning Service for CapLiquify Multi-Tenant System
 *
 * Handles the complete trial signup flow:
 * - Tenant creation with 14-day trial
 * - User provisioning with 'owner' role
 * - Audit logging
 * - Error handling and idempotency
 *
 * @module server/services/TrialProvisioningService
 */

import { tenantPrisma } from './tenantPrisma.js'
import { getOrganization, getUser } from '../../src/lib/clerk.js'

/**
 * Trial Provisioning Service
 *
 * Orchestrates the trial signup process:
 * 1. Validates Clerk organization and user
 * 2. Creates tenant schema with trial defaults
 * 3. Creates user record with 'owner' role
 * 4. Logs audit trail
 * 5. Handles duplicate signups gracefully
 *
 * @class TrialProvisioningService
 *
 * @example
 * import { trialProvisioningService } from './services/TrialProvisioningService.js'
 *
 * const result = await trialProvisioningService.provisionTenant({
 *   clerkOrganizationId: 'org_abc123',
 *   clerkUserId: 'user_xyz789',
 *   organizationName: 'Acme Manufacturing',
 *   slug: 'acme-manufacturing',
 *   subscriptionTier: 'professional'
 * })
 */
export class TrialProvisioningService {
  constructor() {
    this.TRIAL_DURATION_DAYS = parseInt(process.env.TRIAL_DURATION_DAYS || '14', 10)
    this.TRIAL_DEFAULT_TIER = process.env.TRIAL_DEFAULT_TIER || 'professional'
    this.TRIAL_GRACE_PERIOD_DAYS = parseInt(process.env.TRIAL_GRACE_PERIOD_DAYS || '7', 10)
  }

  /**
   * Provision Tenant for Trial Signup
   *
   * Creates a new tenant with 14-day trial and provisions the owner user.
   * Idempotent - if tenant already exists for Clerk org, returns existing tenant.
   *
   * @param {Object} params - Provisioning parameters
   * @param {string} params.clerkOrganizationId - Clerk organization ID
   * @param {string} params.clerkUserId - Clerk user ID (will become owner)
   * @param {string} params.organizationName - Organization display name
   * @param {string} params.slug - Unique URL-safe slug for tenant
   * @param {string} [params.subscriptionTier='professional'] - Subscription tier
   * @param {Object} [params.metadata={}] - Additional metadata
   * @param {string} [params.ipAddress] - User IP address for audit logging
   * @param {string} [params.userAgent] - User agent for audit logging
   * @returns {Promise<Object>} Result object with tenant, user, and success status
   *
   * @throws {Error} If validation fails or provisioning encounters error
   *
   * @example
   * const result = await trialProvisioningService.provisionTenant({
   *   clerkOrganizationId: 'org_abc123',
   *   clerkUserId: 'user_xyz789',
   *   organizationName: 'Acme Manufacturing',
   *   slug: 'acme-manufacturing',
   *   subscriptionTier: 'professional',
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...'
   * })
   *
   * if (result.success) {
   *   console.log(`Tenant created: ${result.tenant.slug}`)
   *   console.log(`Trial expires: ${result.tenant.trialEndsAt}`)
   * }
   */
  async provisionTenant(params) {
    const {
      clerkOrganizationId,
      clerkUserId,
      organizationName,
      slug,
      subscriptionTier = this.TRIAL_DEFAULT_TIER,
      metadata = {},
      ipAddress,
      userAgent
    } = params

    console.log(`[TrialProvisioning] Starting provisioning for organization: ${organizationName} (${clerkOrganizationId})`)

    // ===== STEP 1: Check for existing tenant (idempotency) =====
    try {
      const existingTenant = await tenantPrisma.getTenantByClerkOrg(clerkOrganizationId)

      if (existingTenant) {
        console.log(`[TrialProvisioning] Tenant already exists for Clerk org ${clerkOrganizationId}`)

        // Get existing user
        const globalClient = tenantPrisma.getGlobalClient()
        const existingUser = await globalClient.user.findUnique({
          where: { clerkUserId }
        })

        return {
          success: true,
          tenant: existingTenant,
          user: existingUser,
          alreadyExists: true,
          message: 'Tenant already provisioned for this organization'
        }
      }
    } catch (error) {
      console.error('[TrialProvisioning] Error checking existing tenant:', error)
      throw new Error(`Failed to check existing tenant: ${error.message}`)
    }

    // ===== STEP 2: Validate Clerk Organization =====
    let clerkOrganization = null
    try {
      clerkOrganization = await getOrganization(clerkOrganizationId)

      if (!clerkOrganization) {
        throw new Error(`Clerk organization not found: ${clerkOrganizationId}`)
      }

      console.log(`[TrialProvisioning] Validated Clerk organization: ${clerkOrganization.name}`)
    } catch (error) {
      console.error('[TrialProvisioning] Error validating Clerk organization:', error)
      throw new Error(`Invalid Clerk organization: ${error.message}`)
    }

    // ===== STEP 3: Validate Clerk User =====
    let clerkUser = null
    try {
      clerkUser = await getUser(clerkUserId)

      if (!clerkUser) {
        throw new Error(`Clerk user not found: ${clerkUserId}`)
      }

      console.log(`[TrialProvisioning] Validated Clerk user: ${clerkUser.emailAddresses[0]?.emailAddress || 'unknown'}`)
    } catch (error) {
      console.error('[TrialProvisioning] Error validating Clerk user:', error)
      throw new Error(`Invalid Clerk user: ${error.message}`)
    }

    // ===== STEP 4: Validate slug availability =====
    try {
      const globalClient = tenantPrisma.getGlobalClient()
      const existingSlug = await globalClient.tenant.findUnique({
        where: { slug }
      })

      if (existingSlug) {
        throw new Error(`Slug already taken: ${slug}. Please choose a different slug.`)
      }

      console.log(`[TrialProvisioning] Slug available: ${slug}`)
    } catch (error) {
      if (error.message.includes('already taken')) {
        throw error
      }
      console.error('[TrialProvisioning] Error checking slug:', error)
      throw new Error(`Failed to validate slug: ${error.message}`)
    }

    // ===== STEP 5: Create tenant and user in transaction =====
    let tenant = null
    let user = null

    try {
      const globalClient = tenantPrisma.getGlobalClient()

      // Execute in transaction for atomicity
      const result = await globalClient.$transaction(async (tx) => {
        // 5a. Create tenant record with trial defaults
        const trialEndsAt = new Date(Date.now() + this.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)
        const schemaName = `tenant_${this.generateSchemaId()}`

        const newTenant = await tx.tenant.create({
          data: {
            slug,
            name: organizationName,
            schemaName,
            clerkOrganizationId,
            subscriptionTier,
            subscriptionStatus: 'trial',
            trialEndsAt,
            maxUsers: this.getMaxUsers(subscriptionTier),
            maxEntities: this.getMaxEntities(subscriptionTier),
            features: this.getFeatures(subscriptionTier)
          }
        })

        console.log(`[TrialProvisioning] Created tenant record: ${newTenant.id} (schema: ${newTenant.schemaName})`)

        // 5b. Create tenant schema using PostgreSQL function
        await tx.$executeRawUnsafe(
          `SELECT create_tenant_schema($1::UUID)`,
          newTenant.id
        )

        console.log(`[TrialProvisioning] Created tenant schema: ${newTenant.schemaName}`)

        // 5c. Create user record with 'owner' role
        const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
        const email = primaryEmail?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com'
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null

        const newUser = await tx.user.create({
          data: {
            clerkUserId,
            email,
            fullName,
            tenantId: newTenant.id,
            role: 'owner',
            lastLoginAt: new Date()
          }
        })

        console.log(`[TrialProvisioning] Created user record: ${newUser.id} (${newUser.email}) with role 'owner'`)

        // 5d. Create audit log entry
        await tx.auditLog.create({
          data: {
            tenantId: newTenant.id,
            userId: newUser.id,
            action: 'tenant.created',
            resourceType: 'tenant',
            resourceId: newTenant.id,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            metadata: {
              clerkOrganizationId,
              clerkUserId,
              subscriptionTier,
              trialDuration: this.TRIAL_DURATION_DAYS,
              ...metadata
            }
          }
        })

        console.log(`[TrialProvisioning] Created audit log entry for tenant.created`)

        return { tenant: newTenant, user: newUser }
      })

      tenant = result.tenant
      user = result.user

      console.log(`[TrialProvisioning] ✅ Successfully provisioned tenant ${tenant.name} with trial ending ${tenant.trialEndsAt}`)

      return {
        success: true,
        tenant,
        user,
        alreadyExists: false,
        message: `Trial tenant provisioned successfully. Trial expires on ${tenant.trialEndsAt.toISOString()}`
      }
    } catch (error) {
      console.error('[TrialProvisioning] ❌ Transaction failed:', error)
      throw new Error(`Failed to provision tenant: ${error.message}`)
    }
  }

  /**
   * Create User in Tenant
   *
   * Adds an additional user to an existing tenant.
   * Used for invitation acceptance or admin user creation.
   *
   * @param {Object} params - User creation parameters
   * @param {string} params.clerkUserId - Clerk user ID
   * @param {string} params.tenantId - Tenant UUID
   * @param {string} params.role - User role (owner/admin/member/viewer)
   * @param {string} [params.ipAddress] - IP address for audit logging
   * @param {string} [params.userAgent] - User agent for audit logging
   * @returns {Promise<Object>} Created user object
   *
   * @throws {Error} If user already exists or tenant not found
   *
   * @example
   * const user = await trialProvisioningService.createUserInTenant({
   *   clerkUserId: 'user_abc123',
   *   tenantId: '123e4567-e89b-12d3-a456-426614174000',
   *   role: 'admin',
   *   ipAddress: '192.168.1.1'
   * })
   */
  async createUserInTenant(params) {
    const {
      clerkUserId,
      tenantId,
      role = 'member',
      ipAddress,
      userAgent
    } = params

    console.log(`[TrialProvisioning] Creating user ${clerkUserId} in tenant ${tenantId} with role ${role}`)

    // ===== STEP 1: Validate tenant exists =====
    const globalClient = tenantPrisma.getGlobalClient()
    const tenant = await globalClient.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`)
    }

    // ===== STEP 2: Check for existing user (idempotency) =====
    const existingUser = await globalClient.user.findUnique({
      where: { clerkUserId }
    })

    if (existingUser) {
      if (existingUser.tenantId === tenantId) {
        console.log(`[TrialProvisioning] User ${clerkUserId} already exists in tenant ${tenantId}`)
        return existingUser
      } else {
        throw new Error(`User ${clerkUserId} already belongs to a different tenant`)
      }
    }

    // ===== STEP 3: Validate Clerk user =====
    const clerkUser = await getUser(clerkUserId)

    if (!clerkUser) {
      throw new Error(`Clerk user not found: ${clerkUserId}`)
    }

    // ===== STEP 4: Create user record =====
    const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
    const email = primaryEmail?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com'
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null

    const user = await globalClient.user.create({
      data: {
        clerkUserId,
        email,
        fullName,
        tenantId,
        role,
        lastLoginAt: new Date()
      }
    })

    // ===== STEP 5: Create audit log entry =====
    await globalClient.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'user.created',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: {
          clerkUserId,
          role,
          email
        }
      }
    })

    console.log(`[TrialProvisioning] ✅ Created user ${user.email} in tenant ${tenant.slug}`)

    return user
  }

  /**
   * Check Slug Availability
   *
   * Validates if a slug is available for use.
   * Useful for real-time validation during onboarding.
   *
   * @param {string} slug - Slug to check
   * @returns {Promise<Object>} Availability result
   *
   * @example
   * const result = await trialProvisioningService.checkSlugAvailability('acme-manufacturing')
   * if (result.available) {
   *   console.log('Slug is available!')
   * } else {
   *   console.log(`Slug taken. Suggestions: ${result.suggestions.join(', ')}`)
   * }
   */
  async checkSlugAvailability(slug) {
    // Validate slug format (lowercase alphanumeric + hyphens, 3-50 chars)
    const slugRegex = /^[a-z0-9-]{3,50}$/
    if (!slugRegex.test(slug)) {
      return {
        available: false,
        valid: false,
        error: 'Slug must be 3-50 characters, lowercase alphanumeric and hyphens only'
      }
    }

    try {
      const globalClient = tenantPrisma.getGlobalClient()
      const existing = await globalClient.tenant.findUnique({
        where: { slug }
      })

      if (existing) {
        // Generate suggestions
        const suggestions = await this.generateSlugSuggestions(slug)

        return {
          available: false,
          valid: true,
          suggestions
        }
      }

      return {
        available: true,
        valid: true
      }
    } catch (error) {
      console.error('[TrialProvisioning] Error checking slug availability:', error)
      throw new Error(`Failed to check slug availability: ${error.message}`)
    }
  }

  /**
   * Generate Slug Suggestions
   *
   * Generates alternative slug suggestions when requested slug is taken.
   *
   * @private
   * @param {string} baseSlug - Base slug to generate alternatives for
   * @returns {Promise<Array<string>>} Array of available slug suggestions
   */
  async generateSlugSuggestions(baseSlug) {
    const suggestions = []
    const globalClient = tenantPrisma.getGlobalClient()

    // Try adding numbers
    for (let i = 1; i <= 5; i++) {
      const candidate = `${baseSlug}-${i}`
      const exists = await globalClient.tenant.findUnique({
        where: { slug: candidate }
      })

      if (!exists) {
        suggestions.push(candidate)
        if (suggestions.length >= 3) break
      }
    }

    // Try adding year if still need more
    if (suggestions.length < 3) {
      const year = new Date().getFullYear()
      const candidate = `${baseSlug}-${year}`
      const exists = await globalClient.tenant.findUnique({
        where: { slug: candidate }
      })

      if (!exists) {
        suggestions.push(candidate)
      }
    }

    return suggestions
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generate Schema ID
   * Creates a UUID without dashes for schema naming
   * @private
   */
  generateSchemaId() {
    return crypto.randomUUID().replace(/-/g, '')
  }

  /**
   * Get Max Users for Tier
   * @private
   */
  getMaxUsers(tier) {
    const limits = {
      starter: 5,
      professional: 25,
      enterprise: 100
    }
    return limits[tier] || 5
  }

  /**
   * Get Max Entities for Tier
   * @private
   */
  getMaxEntities(tier) {
    const limits = {
      starter: 500,
      professional: 5000,
      enterprise: 999999
    }
    return limits[tier] || 500
  }

  /**
   * Get Features for Tier
   * @private
   */
  getFeatures(tier) {
    const features = {
      starter: {
        ai_forecasting: false,
        what_if: false,
        api_integrations: true,
        advanced_reports: false,
        custom_integrations: false
      },
      professional: {
        ai_forecasting: true,
        what_if: true,
        api_integrations: true,
        advanced_reports: false,
        custom_integrations: false
      },
      enterprise: {
        ai_forecasting: true,
        what_if: true,
        api_integrations: true,
        advanced_reports: true,
        custom_integrations: true
      }
    }
    return features[tier] || features.starter
  }
}

// Singleton instance - import this in your routes
export const trialProvisioningService = new TrialProvisioningService()
