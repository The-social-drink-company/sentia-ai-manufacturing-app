import React, { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartCard from './ChartCard'

/**
 * SalesRevenueChart Component
 *
 * Displays sales and revenue trends over time with:
 * - Dual-axis line chart (sales count + revenue amount)
 * - Time range selector (7d, 30d, 90d, 1y)
 * - Chart type toggle (line/area)
 * - Market/channel breakdown
 * - Export functionality
 *
 * @param {Object} props
 * @param {Array} props.data - Time series data with date, sales, revenue
 * @param {boolean} props.loading - Loading state
 * @param {Error} props.error - Error object
 * @param {Function} props.onRefresh - Refresh handler
 * @param {Function} props.onExport - Export handler
 */
function SalesRevenueChart({ data = [], loading = false, error = null, onRefresh, onExport }) {
  const [timeRange, setTimeRange] = useState('30d') // 7d, 30d, 90d, 1y
  const [chartType, setChartType] = useState('line') // line, area
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Filter data based on time range
  const filteredData = filterDataByTimeRange(data, timeRange)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null

    return (
      <div className="bg-white border border-gray-200 rounded shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">{formatDate(label)}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold">{formatValue(entry.value, entry.dataKey)}</span>
          </div>
        ))}
      </div>
    )
  }

  // Time range buttons
  const timeRangeActions = (
    <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
      {['7d', '30d', '90d', '1y'].map(range => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            timeRange === range
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {range.toUpperCase()}
        </button>
      ))}
    </div>
  )

  return (
    <ChartCard
      title="Sales & Revenue"
      subtitle={`${getTimeRangeLabel(timeRange)} performance overview`}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onExport={onExport}
      actions={timeRangeActions}
    >
      {/* Chart type toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded text-sm ${
              chartType === 'line' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded text-sm ${
              chartType === 'area' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Area
          </button>
        </div>

        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showBreakdown ? 'Hide' : 'Show'} Breakdown
        </button>
      </div>

      {/* Main Chart */}
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#3b82f6"
              style={{ fontSize: '12px' }}
              tickFormatter={value => `£${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#10b981"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#3b82f6"
              style={{ fontSize: '12px' }}
              tickFormatter={value => `£${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#10b981"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#3b82f6"
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#10b981"
              fill="url(#colorOrders)"
              strokeWidth={2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Breakdown by Market/Channel */}
      {showBreakdown && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Market */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-3">By Market</h5>
              <div className="space-y-2">
                <BreakdownBar label="UK" value={45} amount="42,500" color="blue" />
                <BreakdownBar label="EU" value={37} amount="35,200" color="green" />
                <BreakdownBar label="US" value={18} amount="17,300" color="purple" />
              </div>
            </div>

            {/* By Channel */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-3">By Channel</h5>
              <div className="space-y-2">
                <BreakdownBar label="Amazon FBA" value={61} amount="58,200" color="orange" />
                <BreakdownBar label="Shopify DTC" value={39} amount="36,800" color="cyan" />
              </div>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  )
}

/**
 * BreakdownBar Component
 * Shows a percentage bar with label and value
 */
function BreakdownBar({ label, value, amount, color }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold">
          £{amount} ({value}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color] || colorClasses.blue}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Helper Functions
 */

function filterDataByTimeRange(data, range) {
  if (!data || data.length === 0) return []

  const now = new Date()
  const ranges = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }

  const daysAgo = ranges[range] || 30
  const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  return data.filter(item => new Date(item.date) >= cutoffDate)
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTick(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatValue(value, dataKey) {
  if (dataKey === 'revenue') {
    return `£${value.toLocaleString()}`
  }
  return value.toLocaleString()
}

function getTimeRangeLabel(range) {
  const labels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '1y': 'Last 12 months',
  }
  return labels[range] || 'Last 30 days'
}

export default SalesRevenueChart
