/**
 * Downgrade Impact Modal Component
 *
 * Shows detailed preview of downgrade consequences before user confirms.
 * Displays features that will be lost, affected data, and effective date.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-011 (Downgrade Impact Preview)
 */

import { X, AlertTriangle, Calendar, Lock, TrendingDown } from 'lucide-react';
import { PRICING_TIERS, FEATURE_NAMES } from '../../config/pricing.config';

export default function DowngradeImpactModal({ isOpen, onClose, onConfirm, targetTier, currentTier, impactData }) {
  if (!isOpen) return null;

  const targetTierInfo = PRICING_TIERS.find((t) => t.id === targetTier);
  const currentTierInfo = PRICING_TIERS.find((t) => t.id === currentTier);

  const featuresLost = impactData?.featuresLost || [];
  const dataImpact = impactData?.dataImpact || {};
  const effectiveDate = impactData?.effectiveDate
    ? new Date(impactData.effectiveDate).toLocaleDateString()
    : 'End of billing cycle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              Confirm Downgrade
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review the impact before scheduling your downgrade
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Tier Comparison */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Current Plan</div>
              <div className="px-4 py-2 bg-blue-100 text-blue-800 font-bold rounded-lg">
                {currentTierInfo?.name || currentTier}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                ${currentTierInfo?.monthlyPrice}/month
              </div>
            </div>

            <TrendingDown className="w-6 h-6 text-gray-400" />

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">New Plan</div>
              <div className="px-4 py-2 bg-gray-100 text-gray-800 font-bold rounded-lg">
                {targetTierInfo?.name || targetTier}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                ${targetTierInfo?.monthlyPrice}/month
              </div>
            </div>
          </div>

          {/* Effective Date */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Scheduled for End of Billing Cycle</h3>
                <p className="text-sm text-blue-700">
                  Your downgrade will take effect on <strong>{effectiveDate}</strong>. You'll continue to have
                  access to all {currentTierInfo?.name} features until then.
                </p>
              </div>
            </div>
          </div>

          {/* Features Lost */}
          {featuresLost.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">Features You'll Lose Access To</h3>
                  <ul className="space-y-2">
                    {featuresLost.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                        <span className="text-yellow-500 font-bold mt-0.5">•</span>
                        <span>{FEATURE_NAMES[feature] || feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Data Impact */}
          {dataImpact && Object.keys(dataImpact).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Data Limits</h3>
                  <div className="space-y-2 text-sm text-red-800">
                    {dataImpact.users && (
                      <p>
                        • <strong>Users:</strong> Current {dataImpact.users.current} exceeds new limit of{' '}
                        {dataImpact.users.limit}. You'll need to remove {dataImpact.users.exceeds} users.
                      </p>
                    )}
                    {dataImpact.entities && (
                      <p>
                        • <strong>Entities:</strong> Current {dataImpact.entities.current} exceeds new limit
                        of {dataImpact.entities.limit}. You'll need to remove{' '}
                        {dataImpact.entities.exceeds} entities.
                      </p>
                    )}
                    {dataImpact.integrations && (
                      <p>
                        • <strong>Integrations:</strong> Current {dataImpact.integrations.current} exceeds
                        new limit of {dataImpact.integrations.limit}. You'll need to disconnect{' '}
                        {dataImpact.integrations.exceeds} integrations.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Savings */}
          {currentTierInfo && targetTierInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-green-700 mb-1">Monthly Savings</p>
                <p className="text-3xl font-bold text-green-900">
                  ${currentTierInfo.monthlyPrice - targetTierInfo.monthlyPrice}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  (${(currentTierInfo.monthlyPrice - targetTierInfo.monthlyPrice) * 12}/year)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg"
          >
            Confirm Downgrade
          </button>
        </div>
      </div>
    </div>
  );
}
