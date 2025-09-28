import React from 'react'

const getRangeStatus = (value, type) => {
  const ranges = {
    dso: { optimal: 30, good: 45 },
    dio: { optimal: 20, good: 35 },
    dpo: { optimal: 35, good: 25 },
    ccc: { optimal: 30, good: 50 }
  }

  const range = ranges[type]
  if (!range || value === null || value === undefined) {
    return 'unknown'
  }

  if (type === 'dpo') {
    if (value >= range.optimal) return 'optimal'
    if (value >= range.good) return 'good'
    return 'warning'
  }

  if (value <= range.optimal) return 'optimal'
  if (value <= range.good) return 'good'
  return 'warning'
}

const colourClasses = status => {
  switch (status) {
    case 'optimal':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'good':
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'warning':
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

export default function CashConversionCycle({ dso, dio, dpo, historical = [] }) {
  if (dso === null && dio === null && dpo === null) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cash Conversion Cycle</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cash conversion cycle metrics are not available yet. Once at least one month of working capital data is ingested, the CCC visual will populate automatically.
        </p>
      </div>
    )
  }

  const currentCCC = (dso ?? 0) + (dio ?? 0) - (dpo ?? 0)
  const previousCCC = historical.length > 1 ? historical[historical.length - 2].ccc : null
  const trend = previousCCC ? ((currentCCC - previousCCC) / Math.abs(previousCCC)) * 100 : null
  const isImproving = trend !== null ? trend < 0 : null

  const cccStatus = getRangeStatus(currentCCC, 'ccc')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cash Conversion Cycle</h3>

      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className={	ext-center p-3 rounded-lg }>
            <div className="text-sm font-medium">DSO</div>
            <div className="text-lg font-bold">{dso ?? '--'}</div>
            <div className="text-xs">days</div>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-lg font-bold">+</div>
          <div className={	ext-center p-3 rounded-lg }>
            <div className="text-sm font-medium">DIO</div>
            <div className="text-lg font-bold">{dio ?? '--'}</div>
            <div className="text-xs">days</div>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-lg font-bold">-</div>
          <div className={	ext-center p-3 rounded-lg }>
            <div className="text-sm font-medium">DPO</div>
            <div className="text-lg font-bold">{dpo ?? '--'}</div>
            <div className="text-xs">days</div>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-lg font-bold">=</div>
          <div className={	ext-center p-4 rounded-lg border-2 border-dashed }>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">CCC</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{Number.isFinite(currentCCC) ? Math.round(currentCCC) : '--'}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">days</div>
          </div>
        </div>
      </div>

      {trend !== null && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trend vs previous period</span>
            <div className={lex items-center text-sm font-medium }>
              <span>{isImproving ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%</span>
              <span className="ml-1">{isImproving ? 'Improving' : 'Worsening'}</span>
            </div>
          </div>
        </div>
      )}

      {historical.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Historical trend</h4>
          <div className="relative h-24 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
            <div className="flex h-full items-end justify-between">
              {historical.map(period => {
                const maxCCC = Math.max(...historical.map(item => item.ccc)) || 1
                const height = (period.ccc / maxCCC) * 100

                return (
                  <div key={period.month || period.date} className="flex flex-col items-center">
                    <div
                      className={w-6 rounded-t transition-all duration-300 }
                      style={{ height: ${Math.max(height, 5)}% }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {period.month || new Date(period.date).toLocaleDateString('en', { month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
