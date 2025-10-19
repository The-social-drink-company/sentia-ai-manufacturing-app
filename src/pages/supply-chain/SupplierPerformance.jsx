/**
 * Supplier Performance Component
 *
 * Comprehensive supplier management and scorecarding:
 * - Supplier scorecard with weighted metrics
 * - On-Time Delivery (OTD) tracking
 * - Quality performance monitoring
 * - Cost competitiveness analysis
 * - Lead time trends
 * - Supplier comparison and ranking
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Award,
  AlertTriangle,
  BarChart3,
  Star,
  Target,
  Package,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts'
import { useSSE } from '../../hooks/useSSE'

/**
 * Supplier Scorecard Component
 */
function SupplierScorecard({ supplier }) {
  const { name, overallScore, otdScore, qualityScore, costScore, leadTimeScore, rating, trend } =
    supplier

  const ratingStars = rating || 0
  const StatusIcon = trend >= 0 ? TrendingUp : TrendingDown
  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600'

  const getRatingColor = score => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 75) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < ratingStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{overallScore}</div>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Overall Score Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Score</span>
          <span className="font-medium text-gray-900">{overallScore}/100</span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${getRatingColor(overallScore)}`}
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Metric Breakdown */}
      <div className="space-y-3">
        {[
          { label: 'On-Time Delivery', score: otdScore, icon: Clock },
          { label: 'Quality', score: qualityScore, icon: CheckCircle2 },
          { label: 'Cost Competitiveness', score: costScore, icon: DollarSign },
          { label: 'Lead Time', score: leadTimeScore, icon: TrendingUp },
        ].map(metric => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{metric.label}</span>
                  <span className="font-medium text-gray-900">{metric.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getRatingColor(metric.score)}`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Supplier Comparison Radar Chart
 */
function SupplierComparisonRadar({ suppliers }) {
  const radarData = [
    {
      metric: 'OTD',
      ...suppliers.reduce((acc, s) => ({ ...acc, [s.name]: s.otdScore }), {}),
    },
    {
      metric: 'Quality',
      ...suppliers.reduce((acc, s) => ({ ...acc, [s.name]: s.qualityScore }), {}),
    },
    {
      metric: 'Cost',
      ...suppliers.reduce((acc, s) => ({ ...acc, [s.name]: s.costScore }), {}),
    },
    {
      metric: 'Lead Time',
      ...suppliers.reduce((acc, s) => ({ ...acc, [s.name]: s.leadTimeScore }), {}),
    },
    {
      metric: 'Overall',
      ...suppliers.reduce((acc, s) => ({ ...acc, [s.name]: s.overallScore }), {}),
    },
  ]

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Comparison</h3>

      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />

          {suppliers.slice(0, 5).map((supplier, index) => (
            <Radar
              key={supplier.name}
              name={supplier.name}
              dataKey={supplier.name}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.3}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * OTD Trend Chart
 */
function OTDTrendChart({ otdData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        On-Time Delivery Trend (Last 6 Months)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={otdData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={month => new Date(month).toLocaleDateString('en-GB', { month: 'short' })}
          />
          <YAxis yAxisId="left" domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            labelFormatter={month =>
              new Date(month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
            }
            formatter={(value, name) => [
              name === 'deliveries' ? value : `${value.toFixed(1)}%`,
              name === 'otdRate' ? 'OTD Rate' : name === 'target' ? 'Target' : 'Total Deliveries',
            ]}
          />
          <Legend />

          <Bar yAxisId="right" dataKey="deliveries" fill="#93c5fd" name="Total Deliveries" />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="otdRate"
            fill="#3b82f6"
            fillOpacity={0.1}
            stroke="none"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="otdRate"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            name="OTD Rate"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="target"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Target"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Quality Performance Chart
 */
function QualityPerformanceChart({ qualityData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Performance</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={qualityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="supplier" angle={-45} textAnchor="end" height={100} />
          <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
          <Tooltip formatter={value => `${value.toFixed(1)}%`} />
          <Legend />

          <Bar dataKey="acceptanceRate" fill="#10b981" name="Acceptance Rate" />
          <Bar dataKey="defectRate" fill="#ef4444" name="Defect Rate" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">
            {(
              qualityData.reduce((sum, s) => sum + s.acceptanceRate, 0) / qualityData.length
            ).toFixed(1)}
            %
          </div>
          <div className="text-xs text-gray-600 mt-1">Avg Acceptance Rate</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">
            {(qualityData.reduce((sum, s) => sum + s.defectRate, 0) / qualityData.length).toFixed(
              1
            )}
            %
          </div>
          <div className="text-xs text-gray-600 mt-1">Avg Defect Rate</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">
            {qualityData.reduce((sum, s) => sum + s.totalInspections, 0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Total Inspections</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Lead Time vs Cost Scatter Plot
 */
function LeadTimeCostScatter({ scatterData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Time vs Cost Analysis</h3>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="leadTime"
            name="Lead Time"
            unit=" days"
            label={{ value: 'Lead Time (days)', position: 'bottom' }}
          />
          <YAxis
            type="number"
            dataKey="costIndex"
            name="Cost Index"
            label={{ value: 'Cost Index', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis type="number" dataKey="volume" range={[100, 1000]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => [
              name === 'leadTime'
                ? `${value} days`
                : name === 'costIndex'
                  ? value.toFixed(2)
                  : value,
              name === 'leadTime' ? 'Lead Time' : name === 'costIndex' ? 'Cost Index' : 'Volume',
            ]}
          />
          <Scatter name="Suppliers" data={scatterData} fill="#3b82f6">
            {scatterData.map((entry, index) => {
              const color =
                entry.rating >= 4 ? '#10b981' : entry.rating >= 3 ? '#f59e0b' : '#ef4444'
              return <Cell key={`cell-${index}`} fill={color} />
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">High Rating (4-5★)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">Medium Rating (3-4★)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Low Rating (&lt;3★)</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Supplier Rankings Table
 */
function SupplierRankingsTable({ suppliers }) {
  const [sortBy, setSortBy] = useState('overallScore')
  const [sortOrder, setSortOrder] = useState('desc')

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  const handleSort = column => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">Supplier Rankings</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th
                onClick={() => handleSort('overallScore')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Overall Score {sortBy === 'overallScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('otdScore')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                OTD {sortBy === 'otdScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('qualityScore')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Quality {sortBy === 'qualityScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('costScore')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Cost {sortBy === 'costScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSuppliers.map((supplier, index) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Award className="w-5 h-5 text-yellow-500" />}
                    <span className="font-medium text-gray-900">#{index + 1}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{supplier.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-sm font-medium rounded ${
                      supplier.overallScore >= 90
                        ? 'bg-green-100 text-green-700'
                        : supplier.overallScore >= 75
                          ? 'bg-yellow-100 text-yellow-700'
                          : supplier.overallScore >= 60
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {supplier.overallScore}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supplier.otdScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supplier.qualityScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supplier.costScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < supplier.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      supplier.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : supplier.status === 'review'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {supplier.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Main Supplier Performance Component
 */
export default function SupplierPerformance() {
  const queryClient = useQueryClient()
  const [dateRange, setDateRange] = useState('6months')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Fetch supplier performance data
  const { data, isLoading, error } = useQuery({
    queryKey: ['supply-chain', 'suppliers', dateRange, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ dateRange, category: categoryFilter })
      const response = await fetch(`/api/v1/supply-chain/suppliers/performance?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch supplier performance data')
      const result = await response.json()
      return result.data
    },
    refetchInterval: 60000,
  })

  // SSE for real-time updates
  const { connected } = useSSE('supply-chain', {
    enabled: true,
    onMessage: message => {
      if (message.type === 'supplier:update') {
        queryClient.invalidateQueries(['supply-chain', 'suppliers'])
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading supplier performance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading supplier performance data: {error.message}</p>
      </div>
    )
  }

  const { suppliers = [], otdTrend = [], qualityData = [], scatterData = [] } = data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Performance</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive supplier scorecarding and management
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
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Last Year</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="ingredients">Ingredients</option>
            <option value="packaging">Packaging</option>
            <option value="logistics">Logistics</option>
          </select>
        </div>
      </div>

      {/* Top Suppliers Scorecards */}
      <div className="grid md:grid-cols-3 gap-6">
        {suppliers.slice(0, 3).map(supplier => (
          <SupplierScorecard key={supplier.id} supplier={supplier} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <SupplierComparisonRadar suppliers={suppliers.slice(0, 5)} />
        <OTDTrendChart otdData={otdTrend} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        <QualityPerformanceChart qualityData={qualityData} />
        <LeadTimeCostScatter scatterData={scatterData} />
      </div>

      {/* Rankings Table */}
      <SupplierRankingsTable suppliers={suppliers} />
    </div>
  )
}
