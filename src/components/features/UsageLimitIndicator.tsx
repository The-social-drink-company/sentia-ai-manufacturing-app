/**
 * UsageLimitIndicator Component
 *
 * Visual progress bar showing current usage against tier limits.
 * Displays warning states at 80% and 100% usage with upgrade CTAs.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-003 (Usage Indicators)
 */

import { AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTenant } from '../../hooks/useTenant';
import {
  getTierConfig,
  formatFeatureValue,
  FEATURE_NAMES,
  type TierFeatures,
} from '../../config/pricing.config';
import { UpgradeModal } from './UpgradeModal';

interface UsageLimitIndicatorProps {
  /**
   * The limit type to display (e.g., maxUsers, maxEntities)
   */
  limitType: keyof TierFeatures;

  /**
   * Current usage amount
   */
  currentUsage: number;

  /**
   * Optional custom label (defaults to FEATURE_NAMES)
   */
  label?: string;

  /**
   * Show upgrade button when at/near limit
   * @default true
   */
  showUpgradeButton?: boolean;

  /**
   * Display size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Custom class name
   */
  className?: string;
}

export const UsageLimitIndicator = ({
  limitType,
  currentUsage,
  label,
  showUpgradeButton = true,
  size = 'md',
  className = '',
}: UsageLimitIndicatorProps) => {
  const { tenant } = useTenant();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!tenant) {
    return null;
  }

  const tierConfig = getTierConfig(tenant.subscriptionTier);

  if (!tierConfig) {
    return null;
  }

  const limit = tierConfig.features[limitType];
  const featureName = label || FEATURE_NAMES[limitType];

  // Handle unlimited limits
  if (limit === 'unlimited') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-medium text-gray-700 ${getSizeClass(size, 'text')}`}>
              {featureName}
            </span>
            <span className={`text-green-600 font-semibold ${getSizeClass(size, 'text')}`}>
              Unlimited
            </span>
          </div>
          <div className={`bg-green-100 rounded-full ${getSizeClass(size, 'bar')}`}>
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full w-1/4" />
          </div>
        </div>
        <TrendingUp className={`text-green-500 ${getSizeClass(size, 'icon')}`} />
      </div>
    );
  }

  // Handle boolean features (not applicable for usage indicators)
  if (typeof limit === 'boolean') {
    return null;
  }

  // Calculate usage percentage
  const usagePercentage = Math.min((currentUsage / limit) * 100, 100);
  const isWarning = usagePercentage >= 80 && usagePercentage < 100;
  const isAtLimit = usagePercentage >= 100;
  const isNormal = !isWarning && !isAtLimit;

  // Color schemes based on usage level
  const colors = {
    normal: {
      bg: 'bg-blue-100',
      bar: 'bg-gradient-to-r from-blue-500 to-blue-600',
      text: 'text-blue-600',
      icon: 'text-blue-500',
    },
    warning: {
      bg: 'bg-yellow-100',
      bar: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
    },
    atLimit: {
      bg: 'bg-red-100',
      bar: 'bg-gradient-to-r from-red-500 to-red-600',
      text: 'text-red-600',
      icon: 'text-red-500',
    },
  };

  const colorScheme = isAtLimit ? colors.atLimit : isWarning ? colors.warning : colors.normal;

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <span className={`font-medium text-gray-700 ${getSizeClass(size, 'text')}`}>
              {featureName}
            </span>
            <span className={`font-semibold ${colorScheme.text} ${getSizeClass(size, 'text')}`}>
              {currentUsage.toLocaleString()} / {formatFeatureValue(limit)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className={`${colorScheme.bg} rounded-full overflow-hidden ${getSizeClass(size, 'bar')}`}>
            <div
              className={`${colorScheme.bar} h-full rounded-full transition-all duration-300`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>

          {/* Warning/Error Message */}
          {(isWarning || isAtLimit) && (
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className={`${colorScheme.icon} ${getSizeClass(size, 'icon')}`} />
              <span className={`text-sm ${colorScheme.text}`}>
                {isAtLimit
                  ? `You've reached your ${featureName.toLowerCase()} limit`
                  : `You're approaching your ${featureName.toLowerCase()} limit (${usagePercentage.toFixed(0)}%)`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Button */}
      {showUpgradeButton && (isWarning || isAtLimit) && (
        <button
          onClick={() => setShowUpgradeModal(true)}
          className={`mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 ${getSizeClass(size, 'button')}`}
        >
          <Zap className={getSizeClass(size, 'icon')} />
          Upgrade to Increase Limit
        </button>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          feature={limitType}
          currentTier={tenant.subscriptionTier}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

/**
 * Get size-specific CSS classes
 */
function getSizeClass(size: 'sm' | 'md' | 'lg', element: 'text' | 'bar' | 'icon' | 'button'): string {
  const sizeMap = {
    sm: {
      text: 'text-xs',
      bar: 'h-1.5',
      icon: 'w-3 h-3',
      button: 'py-1.5 px-3 text-xs',
    },
    md: {
      text: 'text-sm',
      bar: 'h-2',
      icon: 'w-4 h-4',
      button: 'py-2 px-4 text-sm',
    },
    lg: {
      text: 'text-base',
      bar: 'h-3',
      icon: 'w-5 h-5',
      button: 'py-3 px-6 text-base',
    },
  };

  return sizeMap[size][element];
}
