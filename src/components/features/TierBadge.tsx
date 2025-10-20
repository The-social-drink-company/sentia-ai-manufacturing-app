/**
 * TierBadge Component
 *
 * Visual indicator showing the current subscription tier.
 * Supports 3 sizes and optional icons.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-004 (UI Components)
 */

import { Zap, Rocket, Crown } from 'lucide-react';
import { getTierConfig, type SubscriptionTier } from '../../config/pricing.config';

interface TierBadgeProps {
  /**
   * Subscription tier to display
   */
  tier: string | SubscriptionTier;

  /**
   * Display size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show tier icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

export const TierBadge = ({
  tier,
  size = 'md',
  showIcon = true,
  className = '',
}: TierBadgeProps) => {
  const tierConfig = getTierConfig(tier);

  if (!tierConfig) {
    return null;
  }

  const Icon = getTierIcon(tierConfig.id);
  const colors = getTierColors(tierConfig.id);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${colors.bg} ${colors.text} ${getSizeClass(size)} ${className}`}
    >
      {showIcon && <Icon className={getIconSize(size)} />}
      {tierConfig.name}
    </span>
  );
};

/**
 * Get icon component for tier
 */
function getTierIcon(tierId: SubscriptionTier) {
  switch (tierId) {
    case 'starter':
      return Zap;
    case 'professional':
      return Rocket;
    case 'enterprise':
      return Crown;
    default:
      return Zap;
  }
}

/**
 * Get color scheme for tier
 */
function getTierColors(tierId: SubscriptionTier) {
  switch (tierId) {
    case 'starter':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
      };
    case 'professional':
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-purple-600',
        text: 'text-white',
      };
    case 'enterprise':
      return {
        bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        text: 'text-gray-900',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
      };
  }
}

/**
 * Get size-specific CSS classes
 */
function getSizeClass(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs';
    case 'md':
      return 'px-3 py-1 text-sm';
    case 'lg':
      return 'px-4 py-2 text-base';
    default:
      return 'px-3 py-1 text-sm';
  }
}

/**
 * Get icon size
 */
function getIconSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-3 h-3';
    case 'md':
      return 'w-4 h-4';
    case 'lg':
      return 'w-5 h-5';
    default:
      return 'w-4 h-4';
  }
}
