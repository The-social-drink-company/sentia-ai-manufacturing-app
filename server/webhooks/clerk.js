/**
 * Clerk Webhook Handler for CapLiquify Multi-Tenant System
 *
 * Handles organization events from Clerk:
 * - organization.created → Trigger tenant provisioning
 * - organization.updated → Update tenant metadata
 * - organizationMembership.created → Add user to tenant
 *
 * @module server/webhooks/clerk
 */

import express from 'express'
import { Webhook } from 'svix'
import { trialProvisioningService } from '../services/TrialProvisioningService.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// ==================== CONFIGURATION ====================

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

if (!WEBHOOK_SECRET) {
  console.warn('[Clerk Webhook] CLERK_WEBHOOK_SECRET not configured - webhooks will not work')
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Retry function with exponential backoff
 *
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<any>} Result from function
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      console.error(`[Clerk Webhook] Attempt ${attempt}/${maxRetries} failed:`, error.message)

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000
        console.log(`[Clerk Webhook] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`)
}

/**
 * Log webhook event to database audit log
 */
async function logWebhookEvent(event, status, error = null) {
  try {
    const globalClient = tenantPrisma.getGlobalClient()
    await globalClient.auditLog.create({
      data: {
        action: `webhook.${event.type}`,
        resourceType: 'webhook',
        resourceId: event.data?.id || 'unknown',
        metadata: {
          eventType: event.type,
          eventId: event.id || 'unknown',
          status,
          error: error ? error.message : null,
          timestamp: new Date().toISOString()
        }
      }
    })
  } catch (logError) {
    console.error('[Clerk Webhook] Failed to log webhook event:', logError)
  }
}

// ==================== WEBHOOK HANDLERS ====================

/**
 * Handle organization.created event
 *
 * Triggers tenant provisioning when a new Clerk organization is created.
 * This is the primary entry point for trial signup flow.
 */
async function handleOrganizationCreated(event) {
  const { id: clerkOrganizationId, name, created_by } = event.data

  console.log(`[Clerk Webhook] organization.created: ${name} (${clerkOrganizationId})`)

  // Generate slug from organization name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)

  // Provision tenant with default Professional tier
  await retryWithBackoff(async () => {
    return await trialProvisioningService.provisionTenant({
      clerkOrganizationId,
      clerkUserId: created_by,
      organizationName: name,
      slug,
      subscriptionTier: 'professional', // Default tier for webhook-based creation
      metadata: {
        source: 'clerk_webhook',
        eventType: 'organization.created',
        eventId: event.id || 'unknown'
      }
    })
  })

  console.log(`[Clerk Webhook] ✅ Tenant provisioned for organization ${name}`)
}

/**
 * Handle organization.updated event
 *
 * Updates tenant metadata when Clerk organization is updated.
 */
async function handleOrganizationUpdated(event) {
  const { id: clerkOrganizationId, name } = event.data

  console.log(`[Clerk Webhook] organization.updated: ${name} (${clerkOrganizationId})`)

  // Find tenant by Clerk organization ID
  const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrganizationId)

  if (!tenant) {
    console.warn(`[Clerk Webhook] Tenant not found for organization ${clerkOrganizationId}`)
    return
  }

  // Update tenant name if changed
  await retryWithBackoff(async () => {
    const globalClient = tenantPrisma.getGlobalClient()
    await globalClient.tenant.update({
      where: { id: tenant.id },
      data: { name }
    })
  })

  // Log update to audit log
  const globalClient = tenantPrisma.getGlobalClient()
  await globalClient.auditLog.create({
    data: {
      tenantId: tenant.id,
      action: 'tenant.updated',
      resourceType: 'tenant',
      resourceId: tenant.id,
      metadata: {
        source: 'clerk_webhook',
        eventType: 'organization.updated',
        previousName: tenant.name,
        newName: name
      }
    }
  })

  console.log(`[Clerk Webhook] ✅ Tenant ${tenant.slug} updated`)
}

/**
 * Handle organizationMembership.created event
 *
 * Adds user to tenant when they join a Clerk organization.
 */
async function handleOrganizationMembershipCreated(event) {
  const {
    organization: { id: clerkOrganizationId, name: orgName },
    public_user_data: { user_id: clerkUserId }
  } = event.data

  console.log(`[Clerk Webhook] organizationMembership.created: User ${clerkUserId} joined ${orgName}`)

  // Find tenant by Clerk organization ID
  const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrganizationId)

  if (!tenant) {
    console.warn(`[Clerk Webhook] Tenant not found for organization ${clerkOrganizationId}`)
    return
  }

  // Check if user already exists in tenant
  const globalClient = tenantPrisma.getGlobalClient()
  const existingUser = await globalClient.user.findUnique({
    where: { clerkUserId }
  })

  if (existingUser) {
    console.log(`[Clerk Webhook] User ${clerkUserId} already exists in tenant ${tenant.slug}`)
    return
  }

  // Add user to tenant with 'member' role (default)
  await retryWithBackoff(async () => {
    return await trialProvisioningService.createUserInTenant({
      clerkUserId,
      tenantId: tenant.id,
      role: 'member'
    })
  })

  console.log(`[Clerk Webhook] ✅ User ${clerkUserId} added to tenant ${tenant.slug}`)
}

/**
 * Handle organizationMembership.deleted event
 *
 * Optionally remove user from tenant when they leave the organization.
 * (Currently logs only - actual removal requires careful consideration)
 */
async function handleOrganizationMembershipDeleted(event) {
  const {
    organization: { id: clerkOrganizationId, name: orgName },
    public_user_data: { user_id: clerkUserId }
  } = event.data

  console.log(`[Clerk Webhook] organizationMembership.deleted: User ${clerkUserId} left ${orgName}`)

  // Find tenant
  const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrganizationId)

  if (!tenant) {
    console.warn(`[Clerk Webhook] Tenant not found for organization ${clerkOrganizationId}`)
    return
  }

  // Log the event (actual user deletion requires business logic decision)
  const globalClient = tenantPrisma.getGlobalClient()
  await globalClient.auditLog.create({
    data: {
      tenantId: tenant.id,
      action: 'organizationMembership.deleted',
      resourceType: 'user',
      metadata: {
        source: 'clerk_webhook',
        clerkUserId,
        note: 'User left organization - consider deactivating account'
      }
    }
  })

  console.log(`[Clerk Webhook] ⚠️ User ${clerkUserId} membership deleted - logged for review`)
}

// ==================== WEBHOOK ENDPOINT ====================

/**
 * POST /webhooks/clerk
 *
 * Main webhook endpoint that receives events from Clerk.
 * Verifies webhook signature and routes events to appropriate handlers.
 *
 * @body {Object} event - Webhook event payload from Clerk
 * @header {string} svix-id - Webhook ID (for verification)
 * @header {string} svix-timestamp - Webhook timestamp (for verification)
 * @header {string} svix-signature - Webhook signature (for verification)
 *
 * @returns {Object} 200 - Webhook processed successfully
 * @returns {Object} 400 - Invalid webhook signature or payload
 * @returns {Object} 500 - Server error processing webhook
 */
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }), // Need raw body for signature verification
  async (req, res) => {
    if (!WEBHOOK_SECRET) {
      console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET not configured')
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured'
      })
    }

    // Get webhook headers
    const svix_id = req.headers['svix-id']
    const svix_timestamp = req.headers['svix-timestamp']
    const svix_signature = req.headers['svix-signature']

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('[Clerk Webhook] Missing webhook headers')
      return res.status(400).json({
        success: false,
        error: 'Missing webhook headers'
      })
    }

    // Verify webhook signature
    const wh = new Webhook(WEBHOOK_SECRET)
    let event

    try {
      event = wh.verify(req.body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature
      })
    } catch (err) {
      console.error('[Clerk Webhook] Signature verification failed:', err.message)
      await logWebhookEvent({ type: 'verification_failed', id: 'unknown' }, 'failed', err)
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      })
    }

    console.log(`[Clerk Webhook] Received event: ${event.type}`)

    // Route event to appropriate handler
    try {
      switch (event.type) {
        case 'organization.created':
          await handleOrganizationCreated(event)
          await logWebhookEvent(event, 'success')
          break

        case 'organization.updated':
          await handleOrganizationUpdated(event)
          await logWebhookEvent(event, 'success')
          break

        case 'organizationMembership.created':
          await handleOrganizationMembershipCreated(event)
          await logWebhookEvent(event, 'success')
          break

        case 'organizationMembership.deleted':
          await handleOrganizationMembershipDeleted(event)
          await logWebhookEvent(event, 'success')
          break

        default:
          console.log(`[Clerk Webhook] Unhandled event type: ${event.type}`)
          await logWebhookEvent(event, 'ignored')
      }

      res.status(200).json({ success: true })
    } catch (error) {
      console.error(`[Clerk Webhook] Error processing ${event.type}:`, error)
      await logWebhookEvent(event, 'failed', error)

      // Return 500 to trigger Clerk's retry mechanism
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
)

// ==================== HEALTH CHECK ====================

/**
 * GET /webhooks/clerk/health
 *
 * Health check endpoint for webhook system
 */
router.get('/clerk/health', (req, res) => {
  res.json({
    success: true,
    webhook: 'clerk',
    configured: !!WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  })
})

// ==================== EXPORT ====================

export default router
