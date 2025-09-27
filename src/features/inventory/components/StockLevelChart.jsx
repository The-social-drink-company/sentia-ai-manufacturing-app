import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar
} from 'recharts'

export default function StockLevelChart({ data, title, timeRange }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">No stock level data available</p>
        </div>
      </div>
    )
  }

  const formatTooltipValue = (value, name) => {
    if (name.includes('Level') || name.includes('Stock')) {
      return [value.toLocaleString(), name]
    }
    if (name.includes('Value')) {
      return [`$${value.toLocaleString()}`, name]
    }
    return [value, name]
  }

  const formatYAxisTick = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-gray-900 dark:text-white font-medium mb-2">{label}</p>
          {payload.map((entry, _index) => (
            <div key={index} className="flex items-center justify-between min-w-32">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.name}:
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white ml-4">
                {formatTooltipValue(entry.value, entry.name)[0]}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Determine chart type based on data structure
  const hasMultipleMetrics = data.some(item =>
    item.hasOwnProperty('currentStock') &&
    item.hasOwnProperty('minLevel') &&
    item.hasOwnProperty('maxLevel')
  )

  const hasValueData = data.some(item => item.hasOwnProperty('value'))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-blue-600 mr-2" />
            <span className="text-gray-600 dark:text-gray-400">Current Stock</span>
          </div>
          {hasMultipleMetrics && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded bg-red-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Min Level</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded bg-green-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Max Level</span>
              </div>
            </>
          )}
          {hasValueData && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-purple-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Value</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {hasMultipleMetrics ? (
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="period"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                tickFormatter={formatYAxisTick}
              />
              {hasValueData && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs text-gray-600 dark:text-gray-400"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${formatYAxisTick(value)}`}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Stock level lines */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="currentStock"
                stroke="#2563eb"
                strokeWidth={3}
                name="Current Stock"
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="minLevel"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Min Level"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="maxLevel"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Max Level"
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
              />

              {/* Value bars if available */}
              {hasValueData && (
                <Bar
                  yAxisId="right"
                  dataKey="value"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  name="Inventory Value"
                />
              )}
            </ComposedChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="period"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              <Line
                type="monotone"
                dataKey="currentStock"
                stroke="#2563eb"
                strokeWidth={3}
                name="Stock Level"
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Stock</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(data.reduce((sum, item) => sum + (item.currentStock || 0), 0) / data.length).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Stock Items</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.length}
          </p>
        </div>
        {hasMultipleMetrics && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Below Min</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              {data.filter(item => (item.currentStock || 0) < (item.minLevel || 0)).length}
            </p>
          </div>
        )}
        {hasValueData && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              ${data.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}