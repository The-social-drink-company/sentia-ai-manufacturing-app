/**
 * Clerk Webhook Handler
 * Handles user lifecycle events and subscription management
 *
 * Pricing Model:
 * - $295/month per account (not per user)
 * - Alpha pricing: $295/month for single client
 * - Multi-tenant architecture: one sub-account per organization
 */

import express from 'express'
import { Webhook } from 'svix'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Clerk webhook events we handle
const WEBHOOK_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',
  ORGANIZATION_MEMBERSHIP_CREATED: 'organizationMembership.created',
  ORGANIZATION_MEMBERSHIP_DELETED: 'organizationMembership.deleted',
}

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  ALPHA: {
    name: 'Alpha',
    price: 295, // $295/month
    currency: 'USD',
    features: [
      'Full dashboard access',
      'Real-time analytics',
      'API integrations (Xero, Shopify, Amazon, Unleashed)',
      'Working capital optimization',
      'Demand forecasting',
      'Inventory management',
      'Email support',
      'Single organization',
    ],
    limits: {
      users: 10, // Max 10 users per account
      apiCallsPerMonth: 100000,
      dataRetentionMonths: 24,
    },
  },
  // Future tiers can be added here
  // PRO: { name: 'Pro', price: 495, ... },
  // ENTERPRISE: { name: 'Enterprise', price: 'custom', ... },
}

/**
 * Verify Clerk webhook signature
 */
function verifyWebhookSignature(req) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('CLERK_WEBHOOK_SECRET not configured')
  }

  const svixId = req.headers['svix-id']
  const svixTimestamp = req.headers['svix-timestamp']
  const svixSignature = req.headers['svix-signature']

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing svix headers')
  }

  const wh = new Webhook(webhookSecret)

  try {
    return wh.verify(JSON.stringify(req.body), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error.message}`)
  }
}

/**
 * Handle user.created event
 * Creates user record and initializes default subscription for first user in org
 */
async function handleUserCreated(data) {
  const { id: clerkUserId, email_addresses, first_name, last_name, public_metadata } = data

  const primaryEmail = email_addresses.find(
    e => e.id === data.primary_email_address_id
  )?.email_address

  // Create user in database
  const user = await prisma.user.create({
    data: {
      clerkUserId,
      email: primaryEmail,
      firstName: first_name,
      lastName: last_name,
      role: public_metadata?.role || 'viewer',
    },
  })

  console.log('[Webhook] User created:', { userId: user.id, email: user.email })

  return { success: true, userId: user.id }
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(data) {
  const { id: clerkUserId, email_addresses, first_name, last_name, public_metadata } = data

  const primaryEmail = email_addresses.find(
    e => e.id === data.primary_email_address_id
  )?.email_address

  const user = await prisma.user.update({
    where: { clerkUserId },
    data: {
      email: primaryEmail,
      firstName: first_name,
      lastName: last_name,
      role: public_metadata?.role,
    },
  })

  console.log('[Webhook] User updated:', { userId: user.id, email: user.email })

  return { success: true, userId: user.id }
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(data) {
  const { id: clerkUserId } = data

  // Soft delete - keep user data for audit trail
  const user = await prisma.user.update({
    where: { clerkUserId },
    data: {
      deletedAt: new Date(),
    },
  })

  console.log('[Webhook] User soft deleted:', { userId: user.id })

  return { success: true, userId: user.id }
}

/**
 * Handle organization.created event
 * Creates subscription record with Alpha tier pricing
 */
async function handleOrganizationCreated(data) {
  const { id: clerkOrgId, name, slug } = data

  // Create organization in database
  const organization = await prisma.organization.create({
    data: {
      clerkOrgId,
      name,
      slug,
    },
  })

  // Create Alpha subscription for this organization
  const subscription = await prisma.subscription.create({
    data: {
      organizationId: organization.id,
      tier: 'ALPHA',
      status: 'trialing', // Start with trial period
      pricePerMonth: SUBSCRIPTION_TIERS.ALPHA.price,
      currency: SUBSCRIPTION_TIERS.ALPHA.currency,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('[Webhook] Organization created with Alpha subscription:', {
    orgId: organization.id,
    subscriptionId: subscription.id,
    tier: 'ALPHA',
    price: '$295/month',
  })

  return { success: true, organizationId: organization.id, subscriptionId: subscription.id }
}

/**
 * Handle organization.updated event
 */
async function handleOrganizationUpdated(data) {
  const { id: clerkOrgId, name, slug } = data

  const organization = await prisma.organization.update({
    where: { clerkOrgId },
    data: { name, slug },
  })

  console.log('[Webhook] Organization updated:', { orgId: organization.id })

  return { success: true, organizationId: organization.id }
}

/**
 * Handle organization.deleted event
 */
async function handleOrganizationDeleted(data) {
  const { id: clerkOrgId } = data

  // Cancel subscription and soft delete organization
  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
    include: { subscription: true },
  })

  if (organization?.subscription) {
    await prisma.subscription.update({
      where: { id: organization.subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    })
  }

  await prisma.organization.update({
    where: { clerkOrgId },
    data: { deletedAt: new Date() },
  })

  console.log('[Webhook] Organization deleted and subscription canceled:', {
    orgId: organization?.id,
  })

  return { success: true, organizationId: organization?.id }
}

/**
 * Handle organizationMembership.created event
 */
async function handleOrganizationMembershipCreated(data) {
  const { organization, public_user_data, role } = data

  // Find user and organization
  const user = await prisma.user.findUnique({
    where: { clerkUserId: public_user_data.user_id },
  })

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: organization.id },
    include: { subscription: true },
  })

  if (!user || !org) {
    console.warn('[Webhook] Missing user or organization for membership')
    return { success: false, error: 'User or organization not found' }
  }

  // Check user limit for subscription tier
  const memberCount = await prisma.user.count({
    where: {
      organizationId: org.id,
      deletedAt: null,
    },
  })

  const userLimit = SUBSCRIPTION_TIERS.ALPHA.limits.users

  if (memberCount >= userLimit) {
    console.error('[Webhook] User limit reached:', {
      orgId: org.id,
      currentUsers: memberCount,
      limit: userLimit,
    })
    // Note: In production, you'd want to prevent this at the Clerk level
    // or notify the admin
  }

  // Update user's organization
  await prisma.user.update({
    where: { id: user.id },
    data: {
      organizationId: org.id,
      role: role || 'viewer',
    },
  })

  console.log('[Webhook] User added to organization:', {
    userId: user.id,
    orgId: org.id,
    role,
  })

  return { success: true, userId: user.id, organizationId: org.id }
}

/**
 * Handle organizationMembership.deleted event
 */
async function handleOrganizationMembershipDeleted(data) {
  const { public_user_data } = data

  const user = await prisma.user.update({
    where: { clerkUserId: public_user_data.user_id },
    data: {
      organizationId: null,
    },
  })

  console.log('[Webhook] User removed from organization:', { userId: user.id })

  return { success: true, userId: user.id }
}

/**
 * Main webhook endpoint
 * POST /api/webhooks/clerk
 */
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const payload = verifyWebhookSignature(req)
    const { type, data } = payload

    console.log('[Webhook] Received event:', type)

    let result

    // Route to appropriate handler
    switch (type) {
      case WEBHOOK_EVENTS.USER_CREATED:
        result = await handleUserCreated(data)
        break

      case WEBHOOK_EVENTS.USER_UPDATED:
        result = await handleUserUpdated(data)
        break

      case WEBHOOK_EVENTS.USER_DELETED:
        result = await handleUserDeleted(data)
        break

      case WEBHOOK_EVENTS.ORGANIZATION_CREATED:
        result = await handleOrganizationCreated(data)
        break

      case WEBHOOK_EVENTS.ORGANIZATION_UPDATED:
        result = await handleOrganizationUpdated(data)
        break

      case WEBHOOK_EVENTS.ORGANIZATION_DELETED:
        result = await handleOrganizationDeleted(data)
        break

      case WEBHOOK_EVENTS.ORGANIZATION_MEMBERSHIP_CREATED:
        result = await handleOrganizationMembershipCreated(data)
        break

      case WEBHOOK_EVENTS.ORGANIZATION_MEMBERSHIP_DELETED:
        result = await handleOrganizationMembershipDeleted(data)
        break

      default:
        console.log('[Webhook] Unhandled event type:', type)
        return res.status(200).json({ received: true, handled: false })
    }

    return res.status(200).json({
      success: true,
      type,
      result,
    })
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)

    // Return 200 to prevent Clerk from retrying (log error for investigation)
    return res.status(200).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * Get subscription status for current user's organization
 * GET /api/webhooks/subscription/status
 */
router.get('/subscription/status', async (req, res) => {
  try {
    const { userId } = req.auth // Assuming Clerk middleware adds this

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    })

    if (!user?.organization?.subscription) {
      return res.status(404).json({
        error: 'No active subscription found',
      })
    }

    const { subscription } = user.organization
    const tier = SUBSCRIPTION_TIERS[subscription.tier]

    return res.json({
      status: subscription.status,
      tier: {
        name: tier.name,
        price: subscription.pricePerMonth,
        currency: subscription.currency,
        features: tier.features,
        limits: tier.limits,
      },
      billing: {
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd,
        canceledAt: subscription.canceledAt,
      },
    })
  } catch (error) {
    console.error('[Subscription] Error fetching status:', error)
    return res.status(500).json({
      error: 'Failed to fetch subscription status',
    })
  }
})

export default router
