/**
 * useFeatureAccess Hook
 *
 * Programmatic hook for checking feature access and usage limits.
 * Provides a clean API for feature gating logic.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-006 (Feature Access Hook)
 */

import { useMemo } from 'react';
import { useTenant } from './useTenant';
import {
  canAccessFeature,
  isWithinLimit,
  getRequiredTier,
  getUpgradeMessage,
  getNextTier,
  getTierConfig,
  type TierFeatures,
  type SubscriptionTier,
} from '../config/pricing.config';

interface FeatureAccessResult {
  /**
   * Whether the user has access to the feature
   */
  hasAccess: boolean;

  /**
   * Current subscription tier
   */
  currentTier: SubscriptionTier | null;

  /**
   * Tier required to access the feature
   */
  requiredTier: SubscriptionTier | null;

  /**
   * User-friendly upgrade message
   */
  upgradeMessage: string;

  /**
   * Next tier the user can upgrade to
   */
  nextTier: {
    id: SubscriptionTier;
    name: string;
    monthlyPrice: number;
  } | null;

  /**
   * Whether the user is on the highest tier
   */
  isMaxTier: boolean;
}

interface LimitCheckResult {
  /**
   * Whether current usage is within the limit
   */
  isWithinLimit: boolean;

  /**
   * Current usage amount
   */
  currentUsage: number;

  /**
   * Maximum allowed by tier
   */
  limit: number | 'unlimited';

  /**
   * Usage percentage (0-100, or null for unlimited)
   */
  usagePercentage: number | null;

  /**
   * Whether usage is approaching limit (>= 80%)
   */
  isApproachingLimit: boolean;

  /**
   * Whether usage has exceeded limit
   */
  isAtLimit: boolean;
}

/**
 * Hook for checking feature access
 */
export function useFeatureAccess(feature: keyof TierFeatures): FeatureAccessResult {
  const { tenant } = useTenant();

  return useMemo(() => {
    if (!tenant) {
      return {
        hasAccess: false,
        currentTier: null,
        requiredTier: getRequiredTier(feature),
        upgradeMessage: 'Please sign in to access this feature',
        nextTier: null,
        isMaxTier: false,
      };
    }

    const currentTier = tenant.subscriptionTier.toLowerCase() as SubscriptionTier;
    const hasAccess = canAccessFeature(currentTier, feature);
    const requiredTier = getRequiredTier(feature);
    const upgradeMessage = getUpgradeMessage(currentTier, feature);
    const nextTierData = getNextTier(currentTier);

    return {
      hasAccess,
      currentTier,
      requiredTier,
      upgradeMessage,
      nextTier: nextTierData
        ? {
            id: nextTierData.id,
            name: nextTierData.name,
            monthlyPrice: nextTierData.monthlyPrice,
          }
        : null,
      isMaxTier: !nextTierData,
    };
  }, [tenant, feature]);
}

/**
 * Hook for checking usage limits
 */
export function useUsageLimit(
  limitType: keyof TierFeatures,
  currentUsage: number
): LimitCheckResult {
  const { tenant } = useTenant();

  return useMemo(() => {
    if (!tenant) {
      return {
        isWithinLimit: false,
        currentUsage,
        limit: 0,
        usagePercentage: null,
        isApproachingLimit: false,
        isAtLimit: true,
      };
    }

    const tierConfig = getTierConfig(tenant.subscriptionTier);

    if (!tierConfig) {
      return {
        isWithinLimit: false,
        currentUsage,
        limit: 0,
        usagePercentage: null,
        isApproachingLimit: false,
        isAtLimit: true,
      };
    }

    const limit = tierConfig.features[limitType];
    const withinLimit = isWithinLimit(tenant.subscriptionTier, limitType, currentUsage);

    // Handle unlimited limits
    if (limit === 'unlimited') {
      return {
        isWithinLimit: true,
        currentUsage,
        limit: 'unlimited',
        usagePercentage: null,
        isApproachingLimit: false,
        isAtLimit: false,
      };
    }

    // Handle boolean features (not applicable for limits)
    if (typeof limit === 'boolean') {
      return {
        isWithinLimit: limit,
        currentUsage,
        limit: limit ? 1 : 0,
        usagePercentage: limit ? 0 : 100,
        isApproachingLimit: false,
        isAtLimit: !limit,
      };
    }

    // Calculate usage percentage
    const usagePercentage = Math.min((currentUsage / limit) * 100, 100);
    const isApproachingLimit = usagePercentage >= 80 && usagePercentage < 100;
    const isAtLimit = usagePercentage >= 100;

    return {
      isWithinLimit: withinLimit,
      currentUsage,
      limit,
      usagePercentage,
      isApproachingLimit,
      isAtLimit,
    };
  }, [tenant, limitType, currentUsage]);
}

/**
 * Hook for checking multiple features at once
 */
export function useMultipleFeatureAccess(
  features: Array<keyof TierFeatures>
): Record<string, FeatureAccessResult> {
  const { tenant } = useTenant();

  return useMemo(() => {
    const results: Record<string, FeatureAccessResult> = {};

    for (const feature of features) {
      if (!tenant) {
        results[feature] = {
          hasAccess: false,
          currentTier: null,
          requiredTier: getRequiredTier(feature),
          upgradeMessage: 'Please sign in to access this feature',
          nextTier: null,
          isMaxTier: false,
        };
        continue;
      }

      const currentTier = tenant.subscriptionTier.toLowerCase() as SubscriptionTier;
      const hasAccess = canAccessFeature(currentTier, feature);
      const requiredTier = getRequiredTier(feature);
      const upgradeMessage = getUpgradeMessage(currentTier, feature);
      const nextTierData = getNextTier(currentTier);

      results[feature] = {
        hasAccess,
        currentTier,
        requiredTier,
        upgradeMessage,
        nextTier: nextTierData
          ? {
              id: nextTierData.id,
              name: nextTierData.name,
              monthlyPrice: nextTierData.monthlyPrice,
            }
          : null,
        isMaxTier: !nextTierData,
      };
    }

    return results;
  }, [tenant, features]);
}

/**
 * Hook for getting tier information
 */
export function useTierInfo() {
  const { tenant } = useTenant();

  return useMemo(() => {
    if (!tenant) {
      return {
        tier: null,
        name: 'Free',
        monthlyPrice: 0,
        annualPrice: 0,
        features: {},
      };
    }

    const tierConfig = getTierConfig(tenant.subscriptionTier);

    if (!tierConfig) {
      return {
        tier: null,
        name: 'Unknown',
        monthlyPrice: 0,
        annualPrice: 0,
        features: {},
      };
    }

    return {
      tier: tierConfig.id,
      name: tierConfig.name,
      monthlyPrice: tierConfig.monthlyPrice,
      annualPrice: tierConfig.annualPrice,
      features: tierConfig.features,
    };
  }, [tenant]);
}
