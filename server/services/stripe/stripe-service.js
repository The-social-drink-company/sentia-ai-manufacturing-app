/**
 * Stripe Service - Core Stripe SDK Wrapper
 *
 * Handles all Stripe API interactions for subscription management.
 * Provides methods for customers, subscriptions, and pricing operations.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY not configured - using mock mode');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: false,
}) : null;

/**
 * Price IDs for subscription tiers
 * Configure these in Stripe Dashboard → Products → Pricing
 */
const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || 'price_starter_annual',
  },
  professional: {
    monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_professional_monthly',
    annual: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || 'price_professional_annual',
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
    annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || 'price_enterprise_annual',
  },
};

class StripeService {
  constructor() {
    this.stripe = stripe;
    this.priceIds = PRICE_IDS;
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured() {
    return !!this.stripe;
  }

  /**
   * Create a new Stripe customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer({ email, name, metadata = {} }) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          ...metadata,
          createdBy: 'capliquify-platform',
        },
      });

      console.log(`[Stripe] Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      console.error('[Stripe] Error creating customer:', error.message);
      throw error;
    }
  }

  /**
   * Get customer by ID
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Stripe customer object
   */
  async getCustomer(customerId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error(`[Stripe] Error retrieving customer ${customerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a new subscription
   * @param {Object} params - Subscription parameters
   * @returns {Promise<Object>} Stripe subscription object
   */
  async createSubscription({ customerId, tier, cycle, trialDays = 0, metadata = {} }) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const priceId = this.priceIds[tier]?.[cycle];
    if (!priceId) {
      throw new Error(`Invalid tier/cycle combination: ${tier}/${cycle}`);
    }

    try {
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          tier,
          cycle,
          ...metadata,
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      console.log(`[Stripe] Subscription created: ${subscription.id} (${tier}/${cycle})`);
      return subscription;
    } catch (error) {
      console.error('[Stripe] Error creating subscription:', error.message);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Stripe subscription object
   */
  async getSubscription(subscriptionId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error(`[Stripe] Error retrieving subscription ${subscriptionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Preview subscription upgrade with proration
   * @param {Object} params - Upgrade parameters
   * @returns {Promise<Object>} Proration preview
   */
  async previewUpgrade({ subscriptionId, newTier, newCycle }) {
    if (!this.stripe) {
      // Return mock data if Stripe not configured
      return this._mockProrationPreview(newTier, newCycle);
    }

    const newPriceId = this.priceIds[newTier]?.[newCycle];
    if (!newPriceId) {
      throw new Error(`Invalid tier/cycle combination: ${newTier}/${newCycle}`);
    }

    try {
      const subscription = await this.getSubscription(subscriptionId);
      const subscriptionItemId = subscription.items.data[0].id;

      // Get upcoming invoice with proration
      const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
        customer: subscription.customer,
        subscription: subscriptionId,
        subscription_items: [{
          id: subscriptionItemId,
          price: newPriceId,
        }],
        subscription_proration_behavior: 'create_prorations',
      });

      return {
        amountDue: upcomingInvoice.amount_due,
        credit: upcomingInvoice.starting_balance * -1, // Convert to positive
        total: upcomingInvoice.total,
        nextBillingDate: new Date(subscription.current_period_end * 1000),
        lines: upcomingInvoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount,
          proration: line.proration,
        })),
      };
    } catch (error) {
      console.error('[Stripe] Error previewing upgrade:', error.message);
      throw error;
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   * @param {Object} params - Update parameters
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription({ subscriptionId, newTier, newCycle, prorationBehavior = 'create_prorations' }) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const newPriceId = this.priceIds[newTier]?.[newCycle];
    if (!newPriceId) {
      throw new Error(`Invalid tier/cycle combination: ${newTier}/${newCycle}`);
    }

    try {
      const subscription = await this.getSubscription(subscriptionId);
      const subscriptionItemId = subscription.items.data[0].id;

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
        metadata: {
          ...subscription.metadata,
          tier: newTier,
          cycle: newCycle,
          updatedAt: new Date().toISOString(),
        },
      });

      console.log(`[Stripe] Subscription updated: ${subscriptionId} → ${newTier}/${newCycle}`);
      return updatedSubscription;
    } catch (error) {
      console.error('[Stripe] Error updating subscription:', error.message);
      throw error;
    }
  }

  /**
   * Schedule subscription downgrade at period end
   * @param {Object} params - Downgrade parameters
   * @returns {Promise<Object>} Updated subscription with scheduled change
   */
  async scheduleDowngrade({ subscriptionId, newTier, newCycle }) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const newPriceId = this.priceIds[newTier]?.[newCycle];
    if (!newPriceId) {
      throw new Error(`Invalid tier/cycle combination: ${newTier}/${newCycle}`);
    }

    try {
      const subscription = await this.getSubscription(subscriptionId);

      // Create schedule for downgrade at period end
      const schedule = await this.stripe.subscriptionSchedules.create({
        from_subscription: subscriptionId,
      });

      await this.stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          // Current phase - keep existing tier until period end
          {
            items: subscription.items.data.map(item => ({
              price: item.price.id,
              quantity: item.quantity,
            })),
            start_date: subscription.current_period_start,
            end_date: subscription.current_period_end,
          },
          // New phase - downgrade tier starting next period
          {
            items: [{ price: newPriceId }],
            start_date: subscription.current_period_end,
          },
        ],
        metadata: {
          scheduledDowngrade: true,
          targetTier: newTier,
          targetCycle: newCycle,
        },
      });

      console.log(`[Stripe] Downgrade scheduled: ${subscriptionId} → ${newTier}/${newCycle} at period end`);
      return schedule;
    } catch (error) {
      console.error('[Stripe] Error scheduling downgrade:', error.message);
      throw error;
    }
  }

  /**
   * Cancel subscription downgrade schedule
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Released subscription
   */
  async cancelScheduledDowngrade(subscriptionId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // Find schedule for this subscription
      const schedules = await this.stripe.subscriptionSchedules.list({
        subscription: subscriptionId,
        limit: 1,
      });

      if (schedules.data.length === 0) {
        throw new Error('No scheduled downgrade found');
      }

      const schedule = schedules.data[0];

      // Release the schedule (removes downgrade)
      const released = await this.stripe.subscriptionSchedules.release(schedule.id);

      console.log(`[Stripe] Downgrade cancelled: ${subscriptionId}`);
      return released;
    } catch (error) {
      console.error('[Stripe] Error cancelling downgrade:', error.message);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {boolean} immediate - Cancel immediately or at period end
   * @returns {Promise<Object>} Cancelled subscription
   */
  async cancelSubscription(subscriptionId, immediate = false) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      if (immediate) {
        const cancelled = await this.stripe.subscriptions.cancel(subscriptionId);
        console.log(`[Stripe] Subscription cancelled immediately: ${subscriptionId}`);
        return cancelled;
      } else {
        const updated = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        console.log(`[Stripe] Subscription set to cancel at period end: ${subscriptionId}`);
        return updated;
      }
    } catch (error) {
      console.error('[Stripe] Error cancelling subscription:', error.message);
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Reactivated subscription
   */
  async reactivateSubscription(subscriptionId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const reactivated = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      console.log(`[Stripe] Subscription reactivated: ${subscriptionId}`);
      return reactivated;
    } catch (error) {
      console.error('[Stripe] Error reactivating subscription:', error.message);
      throw error;
    }
  }

  /**
   * Get price information
   * @param {string} tier - Subscription tier
   * @param {string} cycle - Billing cycle
   * @returns {string} Stripe price ID
   */
  getPriceId(tier, cycle) {
    return this.priceIds[tier]?.[cycle];
  }

  /**
   * Mock proration preview (when Stripe not configured)
   * @private
   */
  _mockProrationPreview(newTier, newCycle) {
    const prices = {
      starter: { monthly: 149, annual: 1490 },
      professional: { monthly: 295, annual: 2950 },
      enterprise: { monthly: 595, annual: 5950 },
    };

    const newPrice = prices[newTier]?.[newCycle] || 0;
    const proratedCredit = Math.floor(newPrice * 0.3); // Mock 30% credit

    return {
      amountDue: (newPrice - proratedCredit) * 100,
      credit: proratedCredit * 100,
      total: newPrice * 100,
      nextBillingDate: new Date(Date.now() + (newCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
      lines: [
        {
          description: `${newTier} - ${newCycle}`,
          amount: newPrice * 100,
          proration: false,
        },
        {
          description: 'Prorated credit from current plan',
          amount: -proratedCredit * 100,
          proration: true,
        },
      ],
    };
  }
}

// Export singleton instance
export default new StripeService();
