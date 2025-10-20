/**
 * Subscription Manager - Business Logic Layer
 *
 * Orchestrates subscription operations between Stripe, database, and email services.
 * Handles the complete subscription lifecycle with proper error handling and rollback.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

import stripeService from './stripe-service.js';

class SubscriptionManager {
  constructor() {
    this.stripeService = stripeService;
    this.subscriptionRepository = null; // Will be injected
    this.emailService = null; // Will be injected
  }

  /**
   * Set dependencies (injected after initialization to avoid circular deps)
   */
  setDependencies({ subscriptionRepository, emailService }) {
    this.subscriptionRepository = subscriptionRepository;
    this.emailService = emailService;
  }

  /**
   * Preview upgrade with proration calculation
   * @param {Object} params - Preview parameters
   * @returns {Promise<Object>} Proration preview
   */
  async previewUpgrade({ tenantId, newTier, newCycle }) {
    try {
      // Get current subscription from database
      const currentSubscription = await this.subscriptionRepository?.getCurrentSubscription(tenantId);

      if (!currentSubscription || !currentSubscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // Get proration preview from Stripe
      const preview = await this.stripeService.previewUpgrade({
        subscriptionId: currentSubscription.stripeSubscriptionId,
        newTier,
        newCycle,
      });

      return {
        success: true,
        ...preview,
        currentTier: currentSubscription.tier,
        currentCycle: currentSubscription.billingCycle,
      };
    } catch (error) {
      console.error('[SubscriptionManager] Error previewing upgrade:', error.message);
      throw error;
    }
  }

  /**
   * Process subscription upgrade
   * @param {Object} params - Upgrade parameters
   * @returns {Promise<Object>} Updated subscription
   */
  async processUpgrade({ tenantId, newTier, newCycle, userId }) {
    let rollbackData = null;

    try {
      // 1. Get current subscription
      const currentSubscription = await this.subscriptionRepository?.getCurrentSubscription(tenantId);

      if (!currentSubscription || !currentSubscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      rollbackData = { ...currentSubscription };

      // 2. Update subscription in Stripe
      const updatedStripeSubscription = await this.stripeService.updateSubscription({
        subscriptionId: currentSubscription.stripeSubscriptionId,
        newTier,
        newCycle,
        prorationBehavior: 'create_prorations', // Immediate upgrade with proration
      });

      // 3. Update subscription in database
      const updatedSubscription = await this.subscriptionRepository?.updateSubscription(
        currentSubscription.id,
        {
          tier: newTier,
          billingCycle: newCycle.toUpperCase(),
          status: updatedStripeSubscription.status.toUpperCase(),
          currentPeriodEnd: new Date(updatedStripeSubscription.current_period_end * 1000),
          stripePriceId: updatedStripeSubscription.items.data[0].price.id,
        }
      );

      // 4. Update tenant tier and limits
      await this.subscriptionRepository?.updateTenantTier(tenantId, newTier);

      // 5. Send confirmation email (non-blocking)
      this.emailService?.sendUpgradeConfirmation({
        tenantId,
        newTier,
        newCycle,
        effectiveDate: new Date(),
      }).catch(error => {
        console.error('[SubscriptionManager] Failed to send upgrade email:', error.message);
      });

      // 6. Log subscription change
      await this.subscriptionRepository?.logSubscriptionChange({
        tenantId,
        subscriptionId: updatedSubscription.id,
        action: 'UPGRADE',
        oldTier: currentSubscription.tier,
        newTier,
        oldCycle: currentSubscription.billingCycle,
        newCycle: newCycle.toUpperCase(),
        userId,
      });

      console.log(`[SubscriptionManager] Upgrade processed: ${tenantId} → ${newTier}/${newCycle}`);

      return {
        success: true,
        subscription: updatedSubscription,
        message: `Successfully upgraded to ${newTier}`,
      };
    } catch (error) {
      console.error('[SubscriptionManager] Error processing upgrade:', error.message);

      // Attempt rollback
      if (rollbackData) {
        console.log('[SubscriptionManager] Attempting rollback...');
        try {
          await this.stripeService.updateSubscription({
            subscriptionId: rollbackData.stripeSubscriptionId,
            newTier: rollbackData.tier,
            newCycle: rollbackData.billingCycle.toLowerCase(),
            prorationBehavior: 'none',
          });
        } catch (rollbackError) {
          console.error('[SubscriptionManager] Rollback failed:', rollbackError.message);
        }
      }

      throw error;
    }
  }

  /**
   * Check downgrade impact
   * @param {Object} params - Downgrade parameters
   * @returns {Promise<Object>} Impact analysis
   */
  async checkDowngradeImpact({ tenantId, newTier }) {
    try {
      // Get current usage from database
      const usage = await this.subscriptionRepository?.getTenantUsage(tenantId);

      // Get limits for new tier
      const limits = this._getTierLimits(newTier);

      const impact = {
        hasImpact: false,
        usersOverLimit: 0,
        entitiesOverLimit: 0,
        integrationsOverLimit: 0,
        featuresLost: [],
      };

      // Check user limits
      if (usage.activeUsers > limits.maxUsers) {
        impact.hasImpact = true;
        impact.usersOverLimit = usage.activeUsers - limits.maxUsers;
      }

      // Check entity limits
      if (limits.maxEntities !== 'unlimited' && usage.totalEntities > limits.maxEntities) {
        impact.hasImpact = true;
        impact.entitiesOverLimit = usage.totalEntities - limits.maxEntities;
      }

      // Check integration limits
      if (limits.maxIntegrations !== 'unlimited' && usage.activeIntegrations > limits.maxIntegrations) {
        impact.hasImpact = true;
        impact.integrationsOverLimit = usage.activeIntegrations - limits.maxIntegrations;
      }

      // Analyze feature loss
      const currentTier = await this.subscriptionRepository?.getCurrentSubscription(tenantId);
      const currentFeatures = this._getTierFeatures(currentTier.tier);
      const newFeatures = this._getTierFeatures(newTier);

      Object.keys(currentFeatures).forEach(feature => {
        if (currentFeatures[feature] && !newFeatures[feature]) {
          impact.featuresLost.push(feature);
        }
      });

      return impact;
    } catch (error) {
      console.error('[SubscriptionManager] Error checking downgrade impact:', error.message);
      throw error;
    }
  }

  /**
   * Schedule subscription downgrade at period end
   * @param {Object} params - Downgrade parameters
   * @returns {Promise<Object>} Scheduled downgrade info
   */
  async scheduleDowngrade({ tenantId, newTier, userId }) {
    try {
      // 1. Get current subscription
      const currentSubscription = await this.subscriptionRepository?.getCurrentSubscription(tenantId);

      if (!currentSubscription || !currentSubscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // 2. Get current billing cycle (keep same cycle for downgrade)
      const newCycle = currentSubscription.billingCycle.toLowerCase();

      // 3. Schedule downgrade in Stripe
      const schedule = await this.stripeService.scheduleDowngrade({
        subscriptionId: currentSubscription.stripeSubscriptionId,
        newTier,
        newCycle,
      });

      // 4. Store scheduled downgrade in database
      await this.subscriptionRepository?.createScheduledChange({
        tenantId,
        subscriptionId: currentSubscription.id,
        changeType: 'DOWNGRADE',
        targetTier: newTier,
        targetCycle: currentSubscription.billingCycle,
        effectiveDate: new Date(currentSubscription.currentPeriodEnd),
        stripeScheduleId: schedule.id,
        userId,
      });

      // 5. Send confirmation email (non-blocking)
      this.emailService?.sendDowngradeScheduled({
        tenantId,
        currentTier: currentSubscription.tier,
        newTier,
        effectiveDate: new Date(currentSubscription.currentPeriodEnd),
      }).catch(error => {
        console.error('[SubscriptionManager] Failed to send downgrade email:', error.message);
      });

      console.log(`[SubscriptionManager] Downgrade scheduled: ${tenantId} → ${newTier} at period end`);

      return {
        success: true,
        message: `Downgrade to ${newTier} scheduled`,
        effectiveDate: new Date(currentSubscription.currentPeriodEnd),
        canCancel: true,
      };
    } catch (error) {
      console.error('[SubscriptionManager] Error scheduling downgrade:', error.message);
      throw error;
    }
  }

  /**
   * Cancel scheduled downgrade
   * @param {Object} params - Cancel parameters
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelScheduledDowngrade({ tenantId, userId }) {
    try {
      // 1. Get scheduled change from database
      const scheduledChange = await this.subscriptionRepository?.getScheduledChange(tenantId);

      if (!scheduledChange) {
        throw new Error('No scheduled downgrade found');
      }

      // 2. Cancel schedule in Stripe
      const subscription = await this.subscriptionRepository?.getCurrentSubscription(tenantId);
      await this.stripeService.cancelScheduledDowngrade(subscription.stripeSubscriptionId);

      // 3. Delete scheduled change from database
      await this.subscriptionRepository?.deleteScheduledChange(scheduledChange.id);

      // 4. Send confirmation email (non-blocking)
      this.emailService?.sendDowngradeCancelled({
        tenantId,
      }).catch(error => {
        console.error('[SubscriptionManager] Failed to send cancellation email:', error.message);
      });

      console.log(`[SubscriptionManager] Scheduled downgrade cancelled: ${tenantId}`);

      return {
        success: true,
        message: 'Scheduled downgrade cancelled',
      };
    } catch (error) {
      console.error('[SubscriptionManager] Error cancelling downgrade:', error.message);
      throw error;
    }
  }

  /**
   * Switch billing cycle (monthly <-> annual)
   * @param {Object} params - Cycle switch parameters
   * @returns {Promise<Object>} Updated subscription
   */
  async switchBillingCycle({ tenantId, newCycle, userId }) {
    try {
      // 1. Get current subscription
      const currentSubscription = await this.subscriptionRepository?.getCurrentSubscription(tenantId);

      if (!currentSubscription || !currentSubscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // 2. Update subscription in Stripe (immediate change with proration)
      const updatedStripeSubscription = await this.stripeService.updateSubscription({
        subscriptionId: currentSubscription.stripeSubscriptionId,
        newTier: currentSubscription.tier,
        newCycle,
        prorationBehavior: 'create_prorations',
      });

      // 3. Update subscription in database
      const updatedSubscription = await this.subscriptionRepository?.updateSubscription(
        currentSubscription.id,
        {
          billingCycle: newCycle.toUpperCase(),
          stripePriceId: updatedStripeSubscription.items.data[0].price.id,
          currentPeriodEnd: new Date(updatedStripeSubscription.current_period_end * 1000),
        }
      );

      // 4. Send confirmation email (non-blocking)
      this.emailService?.sendCycleSwitchConfirmation({
        tenantId,
        oldCycle: currentSubscription.billingCycle,
        newCycle: newCycle.toUpperCase(),
        effectiveDate: new Date(),
      }).catch(error => {
        console.error('[SubscriptionManager] Failed to send cycle switch email:', error.message);
      });

      // 5. Log subscription change
      await this.subscriptionRepository?.logSubscriptionChange({
        tenantId,
        subscriptionId: updatedSubscription.id,
        action: 'CYCLE_CHANGE',
        oldCycle: currentSubscription.billingCycle,
        newCycle: newCycle.toUpperCase(),
        userId,
      });

      console.log(`[SubscriptionManager] Billing cycle switched: ${tenantId} → ${newCycle}`);

      return {
        success: true,
        subscription: updatedSubscription,
        message: `Billing cycle switched to ${newCycle}`,
      };
    } catch (error) {
      console.error('[SubscriptionManager] Error switching billing cycle:', error.message);
      throw error;
    }
  }

  /**
   * Get tier limits
   * @private
   */
  _getTierLimits(tier) {
    const limits = {
      starter: {
        maxUsers: 5,
        maxEntities: 500,
        maxIntegrations: 3,
      },
      professional: {
        maxUsers: 25,
        maxEntities: 5000,
        maxIntegrations: 10,
      },
      enterprise: {
        maxUsers: 100,
        maxEntities: 'unlimited',
        maxIntegrations: 'unlimited',
      },
    };

    return limits[tier] || limits.starter;
  }

  /**
   * Get tier features
   * @private
   */
  _getTierFeatures(tier) {
    const features = {
      starter: {
        basicDashboards: true,
        inventoryManagement: true,
        orderTracking: true,
        basicReports: true,
        aiForcasting: false,
        whatIfAnalysis: false,
        advancedAnalytics: false,
      },
      professional: {
        basicDashboards: true,
        inventoryManagement: true,
        orderTracking: true,
        basicReports: true,
        aiForcasting: true,
        whatIfAnalysis: true,
        advancedAnalytics: true,
        prioritySupport: true,
      },
      enterprise: {
        basicDashboards: true,
        inventoryManagement: true,
        orderTracking: true,
        basicReports: true,
        aiForcasting: true,
        whatIfAnalysis: true,
        advancedAnalytics: true,
        prioritySupport: true,
        dedicatedSupport: true,
        whiteLabel: true,
        customIntegrations: true,
        advancedSecurity: true,
      },
    };

    return features[tier] || features.starter;
  }
}

// Export singleton instance
export default new SubscriptionManager();
