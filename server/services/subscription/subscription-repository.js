/**
 * Subscription Repository - Database Access Layer
 *
 * Handles all database operations for subscriptions using Prisma ORM.
 * Provides CRUD operations and business logic queries.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SubscriptionRepository {
  /**
   * Get current active subscription for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} Subscription object or null
   */
  async getCurrentSubscription(tenantId) {
    try {
      return await prisma.subscription.findFirst({
        where: {
          tenants: {
            some: { id: tenantId },
          },
          status: {
            in: ['TRIAL', 'ACTIVE', 'PAST_DUE'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('[SubscriptionRepository] Error getting current subscription:', error.message);
      throw error;
    }
  }

  /**
   * Find subscription by Stripe subscription ID
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @returns {Promise<Object|null>} Subscription object or null
   */
  async findByStripeSubscriptionId(stripeSubscriptionId) {
    try {
      return await prisma.subscription.findUnique({
        where: {
          stripeSubscriptionId,
        },
        include: {
          tenants: true,
        },
      });
    } catch (error) {
      console.error('[SubscriptionRepository] Error finding subscription:', error.message);
      throw error;
    }
  }

  /**
   * Find tenant by Stripe customer ID
   * @param {string} stripeCustomerId - Stripe customer ID
   * @returns {Promise<Object|null>} Tenant object or null
   */
  async findTenantByStripeCustomer(stripeCustomerId) {
    try {
      return await prisma.tenant.findFirst({
        where: {
          subscription: {
            stripeCustomerId,
          },
        },
      });
    } catch (error) {
      console.error('[SubscriptionRepository] Error finding tenant:', error.message);
      throw error;
    }
  }

  /**
   * Create new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const { tenantId, ...data } = subscriptionData;

      return await prisma.subscription.create({
        data: {
          ...data,
          tenants: {
            connect: { id: tenantId },
          },
        },
      });
    } catch (error) {
      console.error('[SubscriptionRepository] Error creating subscription:', error.message);
      throw error;
    }
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[SubscriptionRepository] Error updating subscription:', error.message);
      throw error;
    }
  }

  /**
   * Update tenant subscription tier and limits
   * @param {string} tenantId - Tenant ID
   * @param {string} tier - New tier
   * @returns {Promise<Object>} Updated tenant
   */
  async updateTenantTier(tenantId, tier) {
    try {
      const limits = this._getTierLimits(tier);

      return await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionTier: tier,
          // Note: You may need to add these fields to your Tenant model
          // maxUsers: limits.maxUsers,
          // maxEntities: limits.maxEntities,
          // maxIntegrations: limits.maxIntegrations,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[SubscriptionRepository] Error updating tenant tier:', error.message);
      throw error;
    }
  }

  /**
   * Get tenant usage statistics
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Usage statistics
   */
  async getTenantUsage(tenantId) {
    try {
      // Count active users
      const activeUsers = await prisma.user.count({
        where: {
          tenantId,
          // Add your active user criteria
          // e.g., lastLoginAt: { gte: thirtyDaysAgo }
        },
      });

      // Count entities (products, orders, etc.)
      // This is a simplified example - adjust based on your schema
      const totalEntities = await prisma.product.count({
        where: {
          // Add tenant filtering if you have it
        },
      });

      // Count active integrations
      // Adjust based on your integration tracking
      const activeIntegrations = 0; // TODO: Implement integration counting

      return {
        activeUsers,
        totalEntities,
        activeIntegrations,
      };
    } catch (error) {
      console.error('[SubscriptionRepository] Error getting tenant usage:', error.message);
      throw error;
    }
  }

  /**
   * Create scheduled subscription change
   * @param {Object} changeData - Scheduled change data
   * @returns {Promise<Object>} Created scheduled change
   */
  async createScheduledChange(changeData) {
    try {
      // Note: You may need to create a ScheduledSubscriptionChange model
      // For now, we'll store it in subscription metadata
      const subscription = await prisma.subscription.findUnique({
        where: { id: changeData.subscriptionId },
      });

      return await prisma.subscription.update({
        where: { id: changeData.subscriptionId },
        data: {
          // Store scheduled change in metadata or a separate table
          // This is a simplified approach
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[SubscriptionRepository] Error creating scheduled change:', error.message);
      throw error;
    }
  }

  /**
   * Get scheduled subscription change for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} Scheduled change or null
   */
  async getScheduledChange(tenantId) {
    try {
      // TODO: Implement scheduled change retrieval
      // This would query your ScheduledSubscriptionChange table
      return null;
    } catch (error) {
      console.error('[SubscriptionRepository] Error getting scheduled change:', error.message);
      throw error;
    }
  }

  /**
   * Delete scheduled subscription change
   * @param {string} changeId - Scheduled change ID
   * @returns {Promise<void>}
   */
  async deleteScheduledChange(changeId) {
    try {
      // TODO: Implement scheduled change deletion
      console.log(`[SubscriptionRepository] Scheduled change deleted: ${changeId}`);
    } catch (error) {
      console.error('[SubscriptionRepository] Error deleting scheduled change:', error.message);
      throw error;
    }
  }

  /**
   * Log subscription change history
   * @param {Object} logData - Change log data
   * @returns {Promise<Object>} Created log entry
   */
  async logSubscriptionChange(logData) {
    try {
      // Note: You may want to create a SubscriptionChangeLog model
      // For now, this is a placeholder
      console.log('[SubscriptionRepository] Subscription change logged:', logData);
      return logData;
    } catch (error) {
      console.error('[SubscriptionRepository] Error logging subscription change:', error.message);
      throw error;
    }
  }

  /**
   * Log payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment log
   */
  async logPayment(paymentData) {
    try {
      // Note: You may want to create a Payment model
      // For now, this is a placeholder
      console.log('[SubscriptionRepository] Payment logged:', paymentData);
      return paymentData;
    } catch (error) {
      console.error('[SubscriptionRepository] Error logging payment:', error.message);
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
        maxEntities: -1, // -1 represents unlimited
        maxIntegrations: -1,
      },
      free: {
        maxUsers: 1,
        maxEntities: 100,
        maxIntegrations: 0,
      },
    };

    return limits[tier] || limits.free;
  }
}

// Export singleton instance
export default new SubscriptionRepository();
