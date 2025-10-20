/**
 * Usage Widget Component
 *
 * Displays current usage metrics and limits for subscription tier.
 * Shows progress bars, warnings when approaching limits, and upgrade CTAs.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Usage Limit Indicators)
 */

import { AlertTriangle, Users, Database, Zap } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useUsageLimit } from '../../hooks/useFeatureAccess';
import { useNavigate } from 'react-router-dom';

export default function UsageWidget() {
  const { tenant } = useTenant();
  const navigate = useNavigate();

  if (!tenant) {
    return null;
  }

  const { currentUsage, limits } = tenant;

  // Calculate usage for each metric
  const usersUsage = useUsageLimit('maxUsers', currentUsage?.users || 0);
  const entitiesUsage = useUsageLimit('maxEntities', currentUsage?.entities || 0);
  const integrationsUsage = useUsageLimit('maxIntegrations', currentUsage?.integrations || 0);

  const usageMetrics = [
    {
      name: 'Active Users',
      icon: Users,
      current: currentUsage?.users || 0,
      limit: limits.users,
      color: 'blue',
      ...usersUsage,
    },
    {
      name: 'Entities',
      icon: Database,
      current: currentUsage?.entities || 0,
      limit: limits.entities,
      color: 'green',
      ...entitiesUsage,
    },
    {
      name: 'Integrations',
      icon: Zap,
      current: currentUsage?.integrations || 0,
      limit: limits.integrations,
      color: 'purple',
      ...integrationsUsage,
    },
  ];

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
    };
    return colors[color] || 'text-gray-600';
  };

  const getBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
    };
    return colors[color] || 'bg-gray-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Usage & Limits</h3>
        <span className="text-sm text-gray-600">
          {tenant.subscriptionTier} Plan
        </span>
      </div>

      {/* Usage Metrics */}
      <div className="space-y-5">
        {usageMetrics.map((metric) => (
          <div key={metric.name}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${getBgColor(metric.color)}`}>
                  <metric.icon className={`w-4 h-4 ${getTextColor(metric.color)}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{metric.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {metric.current.toLocaleString()} / {metric.limit === Infinity ? '∞' : metric.limit.toLocaleString()}
              </span>
            </div>

            {/* Progress Bar */}
            {metric.limit !== Infinity && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                      metric.usagePercentage
                    )}`}
                    style={{ width: `${Math.min(metric.usagePercentage, 100)}%` }}
                  />
                </div>

                {/* Warning Message */}
                {metric.isApproachingLimit && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">
                      {metric.isAtLimit
                        ? `You've reached your ${metric.name.toLowerCase()} limit. Upgrade to add more.`
                        : `You're using ${Math.round(metric.usagePercentage)}% of your ${metric.name.toLowerCase()} limit.`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      {usageMetrics.some((m) => m.isApproachingLimit) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/settings/billing')}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}
