/**
 * Trial Upgrade Routes - Convert trial users to paying customers
 *
 * Handles the complete trial-to-paid conversion flow:
 * 1. Preview upgrade with proration (remaining trial days credited)
 * 2. Create Stripe customer (if doesn't exist)
 * 3. Create Stripe subscription with payment method
 * 4. Update tenant status to 'active'
 * 5. Send upgrade confirmation email
 *
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 4 (Upgrade Flow - No-CC Trial → Paid)
 */

import express from 'express';
import { prisma } from '../../lib/prisma.js';
import stripeService from '../../services/stripe/stripe-service.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();

/**
 * POST /api/billing/trial-upgrade/preview
 *
 * Preview upgrade cost with proration for remaining trial days
 *
 * Request Body:
 * {
 *   "tier": "professional",
 *   "cycle": "monthly"
 * }
 *
 * Response:
 * {
 *   "amountDue": 11417,  // $114.17 (after proration)
 *   "credit": 3483,       // $34.83 (7 days remaining credit)
 *   "total": 14900,       // $149.00 (full monthly price)
 *   "nextBillingDate": "2025-11-20T00:00:00Z",
 *   "lines": [
 *     { "description": "Professional - Monthly", "amount": 14900, "proration": false },
 *     { "description": "Prorated credit (7 days remaining)", "amount": -3483, "proration": true }
 *   ]
 * }
 */
router.post('/trial-upgrade/preview', async (req, res) => {
  try {
    const { userId } = req.auth; // From Clerk middleware
    const { tier, cycle } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate inputs
    const validTiers = ['starter', 'professional', 'enterprise'];
    const validCycles = ['monthly', 'annual'];

    if (!tier || !validTiers.includes(tier.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid tier. Must be: starter, professional, or enterprise' });
    }

    if (!cycle || !validCycles.includes(cycle.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid cycle. Must be: monthly or annual' });
    }

    // Get tenant from user
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user || !user.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = user.tenant;

    // Verify tenant is in trial
    if (tenant.subscriptionStatus !== 'trial' && tenant.subscriptionStatus !== 'TRIAL') {
      return res.status(400).json({
        error: 'Tenant is not in trial mode',
        currentStatus: tenant.subscriptionStatus
      });
    }

    // Calculate proration based on remaining trial days
    const now = new Date();
    const trialEndDate = tenant.trialEndsAt || tenant.trialEndDate;

    if (!trialEndDate) {
      return res.status(400).json({ error: 'Trial end date not found' });
    }

    const daysRemaining = Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)));

    // Price lookup (in cents)
    const prices = {
      starter: { monthly: 14900, annual: 149000 },      // $149/mo, $1490/yr
      professional: { monthly: 29500, annual: 295000 }, // $295/mo, $2950/yr
      enterprise: { monthly: 59500, annual: 595000 },   // $595/mo, $5950/yr
    };

    const fullPrice = prices[tier.toLowerCase()]?.[cycle.toLowerCase()];

    if (!fullPrice) {
      return res.status(400).json({ error: 'Invalid tier/cycle combination' });
    }

    // Calculate proration credit (remaining trial days)
    const daysInMonth = 30;
    const proratedCredit = Math.floor((fullPrice / daysInMonth) * daysRemaining);
    const amountDue = fullPrice - proratedCredit;

    // Calculate next billing date
    const nextBillingDate = new Date(now);
    if (cycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const preview = {
      amountDue,
      credit: proratedCredit,
      total: fullPrice,
      daysRemaining,
      nextBillingDate: nextBillingDate.toISOString(),
      lines: [
        {
          description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} - ${cycle.charAt(0).toUpperCase() + cycle.slice(1)}`,
          amount: fullPrice,
          proration: false,
        },
        {
          description: `Prorated credit (${daysRemaining} days remaining)`,
          amount: -proratedCredit,
          proration: true,
        },
      ],
    };

    console.log(`[Trial Upgrade] Preview generated for tenant ${tenant.id}: ${tier}/${cycle}, $${(amountDue / 100).toFixed(2)} due`);

    res.json(preview);
  } catch (error) {
    console.error('[Trial Upgrade] Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate upgrade preview' });
  }
});

/**
 * POST /api/billing/trial-upgrade
 *
 * Complete trial-to-paid conversion
 *
 * Request Body:
 * {
 *   "tier": "professional",
 *   "cycle": "monthly",
 *   "paymentMethodId": "pm_card_visa"  // From Stripe.js
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "subscriptionId": "sub_xxx",
 *   "customerId": "cus_xxx",
 *   "amountPaid": 11417,
 *   "nextBillingDate": "2025-11-20T00:00:00Z"
 * }
 */
router.post('/trial-upgrade', async (req, res) => {
  try {
    const { userId } = req.auth; // From Clerk middleware
    const { tier, cycle, paymentMethodId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate inputs
    const validTiers = ['starter', 'professional', 'enterprise'];
    const validCycles = ['monthly', 'annual'];

    if (!tier || !validTiers.includes(tier.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (!cycle || !validCycles.includes(cycle.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid cycle' });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    // Get user and tenant
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user || !user.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = user.tenant;

    // Verify tenant is in trial
    if (tenant.subscriptionStatus !== 'trial' && tenant.subscriptionStatus !== 'TRIAL') {
      return res.status(400).json({
        error: 'Tenant is not in trial mode',
        currentStatus: tenant.subscriptionStatus
      });
    }

    // Get user info from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

    // Step 1: Create Stripe customer (if doesn't exist)
    let stripeCustomerId = tenant.stripeCustomerId;

    if (!stripeCustomerId) {
      console.log(`[Trial Upgrade] Creating Stripe customer for tenant ${tenant.id}`);

      const customer = await stripeService.createCustomer({
        email,
        name: name || tenant.name,
        metadata: {
          tenantId: tenant.id,
          clerkUserId: userId,
          companyName: tenant.name,
        },
      });

      stripeCustomerId = customer.id;

      // Update tenant with Stripe customer ID
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId },
      });
    }

    // Step 2: Attach payment method to customer
    console.log(`[Trial Upgrade] Attaching payment method to customer ${stripeCustomerId}`);

    if (stripeService.isConfigured()) {
      await stripeService.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await stripeService.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Step 3: Create Stripe subscription
    console.log(`[Trial Upgrade] Creating subscription: ${tier}/${cycle}`);

    const subscription = await stripeService.createSubscription({
      customerId: stripeCustomerId,
      tier: tier.toLowerCase(),
      cycle: cycle.toLowerCase(),
      trialDays: 0, // No additional trial - converting from trial
      metadata: {
        tenantId: tenant.id,
        convertedFromTrial: true,
        trialEndDate: tenant.trialEndsAt?.toISOString() || tenant.trialEndDate?.toISOString(),
      },
    });

    // Step 4: Update tenant status
    const now = new Date();
    const nextBillingDate = new Date(now);
    if (cycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'active',
        subscriptionTier: tier.toUpperCase(),
        subscriptionCycle: cycle.toUpperCase(),
        stripeSubscriptionId: subscription.id,
        isInTrial: false,
        convertedAt: now,
        conversionDays: Math.ceil((now - (tenant.trialStartedAt || tenant.trialStartDate)) / (1000 * 60 * 60 * 24)),
      },
    });

    // Step 5: Log conversion event
    console.log(`[Trial Upgrade] ✅ Trial conversion complete: Tenant ${tenant.id} → ${tier}/${cycle}`);

    // TODO: Send upgrade confirmation email
    // await sendUpgradeConfirmationEmail(email, { tier, cycle, amountPaid });

    res.json({
      success: true,
      subscriptionId: subscription.id,
      customerId: stripeCustomerId,
      amountPaid: subscription.latest_invoice?.amount_paid || 0,
      nextBillingDate: nextBillingDate.toISOString(),
      message: `Successfully upgraded to ${tier} (${cycle})`,
    });
  } catch (error) {
    console.error('[Trial Upgrade] Error processing upgrade:', error);
    res.status(500).json({
      error: 'Failed to process upgrade',
      message: error.message
    });
  }
});

/**
 * GET /api/billing/trial-upgrade/status
 *
 * Get upgrade eligibility and trial status
 *
 * Response:
 * {
 *   "eligible": true,
 *   "trialStatus": "active",
 *   "daysRemaining": 7,
 *   "trialEndDate": "2025-11-13T00:00:00Z",
 *   "currentTier": "professional",
 *   "currentCycle": "monthly"
 * }
 */
router.get('/trial-upgrade/status', async (req, res) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get tenant
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user || !user.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = user.tenant;

    // Calculate days remaining
    const now = new Date();
    const trialEndDate = tenant.trialEndsAt || tenant.trialEndDate;
    const daysRemaining = trialEndDate
      ? Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)))
      : 0;

    const isInTrial = tenant.subscriptionStatus === 'trial' || tenant.subscriptionStatus === 'TRIAL';

    res.json({
      eligible: isInTrial && daysRemaining >= 0,
      trialStatus: isInTrial ? (daysRemaining > 0 ? 'active' : 'expired') : 'not_in_trial',
      daysRemaining,
      trialEndDate: trialEndDate?.toISOString(),
      currentTier: tenant.subscriptionTier?.toLowerCase(),
      currentCycle: tenant.subscriptionCycle?.toLowerCase(),
    });
  } catch (error) {
    console.error('[Trial Upgrade] Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch upgrade status' });
  }
});

export default router;
