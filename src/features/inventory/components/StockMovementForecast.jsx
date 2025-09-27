import React, { useState } from 'react'
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid'

export default function StockMovementForecast({ data, period = 'current' }) {
  const [forecastPeriod, setForecastPeriod] = useState('30')

  // Mock stock movement forecast data if not provided
  const generateForecastData = (days) => {
    const forecast = []
    const today = new Date()

    // Mock SKUs with different movement patterns
    const skus = [
      { sku: 'SNTG-001', baseDaily: 45, pattern: 'steady', seasonal: 1.0 },
      { sku: 'SNTB-001', baseDaily: 32, pattern: 'growing', seasonal: 1.1 },
      { sku: 'SNTR-001', baseDaily: 28, pattern: 'declining', seasonal: 0.9 },
      { sku: 'SNTG-002', baseDaily: 38, pattern: 'volatile', seasonal: 1.2 }
    ]

    for (let day = 0; day < parseInt(days); day++) {
      const date = new Date(today)
      date.setDate(date.getDate() + day)

      skus.forEach(sku => {
        // Calculate daily movement with pattern and seasonality
        let movement = sku.baseDaily * sku.seasonal

        // Apply pattern
        switch (sku.pattern) {
          case 'growing':
            movement *= 1 + (day * 0.005) // 0.5% daily growth
            break
          case 'declining':
            movement *= 1 - (day * 0.003) // 0.3% daily decline
            break
          case 'volatile':
            movement *= 1 + (Math.sin(day / 7) * 0.3) // Weekly volatility
            break
          case 'steady':
          default:
            movement *= 1 + ((Math.random() - 0.5) * 0.1) // ±5% variance
            break
        }

        // Weekend effect (reduced movement)
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          movement *= 0.3
        }

        forecast.push({
          date: date.toISOString().split('T')[0],
          dateFormatted: date.toLocaleDateString(),
          sku: sku.sku,
          predictedMovement: Math.round(Math.max(0, movement)),
          confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
          pattern: sku.pattern
        })
      })
    }

    return forecast
  }

  const forecastData = data || generateForecastData(forecastPeriod)

  // Aggregate by date for summary view
  const dailyTotals = forecastData.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = {
        date: item.date,
        dateFormatted: item.dateFormatted,
        totalMovement: 0,
        avgConfidence: 0,
        itemCount: 0
      }
    }
    acc[item.date].totalMovement += item.predictedMovement
    acc[item.date].avgConfidence += item.confidence
    acc[item.date].itemCount += 1
    return acc
  }, {})

  // Calculate average confidence
  Object.values(dailyTotals).forEach(day => {
    day.avgConfidence = day.avgConfidence / day.itemCount
  })

  const sortedDailyTotals = Object.values(dailyTotals).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  )

  // Calculate trend
  const totalMovement = sortedDailyTotals.reduce((sum, day) => sum + day.totalMovement, 0)
  const avgDailyMovement = totalMovement / sortedDailyTotals.length

  const firstWeekAvg = sortedDailyTotals.slice(0, 7).reduce((sum, day) => sum + day.totalMovement, 0) / 7
  const lastWeekAvg = sortedDailyTotals.slice(-7).reduce((sum, day) => sum + day.totalMovement, 0) / 7
  const trend = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100

  // Get top moving SKUs
  const skuTotals = forecastData.reduce((acc, item) => {
    if (!acc[item.sku]) {
      acc[item.sku] = { sku: item.sku, totalMovement: 0, pattern: item.pattern }
    }
    acc[item.sku].totalMovement += item.predictedMovement
    return acc
  }, {})

  const topSkus = Object.values(skuTotals)
    .sort((a, b) => b.totalMovement - a.totalMovement)
    .slice(0, 4)

  const getPatternColor = (pattern) => {
    switch (pattern) {
      case 'growing':
        return 'text-green-600 dark:text-green-400'
      case 'declining':
        return 'text-red-600 dark:text-red-400'
      case 'volatile':
        return 'text-orange-600 dark:text-orange-400'
      case 'steady':
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getPatternIcon = (pattern) => {
    switch (pattern) {
      case 'growing':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'declining':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <ChartBarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          Stock Movement Forecast
        </h3>

        {/* Period Selector */}
        <select
          value={forecastPeriod}
          onChange={(e) => setForecastPeriod(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7">7 Days</option>
          <option value="14">14 Days</option>
          <option value="30">30 Days</option>
          <option value="60">60 Days</option>
        </select>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">Avg Daily Movement</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {Math.round(avgDailyMovement)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">units/day</p>
        </div>

        <div className={`rounded-lg p-3 ${
          trend >= 0
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <p className={`text-xs ${
            trend >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            Trend
          </p>
          <p className={`text-lg font-bold ${
            trend >= 0
              ? 'text-green-900 dark:text-green-100'
              : 'text-red-900 dark:text-red-100'
          }`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </p>
          <p className={`text-xs ${
            trend >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            vs first week
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs text-purple-600 dark:text-purple-400">Total Forecast</p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {totalMovement.toLocaleString()}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">units</p>
        </div>
      </div>

      {/* Top SKUs */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Top Moving SKUs
        </h4>
        <div className="space-y-2">
          {topSkus.map((sku) => (
            <div key={sku.sku} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <div className="flex items-center">
                {getPatternIcon(sku.pattern)}
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                  {sku.sku}
                </span>
                <span className={`ml-2 text-xs ${getPatternColor(sku.pattern)}`}>
                  {sku.pattern}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {sku.totalMovement.toLocaleString()} units
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Daily Movement Trend
        </h4>
        <div className="relative h-24 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <div className="flex h-full items-end justify-between">
            {sortedDailyTotals.slice(0, 14).map((day, index) => {
              const maxMovement = Math.max(...sortedDailyTotals.map(d => d.totalMovement))
              const height = (day.totalMovement / maxMovement) * 100

              return (
                <div key={day.date} className="flex flex-col items-center">
                  <div
                    className={`w-2 rounded-t transition-all duration-300 ${
                      day.avgConfidence > 0.9 ? 'bg-green-500' :
                      day.avgConfidence > 0.85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${day.dateFormatted}: ${day.totalMovement} units (${(day.avgConfidence * 100).toFixed(0)}% confidence)`}
                  />
                  {index % 2 === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 transform -rotate-45">
                      {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Confidence Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">High Confidence (90%+)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Medium (85-90%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Low (<85%)</span>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        View Detailed Forecast
      </button>
    </div>
  )
}
