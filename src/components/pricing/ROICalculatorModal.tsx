/**
 * ROI Calculator Modal
 *
 * Interactive calculator showing potential savings with CapLiquify:
 * - Cash freed up (CCC reduction)
 * - Additional cash runway (days)
 * - Time savings value ($/year)
 * - Total annual benefit + ROI + payback period
 *
 * @epic EPIC-PRICING-001
 * @story BMAD-PRICE-003
 */

import { useState } from 'react';
import { X, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ROICalculatorModalProps {
  onClose: () => void;
}

export const ROICalculatorModal = ({ onClose }: ROICalculatorModalProps) => {
  const [inputs, setInputs] = useState({
    annualRevenue: 10000000,
    currentCCC: 75,
    currentCashRunway: 45,
    hoursPerWeekOnForecasting: 10,
    hourlyRate: 75,
  });

  // Calculations
  const targetCCC = 55; // CapLiquify target (industry best-in-class)
  const cccImprovement = inputs.currentCCC - targetCCC;
  const dailyRevenue = inputs.annualRevenue / 365;
  const cashFreed = dailyRevenue * cccImprovement;
  const additionalRunway = cashFreed / dailyRevenue;
  const timeSavings = inputs.hoursPerWeekOnForecasting * 0.7; // 70% time savings
  const timeSavingsValue = timeSavings * inputs.hourlyRate * 52;
  const totalAnnualBenefit = cashFreed + timeSavingsValue;
  const professionalPlanCost = 295 * 12;
  const roi = ((totalAnnualBenefit - professionalPlanCost) / professionalPlanCost) * 100;
  const paybackPeriod = professionalPlanCost / (totalAnnualBenefit / 12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ROI Calculator</h2>
            <p className="text-gray-600 mt-1">See how much you could save with CapLiquify</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Your Business</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.annualRevenue}
                      onChange={(e) => setInputs({ ...inputs, annualRevenue: parseInt(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Cash Conversion Cycle (days)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentCCC}
                    onChange={(e) => setInputs({ ...inputs, currentCCC: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Industry average: 60-90 days</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Cash Runway (days)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentCashRunway}
                    onChange={(e) => setInputs({ ...inputs, currentCashRunway: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours/week on manual forecasting
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.hoursPerWeekOnForecasting}
                      onChange={(e) =>
                        setInputs({ ...inputs, hoursPerWeekOnForecasting: parseInt(e.target.value) || 0 })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Average hourly rate ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.hourlyRate}
                      onChange={(e) => setInputs({ ...inputs, hourlyRate: parseInt(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Your Potential Savings</h3>

              <div className="space-y-4">
                {/* Cash Freed */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Cash Freed Up</h4>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${cashFreed.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-sm text-green-800">
                    By reducing CCC from {inputs.currentCCC} to {targetCCC} days
                  </p>
                </div>

                {/* Additional Runway */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Additional Cash Runway</h4>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    +{additionalRunway.toFixed(0)} days
                  </div>
                  <p className="text-sm text-blue-800">
                    From {inputs.currentCashRunway} to {(inputs.currentCashRunway + additionalRunway).toFixed(0)}{' '}
                    days
                  </p>
                </div>

                {/* Time Savings */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Time Savings Value</h4>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    ${timeSavingsValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}/year
                  </div>
                  <p className="text-sm text-purple-800">
                    {timeSavings.toFixed(1)} hours/week saved on forecasting
                  </p>
                </div>

                {/* Total Benefit */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-6">
                  <h4 className="font-semibold mb-2">Total Annual Benefit</h4>
                  <div className="text-4xl font-bold mb-4">
                    ${totalAnnualBenefit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-blue-100">ROI</div>
                      <div className="text-2xl font-bold">{roi.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-blue-100">Payback Period</div>
                      <div className="text-2xl font-bold">{paybackPeriod.toFixed(1)} mo</div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => (window.location.href = '/signup?tier=professional')}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                </button>

                <p className="text-xs text-center text-gray-500">Based on Professional plan at $295/month</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
