import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Play,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Download,
  AlertTriangle,
} from 'lucide-react';

/**
 * WhatIfAnalysis Component
 *
 * Scenario modeling interface with:
 * - Scenario builder with parameter sliders
 * - Impact calculator for revenue, margin, units
 * - Comparison view (baseline vs. scenario)
 * - Sensitivity analysis visualization
 * - Export scenario results
 *
 * Use cases:
 * - Price optimization ("What if we increase price by 10%?")
 * - Demand modeling ("What if demand drops 20%?")
 * - Cost analysis ("What if COGS increases 15%?")
 * - Promotion planning ("What if we run a 25% off sale?")
 */
function WhatIfAnalysis() {
  // Baseline state (current reality)
  const [baseline] = useState({
    price: 25.00,
    demand: 10000,
    cogs: 12.50,
    marketingSpend: 5000,
    conversionRate: 3.5,
  });

  // Scenario state (what-if parameters)
  const [scenario, setScenario] = useState({ ...baseline });

  const [showComparison, setShowComparison] = useState(false);
  const [sensitivityMetric, setSensitivityMetric] = useState('revenue');

  // Calculate scenario mutation
  const calculateScenarioMutation = useMutation({
    mutationFn: async (params) => {
      const response = await fetch('/api/v1/analytics/what-if/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to calculate scenario');
      return response.json();
    },
  });

  const handleRunScenario = () => {
    calculateScenarioMutation.mutate({
      baseline,
      scenario,
    });
    setShowComparison(true);
  };

  const handleReset = () => {
    setScenario({ ...baseline });
    setShowComparison(false);
    calculateScenarioMutation.reset();
  };

  const handleExport = () => {
    console.log('Export scenario results');
    const exportData = {
      baseline,
      scenario,
      results: calculateScenarioMutation.data?.data,
      timestamp: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `what-if-scenario-${Date.now()}.json`;
    link.click();
  };

  // Calculate impacts
  const baselineRevenue = baseline.price * baseline.demand;
  const baselineProfit = (baseline.price - baseline.cogs) * baseline.demand - baseline.marketingSpend;
  const baselineMargin = ((baseline.price - baseline.cogs) / baseline.price) * 100;

  const scenarioRevenue = scenario.price * scenario.demand;
  const scenarioProfit = (scenario.price - scenario.cogs) * scenario.demand - scenario.marketingSpend;
  const scenarioMargin = ((scenario.price - scenario.cogs) / scenario.price) * 100;

  const revenueChange = ((scenarioRevenue - baselineRevenue) / baselineRevenue) * 100;
  const profitChange = ((scenarioProfit - baselineProfit) / baselineProfit) * 100;
  const marginChange = scenarioMargin - baselineMargin;

  // Sensitivity analysis data
  const sensitivityData = generateSensitivityData(baseline, sensitivityMetric);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">What-If Analysis</h1>
        <p className="text-gray-600 mt-1">
          Model scenarios and analyze potential impacts on revenue, profit, and operations
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Parameter Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Scenario Parameters
            </h2>

            <div className="space-y-6">
              {/* Price Slider */}
              <ParameterSlider
                label="Price"
                value={scenario.price}
                min={baseline.price * 0.5}
                max={baseline.price * 2}
                step={0.50}
                baseline={baseline.price}
                format={(v) => `£${v.toFixed(2)}`}
                onChange={(value) => setScenario({ ...scenario, price: value })}
                icon={DollarSign}
              />

              {/* Demand Slider */}
              <ParameterSlider
                label="Demand (units)"
                value={scenario.demand}
                min={baseline.demand * 0.3}
                max={baseline.demand * 1.7}
                step={100}
                baseline={baseline.demand}
                format={(v) => v.toLocaleString()}
                onChange={(value) => setScenario({ ...scenario, demand: value })}
                icon={Package}
              />

              {/* COGS Slider */}
              <ParameterSlider
                label="Cost of Goods Sold"
                value={scenario.cogs}
                min={baseline.cogs * 0.7}
                max={baseline.cogs * 1.5}
                step={0.25}
                baseline={baseline.cogs}
                format={(v) => `£${v.toFixed(2)}`}
                onChange={(value) => setScenario({ ...scenario, cogs: value })}
                icon={TrendingUp}
              />

              {/* Marketing Spend Slider */}
              <ParameterSlider
                label="Marketing Spend"
                value={scenario.marketingSpend}
                min={0}
                max={baseline.marketingSpend * 3}
                step={500}
                baseline={baseline.marketingSpend}
                format={(v) => `£${v.toLocaleString()}`}
                onChange={(value) => setScenario({ ...scenario, marketingSpend: value })}
                icon={Users}
              />

              {/* Conversion Rate Slider */}
              <ParameterSlider
                label="Conversion Rate"
                value={scenario.conversionRate}
                min={1.0}
                max={10.0}
                step={0.1}
                baseline={baseline.conversionRate}
                format={(v) => `${v.toFixed(1)}%`}
                onChange={(value) => setScenario({ ...scenario, conversionRate: value })}
                icon={TrendingUp}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleRunScenario}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Play className="w-5 h-5" />
                Run Scenario
              </button>
              <button
                onClick={handleReset}
                className="w-full py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Baseline
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Impact Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <ImpactCard
              label="Revenue Impact"
              baseline={baselineRevenue}
              scenario={scenarioRevenue}
              change={revenueChange}
              format="currency"
            />
            <ImpactCard
              label="Profit Impact"
              baseline={baselineProfit}
              scenario={scenarioProfit}
              change={profitChange}
              format="currency"
            />
            <ImpactCard
              label="Margin Impact"
              baseline={baselineMargin}
              scenario={scenarioMargin}
              change={marginChange}
              format="percentage"
            />
          </div>

          {/* Comparison Chart */}
          {showComparison && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Baseline vs. Scenario Comparison
                </h2>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Revenue',
                      Baseline: baselineRevenue,
                      Scenario: scenarioRevenue,
                    },
                    {
                      name: 'Profit',
                      Baseline: baselineProfit,
                      Scenario: scenarioProfit,
                    },
                    {
                      name: 'Units',
                      Baseline: baseline.demand,
                      Scenario: scenario.demand,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Baseline" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Scenario" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sensitivity Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Sensitivity Analysis
              </h2>
              <select
                value={sensitivityMetric}
                onChange={(e) => setSensitivityMetric(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 text-sm"
              >
                <option value="revenue">Revenue Sensitivity</option>
                <option value="profit">Profit Sensitivity</option>
                <option value="margin">Margin Sensitivity</option>
              </select>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Shows how {sensitivityMetric} changes with ±20% variation in each parameter
            </p>

            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={sensitivityData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="parameter" style={{ fontSize: '12px' }} />
                <PolarRadiusAxis style={{ fontSize: '12px' }} />
                <Radar
                  name="Negative Change (-20%)"
                  dataKey="negative"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Positive Change (+20%)"
                  dataKey="positive"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario Insights */}
          {showComparison && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Scenario Insights
                </h2>
              </div>

              <div className="space-y-3">
                <ScenarioInsight
                  condition={revenueChange < -10}
                  severity="warning"
                  title="Significant Revenue Decline"
                  message={`Revenue would decrease by ${Math.abs(revenueChange).toFixed(1)}%, impacting overall profitability.`}
                />
                <ScenarioInsight
                  condition={profitChange < -15}
                  severity="critical"
                  title="Profit Margin at Risk"
                  message={`Profit would decline by ${Math.abs(profitChange).toFixed(1)}%, potentially unsustainable.`}
                />
                <ScenarioInsight
                  condition={scenarioMargin < 30}
                  severity="warning"
                  title="Low Gross Margin"
                  message={`Margin of ${scenarioMargin.toFixed(1)}% is below industry target of 30%.`}
                />
                <ScenarioInsight
                  condition={revenueChange > 20}
                  severity="success"
                  title="Strong Revenue Growth"
                  message={`Revenue would increase by ${revenueChange.toFixed(1)}%, significantly improving performance.`}
                />
                <ScenarioInsight
                  condition={profitChange > 25}
                  severity="success"
                  title="Exceptional Profit Growth"
                  message={`Profit would increase by ${profitChange.toFixed(1)}%, excellent opportunity.`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ParameterSlider Component
 */
function ParameterSlider({ label, value, min, max, step, baseline, format, onChange, icon: Icon }) {
  const percentChange = ((value - baseline) / baseline) * 100;
  const isIncreased = value > baseline;
  const isDecreased = value < baseline;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">{label}</label>
        </div>
        <span className="text-sm font-semibold text-gray-900">{format(value)}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />

      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
        <span>{format(min)}</span>
        <span className={`font-medium ${isIncreased ? 'text-green-600' : isDecreased ? 'text-red-600' : 'text-gray-600'}`}>
          {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% vs baseline
        </span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

/**
 * ImpactCard Component
 */
function ImpactCard({ label, baseline, scenario, change, format }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  const formatValue = (value) => {
    if (format === 'currency') {
      return `£${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className={`rounded-lg p-6 border-2 ${isPositive ? 'border-green-500 bg-green-50' : isNegative ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <p className={`text-2xl font-bold mb-1 ${isPositive ? 'text-green-900' : isNegative ? 'text-red-900' : 'text-gray-900'}`}>
        {formatValue(scenario)}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">
          Baseline: {formatValue(baseline)}
        </span>
        <span className={`text-xs font-semibold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/**
 * ScenarioInsight Component
 */
function ScenarioInsight({ condition, severity, title, message }) {
  if (!condition) return null;

  const severityConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: '✓',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: '⚠',
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: '⚠',
    },
  };

  const config = severityConfig[severity];

  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1">
          <h3 className={`font-semibold ${config.text} mb-1`}>{title}</h3>
          <p className={`text-sm ${config.text}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper Functions
 */

function generateSensitivityData(baseline, metric) {
  const parameters = [
    { name: 'Price', key: 'price' },
    { name: 'Demand', key: 'demand' },
    { name: 'COGS', key: 'cogs' },
    { name: 'Marketing', key: 'marketingSpend' },
    { name: 'Conv. Rate', key: 'conversionRate' },
  ];

  return parameters.map((param) => {
    const negativeScenario = { ...baseline, [param.key]: baseline[param.key] * 0.8 };
    const positiveScenario = { ...baseline, [param.key]: baseline[param.key] * 1.2 };

    const baselineValue = calculateMetric(baseline, metric);
    const negativeValue = calculateMetric(negativeScenario, metric);
    const positiveValue = calculateMetric(positiveScenario, metric);

    return {
      parameter: param.name,
      negative: ((negativeValue - baselineValue) / baselineValue) * 100,
      positive: ((positiveValue - baselineValue) / baselineValue) * 100,
    };
  });
}

function calculateMetric(scenario, metric) {
  const revenue = scenario.price * scenario.demand;
  const profit = (scenario.price - scenario.cogs) * scenario.demand - scenario.marketingSpend;
  const margin = ((scenario.price - scenario.cogs) / scenario.price) * 100;

  if (metric === 'revenue') return revenue;
  if (metric === 'profit') return profit;
  if (metric === 'margin') return margin;
  return 0;
}

export default WhatIfAnalysis;
