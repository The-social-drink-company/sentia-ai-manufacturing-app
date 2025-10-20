/**
 * Downgrade Plan Component
 *
 * Allows users to downgrade their subscription tier with:
 * - Clear warnings about lost features
 * - Affected data analysis
 * - End-of-period scheduling
 * - Confirmation requirements
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-009 (Upgrade/Downgrade Flows)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X, Check, TrendingDown } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { PRICING_TIERS } from '@/config/pricing.config';

const DowngradePlan = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const [selectedTier, setSelectedTier] = useState('');
  const [loading, setLoading] = useState(false);
  const [lostFeatures, setLostFeatures] = useState<string[]>([]);
  const [affectedData, setAffectedData] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (selectedTier) {
      analyzeLostFeatures();
      checkAffectedData();
    }
  }, [selectedTier]);

  const analyzeLostFeatures = () => {
    if (!tenant) return;

    const currentTier = PRICING_TIERS.find(t => t.id === tenant.subscriptionTier.toLowerCase());
    const newTier = PRICING_TIERS.find(t => t.id === selectedTier);

    if (!currentTier || !newTier) return;

    const lost: string[] = [];

    Object.entries(currentTier.features).forEach(([key, value]) => {
      const newValue = newTier.features[key];

      if (value === true && newValue === false) {
        lost.push(formatFeatureName(key));
      } else if (typeof value === 'number' && typeof newValue === 'number' && value > newValue) {
        lost.push(`${formatFeatureName(key)} (reduced from ${value} to ${newValue})`);
      } else if (value === 'unlimited' && newValue !== 'unlimited') {
        lost.push(`${formatFeatureName(key)} (limited to ${newValue})`);
      }
    });

    setLostFeatures(lost);
  };

  const checkAffectedData = async () => {
    try {
      const response = await fetch(`/api/subscription/downgrade-impact?newTier=${selectedTier}`);
      const data = await response.json();
      setAffectedData(data);
    } catch (error) {
      console.error('Error checking affected data:', error);
    }
  };

  const handleDowngrade = async () => {
    if (!confirmed) {
      alert('Please confirm you understand the changes');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscription/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTier: selectedTier
        })
      });

      if (!response.ok) {
        throw new Error('Downgrade failed');
      }

      navigate('/settings/billing?downgraded=true');
    } catch (error) {
      console.error('Error downgrading:', error);
      alert('Failed to downgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  const currentTierIndex = PRICING_TIERS.findIndex(
    t => t.id === tenant.subscriptionTier.toLowerCase()
  );

  const availableTiers = PRICING_TIERS.filter((_, index) => index < currentTierIndex);

  const selectedTierConfig = PRICING_TIERS.find(t => t.id === selectedTier);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Downgrade Your Plan
        </h1>
        <p className="text-gray-600">
          Review what you'll lose before downgrading
        </p>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">
              Important: Changes take effect at end of billing period
            </h3>
            <p className="text-sm text-yellow-800">
              Your downgrade will be scheduled for {tenant.currentPeriodEnd?.toLocaleDateString()}.
              You'll continue to have access to all features until then.
            </p>
          </div>
        </div>
      </div>

      {/* Available Tiers */}
      <div className="space-y-4 mb-8">
        {availableTiers.map(tier => {
          const isSelected = selectedTier === tier.id;

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-yellow-600 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">${tier.monthlyPrice}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-8 h-8 text-yellow-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lost Features Warning */}
      {lostFeatures.length > 0 && selectedTier && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <X className="w-5 h-5" />
            You will lose access to:
          </h3>
          <ul className="space-y-2">
            {lostFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected Data Warning */}
      {affectedData && affectedData.hasImpact && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-orange-900 mb-4">
            Data that will be affected:
          </h3>
          <ul className="space-y-2 text-sm text-orange-800">
            {affectedData.usersOverLimit > 0 && (
              <li>• {affectedData.usersOverLimit} users will be deactivated</li>
            )}
            {affectedData.integrationsOverLimit > 0 && (
              <li>• {affectedData.integrationsOverLimit} integrations will be disconnected</li>
            )}
            {affectedData.entitiesOverLimit > 0 && (
              <li>• {affectedData.entitiesOverLimit} entities will be archived</li>
            )}
          </ul>
        </div>
      )}

      {/* Confirmation */}
      {selectedTier && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              I understand that I will lose access to the features listed above and that this change
              will take effect on {tenant.currentPeriodEnd?.toLocaleDateString()}. I can cancel this
              downgrade at any time before then.
            </span>
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleDowngrade}
          disabled={loading || !selectedTier || !confirmed}
          className="flex-1 bg-yellow-600 text-white py-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              <TrendingDown className="w-5 h-5" />
              Schedule Downgrade to {selectedTierConfig?.name}
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

function formatFeatureName(key: string): string {
  const names: Record<string, string> = {
    scenarioModeling: 'What-If Scenario Modeling',
    inventoryOptimization: 'Inventory Optimization',
    realTimeUpdates: 'Real-time Updates',
    prioritySupport: 'Priority Support',
    dedicatedAccountManager: 'Dedicated Account Manager',
    whiteLabel: 'White-label Branding',
    apiAccess: 'API Access',
    sso: 'SSO & SAML',
    customReporting: 'Custom Reporting',
    maxUsers: 'User Limit',
    maxEntities: 'Entity Limit',
    maxIntegrations: 'Integration Limit',
    forecastHorizonMonths: 'Forecast Horizon',
    dataRetentionMonths: 'Data Retention',
    aiForcasting: 'AI-Powered Forecasting',
    whatIfAnalysis: 'What-If Analysis',
    advancedAnalytics: 'Advanced Analytics',
    multiCurrency: 'Multi-Currency Support',
    customIntegrations: 'Custom Integrations',
    dedicatedSupport: 'Dedicated Support',
    slaGuarantees: 'SLA Guarantees',
    advancedSecurity: 'Advanced Security',
    auditLogs: 'Audit Logs',
    customReports: 'Custom Reports'
  };

  return names[key] || key;
}

export default DowngradePlan;
