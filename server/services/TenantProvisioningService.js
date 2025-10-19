/**
 * Tenant Provisioning Service
 *
 * Handles automated tenant creation when Clerk organization is created.
 * Provisions complete tenant infrastructure including:
 * - Tenant record in public schema
 * - Tenant-specific PostgreSQL schema
 * - Default company record
 * - Trial period activation
 *
 * @module server/services/TenantProvisioningService
 */

import { tenantPrisma } from './tenantPrisma.js'
import crypto from 'crypto'

export class TenantProvisioningService {
  /**
   * Provision a new tenant from Clerk organization data
   *
   * @param {Object} organizationData - Clerk organization data
   * @param {string} organizationData.id - Clerk organization ID
   * @param {string} organizationData.name - Organization name
   * @param {string} organizationData.slug - Organization slug (URL-safe)
   * @param {string} [organizationData.createdBy] - User ID who created the organization
   * @param {string} [organizationData.subscriptionTier='starter'] - Initial subscription tier
   * @returns {Promise<Object>} Created tenant with schema name
   *
   * @throws {Error} If tenant provisioning fails
   */
  async provisionTenant(organizationData) {
    const {
      id: clerkOrgId,
      name,
      slug,
      createdBy,
      subscriptionTier = 'starter'
    } = organizationData

    console.log(`[TenantProvisioning] Starting provisioning for organization: ${name} (${clerkOrgId})`)

    try {
      // Step 1: Check if tenant already exists (idempotency)
      const existingTenant = await tenantPrisma.getTenantByClerkOrg(clerkOrgId)
      if (existingTenant) {
        console.log(`[TenantProvisioning] Tenant already exists: ${existingTenant.schemaName}`)
        return {
          tenant: existingTenant,
          alreadyExists: true
        }
      }

      // Step 2: Create tenant record in public schema
      const globalClient = tenantPrisma.getGlobalClient()

      const tenant = await globalClient.tenant.create({
        data: {
          slug,
          name,
          schemaName: `tenant_${this.generateSchemaId()}`,
          clerkOrganizationId: clerkOrgId,
          subscriptionTier,
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          maxUsers: this.getMaxUsers(subscriptionTier),
          maxEntities: this.getMaxEntities(subscriptionTier),
          features: this.getFeatures(subscriptionTier)
        }
      })

      console.log(`[TenantProvisioning] Created tenant record: ${tenant.id}`)

      // Step 3: Create tenant schema using PostgreSQL function
      console.log(`[TenantProvisioning] Creating tenant schema: ${tenant.schemaName}`)

      await globalClient.$executeRawUnsafe(
        `SELECT create_tenant_schema($1::UUID)`,
        tenant.id
      )

      console.log(`[TenantProvisioning] Tenant schema created successfully`)

      // Step 4: Create default company record in tenant schema
      await this.createDefaultCompany(tenant.schemaName, name)

      console.log(`[TenantProvisioning] Default company created`)

      // Step 5: Create owner user record if createdBy provided
      if (createdBy) {
        await this.createOwnerUser(tenant.id, createdBy)
        console.log(`[TenantProvisioning] Owner user record created`)
      }

      // Step 6: Log provisioning completion
      await this.logProvisioningEvent(tenant.id, 'tenant.provisioned', {
        clerkOrgId,
        schemaName: tenant.schemaName,
        subscriptionTier,
        createdBy
      })

      console.log(`[TenantProvisioning] ✅ Provisioning complete for ${name}`)

      return {
        tenant,
        alreadyExists: false
      }
    } catch (error) {
      console.error(`[TenantProvisioning] ❌ Provisioning failed for ${name}:`, error)

      // Attempt rollback if tenant was created
      // Note: PostgreSQL function handles schema deletion on failure
      throw new Error(`Tenant provisioning failed: ${error.message}`)
    }
  }

  /**
   * Deprovision a tenant (soft delete)
   *
   * @param {string} clerkOrgId - Clerk organization ID
   * @param {boolean} [hardDelete=false] - If true, permanently delete schema
   * @returns {Promise<Object>} Deleted tenant
   */
  async deprovisionTenant(clerkOrgId, hardDelete = false) {
    console.log(`[TenantProvisioning] Deprovisioning tenant for organization: ${clerkOrgId}`)

    try {
      const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrgId)

      if (!tenant) {
        console.warn(`[TenantProvisioning] Tenant not found for organization: ${clerkOrgId}`)
        return null
      }

      // Soft delete (set deleted_at timestamp)
      const globalClient = tenantPrisma.getGlobalClient()

      const deletedTenant = await globalClient.tenant.update({
        where: { id: tenant.id },
        data: { deletedAt: new Date() }
      })

      console.log(`[TenantProvisioning] Tenant soft-deleted: ${tenant.schemaName}`)

      // Hard delete if requested (IRREVERSIBLE)
      if (hardDelete) {
        await globalClient.$executeRawUnsafe(
          `SELECT delete_tenant_schema($1::UUID)`,
          tenant.id
        )

        await globalClient.tenant.delete({
          where: { id: tenant.id }
        })

        console.log(`[TenantProvisioning] Tenant hard-deleted: ${tenant.schemaName}`)
      }

      // Log deprovisioning event
      await this.logProvisioningEvent(tenant.id, 'tenant.deprovisioned', {
        clerkOrgId,
        hardDelete
      })

      return deletedTenant
    } catch (error) {
      console.error(`[TenantProvisioning] Deprovisioning failed:`, error)
      throw new Error(`Tenant deprovisioning failed: ${error.message}`)
    }
  }

  /**
   * Update tenant metadata from Clerk organization
   *
   * @param {string} clerkOrgId - Clerk organization ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated tenant
   */
  async updateTenantMetadata(clerkOrgId, updates) {
    console.log(`[TenantProvisioning] Updating tenant metadata for: ${clerkOrgId}`)

    try {
      const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrgId)

      if (!tenant) {
        throw new Error(`Tenant not found for organization: ${clerkOrgId}`)
      }

      const globalClient = tenantPrisma.getGlobalClient()

      const updatedTenant = await globalClient.tenant.update({
        where: { id: tenant.id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      })

      console.log(`[TenantProvisioning] Tenant metadata updated: ${tenant.schemaName}`)

      return updatedTenant
    } catch (error) {
      console.error(`[TenantProvisioning] Metadata update failed:`, error)
      throw new Error(`Tenant metadata update failed: ${error.message}`)
    }
  }

  /**
   * Add user to tenant
   *
   * @param {string} clerkOrgId - Clerk organization ID
   * @param {string} clerkUserId - Clerk user ID
   * @param {string} role - User role (owner, admin, member, viewer)
   * @returns {Promise<Object>} Created user record
   */
  async addUserToTenant(clerkOrgId, clerkUserId, role) {
    console.log(`[TenantProvisioning] Adding user ${clerkUserId} to organization ${clerkOrgId} with role ${role}`)

    try {
      const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrgId)

      if (!tenant) {
        throw new Error(`Tenant not found for organization: ${clerkOrgId}`)
      }

      const globalClient = tenantPrisma.getGlobalClient()

      // Check if user already exists
      const existingUser = await globalClient.user.findFirst({
        where: {
          clerkUserId,
          tenantId: tenant.id
        }
      })

      if (existingUser) {
        console.log(`[TenantProvisioning] User already exists in tenant, updating role`)
        return await globalClient.user.update({
          where: { id: existingUser.id },
          data: { role }
        })
      }

      // Create new user
      const user = await globalClient.user.create({
        data: {
          clerkUserId,
          tenantId: tenant.id,
          role
        }
      })

      console.log(`[TenantProvisioning] User added to tenant: ${user.id}`)

      return user
    } catch (error) {
      console.error(`[TenantProvisioning] Add user failed:`, error)
      throw new Error(`Add user to tenant failed: ${error.message}`)
    }
  }

  /**
   * Remove user from tenant
   *
   * @param {string} clerkOrgId - Clerk organization ID
   * @param {string} clerkUserId - Clerk user ID
   * @returns {Promise<Object>} Deleted user record
   */
  async removeUserFromTenant(clerkOrgId, clerkUserId) {
    console.log(`[TenantProvisioning] Removing user ${clerkUserId} from organization ${clerkOrgId}`)

    try {
      const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrgId)

      if (!tenant) {
        throw new Error(`Tenant not found for organization: ${clerkOrgId}`)
      }

      const globalClient = tenantPrisma.getGlobalClient()

      const user = await globalClient.user.deleteMany({
        where: {
          clerkUserId,
          tenantId: tenant.id
        }
      })

      console.log(`[TenantProvisioning] User removed from tenant`)

      return user
    } catch (error) {
      console.error(`[TenantProvisioning] Remove user failed:`, error)
      throw new Error(`Remove user from tenant failed: ${error.message}`)
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Create default company record in tenant schema
   * @private
   */
  async createDefaultCompany(tenantSchema, organizationName) {
    try {
      await tenantPrisma.queryRaw(
        tenantSchema,
        `INSERT INTO companies (name, legal_name, currency, settings)
         VALUES ($1, $1, 'USD', '{}')`,
        [organizationName]
      )
    } catch (error) {
      console.error(`[TenantProvisioning] Failed to create default company:`, error)
      // Non-fatal error - tenant can still function
    }
  }

  /**
   * Create owner user record
   * @private
   */
  async createOwnerUser(tenantId, clerkUserId) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      await globalClient.user.create({
        data: {
          clerkUserId,
          tenantId,
          role: 'owner'
        }
      })
    } catch (error) {
      console.error(`[TenantProvisioning] Failed to create owner user:`, error)
      // Non-fatal error - user can be added later via webhook
    }
  }

  /**
   * Log provisioning event to audit log
   * @private
   */
  async logProvisioningEvent(tenantId, action, metadata) {
    try {
      const globalClient = tenantPrisma.getGlobalClient()

      await globalClient.auditLog.create({
        data: {
          tenantId,
          userId: null,
          action,
          resourceType: 'tenant',
          resourceId: tenantId,
          ipAddress: null,
          userAgent: 'TenantProvisioningService',
          metadata
        }
      })
    } catch (error) {
      console.error(`[TenantProvisioning] Failed to log event:`, error)
      // Non-fatal error - continue processing
    }
  }

  /**
   * Generate schema ID (UUID without dashes)
   * @private
   */
  generateSchemaId() {
    return crypto.randomUUID().replace(/-/g, '')
  }

  /**
   * Get max users for subscription tier
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
   * Get max entities for subscription tier
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
   * Get features for subscription tier
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

// Singleton instance
export const tenantProvisioningService = new TenantProvisioningService()
