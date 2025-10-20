/**
 * Settings - Billing Page
 *
 * Manage subscription tier and billing information.
 * Integration point for upgrade flow from FeatureGate system.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-007 (Integration)
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, Zap, Rocket, Crown } from 'lucide-react';
import { useTenant } from '../hooks/useTenant';
import { useTierInfo } from '../hooks/useFeatureAccess';
import { TierBadge } from '../components/features';
import { PRICING_TIERS, formatFeatureValue, FEATURE_NAMES } from '../config/pricing.config';

export default function SettingsBilling() {
  const { tenant } = useTenant();
  const tierInfo = useTierInfo();
  const [searchParams] = useSearchParams();
  const suggestedUpgrade = searchParams.get('upgrade');
  const [selectedTier, setSelectedTier] = useState(tierInfo.tier);

  useEffect(() => {
    if (suggestedUpgrade) {
      setSelectedTier(suggestedUpgrade);
    }
  }, [suggestedUpgrade]);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to manage billing.</p>
        </div>
      </div>
    );
  }

  const getTierIcon = (tierId) => {
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

  const handleUpgrade = (tierId) => {
    // In production, this would integrate with Stripe
    console.log('Upgrading to:', tierId);
    alert(`Upgrade to ${tierId} tier selected. In production, this would integrate with Stripe payment flow.`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription tier and billing information</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
            <TierBadge tier={tierInfo.tier || 'starter'} size="lg" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Cost</p>
              <p className="text-2xl font-bold text-gray-900">${tierInfo.monthlyPrice}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Annual Cost</p>
              <p className="text-2xl font-bold text-gray-900">${tierInfo.annualPrice}</p>
              <p className="text-xs text-green-600">Save 17%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
              <p className="text-lg font-semibold text-gray-900">Dec 20, 2025</p>
            </div>
          </div>
        </div>

        {/* Upgrade Notice */}
        {suggestedUpgrade && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Upgrade Recommended</h3>
              <p className="text-sm text-blue-700">
                You attempted to access a feature that requires the{' '}
                <span className="font-semibold">
                  {PRICING_TIERS.find((t) => t.id === suggestedUpgrade)?.name}
                </span>{' '}
                tier. Select a plan below to upgrade.
              </p>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier) => {
            const Icon = getTierIcon(tier.id);
            const isCurrent = tier.id === tierInfo.tier;
            const isSelected = tier.id === selectedTier;
            const highlightedFeatures = Object.entries(tier.features)
              .filter(([key, value]) => {
                if (typeof value === 'boolean') return value;
                if (typeof value === 'number') return value > 0;
                if (value === 'unlimited') return true;
                return false;
              })
              .slice(0, 8);

            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-xl border-2 p-6 transition-all duration-200 ${
                  tier.popular
                    ? 'border-blue-500 shadow-lg scale-105'
                    : isSelected
                    ? 'border-purple-500 shadow-md'
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

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Current
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
                    <span className="text-4xl font-bold text-gray-900">${tier.monthlyPrice}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">or ${tier.annualPrice}/year (save 17%)</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {highlightedFeatures.map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        {typeof value === 'boolean'
                          ? FEATURE_NAMES[key]
                          : `${formatFeatureValue(value)} ${FEATURE_NAMES[key]}`}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : tier.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {tier.id > (tierInfo.tier || 'starter') ? 'Upgrade' : 'Downgrade'} to {tier.name}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <CreditCard className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-600">Expires 12/25</p>
            </div>
            <button className="ml-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
              Update
            </button>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>
          <div className="space-y-3">
            {[
              { date: 'Nov 20, 2025', amount: tierInfo.monthlyPrice, status: 'Paid' },
              { date: 'Oct 20, 2025', amount: tierInfo.monthlyPrice, status: 'Paid' },
              { date: 'Sep 20, 2025', amount: tierInfo.monthlyPrice, status: 'Paid' },
            ].map((invoice, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{invoice.date}</p>
                  <p className="text-sm text-gray-600">{tierInfo.name} Plan</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${invoice.amount}</p>
                  <p className="text-sm text-green-600">{invoice.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
