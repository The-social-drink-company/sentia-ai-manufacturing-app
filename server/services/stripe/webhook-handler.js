/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for subscription lifecycle management.
 * Handles payment successes, failures, subscription updates, and cancellations.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

import Stripe from 'stripe';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

class StripeWebhookHandler {
  constructor() {
    this.webhookSecret = stripeWebhookSecret;
    this.subscriptionRepository = null; // Will be injected
    this.emailService = null; // Will be injected
  }

  /**
   * Set dependencies (injected after initialization)
   */
  setDependencies({ subscriptionRepository, emailService }) {
    this.subscriptionRepository = subscriptionRepository;
    this.emailService = emailService;
  }

  /**
   * Verify webhook signature
   * @param {string} rawBody - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified event
   */
  verifyWebhook(rawBody, signature) {
    if (!this.webhookSecret) {
      console.warn('[Webhook] Webhook secret not configured - skipping verification');
      // In development, parse the body directly
      return typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      return stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (error) {
      console.error('[Webhook] Signature verification failed:', error.message);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Handle webhook event
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<void>}
   */
  async handleEvent(event) {
    console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object);
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      console.log(`[Webhook] Event processed successfully: ${event.type}`);
    } catch (error) {
      console.error(`[Webhook] Error processing event ${event.type}:`, error.message);
      throw error;
    }
  }

  /**
   * Handle subscription created event
   * @param {Object} subscription - Stripe subscription object
   */
  async handleSubscriptionCreated(subscription) {
    try {
      // Extract metadata
      const { tier, cycle } = subscription.metadata || {};

      if (!tier || !cycle) {
        console.warn('[Webhook] Subscription created without tier/cycle metadata');
        return;
      }

      // Find tenant by Stripe customer ID
      const tenant = await this.subscriptionRepository?.findTenantByStripeCustomer(
        subscription.customer
      );

      if (!tenant) {
        console.error(`[Webhook] Tenant not found for customer: ${subscription.customer}`);
        return;
      }

      // Create subscription record in database
      await this.subscriptionRepository?.createSubscription({
        tenantId: tenant.id,
        tier,
        status: subscription.status.toUpperCase(),
        billingCycle: cycle.toUpperCase(),
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      // Send welcome email
      this.emailService?.sendWelcomeEmail({
        tenantId: tenant.id,
        tier,
        cycle,
      }).catch(error => {
        console.error('[Webhook] Failed to send welcome email:', error.message);
      });

      console.log(`[Webhook] Subscription created for tenant: ${tenant.id}`);
    } catch (error) {
      console.error('[Webhook] Error handling subscription created:', error.message);
      throw error;
    }
  }

  /**
   * Handle subscription updated event
   * @param {Object} subscription - Stripe subscription object
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      // Find subscription in database
      const dbSubscription = await this.subscriptionRepository?.findByStripeSubscriptionId(
        subscription.id
      );

      if (!dbSubscription) {
        console.error(`[Webhook] Subscription not found: ${subscription.id}`);
        return;
      }

      // Extract updated metadata
      const { tier, cycle } = subscription.metadata || {};

      // Update subscription in database
      await this.subscriptionRepository?.updateSubscription(dbSubscription.id, {
        tier: tier || dbSubscription.tier,
        status: subscription.status.toUpperCase(),
        billingCycle: cycle ? cycle.toUpperCase() : dbSubscription.billingCycle,
        stripePriceId: subscription.items.data[0].price.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      // Update tenant tier if changed
      if (tier && tier !== dbSubscription.tier) {
        await this.subscriptionRepository?.updateTenantTier(dbSubscription.tenantId, tier);
      }

      console.log(`[Webhook] Subscription updated: ${subscription.id}`);
    } catch (error) {
      console.error('[Webhook] Error handling subscription updated:', error.message);
      throw error;
    }
  }

  /**
   * Handle subscription deleted event
   * @param {Object} subscription - Stripe subscription object
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      // Find subscription in database
      const dbSubscription = await this.subscriptionRepository?.findByStripeSubscriptionId(
        subscription.id
      );

      if (!dbSubscription) {
        console.error(`[Webhook] Subscription not found: ${subscription.id}`);
        return;
      }

      // Update subscription status
      await this.subscriptionRepository?.updateSubscription(dbSubscription.id, {
        status: 'CANCELLED',
      });

      // Downgrade tenant to free tier
      await this.subscriptionRepository?.updateTenantTier(dbSubscription.tenantId, 'free');

      // Send cancellation confirmation email
      this.emailService?.sendCancellationConfirmation({
        tenantId: dbSubscription.tenantId,
      }).catch(error => {
        console.error('[Webhook] Failed to send cancellation email:', error.message);
      });

      console.log(`[Webhook] Subscription deleted: ${subscription.id}`);
    } catch (error) {
      console.error('[Webhook] Error handling subscription deleted:', error.message);
      throw error;
    }
  }

  /**
   * Handle payment succeeded event
   * @param {Object} invoice - Stripe invoice object
   */
  async handlePaymentSucceeded(invoice) {
    try {
      if (!invoice.subscription) {
        console.log('[Webhook] Payment succeeded for non-subscription invoice');
        return;
      }

      // Find subscription in database
      const dbSubscription = await this.subscriptionRepository?.findByStripeSubscriptionId(
        invoice.subscription
      );

      if (!dbSubscription) {
        console.error(`[Webhook] Subscription not found: ${invoice.subscription}`);
        return;
      }

      // Log payment
      await this.subscriptionRepository?.logPayment({
        subscriptionId: dbSubscription.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        stripeInvoiceId: invoice.id,
        status: 'SUCCEEDED',
        paidAt: new Date(invoice.status_transitions.paid_at * 1000),
      });

      // Send payment receipt email
      this.emailService?.sendPaymentReceipt({
        tenantId: dbSubscription.tenantId,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        invoiceUrl: invoice.hosted_invoice_url,
      }).catch(error => {
        console.error('[Webhook] Failed to send payment receipt:', error.message);
      });

      console.log(`[Webhook] Payment succeeded for subscription: ${invoice.subscription}`);
    } catch (error) {
      console.error('[Webhook] Error handling payment succeeded:', error.message);
      throw error;
    }
  }

  /**
   * Handle payment failed event
   * @param {Object} invoice - Stripe invoice object
   */
  async handlePaymentFailed(invoice) {
    try {
      if (!invoice.subscription) {
        console.log('[Webhook] Payment failed for non-subscription invoice');
        return;
      }

      // Find subscription in database
      const dbSubscription = await this.subscriptionRepository?.findByStripeSubscriptionId(
        invoice.subscription
      );

      if (!dbSubscription) {
        console.error(`[Webhook] Subscription not found: ${invoice.subscription}`);
        return;
      }

      // Log failed payment
      await this.subscriptionRepository?.logPayment({
        subscriptionId: dbSubscription.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        stripeInvoiceId: invoice.id,
        status: 'FAILED',
        failureReason: invoice.last_finalization_error?.message || 'Payment failed',
      });

      // Update subscription status
      await this.subscriptionRepository?.updateSubscription(dbSubscription.id, {
        status: 'PAST_DUE',
      });

      // Send payment failed email with retry instructions
      this.emailService?.sendPaymentFailedAlert({
        tenantId: dbSubscription.tenantId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        retryUrl: invoice.hosted_invoice_url,
      }).catch(error => {
        console.error('[Webhook] Failed to send payment failed alert:', error.message);
      });

      console.log(`[Webhook] Payment failed for subscription: ${invoice.subscription}`);
    } catch (error) {
      console.error('[Webhook] Error handling payment failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle trial will end event
   * @param {Object} subscription - Stripe subscription object
   */
  async handleTrialWillEnd(subscription) {
    try {
      // Find subscription in database
      const dbSubscription = await this.subscriptionRepository?.findByStripeSubscriptionId(
        subscription.id
      );

      if (!dbSubscription) {
        console.error(`[Webhook] Subscription not found: ${subscription.id}`);
        return;
      }

      // Send trial ending reminder email
      this.emailService?.sendTrialEndingReminder({
        tenantId: dbSubscription.tenantId,
        daysRemaining: 3,
        trialEndDate: new Date(subscription.trial_end * 1000),
      }).catch(error => {
        console.error('[Webhook] Failed to send trial ending email:', error.message);
      });

      console.log(`[Webhook] Trial will end for subscription: ${subscription.id}`);
    } catch (error) {
      console.error('[Webhook] Error handling trial will end:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export default new StripeWebhookHandler();
