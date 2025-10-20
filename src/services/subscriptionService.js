/**
 * Subscription Service
 *
 * API wrapper for subscription management (upgrades, downgrades, cycle switching).
 * Handles tier changes, proration calculations, and billing cycle updates.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-009 (Settings/Billing API Integration)
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class SubscriptionService {
  /**
   * Preview upgrade cost with proration
   * @param {string} newTier - Target tier (starter|professional|enterprise)
   * @param {string} newCycle - Target cycle (monthly|annual)
   * @returns {Promise<{prorationAmount: number, nextBillingDate: string, totalCost: number}>}
   */
  async previewUpgrade(newTier, newCycle) {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscription/preview-upgrade`, {
        newTier,
        newCycle,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to preview upgrade',
      };
    }
  }

  /**
   * Process immediate upgrade with Stripe payment
   * @param {string} newTier - Target tier
   * @param {string} newCycle - Target billing cycle
   * @returns {Promise<{success: boolean, subscription: object}>}
   */
  async processUpgrade(newTier, newCycle) {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscription/upgrade`, {
        newTier,
        newCycle,
      });
      return {
        success: true,
        subscription: response.data.subscription,
        message: response.data.message || 'Upgrade successful',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process upgrade',
      };
    }
  }

  /**
   * Check downgrade impact (features lost, data affected)
   * @param {string} newTier - Target tier
   * @returns {Promise<{featuresLost: string[], dataImpact: object}>}
   */
  async checkDowngradeImpact(newTier) {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/downgrade-impact`, {
        params: { newTier },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check downgrade impact',
      };
    }
  }

  /**
   * Schedule end-of-cycle downgrade
   * @param {string} newTier - Target tier
   * @returns {Promise<{effectiveDate: string, scheduledDowngrade: object}>}
   */
  async scheduleDowngrade(newTier) {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscription/downgrade`, {
        newTier,
      });
      return {
        success: true,
        effectiveDate: response.data.effectiveDate,
        scheduledDowngrade: response.data.scheduledDowngrade,
        message: response.data.message || 'Downgrade scheduled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to schedule downgrade',
      };
    }
  }

  /**
   * Cancel scheduled downgrade
   * @returns {Promise<{success: boolean}>}
   */
  async cancelDowngrade() {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscription/cancel-downgrade`);
      return {
        success: true,
        message: response.data.message || 'Downgrade cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel downgrade',
      };
    }
  }

  /**
   * Switch billing cycle (monthly <-> annual)
   * @param {string} newCycle - Target cycle (monthly|annual)
   * @returns {Promise<{effectiveDate: string, discount?: number}>}
   */
  async switchCycle(newCycle) {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscription/change-cycle`, {
        newCycle,
      });
      return {
        success: true,
        effectiveDate: response.data.effectiveDate,
        discount: response.data.discount,
        message: response.data.message || 'Billing cycle updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to switch billing cycle',
      };
    }
  }

  /**
   * Get current subscription status
   * @returns {Promise<{tier: string, cycle: string, status: string}>}
   */
  async getStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/status`);
      return {
        success: true,
        subscription: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch subscription status',
      };
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
