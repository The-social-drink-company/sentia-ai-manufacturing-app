import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  TreeMap,
} from 'recharts'
import {
  CubeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid'

export default function ABCAnalysis({ data, title }) {
  const [viewMode, setViewMode] = useState('chart') // chart, table, treemap
  const [selectedCategory, setSelectedCategory] = useState('all') // all, A, B, C
  const [sortBy] = useState('value') // value, quantity, percentage

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">
            No inventory data available for ABC analysis
          </p>
        </div>
      </div>
    )
  }

  // Perform ABC classification
  const abcData = useMemo(() => {
    // Sort items by value (price * quantity) descending
    const sortedItems = [...data].sort((a, b) => {
      const valueA = (a.unitCost || 0) * (a.quantity || 0)
      const valueB = (b.unitCost || 0) * (b.quantity || 0)
      return valueB - valueA
    })

    const totalValue = sortedItems.reduce(
      (sum, item) => sum + (item.unitCost || 0) * (item.quantity || 0),
      0
    )

    let cumulativeValue = 0
    const classifiedItems = sortedItems.map((item, index) => {
      const itemValue = (item.unitCost || 0) * (item.quantity || 0)
      cumulativeValue += itemValue
      const cumulativePercentage = (cumulativeValue / totalValue) * 100

      // ABC Classification Rules
      let category = 'C'
      if (cumulativePercentage <= 70) {
        category = 'A' // Top 70% of value
      } else if (cumulativePercentage <= 90) {
        category = 'B' // Next 20% of value
      }

      return {
        ...item,
        value: itemValue,
        cumulativeValue,
        cumulativePercentage,
        category,
        rank: index + 1,
      }
    })

    return classifiedItems
  }, [data])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const categoryStats = {
      A: { count: 0, value: 0, percentage: 0 },
      B: { count: 0, value: 0, percentage: 0 },
      C: { count: 0, value: 0, percentage: 0 },
    }

    const totalValue = abcData.reduce((sum, item) => sum + item.value, 0)
    const totalCount = abcData.length

    abcData.forEach(item => {
      categoryStats[item.category].count += 1
      categoryStats[item.category].value += item.value
    })

    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].percentage =
        totalCount > 0 ? (categoryStats[category].count / totalCount) * 100 : 0
      categoryStats[category].valuePercentage =
        totalValue > 0 ? (categoryStats[category].value / totalValue) * 100 : 0
    })

    return categoryStats
  }, [abcData])

  const getCategoryColor = category => {
    switch (category) {
      case 'A':
        return {
          primary: '#dc2626', // red-600
          light: '#fecaca', // red-200
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-600',
        }
      case 'B':
        return {
          primary: '#d97706', // amber-600
          light: '#fed7aa', // amber-200
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-600',
        }
      case 'C':
        return {
          primary: '#16a34a', // green-600
          light: '#bbf7d0', // green-200
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-600',
        }
      default:
        return {
          primary: '#6b7280',
          light: '#d1d5db',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          text: 'text-gray-600 dark:text-gray-400',
          badge: 'bg-gray-600',
        }
    }
  }

  const getCategoryDescription = category => {
    switch (category) {
      case 'A':
        return 'High Value Items - Critical for business, require tight control'
      case 'B':
        return 'Moderate Value Items - Important but less critical control'
      case 'C':
        return 'Low Value Items - Basic inventory control sufficient'
      default:
        return ''
    }
  }

  const filteredData =
    selectedCategory === 'all'
      ? abcData
      : abcData.filter(item => item.category === selectedCategory)

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.value - a.value
      case 'quantity':
        return (b.quantity || 0) - (a.quantity || 0)
      case 'percentage':
        return b.cumulativePercentage - a.cumulativePercentage
      default:
        return 0
    }
  })

  const formatTooltipValue = (value, name) => {
    if (name.includes('Value') || name.includes('Cost')) {
      return [`$${value.toLocaleString()}`, name]
    }
    if (name.includes('Percentage')) {
      return [`${value.toFixed(1)}%`, name]
    }
    return [value.toLocaleString(), name]
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-gray-900 dark:text-white font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between min-w-40">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}:</span>
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

  // Prepare chart data
  const chartData = Object.keys(summaryStats).map(category => ({
    category,
    count: summaryStats[category].count,
    value: summaryStats[category].value,
    percentage: summaryStats[category].percentage,
    valuePercentage: summaryStats[category].valuePercentage,
  }))

  const pieData = chartData.map(item => ({
    name: `Category ${item.category}`,
    value: item.valuePercentage,
    count: item.count,
    color: getCategoryColor(item.category).primary,
  }))

  // TreeMap data
  const treeMapData = abcData.slice(0, 20).map(item => ({
    name: item.name,
    size: item.value,
    category: item.category,
    fill: getCategoryColor(item.category).primary,
  }))

  const renderChart = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="h-80">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Category Distribution
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="category" className="text-xs text-gray-600 dark:text-gray-400" />
            <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="valuePercentage" fill="#3b82f6" name="Value %" />
            <Bar dataKey="percentage" fill="#10b981" name="Item Count %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="h-80">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Value Distribution
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={value => `${value.toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderTreeMap = () => (
    <div className="h-96">
      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Top 20 Items by Value (TreeMap)
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <TreeMap
          data={treeMapData}
          dataKey="size"
          ratio={4 / 3}
          stroke="#fff"
          strokeWidth={2}
          content={({ root, depth, x, y, width, height, index, payload, name }) => {
            if (depth === 1) {
              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                      fill: payload.fill,
                      stroke: '#fff',
                      strokeWidth: 2,
                      fillOpacity: depth < 2 ? 1 : 0.7,
                    }}
                  />
                  {width > 100 && height > 40 && (
                    <>
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={12}
                        fontWeight="bold"
                      >
                        {name}
                      </text>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 15}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={10}
                      >
                        ${payload.size.toLocaleString()}
                      </text>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 28}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        Category {payload.category}
                      </text>
                    </>
                  )}
                </g>
              )
            }
            return null
          }}
        />
      </ResponsiveContainer>
    </div>
  )

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Item
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Unit Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Total Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Cumulative %
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedData.slice(0, 50).map((item, index) => {
            const colors = getCategoryColor(item.category)
            return (
              <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CubeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Rank #{item.rank}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colors.badge}`}
                  >
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {(item.quantity || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ${(item.unitCost || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ${item.value.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.cumulativePercentage.toFixed(1)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sortedData.length > 50 && (
        <div className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-700">
          Showing top 50 of {sortedData.length} items
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pareto analysis for inventory optimization
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="A">Category A (High Value)</option>
            <option value="B">Category B (Medium Value)</option>
            <option value="C">Category C (Low Value)</option>
          </select>

          {/* View mode toggles */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'chart'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ChartBarIcon className="h-4 w-4 mr-1 inline" />
              Charts
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('treemap')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'treemap'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              TreeMap
            </button>
          </div>
        </div>
      </div>

      {/* Category overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.keys(summaryStats).map(category => {
          const stats = summaryStats[category]
          const colors = getCategoryColor(category)

          return (
            <div key={category} className={`p-4 rounded-lg ${colors.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colors.badge}`}
                  >
                    Category {category}
                  </span>
                  {category === 'A' && <StarIcon className="h-4 w-4 text-yellow-500" />}
                  {category === 'C' && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div className={`text-xl font-bold ${colors.text}`}>{stats.count}</div>
              </div>
              <p className={`text-xs ${colors.text} mb-1`}>{getCategoryDescription(category)}</p>
              <div className="text-sm">
                <div className={`${colors.text} font-medium`}>
                  {stats.percentage.toFixed(1)}% of items
                </div>
                <div className={`${colors.text}`}>
                  {stats.valuePercentage.toFixed(1)}% of value (${stats.value.toLocaleString()})
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dynamic content */}
      {viewMode === 'chart' && renderChart()}
      {viewMode === 'table' && renderTable()}
      {viewMode === 'treemap' && renderTreeMap()}

      {/* ABC Analysis Insights */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          ABC Analysis Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Category A Strategy:</p>
            <p className="text-blue-700 dark:text-blue-300">
              Tight control, frequent review, accurate forecasting, safety stock optimization
            </p>
          </div>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Category B Strategy:</p>
            <p className="text-blue-700 dark:text-blue-300">
              Moderate control, periodic review, standard ordering procedures
            </p>
          </div>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Category C Strategy:</p>
            <p className="text-blue-700 dark:text-blue-300">
              Simple controls, bulk ordering, minimal safety stock, two-bin system
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
