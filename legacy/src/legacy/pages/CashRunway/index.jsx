import React, { useState, useEffect } from 'react'
import {
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { Line, Bar, Area } from 'recharts'
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
  ReferenceLine
} from 'recharts'

const CashRunway = () => {
  // Core state for cash runway calculations
  const [currentCash, setCurrentCash] = useState(1250000)
  const [monthlyBurnRate, setMonthlyBurnRate] = useState(185000)
  const [monthlyRevenue, setMonthlyRevenue] = useState(145000)
  const [growthRate, setGrowthRate] = useState(5) // % monthly growth
  const [selectedPeriod, setSelectedPeriod] = useState(180) // days

  // Expense breakdown state
  const [expenses, setExpenses] = useState({
    payroll: 85000,
    rent: 15000,
    inventory: 35000,
    marketing: 12000,
    operations: 18000,
    other: 20000
  })

  // Calculate net burn rate
  const netBurnRate = monthlyBurnRate - monthlyRevenue

  // Calculate runway in months
  const runwayMonths = currentCash > 0 && netBurnRate > 0
    ? Math.floor(currentCash / netBurnRate)
    : currentCash > 0 ? 999 : 0

  // Calculate runway in days
  const runwayDays = runwayMonths * 30

  // Generate projection data for the chart
  const generateProjectionData = () => {
    const data = []
    let cash = currentCash
    let revenue = monthlyRevenue

    for (let month = 0; month <= 12; month++) {
      const burn = monthlyBurnRate
      revenue = revenue * (1 + growthRate / 100)
      cash = cash - burn + revenue

      data.push({
        month: `Month ${month}`,
        cash: Math.max(0, cash),
        revenue: revenue,
        expenses: burn,
        netBurn: burn - revenue,
        runwayDays: Math.max(0, Math.floor((cash / (burn - revenue)) * 30))
      })

      if (cash <= 0) break
    }

    return data
  }

  const projectionData = generateProjectionData()

  // Calculate cash needed for different periods
  const calculateCashNeeded = (days) => {
    const months = days / 30
    let totalNeeded = 0
    let revenue = monthlyRevenue

    for (let month = 0; month < months; month++) {
      revenue = revenue * (1 + growthRate / 100)
      totalNeeded += monthlyBurnRate - revenue
    }

    return Math.max(0, totalNeeded)
  }

  const cashNeededPeriods = [
    { days: 30, needed: calculateCashNeeded(30), label: '30 Days' },
    { days: 60, needed: calculateCashNeeded(60), label: '60 Days' },
    { days: 90, needed: calculateCashNeeded(90), label: '90 Days' },
    { days: 120, needed: calculateCashNeeded(120), label: '120 Days' },
    { days: 180, needed: calculateCashNeeded(180), label: '180 Days' }
  ]

  // Determine runway status
  const getRunwayStatus = () => {
    if (runwayMonths > 18) return { status: 'Healthy', color: 'text-green-600', bg: 'bg-green-100' }
    if (runwayMonths > 9) return { status: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (runwayMonths > 6) return { status: 'Warning', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { status: 'Critical', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const runwayStatus = getRunwayStatus()

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cash Runway Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor your cash position and runway across multiple time horizons
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${runwayStatus.bg}`}>
            <span className={`text-sm font-medium ${runwayStatus.color}`}>
              Status: {runwayStatus.status}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Cash</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(currentCash / 1000).toFixed(0)}K
              </p>
            </div>
            <BanknotesIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Burn Rate</p>
              <p className="text-2xl font-bold text-red-600">
                ${(netBurnRate / 1000).toFixed(0)}K
              </p>
            </div>
            <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Runway</p>
              <p className="text-2xl font-bold text-gray-900">
                {runwayMonths} Months
              </p>
            </div>
            <CalendarDaysIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Days Remaining</p>
              <p className="text-2xl font-bold text-gray-900">
                {runwayDays} Days
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Scenario Modeling</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Cash Balance
            </label>
            <input
              type="range"
              min="0"
              max="5000000"
              step="50000"
              value={currentCash}
              onChange={(e) => setCurrentCash(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">
              ${(currentCash / 1000).toFixed(0)}K
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Expenses
            </label>
            <input
              type="range"
              min="50000"
              max="500000"
              step="5000"
              value={monthlyBurnRate}
              onChange={(e) => setMonthlyBurnRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">
              ${(monthlyBurnRate / 1000).toFixed(0)}K
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Revenue
            </label>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">
              ${(monthlyRevenue / 1000).toFixed(0)}K
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Growth Rate
            </label>
            <input
              type="range"
              min="-10"
              max="50"
              step="1"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">
              {growthRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Cash Needed for Coverage Periods */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Cash Requirements by Period</h2>
        <div className="grid grid-cols-5 gap-4">
          {cashNeededPeriods.map((period) => (
            <div
              key={period.days}
              className={`border rounded-lg p-4 text-center cursor-pointer transition-all
                ${selectedPeriod === period.days
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setSelectedPeriod(period.days)}
            >
              <div className="text-sm text-gray-600 mb-1">{period.label}</div>
              <div className="text-xl font-bold text-gray-900">
                ${(period.needed / 1000).toFixed(0)}K
              </div>
              <div className={`text-xs mt-1 ${
                period.needed <= currentCash ? 'text-green-600' : 'text-red-600'
              }`}>
                {period.needed <= currentCash ? 'Covered' : 'Shortfall'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cash Flow Projection Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Cash Flow Projection</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
            <Legend />
            <ReferenceLine y={0} stroke="red" strokeDasharray="5 5" />
            <Area
              type="monotone"
              dataKey="cash"
              stackId="1"
              stroke="#3B82F6"
              fill="#93C5FD"
              name="Cash Balance"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="2"
              stroke="#10B981"
              fill="#86EFAC"
              name="Revenue"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stackId="2"
              stroke="#EF4444"
              fill="#FCA5A5"
              name="Expenses"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Expense Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(expenses).map(([key, value]) => ({
              category: key.charAt(0).toUpperCase() + key.slice(1),
              amount: value
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
              <Bar dataKey="amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Runway Timeline</h2>
          <div className="space-y-3">
            {cashNeededPeriods.map((period, index) => {
              const covered = period.needed <= currentCash
              const percentage = Math.min(100, (currentCash / period.needed) * 100)

              return (
                <div key={period.days} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{period.label}</span>
                    <span className={covered ? 'text-green-600' : 'text-red-600'}>
                      {covered ? 'Covered' : `$${((period.needed - currentCash) / 1000).toFixed(0)}K Short`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        covered ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Alerts & Recommendations</h2>
        <div className="space-y-3">
          {runwayMonths < 6 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Critical: Low Cash Runway</p>
                <p className="text-sm text-red-700">
                  Your current runway is {runwayMonths} months. Consider raising capital or reducing expenses immediately.
                </p>
              </div>
            </div>
          )}

          {netBurnRate > monthlyRevenue * 0.5 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Warning: High Burn Rate</p>
                <p className="text-sm text-yellow-700">
                  Your burn rate exceeds 50% of revenue. Focus on improving unit economics or securing funding.
                </p>
              </div>
            </div>
          )}

          {growthRate < 0 && (
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">Alert: Negative Growth</p>
                <p className="text-sm text-orange-700">
                  Revenue is declining. Review sales strategy and market conditions.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Recommendation</p>
              <p className="text-sm text-blue-700">
                To extend runway to 12 months, reduce monthly expenses by ${((netBurnRate - (currentCash / 12)) / 1000).toFixed(0)}K
                or increase revenue by ${((netBurnRate - (currentCash / 12)) / 1000).toFixed(0)}K.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CashRunway
