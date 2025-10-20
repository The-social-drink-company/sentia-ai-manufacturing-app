/**
 * FeatureTooltip Component
 *
 * Tooltip showing feature information, tier requirements, and help text.
 * Helps users discover features and understand access requirements.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-004 (UI Components)
 */

import { HelpCircle, Lock, Check } from 'lucide-react';
import { useState } from 'react';
import { useTenant } from '../../hooks/useTenant';
import {
  canAccessFeature,
  getRequiredTier,
  getTierConfig,
  FEATURE_NAMES,
  FEATURE_DESCRIPTIONS,
  type TierFeatures,
} from '../../config/pricing.config';
import { TierBadge } from './TierBadge';

interface FeatureTooltipProps {
  /**
   * Feature to display info about
   */
  feature: keyof TierFeatures;

  /**
   * Custom trigger element (defaults to help icon)
   */
  children?: React.ReactNode;

  /**
   * Tooltip placement
   * @default 'top'
   */
  placement?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Custom class name
   */
  className?: string;
}

export const FeatureTooltip = ({
  feature,
  children,
  placement = 'top',
  className = '',
}: FeatureTooltipProps) => {
  const { tenant } = useTenant();
  const [isVisible, setIsVisible] = useState(false);

  const hasAccess = tenant ? canAccessFeature(tenant.subscriptionTier, feature) : false;
  const requiredTier = getRequiredTier(feature);
  const requiredTierConfig = requiredTier ? getTierConfig(requiredTier) : null;
  const featureName = FEATURE_NAMES[feature];
  const featureDescription = FEATURE_DESCRIPTIONS[feature];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`absolute z-50 ${getPlacementClass(placement)}`}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">{featureName}</h4>
                {requiredTierConfig && (
                  <div className="mt-1">
                    <TierBadge tier={requiredTierConfig.id} size="sm" />
                  </div>
                )}
              </div>
              {hasAccess ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">{featureDescription}</p>

            {/* Access Status */}
            {tenant ? (
              <div className="border-t border-gray-100 pt-3">
                {hasAccess ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">Available on your plan</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs">
                      Requires {requiredTierConfig?.name || 'higher tier'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-500">Sign in to check access</span>
              </div>
            )}

            {/* Arrow */}
            <div className={`absolute ${getArrowClass(placement)}`}>
              <div className="w-3 h-3 bg-white border border-gray-200 transform rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get placement-specific CSS classes for tooltip
 */
function getPlacementClass(placement: 'top' | 'bottom' | 'left' | 'right'): string {
  switch (placement) {
    case 'top':
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    case 'bottom':
      return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
    case 'left':
      return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
    case 'right':
      return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
    default:
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
  }
}

/**
 * Get arrow position for tooltip
 */
function getArrowClass(placement: 'top' | 'bottom' | 'left' | 'right'): string {
  switch (placement) {
    case 'top':
      return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2';
    case 'bottom':
      return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    case 'left':
      return 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2';
    case 'right':
      return 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2';
    default:
      return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2';
  }
}
