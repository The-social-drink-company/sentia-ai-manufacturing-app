/**
 * UpgradeModal Component
 *
 * Modal that displays tier comparison and upgrade options when users
 * try to access features beyond their current subscription.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-005 (Upgrade Modal)
 */

import { X, Check, Zap, Crown, Rocket } from 'lucide-react';
import {
  PRICING_TIERS,
  getUpgradeTiers,
  formatFeatureValue,
  FEATURE_NAMES,
  type TierFeatures,
  type SubscriptionTier,
} from '../../config/pricing.config';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  /**
   * Feature that triggered the upgrade prompt
   */
  feature: keyof TierFeatures;

  /**
   * Current subscription tier
   */
  currentTier: string | SubscriptionTier;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;
}

export const UpgradeModal = ({ feature, currentTier, onClose }: UpgradeModalProps) => {
  const navigate = useNavigate();

  const availableTiers = getUpgradeTiers(currentTier);

  const handleUpgrade = (tierId: string) => {
    // Navigate to billing page with upgrade parameter
    navigate(`/settings/billing?upgrade=${tierId}`);
    onClose();
  };

  const getTierIcon = (tierId: string) => {
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
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
              <p className="text-blue-100 mt-1">
                Unlock {FEATURE_NAMES[feature]} and access more powerful features
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {availableTiers.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                You're on the highest tier!
              </h3>
              <p className="text-gray-600">
                You already have access to all available features.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTiers.map(tier => {
                const Icon = getTierIcon(tier.id);
                const highlightedFeatures = Object.entries(tier.features)
                  .filter(([key, value]) => {
                    // Show boolean features that are enabled
                    if (typeof value === 'boolean') return value;
                    // Show non-zero limits
                    if (typeof value === 'number') return value > 0;
                    // Show unlimited
                    if (value === 'unlimited') return true;
                    return false;
                  })
                  .slice(0, 8);

                return (
                  <div
                    key={tier.id}
                    className={`relative border-2 rounded-xl p-6 transition-all duration-200 ${
                      tier.popular
                        ? 'border-blue-500 bg-blue-50/50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">{tier.description}</p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          ${tier.monthlyPrice}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        or ${tier.annualPrice}/year (save 17%)
                      </p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {highlightedFeatures.map(([key, value]) => (
                        <li key={key} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            {formatFeatureDisplay(key as keyof TierFeatures, value)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(tier.id)}
                      className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        tier.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                      Upgrade to {tier.name}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">What happens when you upgrade?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Instant access to all tier features</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Prorated billing (pay only for the remaining period)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Seamless transition - no data migration needed</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Cancel anytime - no long-term contracts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Format feature for display in tier comparison
 */
function formatFeatureDisplay(key: keyof TierFeatures, value: any): string {
  const name = FEATURE_NAMES[key];

  if (typeof value === 'boolean') {
    return name;
  }

  const formattedValue = formatFeatureValue(value);
  return `${formattedValue} ${name}`;
}
