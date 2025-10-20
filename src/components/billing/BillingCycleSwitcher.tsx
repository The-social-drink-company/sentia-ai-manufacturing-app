/**
 * Billing Cycle Switcher Component
 *
 * Allows users to switch between monthly and annual billing with:
 * - Clear savings calculation for annual
 * - Price comparison
 * - One-click switching
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-009 (Upgrade/Downgrade Flows)
 */

import { useState } from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { PRICING_TIERS } from '@/config/pricing.config';

export const BillingCycleSwitcher = () => {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);

  if (!tenant) return null;

  const currentCycle = tenant.subscriptionCycle;
  const newCycle = currentCycle === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY';

  const tierConfig = PRICING_TIERS.find(t => t.id === tenant.subscriptionTier.toLowerCase());
  if (!tierConfig) return null;

  const currentPrice = currentCycle === 'MONTHLY' ? tierConfig.monthlyPrice : tierConfig.annualPrice;
  const newPrice = newCycle === 'MONTHLY' ? tierConfig.monthlyPrice : tierConfig.annualPrice;
  const savings = newCycle === 'ANNUAL' ? (tierConfig.monthlyPrice * 12) - tierConfig.annualPrice : 0;

  const handleSwitch = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/subscription/switch-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCycle: newCycle.toLowerCase() })
      });

      if (!response.ok) {
        throw new Error('Failed to switch billing cycle');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error switching billing cycle:', error);
      alert('Failed to switch billing cycle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Switch to {newCycle === 'MONTHLY' ? 'Monthly' : 'Annual'} Billing
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {newCycle === 'ANNUAL' ? (
              <>Save ${savings}/year by switching to annual billing</>
            ) : (
              <>Switch to monthly billing for more flexibility</>
            )}
          </p>

          <div className="flex items-center gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Current</div>
              <div className="font-semibold text-gray-900">
                ${currentPrice}/{currentCycle === 'MONTHLY' ? 'mo' : 'yr'}
              </div>
            </div>
            <div className="text-gray-400">→</div>
            <div>
              <div className="text-xs text-gray-500">New</div>
              <div className="font-semibold text-blue-600">
                ${newPrice}/{newCycle === 'MONTHLY' ? 'mo' : 'yr'}
              </div>
            </div>
            {savings > 0 && (
              <>
                <div className="text-gray-400">=</div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Save ${savings}/year
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSwitch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Switching...' : `Switch to ${newCycle === 'MONTHLY' ? 'Monthly' : 'Annual'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
