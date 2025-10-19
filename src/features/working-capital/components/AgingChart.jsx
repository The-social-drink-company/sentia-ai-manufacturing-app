import React, { useMemo } from 'react'

const formatCurrency = value => {
  if (value === null || value === undefined) {
    return '--'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const hasValues = buckets =>
  buckets &&
  Object.values(buckets).some(
    value => typeof value === 'number' && !Number.isNaN(value) && value !== 0
  )

export default function AgingChart({ receivables, payables, title }) {
  const agingBuckets = ['0-30', '31-60', '61-90', '90+']

  const chartData = useMemo(() => {
    const receivableBuckets = receivables && typeof receivables === 'object' ? receivables : null
    const payableBuckets = payables && typeof payables === 'object' ? payables : null

    const receivableTotal = receivableBuckets
      ? Object.values(receivableBuckets).reduce((acc, value) => acc + (value ?? 0), 0)
      : 0

    const payableTotal = payableBuckets
      ? Object.values(payableBuckets).reduce((acc, value) => acc + (value ?? 0), 0)
      : 0

    return {
      receivableBuckets,
      payableBuckets,
      receivableTotal,
      payableTotal,
    }
  }, [receivables, payables])

  const shouldRenderChart =
    hasValues(chartData.receivableBuckets) || hasValues(chartData.payableBuckets)

  if (!shouldRenderChart) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title || 'AR/AP Aging Analysis'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No aging breakdown is available yet. Connect your ERP/finance system to populate this
          view.
        </p>
      </div>
    )
  }

  const getBarColor = (bucket, type) => {
    const colours = {
      receivables: {
        '0-30': 'bg-green-500',
        '31-60': 'bg-yellow-500',
        '61-90': 'bg-orange-500',
        '90+': 'bg-red-500',
      },
      payables: {
        '0-30': 'bg-blue-500',
        '31-60': 'bg-indigo-500',
        '61-90': 'bg-purple-500',
        '90+': 'bg-pink-500',
      },
    }

    return colours[type]?.[bucket] ?? 'bg-gray-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title || 'AR/AP Aging Analysis'}
      </h3>

      <div className="flex justify-center mb-6">
        <div className="flex space-x-6">
          {chartData.receivableBuckets && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Receivables</span>
            </div>
          )}
          {chartData.payableBuckets && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Payables</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {agingBuckets.map(bucket => {
          const arValue = chartData.receivableBuckets?.[bucket] ?? 0
          const apValue = chartData.payableBuckets?.[bucket] ?? 0
          const arPercentage =
            chartData.receivableTotal > 0 ? (arValue / chartData.receivableTotal) * 100 : 0
          const apPercentage =
            chartData.payableTotal > 0 ? (apValue / chartData.payableTotal) * 100 : 0

          if (!arValue && !apValue) {
            return null
          }

          return (
            <div key={bucket} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {bucket} days
                </span>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    AR: {formatCurrency(arValue)}
                    {chartData.payableBuckets && <> | AP: {formatCurrency(apValue)}</>}
                  </div>
                </div>
              </div>

              {chartData.receivableBuckets && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Receivables ({arPercentage.toFixed(1)}%)
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 bg-green-500"
                      style={{ width: `${arPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {chartData.payableBuckets && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Payables ({apPercentage.toFixed(1)}%)
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 bg-blue-500"
                      style={{ width: `${apPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          {chartData.receivableBuckets && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Receivables</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(chartData.receivableTotal)}
              </p>
            </div>
          )}
          {chartData.payableBuckets && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Payables</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(chartData.payableTotal)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
