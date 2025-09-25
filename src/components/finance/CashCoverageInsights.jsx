import React, { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';

/**
 * Enterprise Cash Coverage Insights Dashboard
 * Fortune 500-level executive decision support interface
 */
const CashCoverageInsights = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(90);
  const [scenario, setScenario] = useState('sustain');
  const [showSimulation, setShowSimulation] = useState(false);
  const [companyId] = useState('sentia-spirits'); // Would come from context

  // Fetch cash coverage analysis
  const { data: coverageAnalysis, isLoading: loadingCoverage } = useQuery({
    queryKey: ['cashCoverage', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/cash-coverage/analysis?companyId=${companyId}&periods=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch coverage analysis');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch executive insights
  const { data: executiveInsights, isLoading: loadingInsights } = useQuery({
    queryKey: ['executiveInsights', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/cash-coverage/executive-insights?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    }
  });

  // Fetch injection needs
  const { data: injectionNeeds } = useQuery({
    queryKey: ['injectionNeeds', scenario],
    queryFn: async () => {
      const response = await fetch(`/api/cash-coverage/injection-needs?companyId=${companyId}&scenario=${scenario}`);
      if (!response.ok) throw new Error('Failed to fetch injection needs');
      return response.json();
    }
  });

  // Run Monte Carlo simulation
  const runSimulation = useMutation({
    mutationFn: async (params) => {
      const response = await fetch('/api/cash-coverage/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          ...params
        })
      });
      if (!response.ok) throw new Error('Simulation failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cashCoverage']);
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMetricTrend = (current, previous) => {
    if (!previous) return 'neutral';
    const change = ((current - previous) / previous) * 100;
    return change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';
  };

  if (loadingCoverage || loadingInsights) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const analysis = coverageAnalysis?.analysis;
  const insights = executiveInsights?.insights;
  const injection = injectionNeeds?.analysis;

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
      {/* Executive Summary Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cash Coverage Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Enterprise financial insights and decision support
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
              <option value={120}>120 Days</option>
              <option value={180}>180 Days</option>
            </select>
            <button
              onClick={() => setShowSimulation(!showSimulation)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Simulation
            </button>
          </div>
        </div>

        {/* Critical Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300">Current Cash</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-white">
                  {formatCurrency(analysis?.currentCash || 0)}
                </p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-300">Cash Runway</p>
                <p className="text-2xl font-bold text-green-900 dark:text-white">
                  {insights?.criticalMetrics?.cashRunway || '0'} days
                </p>
              </div>
              <CalendarDaysIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">Burn Rate</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-white">
                  {formatCurrency(insights?.criticalMetrics?.burnRate || 0)}/mo
                </p>
              </div>
              <ArrowTrendingDownIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-300">Health Score</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-white">
                  {insights?.criticalMetrics?.financialHealth || 0}/100
                </p>
              </div>
              <ShieldCheckIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Cash Coverage Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage by Period */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Cash Coverage by Period
          </h2>
          <div className="space-y-4">
            {analysis?.coverage && Object.entries(analysis.coverage).map(([period, data]) => (
              <div key={period} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {period.replace('day_', '')} Days
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Coverage Ratio: {data.coverageRatio?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {data.shortfall > 0 ? (
                        <span className="text-red-600">
                          -{formatCurrency(data.shortfall)}
                        </span>
                      ) : (
                        <span className="text-green-600">
                          +{formatCurrency(data.surplusCash || 0)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPercent(data.probability)} probability
                    </p>
                  </div>
                </div>
                {data.actionRequired && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900 rounded text-sm text-red-700 dark:text-red-300">
                    Action Required: {data.recommendations?.[0] || 'Review cash position'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cash Injection Needs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
            Cash Injection Analysis
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Scenario</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="sustain">Sustain Operations</option>
              <option value="growth">Growth (20% target)</option>
              <option value="aggressive">Aggressive Expansion</option>
              <option value="turnaround">Turnaround</option>
            </select>
          </div>
          {injection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Immediate Need</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(injection.immediateNeed)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Optimal Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(injection.optimalAmount)}
                  </p>
                </div>
              </div>
              {injection.criticalDate && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Critical Date: {new Date(injection.criticalDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {injection.sources && injection.sources.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Funding Sources</p>
                  <div className="space-y-2">
                    {injection.sources.slice(0, 3).map((source, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{source.name}</span>
                        <span className="font-medium">{source.cost}% cost</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Executive Alerts & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
            Critical Alerts
          </h2>
          <div className="space-y-3">
            {analysis?.alerts && analysis.alerts.length > 0 ? (
              analysis.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}
                >
                  <p className="font-medium">{alert.message}</p>
                  {alert.action && (
                    <p className="text-sm mt-1 opacity-90">{alert.action}</p>
                  )}
                  {alert.amount && (
                    <p className="text-sm font-semibold mt-1">
                      Amount: {formatCurrency(alert.amount)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No critical alerts at this time</p>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-600" />
            Strategic Recommendations
          </h2>
          <div className="space-y-3">
            {analysis?.recommendations && analysis.recommendations.length > 0 ? (
              analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{rec}</p>
                </div>
              ))
            ) : insights?.recommendations ? (
              insights.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {rec.title || rec}
                  </p>
                  {rec.impact && (
                    <p className="text-xs mt-1 opacity-75">
                      Impact: {rec.impact}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">Loading recommendations...</p>
            )}
          </div>
        </div>
      </div>

      {/* Working Capital Optimization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <ScaleIcon className="h-5 w-5 mr-2 text-purple-600" />
          Working Capital Optimization Opportunities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-1">DSO Improvement</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-white">
              {formatCurrency(150000)}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Reduce from 45 to 35 days
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-300 mb-1">DPO Extension</p>
            <p className="text-2xl font-bold text-green-900 dark:text-white">
              {formatCurrency(200000)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              Extend from 30 to 45 days
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-300 mb-1">Inventory Turns</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-white">
              {formatCurrency(180000)}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
              Increase from 6 to 8 turns
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Total Cash Release Opportunity
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Through working capital optimization
              </p>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(530000)}
            </p>
          </div>
        </div>
      </div>

      {/* Monte Carlo Simulation Modal */}
      {showSimulation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Monte Carlo Simulation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Time Horizon (days)</label>
                <input
                  type="number"
                  defaultValue={180}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Iterations</label>
                <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                  <option value={10000}>10,000</option>
                  <option value={50000}>50,000</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSimulation(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    runSimulation.mutate({
                      timeHorizon: 180,
                      iterations: 10000,
                      variables: {
                        revenue: { distribution: 'normal', mean: 1000000, stdDev: 100000 },
                        expenses: { distribution: 'normal', mean: 800000, stdDev: 50000 },
                        collections: { distribution: 'normal', mean: 950000, stdDev: 75000 }
                      }
                    });
                    setShowSimulation(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Run Simulation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashCoverageInsights;