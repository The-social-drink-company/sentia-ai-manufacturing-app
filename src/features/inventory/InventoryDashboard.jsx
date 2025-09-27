import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TruckIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '../../hooks/useAuth'
import { useInventoryMetrics } from './hooks/useInventoryMetrics'
import InventoryCard from './components/InventoryCard'
import StockLevelChart from './components/StockLevelChart'
import DemandForecast from './components/DemandForecast'
import SupplierPerformance from './components/SupplierPerformance'
import ReorderRecommendations from './components/ReorderRecommendations'
import ABCAnalysis from './components/ABCAnalysis'
import { logError, devLog } from '../../utils/structuredLogger'

export default function InventoryDashboard() {
  const { user } = useAuth()
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [timeRange, setTimeRange] = useState('30d')
  const { data: metrics, loading, error, refetch, exportData } = useInventoryMetrics({
    location: selectedLocation,
    category: selectedCategory,
    timeRange
  })

  // Role-based access control
  if (user?.role === 'viewer') {
    return <Navigate to="/dashboard" replace />
  }

  // Auto-refresh every 30 seconds for inventory data
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30 * 1000) // 30 seconds for real-time inventory
    return () => clearInterval(interval)
  }, [refetch])

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Inventory Data</h3>
                <p className="text-red-600 dark:text-red-400 mt-1">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleExport = async (_format) => {
    try {
      await exportData(format)
    } catch (err) {
      logError('Export failed', err)
    }
  }

  const { summary, stockLevels, forecast, suppliers, reorders, analysis, alerts } = metrics || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <CubeIcon className="h-8 w-8 mr-3 text-blue-600" />
                Inventory Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time inventory tracking, demand forecasting, and optimization
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Locations</option>
                <option value="main">Main Warehouse</option>
                <option value="secondary">Secondary Warehouse</option>
                <option value="production">Production Floor</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="raw-materials">Raw Materials</option>
                <option value="wip">Work in Progress</option>
                <option value="finished-goods">Finished Goods</option>
                <option value="consumables">Consumables</option>
              </select>

              {/* Time Range */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="1y">1 Year</option>
              </select>

              {/* Export Menu */}
              <div className="relative group">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center">
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Alerts Section */}
        {alerts && alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Critical Inventory Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border flex items-start ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <ExclamationTriangleIcon
                    className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                      alert.severity === 'critical'
                        ? 'text-red-600 dark:text-red-400'
                        : alert.severity === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                    {alert.action && (
                      <button className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        {alert.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <InventoryCard
            title="Total Items"
            value={summary?.totalItems || 0}
            change={summary?.itemsChange}
            format="number"
            icon={CubeIcon}
            color="blue"
          />
          <InventoryCard
            title="Inventory Value"
            value={summary?.totalValue || 0}
            change={summary?.valueChange}
            format="currency"
            icon={ChartBarIcon}
            color="green"
          />
          <InventoryCard
            title="Turnover Ratio"
            value={summary?.turnoverRatio || 0}
            change={summary?.turnoverChange}
            format="decimal"
            icon={ArrowTrendingUpIcon}
            color="purple"
            target={6.0}
          />
          <InventoryCard
            title="Stockout Risk"
            value={summary?.stockoutRisk || 0}
            change={summary?.riskChange}
            format="percentage"
            icon={ExclamationTriangleIcon}
            color="red"
            target={5}
            inverted={true}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StockLevelChart
            data={stockLevels}
            title="Stock Level Overview"
            timeRange={timeRange}
          />
          <DemandForecast
            data={forecast}
            title="Demand Forecast"
            period={timeRange}
          />
        </div>

        {/* ABC Analysis */}
        <div className="mb-8">
          <ABCAnalysis
            data={analysis}
            title="ABC Analysis"
          />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SupplierPerformance
            data={suppliers}
            title="Supplier Performance"
          />
          <ReorderRecommendations
            data={reorders}
            title="Reorder Recommendations"
            onReorderAction={(item) => devLog.log('Reorder action:', item)}
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <CubeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Cycle Count</span>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <TruckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create PO</span>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Adjust Stock</span>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <ChartBarIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}