/**
 * Subscription Service Unit Tests
 *
 * Tests for subscription management service (upgrade, downgrade, cycle switching).
 * Critical P0 tests - revenue-generating feature with 0% coverage.
 *
 * Test Coverage:
 * - Preview upgrade (proration calculations)
 * - Process upgrade (Stripe integration)
 * - Check downgrade impact (feature loss analysis)
 * - Schedule downgrade (end-of-cycle)
 * - Cancel downgrade
 * - Switch billing cycle (monthly <-> annual)
 * - Get subscription status
 * - Error handling for all operations
 *
 * @epic EPIC-004 (Test Coverage Enhancement)
 * @story BMAD-TEST-001 (Unit Tests for API Services)
 * @priority P0 (Critical - Revenue Feature)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionService } from '../../../src/services/subscriptionService';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('previewUpgrade', () => {
    it('should return upgrade preview with proration', async () => {
      const mockResponse = {
        data: {
          prorationAmount: 50,
          nextBillingDate: '2025-12-01',
          totalCost: 295,
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.previewUpgrade('professional', 'monthly');

      expect(result.success).toBe(true);
      expect(result.data.prorationAmount).toBe(50);
      expect(result.data.totalCost).toBe(295);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/subscription/preview-upgrade'),
        expect.objectContaining({
          newTier: 'professional',
          newCycle: 'monthly',
        })
      );
    });

    it('should handle preview error gracefully', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Invalid tier' } },
      });

      const result = await subscriptionService.previewUpgrade('invalid', 'monthly');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid tier');
    });

    it('should calculate proration for partial month', async () => {
      const mockResponse = {
        data: {
          prorationAmount: 123.50,
          nextBillingDate: '2025-11-20',
          totalCost: 295,
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.previewUpgrade('professional', 'monthly');

      expect(result.success).toBe(true);
      expect(result.data.prorationAmount).toBeCloseTo(123.50, 2);
    });
  });

  describe('processUpgrade', () => {
    it('should successfully upgrade subscription', async () => {
      const mockResponse = {
        data: {
          subscription: {
            tier: 'professional',
            cycle: 'monthly',
            status: 'active',
          },
          message: 'Upgrade successful',
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.processUpgrade('professional', 'monthly');

      expect(result.success).toBe(true);
      expect(result.subscription.tier).toBe('professional');
      expect(result.message).toBe('Upgrade successful');
    });

    it('should handle payment failure', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Payment method declined' } },
      });

      const result = await subscriptionService.processUpgrade('professional', 'monthly');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment method declined');
    });

    it('should upgrade from starter to enterprise', async () => {
      const mockResponse = {
        data: {
          subscription: { tier: 'enterprise', cycle: 'annual', status: 'active' },
          message: 'Upgraded to Enterprise',
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.processUpgrade('enterprise', 'annual');

      expect(result.success).toBe(true);
      expect(result.subscription.tier).toBe('enterprise');
    });
  });

  describe('checkDowngradeImpact', () => {
    it('should return features that will be lost', async () => {
      const mockResponse = {
        data: {
          featuresLost: ['advancedAnalytics', 'multiCurrency', 'prioritySupport'],
          dataImpact: {
            users: { current: 18, limit: 5, exceeds: 13 },
          },
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await subscriptionService.checkDowngradeImpact('starter');

      expect(result.success).toBe(true);
      expect(result.data.featuresLost).toHaveLength(3);
      expect(result.data.featuresLost).toContain('advancedAnalytics');
      expect(result.data.dataImpact.users.exceeds).toBe(13);
    });

    it('should handle downgrade with no impact', async () => {
      const mockResponse = {
        data: {
          featuresLost: [],
          dataImpact: {},
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await subscriptionService.checkDowngradeImpact('professional');

      expect(result.success).toBe(true);
      expect(result.data.featuresLost).toHaveLength(0);
    });

    it('should handle API error', async () => {
      axios.get.mockRejectedValue({
        response: { data: { message: 'Tier not found' } },
      });

      const result = await subscriptionService.checkDowngradeImpact('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tier not found');
    });
  });

  describe('scheduleDowngrade', () => {
    it('should schedule downgrade for end of billing cycle', async () => {
      const mockResponse = {
        data: {
          effectiveDate: '2025-12-20',
          scheduledDowngrade: {
            targetTier: 'starter',
            scheduledAt: '2025-11-20',
          },
          message: 'Downgrade scheduled successfully',
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.scheduleDowngrade('starter');

      expect(result.success).toBe(true);
      expect(result.effectiveDate).toBe('2025-12-20');
      expect(result.message).toBe('Downgrade scheduled successfully');
    });

    it('should handle scheduling error', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Cannot downgrade with pending invoices' } },
      });

      const result = await subscriptionService.scheduleDowngrade('starter');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot downgrade with pending invoices');
    });
  });

  describe('cancelDowngrade', () => {
    it('should cancel scheduled downgrade', async () => {
      const mockResponse = {
        data: { message: 'Downgrade cancelled successfully' },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.cancelDowngrade();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Downgrade cancelled successfully');
    });

    it('should handle no scheduled downgrade', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'No scheduled downgrade found' } },
      });

      const result = await subscriptionService.cancelDowngrade();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No scheduled downgrade found');
    });
  });

  describe('switchCycle', () => {
    it('should switch from monthly to annual with discount', async () => {
      const mockResponse = {
        data: {
          effectiveDate: '2025-12-01',
          discount: 17,
          message: 'Billing cycle updated successfully',
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.switchCycle('annual');

      expect(result.success).toBe(true);
      expect(result.discount).toBe(17);
      expect(result.message).toBe('Billing cycle updated successfully');
    });

    it('should switch from annual to monthly', async () => {
      const mockResponse = {
        data: {
          effectiveDate: '2025-11-01',
          discount: 0,
          message: 'Billing cycle updated successfully',
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await subscriptionService.switchCycle('monthly');

      expect(result.success).toBe(true);
      expect(result.discount).toBe(0);
    });

    it('should handle cycle switch error', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Cannot switch during trial period' } },
      });

      const result = await subscriptionService.switchCycle('annual');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot switch during trial period');
    });
  });

  describe('getStatus', () => {
    it('should return current subscription status', async () => {
      const mockResponse = {
        data: {
          tier: 'professional',
          cycle: 'monthly',
          status: 'active',
          currentPeriodEnd: '2025-12-01',
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await subscriptionService.getStatus();

      expect(result.success).toBe(true);
      expect(result.subscription.tier).toBe('professional');
      expect(result.subscription.status).toBe('active');
    });

    it('should handle trial subscription', async () => {
      const mockResponse = {
        data: {
          tier: 'starter',
          cycle: 'monthly',
          status: 'trialing',
          trialEnd: '2025-11-30',
        },
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await subscriptionService.getStatus();

      expect(result.success).toBe(true);
      expect(result.subscription.status).toBe('trialing');
      expect(result.subscription.trialEnd).toBe('2025-11-30');
    });

    it('should handle API error', async () => {
      axios.get.mockRejectedValue({
        response: { data: { message: 'Subscription not found' } },
      });

      const result = await subscriptionService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout', async () => {
      axios.post.mockRejectedValue(new Error('Network timeout'));

      const result = await subscriptionService.processUpgrade('professional', 'monthly');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process upgrade');
    });

    it('should handle missing response data', async () => {
      axios.post.mockRejectedValue({ response: {} });

      const result = await subscriptionService.processUpgrade('professional', 'monthly');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to process upgrade');
    });

    it('should handle server error (500)', async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      const result = await subscriptionService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });
  });
});
