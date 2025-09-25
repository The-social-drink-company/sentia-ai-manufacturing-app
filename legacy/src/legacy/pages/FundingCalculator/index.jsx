import React, { useState, useEffect } from 'react'
import {
  CalculatorIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  RocketLaunchIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  BarChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  Bar,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { CashRunwayEngine } from '../../services/engines/CashRunwayEngine'

const FundingCalculator = () => {
  // Core financial metrics
  const [metrics, setMetrics] = useState({
    currentCash: 750000,
    monthlyRevenue: 285000,
    monthlyExpenses: 350000,
    grossMargin: 35,
    currentGrowthRate: 8,
    targetGrowthRate: 25,
    customerAcquisitionCost: 2500,
    lifetimeValue: 12000,
    churnRate: 5
  })

  // Funding scenarios
  const [scenarios, setScenarios] = useState({
    sustain: { months: 12, amount: 0 },
    growth: { months: 18, rate: 25, amount: 0 },
    aggressive: { months: 24, rate: 50, amount: 0 }
  })

  // Working capital metrics
  const [workingCapital, setWorkingCapital] = useState({
    dso: 45,
    dpo: 30,
    dio: 60,
    targetDso: 35,
    targetDpo: 45,
    targetDio: 45
  })

  // Funding options
  const [fundingOptions, setFundingOptions] = useState([
    { type: 'Equity', amount: 0, cost: 25, dilution: 20, selected: false },
    { type: 'Debt', amount: 0, cost: 12, term: 36, selected: false },
    { type: 'Revenue-Based', amount: 0, cost: 8, cap: 2.5, selected: false },
    { type: 'Convertible', amount: 0, cost: 6, discount: 20, selected: false }
  ])

  const engine = new CashRunwayEngine()

  // Calculate funding requirements for different scenarios
  useEffect(() => {
    // Sustain scenario - maintain current operations
    const sustainMonths = scenarios.sustain.months
    const netBurn = metrics.monthlyExpenses - metrics.monthlyRevenue
    const sustainFunding = Math.max(0, netBurn * sustainMonths - metrics.currentCash)

    // Growth scenario - target growth rate
    const growthFunding = engine.calculateGrowthFunding({
      currentCash: metrics.currentCash,
      monthlyBurnRate: metrics.monthlyExpenses,
      monthlyRevenue: metrics.monthlyRevenue,
      targetGrowthRate: scenarios.growth.rate,
      growthPeriodMonths: scenarios.growth.months,
      customerAcquisitionCost: metrics.customerAcquisitionCost,
      lifetimeValue: metrics.lifetimeValue
    })

    // Aggressive scenario
    const aggressiveFunding = engine.calculateGrowthFunding({
      currentCash: metrics.currentCash,
      monthlyBurnRate: metrics.monthlyExpenses * 1.5,
      monthlyRevenue: metrics.monthlyRevenue,
      targetGrowthRate: scenarios.aggressive.rate,
      growthPeriodMonths: scenarios.aggressive.months,
      customerAcquisitionCost: metrics.customerAcquisitionCost * 0.8,
      lifetimeValue: metrics.lifetimeValue
    })

    setScenarios(prev => ({
      ...prev,
      sustain: { ...prev.sustain, amount: sustainFunding },
      growth: { ...prev.growth, amount: growthFunding.bufferFunding },
      aggressive: { ...prev.aggressive, amount: aggressiveFunding.bufferFunding }
    }))
  }, [metrics])

  // Calculate unit economics
  const unitEconomics = {
    ltv: metrics.lifetimeValue,
    cac: metrics.customerAcquisitionCost,
    ratio: (metrics.lifetimeValue / metrics.customerAcquisitionCost).toFixed(2),
    paybackPeriod: (metrics.customerAcquisitionCost / (metrics.monthlyRevenue / 100)).toFixed(1),
    grossMargin: metrics.grossMargin
  }

  // Generate growth projection data
  const generateGrowthProjection = (fundingAmount, growthRate) => {
    const data = []
    let revenue = metrics.monthlyRevenue
    let expenses = metrics.monthlyExpenses
    let cash = metrics.currentCash + fundingAmount

    for (let month = 0; month <= 24; month++) {
      revenue = revenue * (1 + growthRate / 100)
      expenses = expenses * (1 + growthRate / 100 * 0.7) // Expenses grow slower
      cash = cash + revenue - expenses

      data.push({
        month,
        revenue: revenue / 1000,
        expenses: expenses / 1000,
        cash: cash / 1000,
        netIncome: (revenue - expenses) / 1000,
        breakeven: revenue >= expenses
      })
    }

    return data
  }

  const sustainProjection = generateGrowthProjection(scenarios.sustain.amount, metrics.currentGrowthRate)
  const growthProjection = generateGrowthProjection(scenarios.growth.amount, scenarios.growth.rate)
  const aggressiveProjection = generateGrowthProjection(scenarios.aggressive.amount, scenarios.aggressive.rate)

  // Calculate funding mix optimization
  const calculateFundingMix = (targetAmount) => {
    const mix = []
    let remaining = targetAmount

    fundingOptions.forEach(option => {
      if (option.selected && remaining > 0) {
        const amount = Math.min(remaining, option.amount || targetAmount * 0.4)
        mix.push({
          ...option,
          actualAmount: amount,
          annualCost: amount * (option.cost / 100)
        })
        remaining -= amount
      }
    })

    return mix
  }

  // Working capital optimization impact
  const wcOptimization = engine.analyzeWorkingCapitalImpact({
    revenue: metrics.monthlyRevenue,
    netBurnRate: metrics.monthlyExpenses - metrics.monthlyRevenue,
    ...workingCapital
  })

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Funding Calculator</h1>
            <p className="text-gray-600 mt-1">
              Calculate funding requirements for sustaining operations and growth scenarios
            </p>
          </div>
          <CalculatorIcon className="w-10 h-10 text-blue-600" />
        </div>
      </div>

      {/* Core Metrics Input */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Current Financial Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Cash
            </label>
            <input
              type="number"
              value={metrics.currentCash}
              onChange={(e) => setMetrics({ ...metrics, currentCash: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Revenue
            </label>
            <input
              type="number"
              value={metrics.monthlyRevenue}
              onChange={(e) => setMetrics({ ...metrics, monthlyRevenue: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Expenses
            </label>
            <input
              type="number"
              value={metrics.monthlyExpenses}
              onChange={(e) => setMetrics({ ...metrics, monthlyExpenses: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gross Margin %
            </label>
            <input
              type="number"
              value={metrics.grossMargin}
              onChange={(e) => setMetrics({ ...metrics, grossMargin: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Funding Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sustain Operations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sustain Operations</h3>
            <BanknotesIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Coverage Period (months)</label>
              <input
                type="range"
                min="6"
                max="24"
                value={scenarios.sustain.months}
                onChange={(e) => setScenarios({
                  ...scenarios,
                  sustain: { ...scenarios.sustain, months: Number(e.target.value) }
                })}
                className="w-full"
              />
              <div className="text-sm text-gray-700 font-medium">
                {scenarios.sustain.months} months
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Funding Required</p>
              <p className="text-2xl font-bold text-blue-600">
                ${(scenarios.sustain.amount / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500 mt-1">
                To maintain current operations
              </p>
            </div>
          </div>
        </div>

        {/* Growth Scenario */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Growth Funding</h3>
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Target Growth Rate (%)</label>
              <input
                type="range"
                min="10"
                max="50"
                value={scenarios.growth.rate}
                onChange={(e) => setScenarios({
                  ...scenarios,
                  growth: { ...scenarios.growth, rate: Number(e.target.value) }
                })}
                className="w-full"
              />
              <div className="text-sm text-gray-700 font-medium">
                {scenarios.growth.rate}% monthly
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Funding Required</p>
              <p className="text-2xl font-bold text-green-600">
                ${(scenarios.growth.amount / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500 mt-1">
                To achieve {scenarios.growth.rate}% growth
              </p>
            </div>
          </div>
        </div>

        {/* Aggressive Growth */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Aggressive Growth</h3>
            <RocketLaunchIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Target Growth Rate (%)</label>
              <input
                type="range"
                min="30"
                max="100"
                value={scenarios.aggressive.rate}
                onChange={(e) => setScenarios({
                  ...scenarios,
                  aggressive: { ...scenarios.aggressive, rate: Number(e.target.value) }
                })}
                className="w-full"
              />
              <div className="text-sm text-gray-700 font-medium">
                {scenarios.aggressive.rate}% monthly
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Funding Required</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(scenarios.aggressive.amount / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500 mt-1">
                To achieve {scenarios.aggressive.rate}% growth
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Unit Economics</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Customer Acquisition Cost</label>
                <input
                  type="number"
                  value={metrics.customerAcquisitionCost}
                  onChange={(e) => setMetrics({ ...metrics, customerAcquisitionCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Lifetime Value</label>
                <input
                  type="number"
                  value={metrics.lifetimeValue}
                  onChange={(e) => setMetrics({ ...metrics, lifetimeValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{unitEconomics.ratio}x</p>
                <p className="text-xs text-gray-600">LTV/CAC Ratio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{unitEconomics.paybackPeriod}mo</p>
                <p className="text-xs text-gray-600">Payback Period</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{unitEconomics.grossMargin}%</p>
                <p className="text-xs text-gray-600">Gross Margin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Working Capital Optimization */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Working Capital Impact</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">DSO Optimization</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{workingCapital.dso} â†’ {workingCapital.targetDso} days</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">DPO Optimization</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{workingCapital.dpo} â†’ {workingCapital.targetDpo} days</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">DIO Optimization</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{workingCapital.dio} â†’ {workingCapital.targetDio} days</span>
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cash Freed Up</span>
                <span className="text-lg font-bold text-green-600">
                  ${(wcOptimization.impact.cashFreedUp / 1000).toFixed(0)}K
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Additional runway: +{wcOptimization.impact.additionalRunwayMonths.toFixed(1)} months
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Projections Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">24-Month Growth Projections</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              domain={[0, 24]}
              ticks={[0, 6, 12, 18, 24]}
            />
            <YAxis label={{ value: 'Amount ($K)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `$${value.toFixed(0)}K`} />
            <Legend />

            <Line
              type="monotone"
              data={sustainProjection}
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Sustain Revenue"
              dot={false}
            />
            <Line
              type="monotone"
              data={growthProjection}
              dataKey="revenue"
              stroke="#10B981"
              strokeWidth={2}
              name="Growth Revenue"
              dot={false}
            />
            <Line
              type="monotone"
              data={aggressiveProjection}
              dataKey="revenue"
              stroke="#8B5CF6"
              strokeWidth={2}
              name="Aggressive Revenue"
              dot={false}
            />
            <Line
              type="monotone"
              data={sustainProjection}
              dataKey="cash"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Sustain Cash"
              dot={false}
            />
            <ReferenceLine y={0} stroke="red" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Funding Options Comparison */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Funding Options Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {fundingOptions.map((option, index) => (
            <div key={option.type} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{option.type}</h4>
                <input
                  type="checkbox"
                  checked={option.selected}
                  onChange={(e) => {
                    const updated = [...fundingOptions]
                    updated[index].selected = e.target.checked
                    setFundingOptions(updated)
                  }}
                  className="w-4 h-4"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">Amount ($K)</label>
                  <input
                    type="number"
                    value={option.amount / 1000}
                    onChange={(e) => {
                      const updated = [...fundingOptions]
                      updated[index].amount = Number(e.target.value) * 1000
                      setFundingOptions(updated)
                    }}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Cost: {option.cost}%
                  {option.type === 'Equity' && ` (${option.dilution}% dilution)`}
                  {option.type === 'Debt' && ` (${option.term}mo term)`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Key Funding Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-blue-900">Current Runway</h4>
            <p className="text-sm text-blue-700 mt-1">
              {Math.floor(metrics.currentCash / (metrics.monthlyExpenses - metrics.monthlyRevenue))} months
              without additional funding
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-green-900">Break-even Timeline</h4>
            <p className="text-sm text-green-700 mt-1">
              With {scenarios.growth.rate}% growth, break-even in{' '}
              {growthProjection.findIndex(p => p.breakeven) + 1} months
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <BuildingLibraryIcon className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-purple-900">Optimal Funding</h4>
            <p className="text-sm text-purple-700 mt-1">
              ${((scenarios.growth.amount + wcOptimization.impact.cashFreedUp) / 1000).toFixed(0)}K
              including WC optimization
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FundingCalculator
