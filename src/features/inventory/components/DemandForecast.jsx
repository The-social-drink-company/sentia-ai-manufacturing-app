import React, { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'
import { CalendarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid'

export default function DemandForecast({ data, title, period = '30d' }) {
  const [selectedItem, setSelectedItem] = useState('all')
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true)

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">No forecast data available</p>
        </div>
      </div>
    )
  }

  // Extract unique items for filter dropdown
  const availableItems = ['all', ...new Set(data.flatMap(d => d.items?.map(item => item.name) || []))]

  // Filter and prepare data based on selected item
  const getFilteredData = () => {
    if (selectedItem === 'all') {
      return data.map(period => ({
        ...period,
        actualDemand: period.items?.reduce((sum, item) => sum + (item.actualDemand || 0), 0) || period.actualDemand || 0,
        forecastDemand: period.items?.reduce((sum, item) => sum + (item.forecastDemand || 0), 0) || period.forecastDemand || 0,
        upperBound: period.items?.reduce((sum, item) => sum + (item.upperBound || item.forecastDemand * 1.2 || 0), 0) || period.upperBound || 0,
        lowerBound: period.items?.reduce((sum, item) => sum + (item.lowerBound || item.forecastDemand * 0.8 || 0), 0) || period.lowerBound || 0
      }))
    } else {
      return data.map(period => {
        const itemData = period.items?.find(item => item.name === selectedItem)
        return {
          period: period.period,
          actualDemand: itemData?.actualDemand || 0,
          forecastDemand: itemData?.forecastDemand || 0,
          upperBound: itemData?.upperBound || itemData?.forecastDemand * 1.2 || 0,
          lowerBound: itemData?.lowerBound || itemData?.forecastDemand * 0.8 || 0
        }
      })
    }
  }

  const filteredData = getFilteredData()

  // Calculate forecast accuracy
  const calculateAccuracy = () => {
    const completedPeriods = filteredData.filter(d => d.actualDemand > 0 && d.forecastDemand > 0)
    if (completedPeriods.length === 0) return { accuracy: 0, trend: 'stable' }

    const mape = completedPeriods.reduce((sum, d) => {
      return sum + Math.abs((d.actualDemand - d.forecastDemand) / d.actualDemand)
    }, 0) / completedPeriods.length

    const accuracy = Math.max(0, (1 - mape) * 100)

    // Calculate trend
    const recentAccuracy = completedPeriods.slice(-3).reduce((sum, d) => {
      return sum + Math.abs((d.actualDemand - d.forecastDemand) / d.actualDemand)
    }, 0) / Math.min(3, completedPeriods.length)

    const overallAccuracy = mape
    const trend = recentAccuracy < overallAccuracy ? 'improving' : recentAccuracy > overallAccuracy ? 'declining' : 'stable'

    return { accuracy: accuracy.toFixed(1), trend }
  }

  const { accuracy, trend } = calculateAccuracy()

  const formatTooltipValue = (value, name) => {
    if (typeof value !== 'number') return [value, name]
    return [value.toLocaleString(), name]
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-gray-900 dark:text-white font-medium mb-2">{label}</p>
          {payload.map((entry, __index) => (
            <div key={index} className="flex items-center justify-between min-w-40">
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
          {data?.confidence && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Confidence:</span>
                <span>{data.confidence}%</span>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
      case 'declining':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400'
      case 'declining':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-yellow-600 dark:text-yellow-400'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Item filter */}
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            {availableItems.map(item => (
              <option key={item} value={item}>
                {item === 'all' ? 'All Items' : item}
              </option>
            ))}
          </select>

          {/* Confidence interval toggle */}
          <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showConfidenceInterval}
              onChange={(e) => setShowConfidenceInterval(e.target.checked)}
              className="mr-2 rounded"
            />
            Show Confidence
          </label>
        </div>
      </div>

      {/* Accuracy metrics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 dark:text-blue-400">Forecast Accuracy</span>
            <span className="text-xl font-bold text-blue-900 dark:text-blue-100">{accuracy}%</span>
          </div>
        </div>
        <div className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
            <div className="flex items-center space-x-2">
              {getTrendIcon(trend)}
              <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
                {trend.charAt(0).toUpperCase() + trend.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600 dark:text-purple-400">Next Period</span>
            <span className="text-xl font-bold text-purple-900 dark:text-purple-100">
              {filteredData[filteredData.length - 1]?.forecastDemand?.toLocaleString() || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="period"
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-xs text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Confidence interval area */}
            {showConfidenceInterval && (
              <>
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stackId="confidence"
                  stroke="none"
                  fill="rgba(59, 130, 246, 0.1)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stackId="confidence"
                  stroke="none"
                  fill="rgba(255, 255, 255, 1)"
                  fillOpacity={1}
                />
              </>
            )}

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecastDemand"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Forecast Demand"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />

            {/* Actual demand line */}
            <Line
              type="monotone"
              dataKey="actualDemand"
              stroke="#ef4444"
              strokeWidth={3}
              name="Actual Demand"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />

            {/* Reference line for current date */}
            <ReferenceLine
              x={new Date().toISOString().split('T')[0].substring(5)}
              stroke="#6b7280"
              strokeDasharray="2 2"
              label={{ value: "Today", position: "insideTopRight" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-1 bg-red-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Actual Demand</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 border-2 border-dashed border-blue-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Forecast</span>
        </div>
        {showConfidenceInterval && (
          <div className="flex items-center">
            <div className="w-4 h-3 bg-blue-200 bg-opacity-30 mr-2" />
            <span className="text-gray-600 dark:text-gray-400">Confidence Interval</span>
          </div>
        )}
      </div>
    </div>
  )
}
