/**
 * Inventory Dashboard Component
 *
 * Multi-warehouse inventory management:
 * - Real-time stock levels across warehouses
 * - Stock value and turnover metrics
 * - Low stock and overstock alerts
 * - ABC analysis
 * - Warehouse comparison
 * - SKU performance tracking
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Warehouse,
  BarChart3,
  DollarSign,
  Activity,
  Filter,
  Download,
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
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts'
import { useSSE } from '../../hooks/useSSE'

// Warehouse locations
const WAREHOUSES = {
  UK: { id: 'uk', name: 'UK Warehouse', color: '#3b82f6' },
  EU: { id: 'eu', name: 'EU Warehouse', color: '#10b981' },
  USA: { id: 'usa', name: 'USA Warehouse', color: '#f59e0b' },
}

/**
 * Inventory Metric Card
 */
function InventoryMetricCard({
  label,
  value,
  unit,
  trend,
  icon: IconComponent, // eslint-disable-line no-unused-vars
  format = 'number',
}) {
  const StatusIcon = trend >= 0 ? TrendingUp : TrendingDown
  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600'

  const formattedValue =
    format === 'currency'
      ? `£${value.toLocaleString()}`
      : format === 'percentage'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <IconComponent className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{formattedValue}</span>
        {unit && <span className="text-sm text-gray-600">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  )
}

/**
 * Warehouse Comparison Chart
 */
function WarehouseComparisonChart({ warehouseData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels by Warehouse</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={warehouseData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="warehouse" />
          <YAxis label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={value => value.toLocaleString()} />
          <Legend />

          <Bar dataKey="inStock" stackId="a" fill="#10b981" name="In Stock" />
          <Bar dataKey="reserved" stackId="a" fill="#f59e0b" name="Reserved" />
          <Bar dataKey="available" fill="#3b82f6" name="Available" />
        </BarChart>
      </ResponsiveContainer>

      {/* Warehouse Stats Grid */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {warehouseData.map(warehouse => (
          <div key={warehouse.id} className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">{warehouse.warehouse}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-gray-900">
                  {warehouse.inStock.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium text-green-600">
                  {warehouse.available.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reserved:</span>
                <span className="font-medium text-orange-600">
                  {warehouse.reserved.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Value:</span>
                <span className="font-medium text-gray-900">
                  £{warehouse.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * ABC Analysis Chart
 */
function ABCAnalysisChart({ abcData }) {
  const chartData = [
    {
      category: 'A - High Value',
      count: abcData.categoryA?.count || 0,
      value: abcData.categoryA?.value || 0,
      color: '#ef4444',
    },
    {
      category: 'B - Medium Value',
      count: abcData.categoryB?.count || 0,
      value: abcData.categoryB?.value || 0,
      color: '#f59e0b',
    },
    {
      category: 'C - Low Value',
      count: abcData.categoryC?.count || 0,
      value: abcData.categoryC?.value || 0,
      color: '#10b981',
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">ABC Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        Classification of SKUs by value contribution (A: 80%, B: 15%, C: 5%)
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, value }) =>
                `${category.split(' - ')[0]}: £${(value / 1000).toFixed(0)}k`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={value => `£${value.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center">
          <div className="space-y-4">
            {chartData.map(item => (
              <div key={item.category} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-gray-900">{item.category}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">SKUs:</span>
                    <span className="ml-2 font-medium text-gray-900">{item.count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Value:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      £{(item.value / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Stock Turnover Chart
 */
function StockTurnoverChart({ turnoverData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Stock Turnover Trend (Last 6 Months)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={turnoverData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={month => new Date(month).toLocaleDateString('en-GB', { month: 'short' })}
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Turnover Ratio', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Days', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            labelFormatter={month =>
              new Date(month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
            }
          />
          <Legend />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey="turnoverRatio"
            fill="#3b82f6"
            fillOpacity={0.1}
            stroke="none"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="turnoverRatio"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            name="Turnover Ratio"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="daysOnHand"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            name="Days on Hand"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">
            {turnoverData[turnoverData.length - 1]?.turnoverRatio.toFixed(1) || 0}
          </div>
          <div className="text-xs text-gray-600 mt-1">Current Turnover Ratio</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">
            {turnoverData[turnoverData.length - 1]?.daysOnHand.toFixed(0) || 0}
          </div>
          <div className="text-xs text-gray-600 mt-1">Days on Hand</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(365 / (turnoverData[turnoverData.length - 1]?.turnoverRatio || 1))}
          </div>
          <div className="text-xs text-gray-600 mt-1">Days Between Turns</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Top SKUs Table
 */
function TopSKUsTable({ skus, metric = 'value' }) {
  const [sortBy, setSortBy] = useState(metric)
  const [sortOrder, setSortOrder] = useState('desc')

  const sortedSKUs = [...skus].sort((a, b) => {
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
        <h3 className="text-lg font-semibold text-gray-900">Top Performing SKUs</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th
                onClick={() => handleSort('quantity')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Quantity {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('value')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Value {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('turnover')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Turnover {sortBy === 'turnover' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSKUs.slice(0, 10).map(sku => (
              <tr key={sku.sku} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{sku.sku}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sku.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sku.quantity.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">£{sku.value.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sku.turnover.toFixed(1)}x</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      sku.status === 'in_stock'
                        ? 'bg-green-100 text-green-700'
                        : sku.status === 'low_stock'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {sku.status.replace('_', ' ')}
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
 * Main Inventory Dashboard Component
 */
export default function InventoryDashboard() {
  const queryClient = useQueryClient()
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [dateRange, setDateRange] = useState('month')

  // Fetch inventory data
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', 'dashboard', selectedWarehouse, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({ warehouse: selectedWarehouse, dateRange })
      const response = await fetch(`/api/v1/inventory/dashboard?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch inventory data')
      const result = await response.json()
      return result.data
    },
    refetchInterval: 60000, // Refetch every minute
  })

  // SSE for real-time inventory updates
  const { connected } = useSSE('inventory', {
    enabled: true,
    onMessage: message => {
      if (message.type === 'inventory:update' || message.type === 'inventory:alert') {
        queryClient.invalidateQueries(['inventory', 'dashboard'])
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading inventory data: {error.message}</p>
      </div>
    )
  }

  const { overview = {}, warehouses = [], abc = {}, turnover = [], topSKUs = [] } = data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Multi-warehouse stock management
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
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Warehouses</option>
            {Object.values(WAREHOUSES).map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InventoryMetricCard
          label="Total Stock Value"
          value={overview.totalValue || 0}
          trend={overview.valueTrend}
          icon={DollarSign}
          format="currency"
        />

        <InventoryMetricCard
          label="Total Units"
          value={overview.totalUnits || 0}
          trend={overview.unitsTrend}
          icon={Package}
          format="number"
        />

        <InventoryMetricCard
          label="Avg Turnover Ratio"
          value={overview.avgTurnover || 0}
          unit="x per year"
          trend={overview.turnoverTrend}
          icon={Activity}
          format="number"
        />

        <InventoryMetricCard
          label="Days on Hand"
          value={overview.daysOnHand || 0}
          unit="days"
          trend={-overview.daysOnHandTrend}
          icon={BarChart3}
          format="number"
        />
      </div>

      {/* Warehouse Comparison */}
      <WarehouseComparisonChart warehouseData={warehouses} />

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <ABCAnalysisChart abcData={abc} />
        <StockTurnoverChart turnoverData={turnover} />
      </div>

      {/* Top SKUs Table */}
      <TopSKUsTable skus={topSKUs} />
    </div>
  )
}
