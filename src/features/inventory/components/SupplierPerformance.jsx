import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/solid'

export default function SupplierPerformance({ data, title }) {
  const [viewMode, setViewMode] = useState('overview') // overview, details, radar
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">No supplier performance data available</p>
        </div>
      </div>
    )
  }

  const getPerformanceScore = (supplier) => {
    const onTimeWeight = 0.4
    const qualityWeight = 0.3
    const costWeight = 0.3

    const onTimeScore = Math.min(100, (supplier.onTimeDelivery || 0))
    const qualityScore = Math.min(100, (supplier.qualityScore || 0))
    const costScore = supplier.costEfficiency || 70 // Mock cost efficiency

    return (onTimeScore * onTimeWeight + qualityScore * qualityWeight + costScore * costWeight).toFixed(1)
  }

  const getPerformanceGrade = (score) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' }
    if (score >= 80) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
    return { grade: 'D', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
  }

  const formatTooltipValue = (value, name) => {
    if (name.includes('Delivery') || name.includes('Quality')) {
      return [`${value.toFixed(1)}%`, name]
    }
    if (name.includes('Lead Time')) {
      return [`${value} days`, name]
    }
    if (name.includes('Cost')) {
      return [`$${value.toLocaleString()}`, name]
    }
    return [value, name]
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
        </div>
      )
    }
    return null
  }

  // Prepare radar chart data for selected supplier
  const getRadarData = (supplier) => {
    return [
      { metric: 'On-Time Delivery', value: supplier.onTimeDelivery || 0, fullMark: 100 },
      { metric: 'Quality Score', value: supplier.qualityScore || 0, fullMark: 100 },
      { metric: 'Cost Efficiency', value: supplier.costEfficiency || 70, fullMark: 100 },
      { metric: 'Lead Time', value: Math.max(0, 100 - (supplier.avgLeadTime || 14) * 2), fullMark: 100 },
      { metric: 'Responsiveness', value: supplier.responsiveness || 75, fullMark: 100 }
    ]
  }

  const renderOverview = () => (
    <div className="space-y-4">
      {data.map((supplier, __index) => {
        const score = getPerformanceScore(supplier)
        const { grade, color, bg } = getPerformanceGrade(score)

        return (
          <div
            key={supplier.id || index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedSupplier(supplier)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${color}`}>{grade}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {supplier.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {supplier.category || 'General Supplier'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{score}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">On-Time</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {supplier.onTimeDelivery?.toFixed(1) || '—'}%
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quality</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {supplier.qualityScore?.toFixed(1) || '—'}%
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TruckIcon className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lead Time</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {supplier.avgLeadTime || '—'} days
                  </p>
                </div>
              </div>
            </div>

            {/* Risk indicators */}
            {supplier.riskFactors && supplier.riskFactors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    Risk Factors: {supplier.riskFactors.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const renderBarChart = () => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="name"
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="onTimeDelivery" fill="#3b82f6" name="On-Time Delivery %" />
          <Bar dataKey="qualityScore" fill="#10b981" name="Quality Score %" />
          <Bar dataKey="responsiveness" fill="#8b5cf6" name="Responsiveness %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  const renderRadarChart = () => {
    if (!selectedSupplier) {
      return (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400">Select a supplier to view detailed metrics</p>
        </div>
      )
    }

    const radarData = getRadarData(selectedSupplier)

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" className="text-xs text-gray-600 dark:text-gray-400" />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <Radar
              name={selectedSupplier.name}
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'chart'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 mr-1 inline" />
            Chart
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'radar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <StarIcon className="h-4 w-4 mr-1 inline" />
            Radar
          </button>
        </div>
      </div>

      {/* Selected supplier info for radar view */}
      {viewMode === 'radar' && selectedSupplier && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                {selectedSupplier.name}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Detailed Performance Analysis
              </p>
            </div>
            <button
              onClick={() => setSelectedSupplier(null)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Dynamic content based on view mode */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'chart' && renderBarChart()}
      {viewMode === 'radar' && renderRadarChart()}

      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Suppliers</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg On-Time</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {(data.reduce((sum, s) => sum + (s.onTimeDelivery || 0), 0) / data.length).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Quality</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {(data.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / data.length).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Top Performers</p>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {data.filter(s => getPerformanceScore(s) >= 90).length}
          </p>
        </div>
      </div>
    </div>
  )
}