/**
 * Trial Management Routes
 *
 * Handles trial signup, status checking, and conversion to paid subscriptions.
 *
 * @module server/routes/trial.routes
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { clerkClient } from '@clerk/clerk-sdk-node'

const router = Router()
const prisma = new PrismaClient()

// Subscription tier configurations
const TIER_CONFIGS = {
  starter: {
    maxUsers: 5,
    maxEntities: 100,
    maxStorage: 1000, // MB
    features: {
      workingCapital: true,
      demandForecasting: true,
      inventoryManagement: true,
      aiAnalytics: false,
      advancedReporting: false,
      apiAccess: false,
    },
  },
  professional: {
    maxUsers: 20,
    maxEntities: 500,
    maxStorage: 5000, // MB
    features: {
      workingCapital: true,
      demandForecasting: true,
      inventoryManagement: true,
      aiAnalytics: true,
      advancedReporting: true,
      apiAccess: false,
    },
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    maxEntities: -1, // Unlimited
    maxStorage: -1, // Unlimited
    features: {
      workingCapital: true,
      demandForecasting: true,
      inventoryManagement: true,
      aiAnalytics: true,
      advancedReporting: true,
      apiAccess: true,
    },
  },
}

const TRIAL_DURATION_DAYS = 14

/**
 * POST /api/trial/create-trial
 *
 * Create a new trial tenant with Clerk organization integration
 *
 * Body:
 * {
 *   clerkUserId: string,
 *   clerkOrgId: string,
 *   email: string,
 *   firstName: string,
 *   lastName: string,
 *   companyName: string,
 *   tier: "starter" | "professional" | "enterprise"
 * }
 */
router.post('/create-trial', async (req: Request, res: Response) => {
  try {
    const {
      clerkUserId,
      clerkOrgId,
      email,
      firstName,
      lastName,
      companyName,
      tier,
    } = req.body

    // Validation
    if (!clerkUserId || !clerkOrgId || !email || !companyName || !tier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    if (!TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be starter, professional, or enterprise',
      })
    }

    // Check if email already has a trial or active subscription
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        billingEmail: email,
      },
    })

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        error: 'Email already associated with an existing account',
      })
    }

    // Generate unique slug from company name
    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let slugSuffix = 1

    // Ensure slug is unique
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugSuffix}`
      slugSuffix++
    }

    // Calculate trial dates
    const trialStartDate = new Date()
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS)

    // Get tier configuration
    const tierConfig = TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS]

    // Generate unique database schema name
    const dbSchema = `tenant_${slug.replace(/-/g, '_')}`

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        companyName,
        billingEmail: email,
        isInTrial: true,
        trialStartDate,
        trialEndDate,
        trialTier: tier,
        subscriptionTier: tier,
        subscriptionStatus: 'TRIAL',
        maxUsers: tierConfig.maxUsers,
        maxEntities: tierConfig.maxEntities,
        maxStorage: tierConfig.maxStorage,
        features: tierConfig.features,
        dbSchema,
        isActive: true,
      },
    })

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        tier,
        status: 'TRIAL',
        amount: 0, // Free trial
        currency: 'USD',
        billingCycle: 'MONTHLY',
        trialEndDate,
        gracePeriodEnd: new Date(
          trialEndDate.getTime() + 3 * 24 * 60 * 60 * 1000
        ), // 3 days after trial
        startDate: trialStartDate,
        tenantId: tenant.id,
      },
    })

    // Update tenant with subscription ID
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionId: subscription.id },
    })

    // Schedule Day 1 welcome email
    await prisma.trialEmail.create({
      data: {
        tenantId: tenant.id,
        type: 'DAY_1',
        status: 'PENDING',
        subject: 'Welcome to CapLiquify - Your 14-Day Trial Starts Now!',
        body: `Welcome ${firstName}!`, // Placeholder - will be replaced by actual template
        toEmail: email,
      },
    })

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          trialEndDate: tenant.trialEndDate,
          tier: tenant.subscriptionTier,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trialEndDate: subscription.trialEndDate,
        },
      },
    })
  } catch (error) {
    console.error('Error creating trial tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create trial tenant',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/trial/status
 *
 * Get trial status for current user's tenant
 *
 * Query params:
 * - tenantId: string (optional, uses auth context if not provided)
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query

    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing tenantId query parameter',
      })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
      },
    })

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found',
      })
    }

    if (!tenant.isInTrial) {
      return res.json({
        success: true,
        data: {
          isInTrial: false,
          status: tenant.subscriptionStatus,
        },
      })
    }

    // Calculate days remaining
    const now = new Date()
    const trialEnd = new Date(tenant.trialEndDate!)
    const timeRemaining = trialEnd.getTime() - now.getTime()
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60))
    const isExpired = daysRemaining <= 0

    res.json({
      success: true,
      data: {
        isInTrial: true,
        tier: tenant.trialTier,
        trialStartDate: tenant.trialStartDate,
        trialEndDate: tenant.trialEndDate,
        daysRemaining: Math.max(0, daysRemaining),
        hoursRemaining: Math.max(0, hoursRemaining),
        isExpired,
        gracePeriodEnd: tenant.subscription?.gracePeriodEnd,
        features: tenant.features,
      },
    })
  } catch (error) {
    console.error('Error fetching trial status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trial status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * PATCH /api/trial/convert
 *
 * Convert trial to paid subscription
 *
 * Body:
 * {
 *   tenantId: string,
 *   stripeCustomerId: string,
 *   stripeSubscriptionId: string,
 *   stripePriceId: string,
 *   stripePaymentMethodId: string
 * }
 */
router.patch('/convert', async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      stripePaymentMethodId,
    } = req.body

    // Validation
    if (
      !tenantId ||
      !stripeCustomerId ||
      !stripeSubscriptionId ||
      !stripePriceId
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    })

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found',
      })
    }

    if (!tenant.isInTrial) {
      return res.status(400).json({
        success: false,
        error: 'Tenant is not in trial status',
      })
    }

    // Update subscription to ACTIVE
    const updatedSubscription = await prisma.subscription.update({
      where: { id: tenant.subscriptionId! },
      data: {
        status: 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId,
        stripePaymentMethodId,
      },
    })

    // Update tenant status
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isInTrial: false,
        subscriptionStatus: 'ACTIVE',
        paymentMethodId: stripePaymentMethodId,
      },
    })

    res.json({
      success: true,
      data: {
        tenant: updatedTenant,
        subscription: updatedSubscription,
      },
    })
  } catch (error) {
    console.error('Error converting trial to paid:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to convert trial to paid subscription',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/trial/tiers
 *
 * Get available subscription tiers and their features
 */
router.get('/tiers', async (req: Request, res: Response) => {
  try {
    const tiers = Object.entries(TIER_CONFIGS).map(([key, config]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      maxUsers: config.maxUsers === -1 ? 'Unlimited' : config.maxUsers,
      maxEntities: config.maxEntities === -1 ? 'Unlimited' : config.maxEntities,
      maxStorage:
        config.maxStorage === -1
          ? 'Unlimited'
          : `${config.maxStorage} MB`,
      features: config.features,
    }))

    res.json({
      success: true,
      data: tiers,
    })
  } catch (error) {
    console.error('Error fetching tiers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription tiers',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
