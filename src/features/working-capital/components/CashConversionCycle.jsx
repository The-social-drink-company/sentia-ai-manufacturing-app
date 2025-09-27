import React from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function CashConversionCycle({ dso, dio, dpo, historical }) {
  // Default values for demo
  const defaultDSO = dso || 45
  const defaultDIO = dio || 30
  const defaultDPO = dpo || 25
  const currentCCC = defaultDSO + defaultDIO - defaultDPO

  // Mock historical data if not provided
  const defaultHistorical = historical || [
    { month: 'Jan', ccc: 55, dso: 48, dio: 32, dpo: 25 },
    { month: 'Feb', ccc: 52, dso: 46, dio: 31, dpo: 25 },
    { month: 'Mar', ccc: 48, dso: 44, dio: 29, dpo: 25 },
    { month: 'Apr', ccc: 50, dso: 45, dio: 30, dpo: 25 },
    { month: 'May', ccc: 50, dso: 45, dio: 30, dpo: 25 },
    { month: 'Jun', ccc: currentCCC, dso: defaultDSO, dio: defaultDIO, dpo: defaultDPO }
  ]

  const trend = defaultHistorical.length > 1
    ? ((currentCCC - defaultHistorical[defaultHistorical.length - 2].ccc) / defaultHistorical[defaultHistorical.length - 2].ccc) * 100
    : 0

  const isImproving = trend < 0 // Lower CCC is better

  const getOptimalRange = (value, type) => {
    const ranges = {
      dso: { optimal: 30, good: 45, warning: 60 },
      dio: { optimal: 20, good: 35, warning: 50 },
      dpo: { optimal: 35, good: 25, warning: 15 },
      ccc: { optimal: 30, good: 50, warning: 70 }
    }

    const range = ranges[type]
    if (!range) return 'good'

    if (type === 'dpo') {
      // For DPO, higher is better (we want to delay payments)
      return value >= range.optimal ? 'optimal' : value >= range.good ? 'good' : 'warning'
    } else {
      // For DSO, DIO, CCC, lower is better
      return value <= range.optimal ? 'optimal' : value <= range.good ? 'good' : 'warning'
    }
  }

  const getColorClass = (_status) => {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cash Conversion Cycle
      </h3>

      {/* CCC Formula Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className={`text-center p-3 rounded-lg ${getColorClass(getOptimalRange(defaultDSO, 'dso'))}`}>
            <div className="text-sm font-medium">DSO</div>
            <div className="text-lg font-bold">{defaultDSO}</div>
            <div className="text-xs">days</div>
          </div>

          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-lg font-bold">+</span>
          </div>

          <div className={`text-center p-3 rounded-lg ${getColorClass(getOptimalRange(defaultDIO, 'dio'))}`}>
            <div className="text-sm font-medium">DIO</div>
            <div className="text-lg font-bold">{defaultDIO}</div>
            <div className="text-xs">days</div>
          </div>

          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-lg font-bold">-</span>
          </div>

          <div className={`text-center p-3 rounded-lg ${getColorClass(getOptimalRange(defaultDPO, 'dpo'))}`}>
            <div className="text-sm font-medium">DPO</div>
            <div className="text-lg font-bold">{defaultDPO}</div>
            <div className="text-xs">days</div>
          </div>

          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-lg font-bold">=</span>
          </div>

          <div className={`text-center p-4 rounded-lg border-2 border-dashed ${
            getOptimalRange(currentCCC, 'ccc') === 'optimal' ? 'border-green-500' :
            getOptimalRange(currentCCC, 'ccc') === 'good' ? 'border-blue-500' : 'border-orange-500'
          }`}>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">CCC</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentCCC}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">days</div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Trend vs Previous Period</span>
          <div className={`flex items-center text-sm font-medium ${
            isImproving ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <span>{isImproving ? '↓' : '↑'} {Math.abs(trend).toFixed(1)}%</span>
            <span className="ml-1">{isImproving ? 'Improving' : 'Worsening'}</span>
          </div>
        </div>
      </div>

      {/* Historical Chart (Simple Line Visualization) */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">6-Month Trend</h4>
        <div className="relative h-24 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <div className="flex h-full items-end justify-between">
            {defaultHistorical.map((period, index) => {
              const maxCCC = Math.max(...defaultHistorical.map(p => p.ccc))
              const height = (period.ccc / maxCCC) * 100

              return (
                <div key={period.month} className="flex flex-col items-center">
                  <div
                    className={`w-6 rounded-t transition-all duration-300 ${
                      index === defaultHistorical.length - 1
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {period.month}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Analysis</h4>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-400">DSO Status</div>
            <div className={`font-medium ${
              getOptimalRange(defaultDSO, 'dso') === 'optimal' ? 'text-green-600' :
              getOptimalRange(defaultDSO, 'dso') === 'good' ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {getOptimalRange(defaultDSO, 'dso').toUpperCase()}
            </div>
          </div>

          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-400">DIO Status</div>
            <div className={`font-medium ${
              getOptimalRange(defaultDIO, 'dio') === 'optimal' ? 'text-green-600' :
              getOptimalRange(defaultDIO, 'dio') === 'good' ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {getOptimalRange(defaultDIO, 'dio').toUpperCase()}
            </div>
          </div>

          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-400">DPO Status</div>
            <div className={`font-medium ${
              getOptimalRange(defaultDPO, 'dpo') === 'optimal' ? 'text-green-600' :
              getOptimalRange(defaultDPO, 'dpo') === 'good' ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {getOptimalRange(defaultDPO, 'dpo').toUpperCase()}
            </div>
          </div>
        </div>

        {currentCCC > 50 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Optimization Opportunity:</strong> Your CCC of {currentCCC} days is above the recommended range.
              Consider accelerating collections or optimizing inventory levels.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}