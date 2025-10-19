/**
 * Downtime Tracker Component
 *
 * Comprehensive downtime monitoring and predictive maintenance:
 * - Real-time downtime events
 * - Downtime classification (planned vs unplanned)
 * - Predictive maintenance alerts
 * - MTBF (Mean Time Between Failures) tracking
 * - MTTR (Mean Time To Repair) tracking
 * - Root cause analysis
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Clock,
  Tool,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  Wrench,
  AlertCircle,
  BarChart3,
  Filter,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Area,
} from 'recharts'
import { useSSE } from '../../hooks/useSSE'

// Downtime categories
const DOWNTIME_CATEGORIES = {
  BREAKDOWN: { label: 'Breakdown', color: '#ef4444', icon: XCircle },
  PLANNED_MAINTENANCE: { label: 'Planned Maintenance', color: '#3b82f6', icon: Tool },
  CHANGEOVER: { label: 'Changeover', color: '#f59e0b', icon: Activity },
  STARTUP: { label: 'Startup', color: '#8b5cf6', icon: PlayCircle },
  LACK_OF_MATERIALS: { label: 'Lack of Materials', color: '#ec4899', icon: AlertCircle },
  LACK_OF_OPERATORS: { label: 'Lack of Operators', color: '#14b8a6', icon: AlertCircle },
  OTHER: { label: 'Other', color: '#6b7280', icon: PauseCircle },
}

/**
 * Downtime Event Card
 */
function DowntimeEventCard({ event, onResolve }) {
  const category = DOWNTIME_CATEGORIES[event.category] || DOWNTIME_CATEGORIES.OTHER
  const Icon = category.icon

  const duration = event.endTime
    ? Math.floor((new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60))
    : Math.floor((Date.now() - new Date(event.startTime)) / (1000 * 60))

  const isOngoing = !event.endTime

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        isOngoing ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: category.color, opacity: 0.2 }}>
            <Icon className="w-5 h-5" style={{ color: category.color }} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{event.machine}</h4>
            <p className="text-sm text-gray-600">{category.label}</p>
          </div>
        </div>

        {isOngoing && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-300">
            ONGOING
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Duration: {duration} minutes</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Started: {new Date(event.startTime).toLocaleString()}</span>
        </div>

        {event.endTime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Resolved: {new Date(event.endTime).toLocaleString()}</span>
          </div>
        )}
      </div>

      {event.description && (
        <p className="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded">{event.description}</p>
      )}

      {event.rootCause && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1">Root Cause:</p>
          <p className="text-sm text-gray-900">{event.rootCause}</p>
        </div>
      )}

      {isOngoing && (
        <button
          onClick={() => onResolve(event.id)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Mark as Resolved
        </button>
      )}
    </div>
  )
}

/**
 * Predictive Maintenance Alert Card
 */
function PredictiveMaintenanceCard({ alert }) {
  const severityColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-blue-500 bg-blue-50',
  }

  const severityIcons = {
    critical: AlertTriangle,
    high: AlertCircle,
    medium: AlertCircle,
    low: Activity,
  }

  const Icon = severityIcons[alert.severity] || AlertCircle

  return (
    <div className={`rounded-lg border-2 p-4 ${severityColors[alert.severity]}`}>
      <div className="flex items-start gap-3 mb-3">
        <Icon
          className={`w-6 h-6 ${
            alert.severity === 'critical'
              ? 'text-red-600'
              : alert.severity === 'high'
                ? 'text-orange-600'
                : alert.severity === 'medium'
                  ? 'text-yellow-600'
                  : 'text-blue-600'
          }`}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900">{alert.machine}</h4>
            <span className="text-xs font-medium text-gray-600">
              {alert.confidence}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-700">{alert.message}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Predicted Failure Date:</span>
          <span className="font-medium text-gray-900">
            {new Date(alert.predictedDate).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Days Until Failure:</span>
          <span
            className={`font-bold ${
              alert.daysUntilFailure <= 7
                ? 'text-red-600'
                : alert.daysUntilFailure <= 14
                  ? 'text-orange-600'
                  : 'text-green-600'
            }`}
          >
            {alert.daysUntilFailure} days
          </span>
        </div>

        {alert.recommendation && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Recommendation:</p>
            <p className="text-sm text-gray-900">{alert.recommendation}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
          Schedule Maintenance
        </button>
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
          View Details
        </button>
      </div>
    </div>
  )
}

/**
 * MTBF/MTTR Stats Card
 */
function ReliabilityStatsCard({ stats }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* MTBF */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">MTBF</p>
            <p className="text-xs text-gray-500">Mean Time Between Failures</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {stats.mtbf?.toFixed(1) || '0.0'}
            </span>
            <span className="text-sm text-gray-600">hours</span>
          </div>
          <p className={`text-sm mt-1 ${stats.mtbfTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.mtbfTrend >= 0 ? '+' : ''}
            {stats.mtbfTrend?.toFixed(1)}% vs last month
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Best Performer:</span>
            <span className="font-medium text-gray-900">{stats.bestMachine}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Worst Performer:</span>
            <span className="font-medium text-gray-900">{stats.worstMachine}</span>
          </div>
        </div>
      </div>

      {/* MTTR */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Wrench className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">MTTR</p>
            <p className="text-xs text-gray-500">Mean Time To Repair</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {stats.mttr?.toFixed(1) || '0.0'}
            </span>
            <span className="text-sm text-gray-600">hours</span>
          </div>
          <p className={`text-sm mt-1 ${stats.mttrTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.mttrTrend <= 0 ? '' : '+'}
            {stats.mttrTrend?.toFixed(1)}% vs last month
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Target MTTR:</span>
            <span className="font-medium text-gray-900">{stats.targetMttr} hours</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Repairs:</span>
            <span className="font-medium text-gray-900">{stats.totalRepairs}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Downtime by Category Chart
 */
function DowntimeByCategoryChart({ data }) {
  const chartData = Object.entries(DOWNTIME_CATEGORIES).map(([key, category]) => ({
    name: category.label,
    value: data[key.toLowerCase()] || 0,
    color: category.color,
  }))

  const totalDowntime = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Downtime by Category (Last 30 Days)
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={value => `${value} min`} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center">
          <div className="space-y-3">
            {chartData
              .sort((a, b) => b.value - a.value)
              .map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{item.value} min</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({totalDowntime > 0 ? ((item.value / totalDowntime) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Downtime</span>
              <span className="text-lg font-bold text-gray-900">{totalDowntime} min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Downtime Trend Chart
 */
function DowntimeTrendChart({ trendData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Downtime Trend (Last 30 Days)</h3>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={date =>
              new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            }
          />
          <YAxis yAxisId="left" label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Events', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            labelFormatter={date => new Date(date).toLocaleDateString()}
            formatter={(value, name) => [
              name === 'events' ? value : `${value} min`,
              name === 'plannedDowntime'
                ? 'Planned Downtime'
                : name === 'unplannedDowntime'
                  ? 'Unplanned Downtime'
                  : name === 'totalDowntime'
                    ? 'Total Downtime'
                    : 'Events',
            ]}
          />
          <Legend />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey="totalDowntime"
            fill="#3b82f6"
            fillOpacity={0.1}
            stroke="none"
          />
          <Bar yAxisId="left" dataKey="plannedDowntime" stackId="a" fill="#3b82f6" />
          <Bar yAxisId="left" dataKey="unplannedDowntime" stackId="a" fill="#ef4444" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="events"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Main Downtime Tracker Component
 */
export default function DowntimeTracker() {
  const queryClient = useQueryClient()
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [dateRange, setDateRange] = useState('today')

  // Fetch downtime data
  const { data, isLoading, error } = useQuery({
    queryKey: ['production', 'downtime', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({ dateRange })
      const response = await fetch(`/api/v1/production/downtime?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch downtime data')
      const result = await response.json()
      return result.data
    },
    refetchInterval: 30000,
  })

  // Resolve downtime mutation
  const resolveDowntimeMutation = useMutation({
    mutationFn: async eventId => {
      const response = await fetch(`/api/v1/production/downtime/${eventId}/resolve`, {
        method: 'PATCH',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to resolve downtime')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['production', 'downtime'])
      queryClient.invalidateQueries(['production', 'overview'])
    },
  })

  // SSE for real-time downtime updates
  const { connected } = useSSE('production', {
    enabled: true,
    onMessage: message => {
      if (message.type === 'downtime:event' || message.type === 'downtime:resolved') {
        queryClient.invalidateQueries(['production', 'downtime'])
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading downtime data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading downtime data: {error.message}</p>
      </div>
    )
  }

  const {
    events = [],
    predictiveAlerts = [],
    stats = {},
    trend = [],
    categoryBreakdown = {},
  } = data || {}

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesCategory = filterCategory === 'ALL' || event.category === filterCategory
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ONGOING' && !event.endTime) ||
      (filterStatus === 'RESOLVED' && event.endTime)
    return matchesCategory && matchesStatus
  })

  // Separate ongoing and resolved events
  const ongoingEvents = filteredEvents.filter(e => !e.endTime)
  const resolvedEvents = filteredEvents.filter(e => e.endTime)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Downtime Tracker</h1>
          <p className="text-gray-600 mt-1">
            Real-time downtime monitoring and predictive maintenance
            {connected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Live
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(DOWNTIME_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* MTBF/MTTR Stats */}
      <ReliabilityStatsCard stats={stats} />

      {/* Predictive Maintenance Alerts */}
      {predictiveAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Predictive Maintenance Alerts ({predictiveAlerts.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictiveAlerts.map(alert => (
              <PredictiveMaintenanceCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <DowntimeByCategoryChart data={categoryBreakdown} />
        <DowntimeTrendChart trendData={trend} />
      </div>

      {/* Ongoing Events */}
      {ongoingEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ongoing Downtime Events ({ongoingEvents.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ongoingEvents.map(event => (
              <DowntimeEventCard
                key={event.id}
                event={event}
                onResolve={id => resolveDowntimeMutation.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Resolved Events */}
      {resolvedEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recently Resolved ({resolvedEvents.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resolvedEvents.slice(0, 6).map(event => (
              <DowntimeEventCard key={event.id} event={event} onResolve={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Downtime Events</h3>
          <p className="text-gray-600">
            {filterCategory !== 'ALL' || filterStatus !== 'ALL'
              ? 'No events match the selected filters.'
              : 'All systems are running smoothly!'}
          </p>
        </div>
      )}
    </div>
  )
}
