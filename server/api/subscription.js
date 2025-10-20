/**
 * Subscription Management API Endpoints
 *
 * Handles upgrade, downgrade, and billing cycle changes for CapLiquify subscriptions.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-009 (Upgrade/Downgrade Flows)
 */

import express from 'express';

const router = express.Router();

// Pricing tiers for reference
const PRICING_TIERS = {
  starter: {
    monthlyPrice: 149,
    annualPrice: 1490,
    features: {
      maxUsers: 5,
      maxEntities: 500,
      maxIntegrations: 3,
    },
  },
  professional: {
    monthlyPrice: 295,
    annualPrice: 2950,
    features: {
      maxUsers: 25,
      maxEntities: 5000,
      maxIntegrations: 10,
    },
  },
  enterprise: {
    monthlyPrice: 595,
    annualPrice: 5950,
    features: {
      maxUsers: 100,
      maxEntities: 'unlimited',
      maxIntegrations: 'unlimited',
    },
  },
};

/**
 * Preview upgrade proration
 * POST /api/subscription/preview-upgrade
 */
router.post('/preview-upgrade', async (req, res) => {
  try {
    const { newTier, newCycle } = req.body;

    // In production, this would:
    // 1. Get current subscription from Stripe
    // 2. Calculate proration using Stripe API
    // 3. Return preview

    // Mock proration preview for demo
    const tierConfig = PRICING_TIERS[newTier];
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const newPrice = newCycle === 'monthly' ? tierConfig.monthlyPrice : tierConfig.annualPrice;

    // Calculate mock proration credit (30% of current period remaining)
    const currentPrice = 295; // Assume current professional monthly
    const daysInMonth = 30;
    const daysRemaining = 15; // Mock: halfway through month
    const proratedCredit = Math.floor((currentPrice * daysRemaining) / daysInMonth);

    const amountDue = (newPrice - proratedCredit) * 100; // Convert to cents

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + (newCycle === 'monthly' ? 1 : 12));

    res.json({
      success: true,
      amountDue: Math.max(0, amountDue),
      credit: proratedCredit * 100, // Convert to cents
      nextBillingDate: nextBillingDate.toLocaleDateString(),
      newPrice,
      newTier,
      newCycle,
    });
  } catch (error) {
    console.error('Error previewing upgrade:', error);
    res.status(500).json({ error: 'Failed to preview upgrade' });
  }
});

/**
 * Process upgrade
 * POST /api/subscription/upgrade
 */
router.post('/upgrade', async (req, res) => {
  try {
    const { newTier, newCycle } = req.body;

    // In production, this would:
    // 1. Validate user has permission
    // 2. Create Stripe subscription update
    // 3. Update database with new tier
    // 4. Trigger webhook for provisioning

    const tierConfig = PRICING_TIERS[newTier];
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Mock successful upgrade
    const subscription = {
      id: 'sub_' + Math.random().toString(36).substring(7),
      tier: newTier,
      cycle: newCycle,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + (newCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
      price: newCycle === 'monthly' ? tierConfig.monthlyPrice : tierConfig.annualPrice,
    };

    console.log(`[Subscription] Upgrade processed: ${newTier} (${newCycle})`);

    res.json({
      success: true,
      subscription,
      message: `Successfully upgraded to ${newTier}`,
    });
  } catch (error) {
    console.error('Error processing upgrade:', error);
    res.status(500).json({ error: 'Failed to process upgrade' });
  }
});

/**
 * Check downgrade impact
 * GET /api/subscription/downgrade-impact
 */
router.get('/downgrade-impact', async (req, res) => {
  try {
    const { newTier } = req.query;

    const tierConfig = PRICING_TIERS[newTier];
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // In production, this would query database for actual counts
    // Mock data showing potential impacts
    const currentUsage = {
      users: 15,
      entities: 2500,
      integrations: 7,
    };

    const newLimits = tierConfig.features;

    const impact = {
      hasImpact: false,
      usersOverLimit: 0,
      entitiesOverLimit: 0,
      integrationsOverLimit: 0,
    };

    if (currentUsage.users > newLimits.maxUsers) {
      impact.hasImpact = true;
      impact.usersOverLimit = currentUsage.users - newLimits.maxUsers;
    }

    if (currentUsage.entities > newLimits.maxEntities && newLimits.maxEntities !== 'unlimited') {
      impact.hasImpact = true;
      impact.entitiesOverLimit = currentUsage.entities - newLimits.maxEntities;
    }

    if (currentUsage.integrations > newLimits.maxIntegrations && newLimits.maxIntegrations !== 'unlimited') {
      impact.hasImpact = true;
      impact.integrationsOverLimit = currentUsage.integrations - newLimits.maxIntegrations;
    }

    res.json(impact);
  } catch (error) {
    console.error('Error checking downgrade impact:', error);
    res.status(500).json({ error: 'Failed to check downgrade impact' });
  }
});

/**
 * Schedule downgrade
 * POST /api/subscription/downgrade
 */
router.post('/downgrade', async (req, res) => {
  try {
    const { newTier } = req.body;

    // In production, this would:
    // 1. Validate user has permission
    // 2. Schedule downgrade in Stripe (at period end)
    // 3. Update database with scheduled change
    // 4. Send confirmation email

    const tierConfig = PRICING_TIERS[newTier];
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Mock scheduled downgrade
    const effectiveDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    console.log(`[Subscription] Downgrade scheduled: ${newTier} (effective ${effectiveDate.toLocaleDateString()})`);

    res.json({
      success: true,
      message: `Downgrade to ${newTier} scheduled for ${effectiveDate.toLocaleDateString()}`,
      effectiveDate,
      newTier,
      canCancel: true,
    });
  } catch (error) {
    console.error('Error scheduling downgrade:', error);
    res.status(500).json({ error: 'Failed to schedule downgrade' });
  }
});

/**
 * Switch billing cycle
 * POST /api/subscription/switch-cycle
 */
router.post('/switch-cycle', async (req, res) => {
  try {
    const { newCycle } = req.body;

    if (!['monthly', 'annual'].includes(newCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // In production, this would:
    // 1. Update Stripe subscription
    // 2. Calculate proration
    // 3. Update database
    // 4. Send confirmation

    // Mock cycle switch
    const currentTier = 'professional'; // Mock current tier
    const tierConfig = PRICING_TIERS[currentTier];
    const newPrice = newCycle === 'monthly' ? tierConfig.monthlyPrice : tierConfig.annualPrice;

    console.log(`[Subscription] Billing cycle switched: ${newCycle}`);

    res.json({
      success: true,
      message: `Billing cycle switched to ${newCycle}`,
      newCycle,
      newPrice,
      effectiveImmediately: true,
    });
  } catch (error) {
    console.error('Error switching billing cycle:', error);
    res.status(500).json({ error: 'Failed to switch billing cycle' });
  }
});

/**
 * Cancel scheduled downgrade
 * POST /api/subscription/cancel-downgrade
 */
router.post('/cancel-downgrade', async (req, res) => {
  try {
    // In production, this would:
    // 1. Cancel scheduled change in Stripe
    // 2. Update database
    // 3. Send confirmation

    console.log('[Subscription] Scheduled downgrade cancelled');

    res.json({
      success: true,
      message: 'Scheduled downgrade cancelled',
    });
  } catch (error) {
    console.error('Error cancelling downgrade:', error);
    res.status(500).json({ error: 'Failed to cancel downgrade' });
  }
});

export default router;
