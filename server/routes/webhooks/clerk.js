/**
 * Clerk Webhooks Handler
 *
 * Handles webhook events from Clerk for organization and user management.
 * Automatically provisions tenants when organizations are created.
 *
 * @module server/routes/webhooks/clerk
 */

import express from 'express'
import { Webhook } from 'svix'
import { tenantProvisioningService } from '../../services/TenantProvisioningService.js'

const router = express.Router()

// Webhook secret from Clerk Dashboard
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events
 *
 * Events handled:
 * - organization.created: Provision new tenant
 * - organization.updated: Update tenant metadata
 * - organization.deleted: Deprovision tenant (soft delete)
 * - organizationMembership.created: Add user to tenant
 * - organizationMembership.deleted: Remove user from tenant
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get webhook headers
    const svix_id = req.headers['svix-id']
    const svix_timestamp = req.headers['svix-timestamp']
    const svix_signature = req.headers['svix-signature']

    // Verify all headers are present
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('[ClerkWebhook] Missing svix headers')
      return res.status(400).json({
        success: false,
        error: 'Missing svix headers'
      })
    }

    // Verify webhook signature
    if (!CLERK_WEBHOOK_SECRET) {
      console.error('[ClerkWebhook] CLERK_WEBHOOK_SECRET not configured')
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured'
      })
    }

    const wh = new Webhook(CLERK_WEBHOOK_SECRET)
    let evt

    try {
      evt = wh.verify(req.body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('[ClerkWebhook] Webhook verification failed:', err.message)
      return res.status(400).json({
        success: false,
        error: 'Webhook verification failed'
      })
    }

    // Parse event
    const { id, type, data } = evt

    console.log(`[ClerkWebhook] Received event: ${type} (${id})`)

    // Route event to appropriate handler
    switch (type) {
      case 'organization.created':
        await handleOrganizationCreated(data, id)
        break

      case 'organization.updated':
        await handleOrganizationUpdated(data, id)
        break

      case 'organization.deleted':
        await handleOrganizationDeleted(data, id)
        break

      case 'organizationMembership.created':
        await handleMembershipCreated(data, id)
        break

      case 'organizationMembership.updated':
        await handleMembershipUpdated(data, id)
        break

      case 'organizationMembership.deleted':
        await handleMembershipDeleted(data, id)
        break

      default:
        console.log(`[ClerkWebhook] Unhandled event type: ${type}`)
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    })
  } catch (error) {
    console.error('[ClerkWebhook] Error processing webhook:', error)
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message
    })
  }
})

// ==================== EVENT HANDLERS ====================

/**
 * Handle organization.created event
 * Provisions a new tenant for the organization
 */
async function handleOrganizationCreated(data, eventId) {
  console.log(`[ClerkWebhook] Handling organization.created: ${data.name}`)

  try {
    const result = await tenantProvisioningService.provisionTenant({
      id: data.id,
      name: data.name,
      slug: data.slug,
      createdBy: data.created_by, // Clerk user ID of creator
      subscriptionTier: 'starter' // Default to starter tier
    })

    if (result.alreadyExists) {
      console.log(`[ClerkWebhook] Tenant already exists (idempotency): ${result.tenant.schemaName}`)
    } else {
      console.log(`[ClerkWebhook] ✅ Tenant provisioned: ${result.tenant.schemaName}`)

      // TODO: Send welcome email to organization creator
      // await emailService.sendWelcomeEmail(data.created_by, result.tenant)
    }
  } catch (error) {
    console.error(`[ClerkWebhook] Failed to provision tenant:`, error)
    throw error
  }
}

/**
 * Handle organization.updated event
 * Updates tenant metadata when organization details change
 */
async function handleOrganizationUpdated(data, eventId) {
  console.log(`[ClerkWebhook] Handling organization.updated: ${data.name}`)

  try {
    await tenantProvisioningService.updateTenantMetadata(data.id, {
      name: data.name,
      slug: data.slug
    })

    console.log(`[ClerkWebhook] ✅ Tenant metadata updated`)
  } catch (error) {
    console.error(`[ClerkWebhook] Failed to update tenant metadata:`, error)
    // Non-fatal error - log but don't throw
  }
}

/**
 * Handle organization.deleted event
 * Soft-deletes the tenant (sets deleted_at timestamp)
 */
async function handleOrganizationDeleted(data, eventId) {
  console.log(`[ClerkWebhook] Handling organization.deleted: ${data.id}`)

  try {
    // Soft delete only (preserve data for potential recovery)
    await tenantProvisioningService.deprovisionTenant(data.id, false)

    console.log(`[ClerkWebhook] ✅ Tenant soft-deleted`)

    // TODO: Schedule hard delete after grace period (e.g., 30 days)
    // await scheduleHardDelete(data.id, Date.now() + 30 * 24 * 60 * 60 * 1000)
  } catch (error) {
    console.error(`[ClerkWebhook] Failed to deprovision tenant:`, error)
    throw error
  }
}

/**
 * Handle organizationMembership.created event
 * Adds user to tenant with appropriate role
 */
async function handleMembershipCreated(data, eventId) {
  console.log(`[ClerkWebhook] Handling membership.created: ${data.public_user_data.user_id} → ${data.organization.id}`)

  try {
    // Map Clerk role to our role system
    const role = mapClerkRoleToTenantRole(data.role)

    await tenantProvisioningService.addUserToTenant(
      data.organization.id,
      data.public_user_data.user_id,
      role
    )

    console.log(`[ClerkWebhook] ✅ User added to tenant with role: ${role}`)
  } catch (error) {
    console.error(`[ClerkWebhook] Failed to add user to tenant:`, error)
    // Non-fatal error - user can still access via Clerk, role just won't be synced
  }
}

/**
 * Handle organizationMembership.updated event
 * Updates user role in tenant
 */
async function handleMembershipUpdated(data, eventId) {
  console.log(`[ClerkWebhook] Handling membership.updated: ${data.public_user_data.user_id}`)

  try {
    const role = mapClerkRoleToTenantRole(data.role)

    // Remove and re-add with new role
    await tenantProvisioningService.removeUserFromTenant(
      data.organization.id,
      data.public_user_data.user_id
    )

    await tenantProvisioningService.addUserToTenant(
      data.organization.id,
      data.public_user_data.user_id,
      role
    )

    console.log(`[ClerkWebhook] ✅ User role updated to: ${role}`)
  } catch (error) {
    console.error(`[ClerkWebhook] Failed to update user role:`, error)
    // Non-fatal error
  }
}

/**
 * Handle organizationMembership.deleted event
 * Removes user from tenant
 */
async function handleMembershipDeleted(data, eventId) {
  console.log(`[ClerkWebhook] Handling membership.deleted: ${data.public_user_data.user_id}`)

  try {
    await tenantProvisioningService.removeUserFromTenant(
      data.organization.id,
      data.public_user_data.user_id
    )

    console.log(`[ClerkWebhook] ✅ User removed from tenant`)
  } catch (error) {
    console.error(`[ClerkWebhook] Failed to remove user from tenant:`, error)
    // Non-fatal error
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Map Clerk organization role to our tenant role
 * Clerk roles: admin, basic_member
 * Our roles: owner, admin, member, viewer
 */
function mapClerkRoleToTenantRole(clerkRole) {
  const roleMap = {
    'admin': 'admin',
    'basic_member': 'member'
  }

  return roleMap[clerkRole] || 'viewer'
}

export default router
