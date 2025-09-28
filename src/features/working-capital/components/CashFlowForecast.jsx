import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function CashFlowForecast({ data, period = 'current' }) {
  const [forecastPeriod, setForecastPeriod] = useState('30')

  // Mock forecast data if not provided
  const generateForecastData = (_days) => {
    const startDate = new Date()
    const forecast = []
    let runningBalance = 150000 // Starting cash balance

    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)

      // Mock cash flows - varies by day of month
      const dayOfMonth = date.getDate()
      const isPayrollWeek = Math.floor(i / 7) % 2 === 0
      const isMonthEnd = dayOfMonth >= 28

      let inflow = 8000 + Math.random() * 4000 // Base daily receipts
      let outflow = 6000 + Math.random() * 2000 // Base daily payments

      // Add variations
      if (isPayrollWeek) outflow += 15000 // Payroll
      if (isMonthEnd) outflow += 20000 // Month-end bills
      if (dayOfMonth <= 5) inflow += 25000 // Early month collections

      runningBalance = runningBalance + inflow - outflow

      forecast.push({
        date: date.toISOString().split('T')[0],
        dateFormatted: date.toLocaleDateString(),
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        netFlow: Math.round(inflow - outflow),
        runningBalance: Math.round(runningBalance),
        dayOfWeek: date.toLocaleDateString('en', { weekday: 'short' })
      })
    }

    return forecast
  }

  const forecastData = data || generateForecastData(forecastPeriod)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value))
  }

  // Calculate summary statistics
  const totalInflow = forecastData.reduce((sum, day) => sum + day.inflow, 0)
  const totalOutflow = forecastData.reduce((sum, day) => sum + day.outflow, 0)
  const netCashFlow = totalInflow - totalOutflow
  const minBalance = Math.min(...forecastData.map(d => d.runningBalance))
  const maxBalance = Math.max(...forecastData.map(d => d.runningBalance))

  // Identify cash shortfall days
  const shortfallDays = forecastData.filter(d => d.runningBalance < 50000)

  const getBalanceColor = (balance) => {
    if (balance < 25000) return 'text-red-600 dark:text-red-400'
    if (balance < 75000) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getBalanceBgColor = (balance) => {
    if (balance < 25000) return 'bg-red-50 dark:bg-red-900/20'
    if (balance < 75000) return 'bg-yellow-50 dark:bg-yellow-900/20'
    return 'bg-green-50 dark:bg-green-900/20'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cash Flow Forecast
        </h3>

        {/* Period Selector */}
        <select
          value={forecastPeriod}
          onChange={(e) => setForecastPeriod(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="30">30 Days</option>
          <option value="60">60 Days</option>
          <option value="90">90 Days</option>
          <option value="180">180 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Inflow</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(totalInflow)}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">Total Outflow</p>
          <p className="text-lg font-bold text-red-900 dark:text-red-100">
            -{formatCurrency(totalOutflow)}
          </p>
        </div>

        <div className={`rounded-lg p-4 ${
          netCashFlow >= 0
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <p className={`text-sm ${
            netCashFlow >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            Net Cash Flow
          </p>
          <p className={`text-lg font-bold ${
            netCashFlow >= 0
              ? 'text-green-900 dark:text-green-100'
              : 'text-red-900 dark:text-red-100'
          }`}>
            {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
          </p>
        </div>

        <div className={`rounded-lg p-4 ${getBalanceBgColor(minBalance)}`}>
          <p className={`text-sm ${getBalanceColor(minBalance)}`}>
            Min Balance
          </p>
          <p className={`text-lg font-bold ${getBalanceColor(minBalance)}`}>
            {formatCurrency(minBalance)}
          </p>
        </div>
      </div>

      {/* Cash Shortfall Warning */}
      {shortfallDays.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Cash Flow Alert
          </h4>
          <p className="text-sm text-red-600 dark:text-red-400">
            Projected cash balance will fall below $50,000 on {shortfallDays.length} day(s).
            Consider accelerating collections or delaying non-critical payments.
          </p>
        </div>
      )}

      {/* Forecast Table */}
      <div className="overflow-x-auto">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Inflow
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Outflow
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Net Flow
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {forecastData.slice(0, 30).map((day, index) => (
                <tr key={day.date} className={`${
                  day.runningBalance < 50000 ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {day.dateFormatted}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {day.dayOfWeek}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-green-600 dark:text-green-400">
                    +{formatCurrency(day.inflow)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-red-600 dark:text-red-400">
                    -{formatCurrency(day.outflow)}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-right text-sm font-medium ${
                    day.netFlow >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {day.netFlow >= 0 ? '+' : ''}{formatCurrency(day.netFlow)}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-right text-sm font-bold ${getBalanceColor(day.runningBalance)}`}>
                    {formatCurrency(day.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View More Button */}
      {forecastData.length > 30 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View All {forecastData.length} Days →
          </button>
        </div>
      )}
    </div>
  )
}