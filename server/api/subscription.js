/**
 * Subscription Management API Endpoints - PRODUCTION VERSION
 *
 * Handles upgrade, downgrade, and billing cycle changes for CapLiquify subscriptions.
 * Integrates with Stripe, PostgreSQL database, and email services.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

import express from 'express';
import subscriptionManager from '../services/stripe/subscription-manager.js';
import stripeService from '../services/stripe/stripe-service.js';
import subscriptionRepository from '../services/subscription/subscription-repository.js';
import emailService from '../services/email/email-service.js';

// Initialize dependencies
subscriptionManager.setDependencies({ subscriptionRepository, emailService });

const router = express.Router();

/**
 * Preview upgrade proration
 * POST /api/subscription/preview-upgrade
 *
 * Body: { newTier: string, newCycle: string }
 * Returns: Proration calculation with amount due
 */
router.post('/preview-upgrade', async (req, res) => {
  try {
    const { newTier, newCycle } = req.body;

    // Validate input
    if (!newTier || !newCycle) {
      return res.status(400).json({
        error: 'Missing required fields: newTier, newCycle'
      });
    }

    if (!['starter', 'professional', 'enterprise'].includes(newTier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (!['monthly', 'annual'].includes(newCycle)) {
      return res.status(400).json({ error: 'Invalid cycle' });
    }

    // Get tenant ID from session/auth (for now, use mock)
    const tenantId = req.user?.tenantId || 'demo-tenant';

    // Get proration preview from subscription manager
    const preview = await subscriptionManager.previewUpgrade({
      tenantId,
      newTier,
      newCycle,
    });

    res.json(preview);
  } catch (error) {
    console.error('[API] Error previewing upgrade:', error.message);
    res.status(500).json({
      error: 'Failed to preview upgrade',
      message: error.message,
    });
  }
});

/**
 * Process subscription upgrade
 * POST /api/subscription/upgrade
 *
 * Body: { newTier: string, newCycle: string }
 * Returns: Updated subscription details
 */
router.post('/upgrade', async (req, res) => {
  try {
    const { newTier, newCycle } = req.body;

    // Validate input
    if (!newTier || !newCycle) {
      return res.status(400).json({
        error: 'Missing required fields: newTier, newCycle'
      });
    }

    // Get tenant and user ID from session/auth (for now, use mock)
    const tenantId = req.user?.tenantId || 'demo-tenant';
    const userId = req.user?.id || 'demo-user';

    // Process upgrade through subscription manager
    const result = await subscriptionManager.processUpgrade({
      tenantId,
      newTier,
      newCycle,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('[API] Error processing upgrade:', error.message);
    res.status(500).json({
      error: 'Failed to process upgrade',
      message: error.message,
    });
  }
});

/**
 * Check downgrade impact
 * GET /api/subscription/downgrade-impact?newTier=starter
 *
 * Query: { newTier: string }
 * Returns: Impact analysis (users/entities/integrations over limit)
 */
router.get('/downgrade-impact', async (req, res) => {
  try {
    const { newTier } = req.query;

    // Validate input
    if (!newTier) {
      return res.status(400).json({ error: 'Missing required parameter: newTier' });
    }

    if (!['starter', 'professional', 'enterprise'].includes(newTier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Get tenant ID from session/auth (for now, use mock)
    const tenantId = req.user?.tenantId || 'demo-tenant';

    // Get impact analysis from subscription manager
    const impact = await subscriptionManager.checkDowngradeImpact({
      tenantId,
      newTier,
    });

    res.json(impact);
  } catch (error) {
    console.error('[API] Error checking downgrade impact:', error.message);
    res.status(500).json({
      error: 'Failed to check downgrade impact',
      message: error.message,
    });
  }
});

/**
 * Schedule subscription downgrade
 * POST /api/subscription/downgrade
 *
 * Body: { newTier: string }
 * Returns: Scheduled downgrade confirmation
 */
router.post('/downgrade', async (req, res) => {
  try {
    const { newTier } = req.body;

    // Validate input
    if (!newTier) {
      return res.status(400).json({ error: 'Missing required field: newTier' });
    }

    // Get tenant and user ID from session/auth (for now, use mock)
    const tenantId = req.user?.tenantId || 'demo-tenant';
    const userId = req.user?.id || 'demo-user';

    // Schedule downgrade through subscription manager
    const result = await subscriptionManager.scheduleDowngrade({
      tenantId,
      newTier,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('[API] Error scheduling downgrade:', error.message);
    res.status(500).json({
      error: 'Failed to schedule downgrade',
      message: error.message,
    });
  }
});

/**
 * Switch billing cycle (monthly <-> annual)
 * POST /api/subscription/switch-cycle
 *
 * Body: { newCycle: string }
 * Returns: Updated subscription with new cycle
 */
router.post('/switch-cycle', async (req, res) => {
  try {
    const { newCycle } = req.body;

    // Validate input
    if (!newCycle) {
      return res.status(400).json({ error: 'Missing required field: newCycle' });
    }

    if (!['monthly', 'annual'].includes(newCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Get tenant and user ID from session/auth (for now, use mock)
    const tenantId = req.user?.tenantId || 'demo-tenant';
    const userId = req.user?.id || 'demo-user';

    // Switch cycle through subscription manager
    const result = await subscriptionManager.switchBillingCycle({
      tenantId,
      newCycle,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('[API] Error switching billing cycle:', error.message);
    res.status(500).json({
      error: 'Failed to switch billing cycle',
      message: error.message,
    });
  }
});

/**
 * Cancel scheduled downgrade
 * POST /api/subscription/cancel-downgrade
 *
 * Returns: Cancellation confirmation
 */
router.post('/cancel-downgrade', async (req, res) => {
  try {
    // Get tenant and user ID from session/auth (for now, use mock)
    const tenantId = req.user?.tenantId || 'demo-tenant';
    const userId = req.user?.id || 'demo-user';

    // Cancel scheduled downgrade through subscription manager
    const result = await subscriptionManager.cancelScheduledDowngrade({
      tenantId,
      userId,
    });

    res.json(result);
  } catch (error) {
    console.error('[API] Error cancelling downgrade:', error.message);
    res.status(500).json({
      error: 'Failed to cancel downgrade',
      message: error.message,
    });
  }
});

/**
 * Get current subscription status
 * GET /api/subscription/status
 *
 * Returns: Current subscription details
 */
router.get('/status', async (req, res) => {
  try {
    // Get tenant ID from session/auth (for now, use mock)
    const tenantId = req.user?.tenantId || 'demo-tenant';

    // Get current subscription from repository
    const subscription = await subscriptionRepository.getCurrentSubscription(tenantId);

    if (!subscription) {
      return res.status(404).json({
        error: 'No active subscription found',
        hasSubscription: false,
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error('[API] Error getting subscription status:', error.message);
    res.status(500).json({
      error: 'Failed to get subscription status',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 * GET /api/subscription/health
 *
 * Returns: Service health status
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'subscription-api',
    version: '1.0.0',
    stripe: {
      configured: stripeService.isConfigured(),
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
