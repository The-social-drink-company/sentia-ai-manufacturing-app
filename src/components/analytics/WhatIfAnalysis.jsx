import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const WhatIfAnalysis = () => {
  const [scenarios, setScenarios] = useState({
    revenue: { current: 2500000, projected: 2500000, change: 0 },
    costs: { current: 1800000, projected: 1800000, change: 0 },
    inventory: { current: 1200000, projected: 1200000, change: 0 },
    efficiency: { current: 94, projected: 94, change: 0 },
    demand: { current: 100, projected: 100, change: 0 },
  });

  const [results, setResults] = useState({
    profit: 700000,
    profitMargin: 28,
    cashFlow: 850000,
    roi: 38.9,
    workingCapital: 1600000,
  });

  // Update results when scenarios change
  useEffect(() => {
    const revenue = scenarios.revenue.projected;
    const costs = scenarios.costs.projected;
    const inventory = scenarios.inventory.projected;
    const efficiency = scenarios.efficiency.projected;

    const profit = revenue - costs;
    const profitMargin = (profit / revenue) * 100;
    const cashFlow = profit + (scenarios.inventory.current - inventory);
    const roi = (profit / costs) * 100;
    const workingCapital = inventory + (revenue * 0.15) - (costs * 0.1);

    setResults({
      profit,
      profitMargin: profitMargin.toFixed(1),
      cashFlow,
      roi: roi.toFixed(1),
      workingCapital,
    });
  }, [scenarios]);

  const handleSliderChange = (metric, value) => {
    setScenarios(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        projected: metric === 'efficiency' || metric === 'demand'
          ? value
          : prev[metric].current * (value / 100),
        change: metric === 'efficiency' || metric === 'demand'
          ? value - prev[metric].current
          : value - 100,
      }
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const resetScenarios = () => {
    setScenarios({
      revenue: { current: 2500000, projected: 2500000, change: 0 },
      costs: { current: 1800000, projected: 1800000, change: 0 },
      inventory: { current: 1200000, projected: 1200000, change: 0 },
      efficiency: { current: 94, projected: 94, change: 0 },
      demand: { current: 100, projected: 100, change: 0 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">What-If Analysis</h1>
          <p className="text-gray-600 mt-1">Simulate scenarios and predict outcomes</p>
        </div>
        <button
          onClick={resetScenarios}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Reset Scenarios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Adjustments */}
        <Card>
          <CardHeader>
            <CardTitle>Adjust Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenue Adjustment */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Revenue Adjustment
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {scenarios.revenue.change > 0 ? '+' : ''}{scenarios.revenue.change}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={scenarios.revenue.change + 100}
                onChange={(e) => handleSliderChange('revenue', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatCurrency(scenarios.revenue.current)}</span>
                <span className="font-bold text-gray-900">{formatCurrency(scenarios.revenue.projected)}</span>
              </div>
            </div>

            {/* Costs Adjustment */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Costs Adjustment
                </label>
                <span className="text-sm font-bold text-orange-600">
                  {scenarios.costs.change > 0 ? '+' : ''}{scenarios.costs.change}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                value={scenarios.costs.change + 100}
                onChange={(e) => handleSliderChange('costs', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatCurrency(scenarios.costs.current)}</span>
                <span className="font-bold text-gray-900">{formatCurrency(scenarios.costs.projected)}</span>
              </div>
            </div>

            {/* Inventory Adjustment */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Inventory Levels
                </label>
                <span className="text-sm font-bold text-purple-600">
                  {scenarios.inventory.change > 0 ? '+' : ''}{scenarios.inventory.change}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="140"
                value={scenarios.inventory.change + 100}
                onChange={(e) => handleSliderChange('inventory', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatCurrency(scenarios.inventory.current)}</span>
                <span className="font-bold text-gray-900">{formatCurrency(scenarios.inventory.projected)}</span>
              </div>
            </div>

            {/* Efficiency Adjustment */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Production Efficiency
                </label>
                <span className="text-sm font-bold text-green-600">
                  {scenarios.efficiency.projected}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                value={scenarios.efficiency.projected}
                onChange={(e) => handleSliderChange('efficiency', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>70%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Demand Forecast */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Demand Forecast
                </label>
                <span className="text-sm font-bold text-indigo-600">
                  {scenarios.demand.projected}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={scenarios.demand.projected}
                onChange={(e) => handleSliderChange('demand', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>150%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projected Results */}
        <Card>
          <CardHeader>
            <CardTitle>Projected Outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profit */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Projected Profit</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(results.profit)}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  results.profit > 700000 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {results.profit > 700000 ? '↑' : '↓'} {Math.abs(((results.profit - 700000) / 700000 * 100)).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Profit Margin */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-blue-700">{results.profitMargin}%</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  results.profitMargin > 28 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {results.profitMargin > 28 ? '↑' : '↓'} {Math.abs((results.profitMargin - 28)).toFixed(1)}pp
                </span>
              </div>
            </div>

            {/* Cash Flow */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Cash Flow</p>
                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(results.cashFlow)}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  results.cashFlow > 850000 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {results.cashFlow > 850000 ? '↑' : '↓'} {Math.abs(((results.cashFlow - 850000) / 850000 * 100)).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* ROI */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Return on Investment</p>
                  <p className="text-2xl font-bold text-orange-700">{results.roi}%</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  results.roi > 38.9 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {results.roi > 38.9 ? '↑' : '↓'} {Math.abs((results.roi - 38.9)).toFixed(1)}pp
                </span>
              </div>
            </div>

            {/* Working Capital */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Working Capital</p>
                  <p className="text-2xl font-bold text-indigo-700">{formatCurrency(results.workingCapital)}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  results.workingCapital > 1600000 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {results.workingCapital > 1600000 ? '↑' : '↓'} {Math.abs(((results.workingCapital - 1600000) / 1600000 * 100)).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border border-gray-300">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Recommendation</h4>
              <p className="text-xs text-gray-600">
                {results.profitMargin > 30
                  ? "Excellent scenario! Consider implementing these changes gradually to minimize risk."
                  : results.profitMargin > 25
                  ? "Good scenario. Monitor market conditions before full implementation."
                  : "Caution advised. Consider adjusting parameters for better outcomes."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Interactive chart showing scenario impacts (Chart library integration pending)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatIfAnalysis;