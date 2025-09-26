import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  TruckIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '../../hooks/useAuth'
import { useInventoryMetrics } from './hooks/useInventoryMetrics'
import { InventoryHeatmap } from './components/InventoryHeatmap'
import StockLevelChart from './components/StockLevelChart'
import ReorderPointsWidget from './components/ReorderPointsWidget'
import InventoryTurnoverChart from './components/InventoryTurnoverChart'
import SlowMovingStock from './components/SlowMovingStock'
import StockMovementForecast from './components/StockMovementForecast'
import MetricCard from '../working-capital/components/MetricCard'

export default function InventoryDashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const { data: metrics, loading, error, refetch, exportData } = useInventoryMetrics(selectedPeriod, selectedCategory, selectedLocation)

  // Role-based access control - allow manager and above
  if (user?.role === 'viewer') {
    return <Navigate to="/dashboard" replace />
  }

  // Auto-refresh every 5 minutes for inventory data
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 5 * 60 * 1000) // 5 minutes
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

  const handleExport = async (format) => {
    try {
      await exportData(format)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleHeatmapCellClick = (sku, locationData) => {
    console.log('Clicked inventory cell:', sku, locationData)
    // Could open a detailed view modal here
  }

  const { summary, stockLevels, reorderPoints, turnover, slowMoving, forecast, alerts } = metrics || {}

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
                Monitor stock levels, reorder points, and inventory turnover
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
                <option value="UK-London">London</option>
                <option value="UK-Manchester">Manchester</option>
                <option value="EU-Amsterdam">Amsterdam</option>
                <option value="EU-Berlin">Berlin</option>
                <option value="US-NYC">New York</option>
                <option value="US-LA">Los Angeles</option>
                <option value="US-Chicago">Chicago</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="raw-materials">Raw Materials</option>
                <option value="work-in-progress">WIP</option>
                <option value="finished-goods">Finished Goods</option>
                <option value="packaging">Packaging</option>
              </select>

              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="current">Current</option>
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
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
        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Alerts</h2>
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

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Stock Value"
            value={summary?.totalValue || 0}
            change={summary?.valueChange}
            format="currency"
            icon={CubeIcon}
            color="blue"
          />
          <MetricCard
            title="Inventory Turnover"
            value={summary?.turnoverRatio || 0}
            change={summary?.turnoverChange}
            format="ratio"
            icon={ArrowTrendingUpIcon}
            color="green"
            target={12}
          />
          <MetricCard
            title="Days on Hand"
            value={summary?.daysOnHand || 0}
            change={summary?.daysOnHandChange}
            format="days"
            icon={ClockIcon}
            color="orange"
            target={30}
          />
          <MetricCard
            title="Stockout Risk"
            value={summary?.stockoutRisk || 0}
            change={summary?.stockoutRiskChange}
            format="number"
            icon={ExclamationTriangleIcon}
            color="red"
          />
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Inventory Heatmap */}
          <div>
            <InventoryHeatmap
              data={stockLevels?.heatmapData}
              onCellClick={handleHeatmapCellClick}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StockLevelChart
              data={stockLevels?.chartData}
              period={selectedPeriod}
            />
            <InventoryTurnoverChart
              data={turnover?.chartData}
              period={selectedPeriod}
            />
          </div>

          {/* Widgets Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ReorderPointsWidget
              data={reorderPoints}
            />
            <SlowMovingStock
              data={slowMoving}
            />
            <StockMovementForecast
              data={forecast}
              period={selectedPeriod}
            />
          </div>
        </div>
      </div>
    </div>
  )
}