import React from 'react'

export default function AgingChart({ receivables, payables, title }) {
  // Mock data if not provided
  const defaultAgingData = {
    receivables: {
      '0-30': 45000,
      '31-60': 28000,
      '61-90': 12000,
      '90+': 8000
    },
    payables: {
      '0-30': 35000,
      '31-60': 20000,
      '61-90': 8000,
      '90+': 3000
    }
  }

  const arData = receivables || defaultAgingData.receivables
  const apData = payables || defaultAgingData.payables

  const formatCurrency = (_value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const agingBuckets = ['0-30', '31-60', '61-90', '90+']
  const arTotal = Object.values(arData).reduce((sum, _val) => sum + val, 0)
  const apTotal = Object.values(apData).reduce((sum, _val) => sum + val, 0)

  const getBarColor = (bucket, _type) => {
    const baseColors = {
      receivables: {
        '0-30': 'bg-green-500',
        '31-60': 'bg-yellow-500',
        '61-90': 'bg-orange-500',
        '90+': 'bg-red-500'
      },
      payables: {
        '0-30': 'bg-blue-500',
        '31-60': 'bg-indigo-500',
        '61-90': 'bg-purple-500',
        '90+': 'bg-pink-500'
      }
    }
    return baseColors[type][bucket] || 'bg-gray-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title || 'AR/AP Aging Analysis'}
      </h3>

      {/* Legend */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Receivables</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Payables</span>
          </div>
        </div>
      </div>

      {/* Aging Buckets */}
      <div className="space-y-6">
        _{agingBuckets.map((bucket) => {
          const arValue = arData[bucket] || 0
          const apValue = apData[bucket] || 0
          const arPercentage = arTotal > 0 ? (arValue / arTotal) * 100 : 0
          const apPercentage = apTotal > 0 ? (apValue / apTotal) * 100 : 0

          return (
            <div key={bucket} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {bucket} days
                </span>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    AR: {formatCurrency(arValue)} | AP: {formatCurrency(apValue)}
                  </div>
                </div>
              </div>

              {/* Receivables Bar */}
              <div className="relative">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Receivables ({arPercentage.toFixed(1)}%)
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getBarColor(bucket, 'receivables')}`}
                    style={{ width: `${arPercentage}%` }}
                  />
                </div>
              </div>

              {/* Payables Bar */}
              <div className="relative">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Payables ({apPercentage.toFixed(1)}%)
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getBarColor(bucket, 'payables')}`}
                    style={{ width: `${apPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Receivables</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(arTotal)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Payables</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(apTotal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}