/**
 * Feature Comparison Table
 *
 * Side-by-side comparison of features across all subscription tiers.
 * Shows check/X icons for boolean features and numeric values for limits.
 *
 * @epic EPIC-PRICING-001
 * @story BMAD-PRICE-004
 */

import { Check, X } from 'lucide-react';
import { PRICING_TIERS, type TierFeatures } from '@/config/pricing.config';

export const FeatureComparisonTable = () => {
  const features: Array<{ key: keyof TierFeatures; label: string }> = [
    { key: 'maxUsers', label: 'Users' },
    { key: 'maxEntities', label: 'Entities' },
    { key: 'maxIntegrations', label: 'Integrations' },
    { key: 'forecastHorizonMonths', label: 'Forecast Horizon' },
    { key: 'dataRetentionMonths', label: 'Data Retention' },
    { key: 'apiCallsPerMonth', label: 'API Calls/Month' },
    { key: 'basicDashboards', label: 'Basic Dashboards' },
    { key: 'aiForcasting', label: 'AI Forecasting' },
    { key: 'whatIfAnalysis', label: 'What-If Scenarios' },
    { key: 'advancedAnalytics', label: 'Advanced Analytics' },
    { key: 'inventoryManagement', label: 'Inventory Optimization' },
    { key: 'multiCurrency', label: 'Multi-Currency Support' },
    { key: 'prioritySupport', label: 'Priority Support' },
    { key: 'customIntegrations', label: 'Custom Integrations' },
    { key: 'whiteLabel', label: 'White-label Branding' },
    { key: 'dedicatedSupport', label: 'Dedicated Account Manager' },
    { key: 'slaGuarantees', label: 'SLA Guarantees (99.9%)' },
    { key: 'advancedSecurity', label: 'Advanced Security (SSO, 2FA)' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
              {PRICING_TIERS.map((tier) => (
                <th key={tier.id} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.key}
                className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature.label}</td>
                {PRICING_TIERS.map((tier) => {
                  const value = tier.features[feature.key];

                  return (
                    <td key={tier.id} className="px-6 py-4 text-center">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">
                          {value === 'unlimited' ? 'Unlimited' : formatValue(feature.key, value)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatValue(key: keyof TierFeatures, value: number | string): string {
  if (key === 'forecastHorizonMonths') {
    return `${value} months`;
  }
  if (key === 'dataRetentionMonths') {
    return `${value} months`;
  }
  if (key === 'apiCallsPerMonth') {
    return typeof value === 'number' ? value.toLocaleString() : value;
  }
  return value.toString();
}
