import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Plus,
  Save,
  FolderOpen,
  Download,
  Play,
  Settings,
  Trash2,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
} from 'lucide-react'

/**
 * AnalyticsDashboard Component
 *
 * Custom report builder with:
 * - Metric selector (revenue, units, margin, etc.)
 * - Dimension selector (product, region, channel, time)
 * - Visualization type selector (line, bar, pie, table)
 * - Filter builder with conditions
 * - Save/load report configurations
 * - Export functionality
 */
function AnalyticsDashboard() {
  const queryClient = useQueryClient()

  // Report configuration state
  const [reportConfig, setReportConfig] = useState({
    name: 'Untitled Report',
    metrics: ['revenue'],
    dimensions: ['product'],
    visualization: 'bar',
    filters: [],
    timeRange: '30d',
    groupBy: 'day',
  })

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)

  // Fetch report data based on configuration
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'custom-report', reportConfig],
    queryFn: async () => {
      const response = await fetch('/api/v1/analytics/custom-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportConfig),
      })
      if (!response.ok) throw new Error('Failed to fetch report data')
      const result = await response.json()
      return result.data
    },
    enabled: false, // Manual trigger
  })

  // Fetch saved reports
  const { data: savedReports = [] } = useQuery({
    queryKey: ['analytics', 'saved-reports'],
    queryFn: async () => {
      const response = await fetch('/api/v1/analytics/reports')
      if (!response.ok) throw new Error('Failed to fetch saved reports')
      const result = await response.json()
      return result.data || []
    },
  })

  // Save report mutation
  const saveReportMutation = useMutation({
    mutationFn: async config => {
      const response = await fetch('/api/v1/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!response.ok) throw new Error('Failed to save report')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['analytics', 'saved-reports'])
      setShowSaveModal(false)
    },
  })

  const handleRunReport = () => {
    refetch()
  }

  const handleSaveReport = () => {
    if (!reportConfig.name || reportConfig.name === 'Untitled Report') {
      alert('Please enter a report name')
      return
    }
    saveReportMutation.mutate(reportConfig)
  }

  const handleLoadReport = report => {
    setReportConfig(report)
    setShowLoadModal(false)
    refetch()
  }

  const handleExport = format => {
    console.log('Export report as:', format)
    // TODO: Implement actual export
  }

  const handleAddFilter = () => {
    setReportConfig({
      ...reportConfig,
      filters: [...reportConfig.filters, { field: 'product', operator: 'equals', value: '' }],
    })
  }

  const handleRemoveFilter = index => {
    const newFilters = reportConfig.filters.filter((_, i) => i !== index)
    setReportConfig({ ...reportConfig, filters: newFilters })
  }

  const handleUpdateFilter = (index, field, value) => {
    const newFilters = [...reportConfig.filters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setReportConfig({ ...reportConfig, filters: newFilters })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Custom Analytics</h1>
        <p className="text-gray-600 mt-1">
          Build custom reports with flexible metrics, dimensions, and visualizations
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Report Name */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
            <input
              type="text"
              value={reportConfig.name}
              onChange={e => setReportConfig({ ...reportConfig, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="Enter report name"
            />
          </div>

          {/* Metrics Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Metrics</h3>
            <div className="space-y-2">
              {AVAILABLE_METRICS.map(metric => (
                <label key={metric.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reportConfig.metrics.includes(metric.id)}
                    onChange={e => {
                      const newMetrics = e.target.checked
                        ? [...reportConfig.metrics, metric.id]
                        : reportConfig.metrics.filter(m => m !== metric.id)
                      setReportConfig({ ...reportConfig, metrics: newMetrics })
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{metric.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dimensions Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dimensions</h3>
            <div className="space-y-2">
              {AVAILABLE_DIMENSIONS.map(dimension => (
                <label key={dimension.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reportConfig.dimensions.includes(dimension.id)}
                    onChange={e => {
                      const newDimensions = e.target.checked
                        ? [...reportConfig.dimensions, dimension.id]
                        : reportConfig.dimensions.filter(d => d !== dimension.id)
                      setReportConfig({ ...reportConfig, dimensions: newDimensions })
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{dimension.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Visualization Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Visualization</h3>
            <div className="grid grid-cols-2 gap-2">
              {VISUALIZATION_TYPES.map(viz => {
                const Icon = viz.icon
                return (
                  <button
                    key={viz.id}
                    onClick={() => setReportConfig({ ...reportConfig, visualization: viz.id })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      reportConfig.visualization === viz.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs text-center">{viz.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Time Range</h3>
            <select
              value={reportConfig.timeRange}
              onChange={e => setReportConfig({ ...reportConfig, timeRange: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last 12 months</option>
              <option value="ytd">Year to date</option>
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleRunReport}
              disabled={reportConfig.metrics.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Run Report
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="w-full py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Report
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              className="w-full py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Load Report
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={handleAddFilter}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Filter
              </button>
            </div>

            {reportConfig.filters.length === 0 ? (
              <p className="text-sm text-gray-500">No filters applied</p>
            ) : (
              <div className="space-y-3">
                {reportConfig.filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={e => handleUpdateFilter(index, 'field', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      {FILTERABLE_FIELDS.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={e => handleUpdateFilter(index, 'operator', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                    </select>

                    <input
                      type="text"
                      value={filter.value}
                      onChange={e => handleUpdateFilter(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                    />

                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visualization */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{reportConfig.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading report data...</p>
                </div>
              </div>
            ) : !reportData ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Click "Run Report" to view results</p>
                </div>
              </div>
            ) : (
              <ReportVisualization
                data={reportData}
                type={reportConfig.visualization}
                metrics={reportConfig.metrics}
                dimensions={reportConfig.dimensions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <Modal onClose={() => setShowSaveModal(false)}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Save Report</h2>
          <p className="text-sm text-gray-600 mb-4">
            Saving report: <strong>{reportConfig.name}</strong>
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowSaveModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <Modal onClose={() => setShowLoadModal(false)}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Load Report</h2>
          {savedReports.length === 0 ? (
            <p className="text-sm text-gray-600">No saved reports found</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedReports.map(report => (
                <button
                  key={report.id}
                  onClick={() => handleLoadReport(report)}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                >
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-xs text-gray-600">
                    {report.metrics.length} metrics • {report.dimensions.length} dimensions
                  </p>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

/**
 * ReportVisualization Component
 */
function ReportVisualization({ data, type, metrics, dimensions }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-12">No data available</p>
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dimensions[0]} style={{ fontSize: '12px' }} />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip />
          <Legend />
          {metrics.map((metric, index) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dimensions[0]} style={{ fontSize: '12px' }} />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip />
          <Legend />
          {metrics.map((metric, index) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey={metrics[0]}
            nameKey={dimensions[0]}
            cx="50%"
            cy="50%"
            outerRadius={120}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  // Table view
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {dimensions.map(dim => (
              <th
                key={dim}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {dim}
              </th>
            ))}
            {metrics.map(metric => (
              <th
                key={metric}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {metric}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {dimensions.map(dim => (
                <td key={dim} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[dim]}
                </td>
              ))}
              {metrics.map(metric => (
                <td
                  key={metric}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right"
                >
                  {typeof row[metric] === 'number' ? row[metric].toLocaleString() : row[metric]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Modal Component
 */
// eslint-disable-next-line no-unused-vars
function Modal({ children, onClose }) {
  // TODO: Add close button or backdrop click to use onClose
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}

/**
 * Constants
 */
const AVAILABLE_METRICS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'units', label: 'Units Sold' },
  { id: 'margin', label: 'Gross Margin' },
  { id: 'cost', label: 'Cost of Goods' },
  { id: 'profit', label: 'Net Profit' },
]

const AVAILABLE_DIMENSIONS = [
  { id: 'product', label: 'Product' },
  { id: 'region', label: 'Region' },
  { id: 'channel', label: 'Channel' },
  { id: 'time', label: 'Time Period' },
  { id: 'customer', label: 'Customer Segment' },
]

const VISUALIZATION_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'line', label: 'Line Chart', icon: LineChartIcon },
  { id: 'pie', label: 'Pie Chart', icon: PieChartIcon },
  { id: 'table', label: 'Data Table', icon: TableIcon },
]

const FILTERABLE_FIELDS = [
  { id: 'product', label: 'Product' },
  { id: 'region', label: 'Region' },
  { id: 'channel', label: 'Channel' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'units', label: 'Units' },
]

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export default AnalyticsDashboard
