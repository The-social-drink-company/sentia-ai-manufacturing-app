/**
 * FeatureGate Component
 *
 * Wrapper component that controls access to features based on subscription tier.
 * Supports 4 display modes: hide, disable, blur, and overlay.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-002 (FeatureGate Component)
 */

import { ReactNode, useState } from 'react';
import { Lock, Zap } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import {
  canAccessFeature,
  getUpgradeMessage,
  type TierFeatures,
} from '../../config/pricing.config';
import { UpgradeModal } from './UpgradeModal';

export type FeatureGateMode = 'hide' | 'disable' | 'blur' | 'overlay';

interface FeatureGateProps {
  /**
   * Feature key from TierFeatures type
   */
  feature: keyof TierFeatures;

  /**
   * Content to display (will be gated based on access)
   */
  children: ReactNode;

  /**
   * Fallback content to show when access is denied (only for 'hide' mode)
   */
  fallback?: ReactNode;

  /**
   * Whether to show upgrade prompt when access is denied
   * @default true
   */
  showUpgradePrompt?: boolean;

  /**
   * Display mode for gated content
   * - hide: Don't show the feature at all
   * - disable: Show but disabled/grayed out
   * - blur: Show blurred with overlay
   * - overlay: Show dimmed with prominent upgrade prompt
   * @default 'overlay'
   */
  mode?: FeatureGateMode;

  /**
   * Custom class name for wrapper
   */
  className?: string;
}

export const FeatureGate = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  mode = 'overlay',
  className = '',
}: FeatureGateProps) => {
  const { tenant } = useTenant();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // If no tenant context, hide the feature
  if (!tenant) {
    return mode === 'hide' ? (fallback ? <>{fallback}</> : null) : null;
  }

  const hasAccess = canAccessFeature(tenant.subscriptionTier, feature);

  // User has access - show the feature normally
  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  // Mode: hide - Don't show the feature at all
  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  // Mode: disable - Show but disabled
  if (mode === 'disable') {
    return (
      <div className={`relative ${className}`}>
        <div className="opacity-50 pointer-events-none select-none">{children}</div>
        {showUpgradePrompt && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Lock className="w-3 h-3" />
              Upgrade
            </button>
          </div>
        )}
        {showUpgradeModal && (
          <UpgradeModal
            feature={feature}
            currentTier={tenant.subscriptionTier}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </div>
    );
  }

  // Mode: blur - Show blurred version
  if (mode === 'blur') {
    return (
      <div className={`relative ${className}`}>
        <div className="filter blur-md pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center max-w-sm p-6 bg-white rounded-lg shadow-xl border border-gray-200">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">
              Upgrade to Unlock This Feature
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {getUpgradeMessage(tenant.subscriptionTier, feature)}
            </p>
            {showUpgradePrompt && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                View Plans
              </button>
            )}
          </div>
        </div>
        {showUpgradeModal && (
          <UpgradeModal
            feature={feature}
            currentTier={tenant.subscriptionTier}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </div>
    );
  }

  // Mode: overlay (default) - Show with prominent overlay
  return (
    <div className={`relative min-h-[300px] ${className}`}>
      <div className="pointer-events-none opacity-20 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm text-center border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-xl">Premium Feature</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {getUpgradeMessage(tenant.subscriptionTier, feature)}
          </p>
          {showUpgradePrompt && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-5 h-5" />
              Upgrade Now
            </button>
          )}
        </div>
      </div>
      {showUpgradeModal && (
        <UpgradeModal
          feature={feature}
          currentTier={tenant.subscriptionTier}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};
