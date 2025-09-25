import React, { useState, useEffect } from 'react'
import {
  CurrencyDollarIcon,
  ClockIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
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
  Radar,
  Sankey
} from 'recharts'

const WorkingCapitalOptimizer = () => {
  // Core working capital metrics
  const [metrics, setMetrics] = useState({
    annualRevenue: 3600000,
    cogs: 2340000,
    currentAssets: 850000,
    currentLiabilities: 620000,
    inventory: 380000,
    accountsReceivable: 420000,
    accountsPayable: 280000,
    prepaidExpenses: 50000,
    accruedExpenses: 45000
  })

  // DSO/DPO/DIO metrics
  const [cycleMetrics, setCycleMetrics] = useState({
    dso: 45, // Days Sales Outstanding
    dpo: 35, // Days Payable Outstanding
    dio: 55, // Days Inventory Outstanding
    targetDso: 30,
    targetDpo: 45,
    targetDio: 40
  })

  // Industry benchmarks
  const [benchmarks, setBenchmarks] = useState({
    industryDso: 38,
    industryDpo: 42,
    industryDio: 48,
    topQuartileDso: 28,
    topQuartileDpo: 50,
    topQuartileDio: 35
  })

  // Calculate derived metrics
  const dailyRevenue = metrics.annualRevenue / 365
  const dailyCogs = metrics.cogs / 365

  const currentWorkingCapital = metrics.currentAssets - metrics.currentLiabilities
  const workingCapitalRatio = metrics.currentAssets / metrics.currentLiabilities
  const quickRatio = (metrics.currentAssets - metrics.inventory) / metrics.currentLiabilities
  const currentRatio = metrics.currentAssets / metrics.currentLiabilities

  // Cash Conversion Cycle
  const currentCCC = cycleMetrics.dso + cycleMetrics.dio - cycleMetrics.dpo
  const targetCCC = cycleMetrics.targetDso + cycleMetrics.targetDio - cycleMetrics.targetDpo
  const industryCCC = benchmarks.industryDso + benchmarks.industryDio - benchmarks.industryDpo

  // Calculate cash impact of optimizations
  const calculateCashImpact = () => {
    const currentReceivables = dailyRevenue * cycleMetrics.dso
    const targetReceivables = dailyRevenue * cycleMetrics.targetDso
    const receivablesReduction = currentReceivables - targetReceivables

    const currentInventory = dailyCogs * cycleMetrics.dio
    const targetInventory = dailyCogs * cycleMetrics.targetDio
    const inventoryReduction = currentInventory - targetInventory

    const currentPayables = dailyCogs * cycleMetrics.dpo
    const targetPayables = dailyCogs * cycleMetrics.targetDpo
    const payablesIncrease = targetPayables - currentPayables

    const totalCashImpact = receivablesReduction + inventoryReduction + payablesIncrease

    return {
      receivablesImpact: receivablesReduction,
      inventoryImpact: inventoryReduction,
      payablesImpact: payablesIncrease,
      totalImpact: totalCashImpact,
      percentImprovement: (totalCashImpact / currentWorkingCapital) * 100
    }
  }

  const cashImpact = calculateCashImpact()

  // Generate optimization scenarios
  const generateScenarios = () => {
    return [
      {
        name: 'Conservative',
        dso: cycleMetrics.dso - 5,
        dpo: cycleMetrics.dpo + 5,
        dio: cycleMetrics.dio - 5,
        impact: dailyRevenue * 5 + dailyCogs * 5 + dailyCogs * 5
      },
      {
        name: 'Moderate',
        dso: cycleMetrics.dso - 10,
        dpo: cycleMetrics.dpo + 10,
        dio: cycleMetrics.dio - 10,
        impact: dailyRevenue * 10 + dailyCogs * 10 + dailyCogs * 10
      },
      {
        name: 'Aggressive',
        dso: cycleMetrics.targetDso,
        dpo: cycleMetrics.targetDpo,
        dio: cycleMetrics.targetDio,
        impact: cashImpact.totalImpact
      },
      {
        name: 'Best-in-Class',
        dso: benchmarks.topQuartileDso,
        dpo: benchmarks.topQuartileDpo,
        dio: benchmarks.topQuartileDio,
        impact: dailyRevenue * (cycleMetrics.dso - benchmarks.topQuartileDso) +
                dailyCogs * (cycleMetrics.dio - benchmarks.topQuartileDio) +
                dailyCogs * (benchmarks.topQuartileDpo - cycleMetrics.dpo)
      }
    ]
  }

  const scenarios = generateScenarios()

  // Generate trend data
  const generateTrendData = () => {
    const data = []
    for (let month = 0; month <= 12; month++) {
      const progress = month / 12
      const dso = cycleMetrics.dso - (cycleMetrics.dso - cycleMetrics.targetDso) * progress
      const dpo = cycleMetrics.dpo + (cycleMetrics.targetDpo - cycleMetrics.dpo) * progress
      const dio = cycleMetrics.dio - (cycleMetrics.dio - cycleMetrics.targetDio) * progress

      data.push({
        month: `M${month}`,
        dso: Math.round(dso),
        dpo: Math.round(dpo),
        dio: Math.round(dio),
        ccc: Math.round(dso + dio - dpo),
        cashFreed: Math.round(cashImpact.totalImpact * progress / 1000)
      })
    }
    return data
  }

  const trendData = generateTrendData()

  // Radar chart data for benchmarking
  const radarData = [
    {
      metric: 'DSO',
      current: cycleMetrics.dso,
      target: cycleMetrics.targetDso,
      industry: benchmarks.industryDso,
      bestInClass: benchmarks.topQuartileDso
    },
    {
      metric: 'DPO',
      current: cycleMetrics.dpo,
      target: cycleMetrics.targetDpo,
      industry: benchmarks.industryDpo,
      bestInClass: benchmarks.topQuartileDpo
    },
    {
      metric: 'DIO',
      current: cycleMetrics.dio,
      target: cycleMetrics.targetDio,
      industry: benchmarks.industryDio,
      bestInClass: benchmarks.topQuartileDio
    },
    {
      metric: 'CCC',
      current: currentCCC,
      target: targetCCC,
      industry: industryCCC,
      bestInClass: benchmarks.topQuartileDso + benchmarks.topQuartileDio - benchmarks.topQuartileDpo
    }
  ]

  // Action items based on metrics
  const generateActionItems = () => {
    const items = []

    if (cycleMetrics.dso > benchmarks.industryDso) {
      items.push({
        priority: 'high',
        area: 'Collections',
        action: 'Implement automated payment reminders',
        impact: `Reduce DSO by ${cycleMetrics.dso - benchmarks.industryDso} days`,
        value: dailyRevenue * (cycleMetrics.dso - benchmarks.industryDso)
      })
    }

    if (cycleMetrics.dio > benchmarks.industryDio) {
      items.push({
        priority: 'high',
        area: 'Inventory',
        action: 'Optimize inventory turnover and implement JIT',
        impact: `Reduce DIO by ${cycleMetrics.dio - benchmarks.industryDio} days`,
        value: dailyCogs * (cycleMetrics.dio - benchmarks.industryDio)
      })
    }

    if (cycleMetrics.dpo < benchmarks.industryDpo) {
      items.push({
        priority: 'medium',
        area: 'Payables',
        action: 'Negotiate extended payment terms with suppliers',
        impact: `Increase DPO by ${benchmarks.industryDpo - cycleMetrics.dpo} days`,
        value: dailyCogs * (benchmarks.industryDpo - cycleMetrics.dpo)
      })
    }

    items.push({
      priority: 'low',
      area: 'Process',
      action: 'Implement automated invoice processing',
      impact: 'Reduce processing time by 50%',
      value: 25000
    })

    return items.sort((a, b) => b.value - a.value)
  }

  const actionItems = generateActionItems()

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Working Capital Optimizer</h1>
            <p className="text-gray-600 mt-1">
              Optimize DSO, DPO, DIO to free up cash and improve liquidity
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Cash Conversion Cycle</p>
            <p className="text-2xl font-bold text-blue-600">{currentCCC} days</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <ClockIcon className="w-8 h-8 text-blue-600" />
            <span className="text-xs text-gray-500">DSO</span>
          </div>
          <p className="text-2xl font-bold">{cycleMetrics.dso} days</p>
          <p className="text-sm text-gray-600">Target: {cycleMetrics.targetDso} days</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (cycleMetrics.targetDso / cycleMetrics.dso) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <BanknotesIcon className="w-8 h-8 text-green-600" />
            <span className="text-xs text-gray-500">DPO</span>
          </div>
          <p className="text-2xl font-bold">{cycleMetrics.dpo} days</p>
          <p className="text-sm text-gray-600">Target: {cycleMetrics.targetDpo} days</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (cycleMetrics.dpo / cycleMetrics.targetDpo) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <ArrowPathIcon className="w-8 h-8 text-purple-600" />
            <span className="text-xs text-gray-500">DIO</span>
          </div>
          <p className="text-2xl font-bold">{cycleMetrics.dio} days</p>
          <p className="text-sm text-gray-600">Target: {cycleMetrics.targetDio} days</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (cycleMetrics.targetDio / cycleMetrics.dio) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <CurrencyDollarIcon className="w-8 h-8 text-orange-600" />
            <span className="text-xs text-gray-500">Impact</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            ${(cashImpact.totalImpact / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-gray-600">Cash to be freed</p>
          <p className="text-xs text-green-600 mt-2">
            +{cashImpact.percentImprovement.toFixed(1)}% improvement
          </p>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Optimization Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Sales Outstanding (DSO)
            </label>
            <input
              type="range"
              min="20"
              max="90"
              value={cycleMetrics.dso}
              onChange={(e) => setCycleMetrics({ ...cycleMetrics, dso: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Current: {cycleMetrics.dso} days</span>
              <span>Target: {cycleMetrics.targetDso} days</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Payable Outstanding (DPO)
            </label>
            <input
              type="range"
              min="20"
              max="90"
              value={cycleMetrics.dpo}
              onChange={(e) => setCycleMetrics({ ...cycleMetrics, dpo: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Current: {cycleMetrics.dpo} days</span>
              <span>Target: {cycleMetrics.targetDpo} days</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Inventory Outstanding (DIO)
            </label>
            <input
              type="range"
              min="20"
              max="120"
              value={cycleMetrics.dio}
              onChange={(e) => setCycleMetrics({ ...cycleMetrics, dio: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Current: {cycleMetrics.dio} days</span>
              <span>Target: {cycleMetrics.targetDio} days</span>
            </div>
          </div>
        </div>

        {/* Target Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target DSO (days)
            </label>
            <input
              type="number"
              value={cycleMetrics.targetDso}
              onChange={(e) => setCycleMetrics({ ...cycleMetrics, targetDso: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target DPO (days)
            </label>
            <input
              type="number"
              value={cycleMetrics.targetDpo}
              onChange={(e) => setCycleMetrics({ ...cycleMetrics, targetDpo: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target DIO (days)
            </label>
            <input
              type="number"
              value={cycleMetrics.targetDio}
              onChange={(e) => setCycleMetrics({ ...cycleMetrics, targetDio: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Cash Impact Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Cash Impact Analysis</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Receivables Reduction</p>
                <p className="text-sm text-blue-700">DSO: {cycleMetrics.dso} â†’ {cycleMetrics.targetDso} days</p>
              </div>
              <p className="text-xl font-bold text-blue-600">
                ${(cashImpact.receivablesImpact / 1000).toFixed(0)}K
              </p>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-purple-900">Inventory Reduction</p>
                <p className="text-sm text-purple-700">DIO: {cycleMetrics.dio} â†’ {cycleMetrics.targetDio} days</p>
              </div>
              <p className="text-xl font-bold text-purple-600">
                ${(cashImpact.inventoryImpact / 1000).toFixed(0)}K
              </p>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Payables Extension</p>
                <p className="text-sm text-green-700">DPO: {cycleMetrics.dpo} â†’ {cycleMetrics.targetDpo} days</p>
              </div>
              <p className="text-xl font-bold text-green-600">
                ${(cashImpact.payablesImpact / 1000).toFixed(0)}K
              </p>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <p className="font-bold text-orange-900">Total Cash Freed Up</p>
              <p className="text-2xl font-bold text-orange-600">
                ${(cashImpact.totalImpact / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        {/* Optimization Scenarios */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Optimization Scenarios</h2>
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <div key={scenario.name} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-sm text-gray-600">
                      DSO: {scenario.dso} | DPO: {scenario.dpo} | DIO: {scenario.dio}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${(scenario.impact / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-500">Cash freed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">12-Month Optimization Roadmap</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Cash Freed ($K)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="dso" stroke="#3B82F6" name="DSO" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="dpo" stroke="#10B981" name="DPO" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="dio" stroke="#8B5CF6" name="DIO" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="ccc" stroke="#F59E0B" name="CCC" strokeWidth={2} strokeDasharray="5 5" />
            <Line yAxisId="right" type="monotone" dataKey="cashFreed" stroke="#059669" name="Cash Freed" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Industry Benchmarking Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Industry Benchmarking</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar name="Current" dataKey="current" stroke="#3B82F6" fill="#93C5FD" fillOpacity={0.6} />
              <Radar name="Target" dataKey="target" stroke="#10B981" fill="#86EFAC" fillOpacity={0.6} />
              <Radar name="Industry" dataKey="industry" stroke="#F59E0B" fill="#FDE68A" fillOpacity={0.6} />
              <Radar name="Best-in-Class" dataKey="bestInClass" stroke="#8B5CF6" fill="#C4B5FD" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recommended Actions</h2>
          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start space-x-3">
                  {item.priority === 'high' ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : item.priority === 'medium' ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-600">{item.area} â€¢ {item.impact}</p>
                      </div>
                      <p className="text-sm font-bold text-green-600">
                        ${(item.value / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Ratios */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Working Capital Health Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{workingCapitalRatio.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Working Capital Ratio</p>
            <p className="text-xs text-gray-500 mt-1">Target: > 1.5</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold text-green-600">{quickRatio.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Quick Ratio</p>
            <p className="text-xs text-gray-500 mt-1">Target: > 1.0</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{currentRatio.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Current Ratio</p>
            <p className="text-xs text-gray-500 mt-1">Target: > 2.0</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold text-orange-600">${(currentWorkingCapital / 1000).toFixed(0)}K</p>
            <p className="text-sm text-gray-600">Working Capital</p>
            <p className="text-xs text-gray-500 mt-1">Available for operations</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkingCapitalOptimizer
