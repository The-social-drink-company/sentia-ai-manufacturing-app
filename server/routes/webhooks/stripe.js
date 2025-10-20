/**
 * Stripe Webhook Route
 *
 * Dedicated route for handling Stripe webhook events.
 * Verifies webhook signatures and delegates to webhook handler.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

import express from 'express';
import webhookHandler from '../../services/stripe/webhook-handler.js';
import subscriptionRepository from '../../services/subscription/subscription-repository.js';
import emailService from '../../services/email/email-service.js';

// Initialize webhook handler dependencies
webhookHandler.setDependencies({ subscriptionRepository, emailService });

const router = express.Router();

/**
 * Stripe Webhook Endpoint
 * POST /api/webhooks/stripe
 *
 * IMPORTANT: This endpoint must receive the raw request body (not parsed JSON)
 * for signature verification to work correctly.
 *
 * Configure in Stripe Dashboard:
 * - URL: https://api.capliquify.com/api/webhooks/stripe
 * - Events to send: All subscription and invoice events
 */
router.post(
  '/',
  express.raw({ type: 'application/json' }), // Important: Use raw body for signature verification
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('[Webhook] Missing Stripe signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    try {
      // Verify webhook signature and construct event
      const event = webhookHandler.verifyWebhook(req.body, signature);

      console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

      // Handle the event asynchronously
      // Respond quickly to Stripe (within 5 seconds) then process
      res.json({ received: true, eventId: event.id });

      // Process event in background
      setImmediate(async () => {
        try {
          await webhookHandler.handleEvent(event);
        } catch (error) {
          console.error(`[Webhook] Error processing event ${event.id}:`, error.message);
          // TODO: Add to retry queue or dead letter queue
        }
      });
    } catch (error) {
      console.error('[Webhook] Error verifying webhook:', error.message);
      return res.status(400).json({
        error: 'Webhook signature verification failed',
        message: error.message,
      });
    }
  }
);

/**
 * Health check for webhook endpoint
 * GET /api/webhooks/stripe/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    endpoint: '/api/webhooks/stripe',
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
  });
});

export default router;
