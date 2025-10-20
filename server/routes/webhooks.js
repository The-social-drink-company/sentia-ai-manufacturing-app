/**
 * Clerk Webhooks API Routes - Multi-Tenant
 *
 * Handles Clerk webhook events for tenant and user lifecycle management.
 * Automatically provisions tenants when organizations are created,
 * syncs user data, and handles organization/user deletions.
 *
 * @module routes/webhooks
 */

import express from 'express'
import { Webhook } from 'svix'
import { PrismaClient } from '@prisma/client'
import { tenantProvisioningService } from '../services/tenantProvisioningService.js'
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js'
import { logAudit } from '../services/audit/AuditLogger.js'
import { STATUS } from '../services/audit/AuditCategories.js'

const router = express.Router()
const prisma = new PrismaClient()

// Webhook secret from Clerk dashboard
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events
 *
 * Supported events:
 * - organization.created → Create tenant
 * - organization.updated → Update tenant metadata
 * - organization.deleted → Archive tenant (soft delete)
 * - organizationMembership.created → Add user to tenant
 * - organizationMembership.updated → Update user role
 * - organizationMembership.deleted → Remove user from tenant
 * - user.created → Create user record
 * - user.updated → Update user metadata
 * - user.deleted → Archive user (soft delete)
 */
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    if (!WEBHOOK_SECRET) {
      logError('CLERK_WEBHOOK_SECRET not configured')
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured'
      })
    }

    // Get webhook headers
    const svixId = req.headers['svix-id']
    const svixTimestamp = req.headers['svix-timestamp']
    const svixSignature = req.headers['svix-signature']

    if (!svixId || !svixTimestamp || !svixSignature) {
      logWarn('Missing Svix headers in webhook request')
      return res.status(400).json({
        success: false,
        error: 'Missing Svix headers'
      })
    }

    // Verify webhook signature using Svix
    const wh = new Webhook(WEBHOOK_SECRET)
    let event

    try {
      event = wh.verify(req.body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch (err) {
      logError('Webhook signature verification failed:', err)
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      })
    }

    // Parse event data
    const { type, data } = event

    logInfo(`Received Clerk webhook: ${type}`, {
      eventId: svixId,
      eventType: type,
      timestamp: svixTimestamp
    })

    // Handle different event types
    switch (type) {
      case 'organization.created':
        await handleOrganizationCreated(data)
        break

      case 'organization.updated':
        await handleOrganizationUpdated(data)
        break

      case 'organization.deleted':
        await handleOrganizationDeleted(data)
        break

      case 'organizationMembership.created':
        await handleMembershipCreated(data)
        break

      case 'organizationMembership.updated':
        await handleMembershipUpdated(data)
        break

      case 'organizationMembership.deleted':
        await handleMembershipDeleted(data)
        break

      case 'user.created':
        await handleUserCreated(data)
        break

      case 'user.updated':
        await handleUserUpdated(data)
        break

      case 'user.deleted':
        await handleUserDeleted(data)
        break

      default:
        logWarn(`Unhandled webhook event type: ${type}`)
    }

    // Return success
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      eventType: type
    })

  } catch (error) {
    logError('Webhook processing error:', error)
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message
    })
  }
})

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle organization.created event
 * Creates a new tenant with PostgreSQL schema
 */
async function handleOrganizationCreated(data) {
  const { id: clerkOrgId, name, slug, created_by } = data

  logInfo(`Creating tenant for organization: ${name} (${clerkOrgId})`)

  try {
    // Create tenant using provisioning service
    const tenant = await tenantProvisioningService.createTenant({
      clerkOrganizationId: clerkOrgId,
      name: name || slug || `Organization ${clerkOrgId}`,
      slug: slug || clerkOrgId,
      subscriptionTier: 'STARTER', // Default to Starter tier
      subscriptionStatus: 'ACTIVE',
      createdBy: created_by,
    })

    logInfo(`Tenant created successfully: ${tenant.name} (${tenant.id})`)

    // Log audit trail
    await logAudit({
      tenantId: tenant.id,
      userId: created_by || 'SYSTEM',
      action: 'TENANT_CREATED',
      category: 'TENANT',
      resourceType: 'TENANT',
      resourceId: tenant.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkOrgId,
        name: tenant.name,
        tier: tenant.subscriptionTier,
      },
    })

    return tenant
  } catch (error) {
    logError(`Failed to create tenant for organization ${clerkOrgId}:`, error)

    // Log audit trail for failure
    await logAudit({
      userId: created_by || 'SYSTEM',
      action: 'TENANT_CREATED',
      category: 'TENANT',
      resourceType: 'TENANT',
      status: STATUS.FAILED,
      metadata: {
        clerkOrgId,
        name,
        error: error.message,
      },
    })

    throw error
  }
}

/**
 * Handle organization.updated event
 * Updates tenant metadata
 */
async function handleOrganizationUpdated(data) {
  const { id: clerkOrgId, name, slug } = data

  logInfo(`Updating tenant for organization: ${clerkOrgId}`)

  try {
    // Find tenant by Clerk organization ID
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
    })

    if (!tenant) {
      logWarn(`Tenant not found for Clerk organization: ${clerkOrgId}`)
      return
    }

    // Update tenant metadata
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: name || tenant.name,
        slug: slug || tenant.slug,
        updatedAt: new Date(),
      },
    })

    logInfo(`Tenant updated successfully: ${updatedTenant.name} (${updatedTenant.id})`)

    // Log audit trail
    await logAudit({
      tenantId: tenant.id,
      userId: 'SYSTEM',
      action: 'TENANT_UPDATED',
      category: 'TENANT',
      resourceType: 'TENANT',
      resourceId: tenant.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkOrgId,
        name: updatedTenant.name,
      },
    })

    return updatedTenant
  } catch (error) {
    logError(`Failed to update tenant for organization ${clerkOrgId}:`, error)
    throw error
  }
}

/**
 * Handle organization.deleted event
 * Archives tenant (soft delete)
 */
async function handleOrganizationDeleted(data) {
  const { id: clerkOrgId } = data

  logInfo(`Archiving tenant for organization: ${clerkOrgId}`)

  try {
    // Find tenant by Clerk organization ID
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
    })

    if (!tenant) {
      logWarn(`Tenant not found for Clerk organization: ${clerkOrgId}`)
      return
    }

    // Soft delete tenant (archive)
    const archivedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'ARCHIVED',
        updatedAt: new Date(),
      },
    })

    logInfo(`Tenant archived successfully: ${archivedTenant.name} (${archivedTenant.id})`)

    // Log audit trail
    await logAudit({
      tenantId: tenant.id,
      userId: 'SYSTEM',
      action: 'TENANT_ARCHIVED',
      category: 'TENANT',
      resourceType: 'TENANT',
      resourceId: tenant.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkOrgId,
        name: archivedTenant.name,
      },
    })

    return archivedTenant
  } catch (error) {
    logError(`Failed to archive tenant for organization ${clerkOrgId}:`, error)
    throw error
  }
}

/**
 * Handle organizationMembership.created event
 * Adds user to tenant
 */
async function handleMembershipCreated(data) {
  const { organization, public_user_data, role } = data
  const clerkOrgId = organization.id
  const clerkUserId = public_user_data.user_id

  logInfo(`Adding user ${clerkUserId} to organization ${clerkOrgId}`)

  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
    })

    if (!tenant) {
      logWarn(`Tenant not found for Clerk organization: ${clerkOrgId}`)
      return
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          clerkUserId,
          email: public_user_data.email_address,
          firstName: public_user_data.first_name,
          lastName: public_user_data.last_name,
          tenantId: tenant.id,
          role: mapClerkRoleToAppRole(role),
        },
      })

      logInfo(`User created: ${user.email} (${user.id})`)
    } else {
      // Update user's tenant and role
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          tenantId: tenant.id,
          role: mapClerkRoleToAppRole(role),
          updatedAt: new Date(),
        },
      })

      logInfo(`User updated: ${user.email} (${user.id})`)
    }

    // Log audit trail
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'USER_ADDED_TO_TENANT',
      category: 'USER',
      resourceType: 'USER',
      resourceId: user.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkOrgId,
        clerkUserId,
        role: user.role,
      },
    })

    return user
  } catch (error) {
    logError(`Failed to add user ${clerkUserId} to organization ${clerkOrgId}:`, error)
    throw error
  }
}

/**
 * Handle organizationMembership.updated event
 * Updates user role
 */
async function handleMembershipUpdated(data) {
  const { organization, public_user_data, role } = data
  const clerkOrgId = organization.id
  const clerkUserId = public_user_data.user_id

  logInfo(`Updating user ${clerkUserId} role in organization ${clerkOrgId}`)

  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
    })

    if (!tenant) {
      logWarn(`Tenant not found for Clerk organization: ${clerkOrgId}`)
      return
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      logWarn(`User not found for Clerk user: ${clerkUserId}`)
      return
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: mapClerkRoleToAppRole(role),
        updatedAt: new Date(),
      },
    })

    logInfo(`User role updated: ${updatedUser.email} → ${updatedUser.role}`)

    // Log audit trail
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'USER_ROLE_UPDATED',
      category: 'USER',
      resourceType: 'USER',
      resourceId: user.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkOrgId,
        clerkUserId,
        newRole: updatedUser.role,
      },
    })

    return updatedUser
  } catch (error) {
    logError(`Failed to update user ${clerkUserId} role:`, error)
    throw error
  }
}

/**
 * Handle organizationMembership.deleted event
 * Removes user from tenant
 */
async function handleMembershipDeleted(data) {
  const { organization, public_user_data } = data
  const clerkOrgId = organization.id
  const clerkUserId = public_user_data.user_id

  logInfo(`Removing user ${clerkUserId} from organization ${clerkOrgId}`)

  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
    })

    if (!tenant) {
      logWarn(`Tenant not found for Clerk organization: ${clerkOrgId}`)
      return
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      logWarn(`User not found for Clerk user: ${clerkUserId}`)
      return
    }

    // Remove user from tenant (set tenantId to null)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        tenantId: null,
        updatedAt: new Date(),
      },
    })

    logInfo(`User removed from tenant: ${updatedUser.email}`)

    // Log audit trail
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'USER_REMOVED_FROM_TENANT',
      category: 'USER',
      resourceType: 'USER',
      resourceId: user.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkOrgId,
        clerkUserId,
      },
    })

    return updatedUser
  } catch (error) {
    logError(`Failed to remove user ${clerkUserId} from organization ${clerkOrgId}:`, error)
    throw error
  }
}

/**
 * Handle user.created event
 * Creates user record in database
 */
async function handleUserCreated(data) {
  const { id: clerkUserId, email_addresses, first_name, last_name } = data

  logInfo(`Creating user: ${clerkUserId}`)

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (existingUser) {
      logWarn(`User already exists: ${clerkUserId}`)
      return existingUser
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        clerkUserId,
        email: email_addresses[0]?.email_address || `user-${clerkUserId}@unknown.com`,
        firstName: first_name,
        lastName: last_name,
        role: 'VIEWER', // Default role
      },
    })

    logInfo(`User created: ${user.email} (${user.id})`)

    // Log audit trail
    await logAudit({
      userId: user.id,
      action: 'USER_CREATED',
      category: 'USER',
      resourceType: 'USER',
      resourceId: user.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkUserId,
        email: user.email,
      },
    })

    return user
  } catch (error) {
    logError(`Failed to create user ${clerkUserId}:`, error)
    throw error
  }
}

/**
 * Handle user.updated event
 * Updates user metadata
 */
async function handleUserUpdated(data) {
  const { id: clerkUserId, email_addresses, first_name, last_name } = data

  logInfo(`Updating user: ${clerkUserId}`)

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      logWarn(`User not found for Clerk user: ${clerkUserId}`)
      return
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: email_addresses[0]?.email_address || user.email,
        firstName: first_name || user.firstName,
        lastName: last_name || user.lastName,
        updatedAt: new Date(),
      },
    })

    logInfo(`User updated: ${updatedUser.email} (${updatedUser.id})`)

    // Log audit trail
    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'USER_UPDATED',
      category: 'USER',
      resourceType: 'USER',
      resourceId: user.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkUserId,
        email: updatedUser.email,
      },
    })

    return updatedUser
  } catch (error) {
    logError(`Failed to update user ${clerkUserId}:`, error)
    throw error
  }
}

/**
 * Handle user.deleted event
 * Archives user (soft delete)
 */
async function handleUserDeleted(data) {
  const { id: clerkUserId } = data

  logInfo(`Archiving user: ${clerkUserId}`)

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      logWarn(`User not found for Clerk user: ${clerkUserId}`)
      return
    }

    // Soft delete user (remove from tenant)
    const archivedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        tenantId: null,
        updatedAt: new Date(),
      },
    })

    logInfo(`User archived: ${archivedUser.email} (${archivedUser.id})`)

    // Log audit trail
    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'USER_ARCHIVED',
      category: 'USER',
      resourceType: 'USER',
      resourceId: user.id,
      status: STATUS.SUCCESS,
      metadata: {
        clerkUserId,
        email: archivedUser.email,
      },
    })

    return archivedUser
  } catch (error) {
    logError(`Failed to archive user ${clerkUserId}:`, error)
    throw error
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map Clerk organization role to application role
 */
function mapClerkRoleToAppRole(clerkRole) {
  const roleMap = {
    'org:admin': 'OWNER',
    'org:member': 'MEMBER',
    // Add more role mappings as needed
  }

  return roleMap[clerkRole] || 'VIEWER'
}

export default router
