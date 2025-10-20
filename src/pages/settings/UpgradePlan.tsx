/**
 * Upgrade Plan Component
 *
 * Allows users to upgrade their subscription tier with:
 * - Tier selection with feature comparison
 * - Billing cycle toggle (monthly/annual)
 * - Proration preview
 * - Immediate upgrade processing
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-009 (Upgrade/Downgrade Flows)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { PRICING_TIERS } from '@/config/pricing.config';
import { TierBadge } from '@/components/features/TierBadge';

const UpgradePlan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();

  const [selectedTier, setSelectedTier] = useState(searchParams.get('upgrade') || 'professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [prorationPreview, setProrationPreview] = useState<any>(null);

  useEffect(() => {
    if (selectedTier) {
      fetchProrationPreview();
    }
  }, [selectedTier, billingCycle]);

  const fetchProrationPreview = async () => {
    try {
      const response = await fetch('/api/subscription/preview-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTier: selectedTier,
          newCycle: billingCycle
        })
      });

      const data = await response.json();
      setProrationPreview(data);
    } catch (error) {
      console.error('Error fetching proration preview:', error);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTier: selectedTier,
          newCycle: billingCycle
        })
      });

      if (!response.ok) {
        throw new Error('Upgrade failed');
      }

      const { subscription } = await response.json();

      // Show success message
      navigate('/settings/billing?upgraded=true');
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  const currentTierIndex = PRICING_TIERS.findIndex(
    t => t.id === tenant.subscriptionTier.toLowerCase()
  );

  const availableTiers = PRICING_TIERS.filter((_, index) => index > currentTierIndex);

  const selectedTierConfig = PRICING_TIERS.find(t => t.id === selectedTier);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upgrade Your Plan
        </h1>
        <p className="text-gray-600">
          Get access to more features and higher limits
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-800 font-medium mb-1">Current Plan</div>
            <div className="flex items-center gap-3">
              <TierBadge tier={tenant.subscriptionTier.toLowerCase() as any} size="lg" />
              <span className="text-2xl font-bold text-gray-900">
                ${tenant.subscriptionCycle === 'MONTHLY' ?
                  PRICING_TIERS.find(t => t.id === tenant.subscriptionTier.toLowerCase())?.monthlyPrice :
                  PRICING_TIERS.find(t => t.id === tenant.subscriptionTier.toLowerCase())?.annualPrice
                }
                <span className="text-base font-normal text-gray-600">
                  /{tenant.subscriptionCycle === 'MONTHLY' ? 'month' : 'year'}
                </span>
              </span>
            </div>
          </div>
          <TrendingUp className="w-12 h-12 text-blue-600" />
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors relative ${
            billingCycle === 'annual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Annual
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            Save 17%
          </span>
        </button>
      </div>

      {/* Available Tiers */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {availableTiers.map(tier => {
          const isSelected = selectedTier === tier.id;
          const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                {tier.popular && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billingCycle === 'annual' && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save ${(tier.monthlyPrice * 12) - tier.annualPrice}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {Object.entries(tier.features).slice(0, 8).map(([key, value]) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      {formatFeature(key, value)}
                    </span>
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <Check className="w-5 h-5" />
                  Selected
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Proration Preview */}
      {prorationPreview && selectedTierConfig && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Billing Summary</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">
                {selectedTierConfig.name} - {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
              </span>
              <span className="font-semibold text-gray-900">
                ${billingCycle === 'monthly' ? selectedTierConfig.monthlyPrice : selectedTierConfig.annualPrice}
              </span>
            </div>

            {prorationPreview.credit > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Credit from current plan</span>
                <span className="font-semibold">-${(prorationPreview.credit / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-gray-300 pt-3 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Due today</span>
              <span className="text-2xl font-bold text-gray-900">
                ${(prorationPreview.amountDue / 100).toFixed(2)}
              </span>
            </div>

            <p className="text-sm text-gray-600">
              Your new plan starts immediately. You'll be charged ${billingCycle === 'monthly' ? selectedTierConfig.monthlyPrice : selectedTierConfig.annualPrice} on {prorationPreview.nextBillingDate}.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleUpgrade}
          disabled={loading || !selectedTier}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Upgrade to {selectedTierConfig?.name}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/settings/billing')}
          className="px-6 py-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

function formatFeature(key: string, value: any): string {
  const labels: Record<string, string> = {
    maxUsers: 'users',
    maxEntities: 'entities',
    maxIntegrations: 'integrations',
    forecastHorizonMonths: 'month forecast',
    dataRetentionMonths: 'months data retention',
    apiCallsPerMonth: 'API calls/month',
    scenarioModeling: 'What-If scenario modeling',
    inventoryOptimization: 'Inventory optimization',
    realTimeUpdates: 'Real-time updates',
    prioritySupport: 'Priority support',
    dedicatedAccountManager: 'Dedicated account manager',
    whiteLabel: 'White-label branding',
    apiAccess: 'API access',
    sso: 'SSO & SAML',
    customReporting: 'Custom reporting'
  };

  if (typeof value === 'boolean') {
    return labels[key] || key;
  }

  const label = labels[key] || key;
  const formattedValue = value === 'unlimited' ? 'Unlimited' : value;

  return `${formattedValue} ${label}`;
}

export default UpgradePlan;
