import React, { useMemo, useState } from 'react'

const formatCurrency = value => {
  if (value === null || value === undefined) {
    return '--'
  }

  const amount = typeof value === 'number' ? value : Number.parseFloat(value)

  if (Number.isNaN(amount)) {
    return '--'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function CashFlowForecast({ data, period = 'current' }) {
  const [forecastPeriod, setForecastPeriod] = useState('30')

  const series = useMemo(() => {
    if (!data?.series?.length) {
      return []
    }

    const window = Number.parseInt(forecastPeriod, 10)
    if (Number.isNaN(window) || window <= 0) {
      return data.series
    }

    return data.series.slice(-window)
  }, [data, forecastPeriod])

  if (!series.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cash Flow Forecast</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No cash flow records are available for the selected period ({period}). Verify that cash flow data is being ingested from your finance system.
        </p>
      </div>
    )
  }

  const totals = series.reduce(
    (acc, row) => {
      acc.inflow += row.inflow ?? 0
      acc.outflow += row.outflow ?? 0
      acc.net += row.netFlow ?? 0
      acc.minBalance = Math.min(acc.minBalance, row.runningBalance ?? acc.minBalance)
      acc.maxBalance = Math.max(acc.maxBalance, row.runningBalance ?? acc.maxBalance)
      return acc
    },
    {
      inflow: 0,
      outflow: 0,
      net: 0,
      minBalance: Number.POSITIVE_INFINITY,
      maxBalance: Number.NEGATIVE_INFINITY
    }
  )

  const shortfallDays = series.filter(row => (row.runningBalance ?? 0) < 50000)

  const getBalanceColour = balance => {
    if (balance < 25000) return 'text-red-600 dark:text-red-400'
    if (balance < 75000) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getBalanceBackground = balance => {
    if (balance < 25000) return 'bg-red-50 dark:bg-red-900/20'
    if (balance < 75000) return 'bg-yellow-50 dark:bg-yellow-900/20'
    return 'bg-green-50 dark:bg-green-900/20'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Flow Forecast</h3>
        <select
          value={forecastPeriod}
          onChange={event => setForecastPeriod(event.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="30">30 Days</option>
          <option value="60">60 Days</option>
          <option value="90">90 Days</option>
          <option value="180">180 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Inflow</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatCurrency(totals.inflow)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">Total Outflow</p>
          <p className="text-lg font-bold text-red-900 dark:text-red-100">-{formatCurrency(totals.outflow)}</p>
        </div>
        <div className={`${totals.net >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} rounded-lg p-4`}>
          <p className={`${totals.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm`}>
            Net Cash Flow
          </p>
          <p className={`${totals.net >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'} text-lg font-bold`}>
            {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
          </p>
        </div>
        <div className={`${getBalanceBackground(totals.minBalance)} rounded-lg p-4`}>
          <p className={`${getBalanceColour(totals.minBalance)} text-sm`}>Lowest Balance</p>
          <p className={`${getBalanceColour(totals.minBalance)} text-lg font-bold`}>
            {formatCurrency(totals.minBalance)}
          </p>
        </div>
      </div>

      {shortfallDays.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Cash flow alert</h4>
          <p className="text-sm text-red-600 dark:text-red-400">
            Cash balance is projected to fall below  on {shortfallDays.length} day(s). Consider accelerating collections or deferring discretionary spend.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Inflow</th>
              <th className="py-2 pr-4">Outflow</th>
              <th className="py-2 pr-4">Net</th>
              <th className="py-2 pr-4">Running balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-800 dark:text-gray-200">
            {series.map(row => (
              <tr key={row.date}>
                <td className="py-2 pr-4 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{formatCurrency(row.inflow)}</td>
                <td className="py-2 pr-4">-{formatCurrency(row.outflow)}</td>
                <td className={`py-2 pr-4 ${row.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {row.netFlow >= 0 ? '+' : ''}{formatCurrency(row.netFlow)}
                </td>
                <td className={`py-2 pr-4 ${getBalanceColour(row.runningBalance)}`}>
                  {formatCurrency(row.runningBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
