import { useState, useEffect, useMemo, memo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CogIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '../../hooks/useAuth'
import { useProductionMetrics } from './hooks/useProductionMetrics'
import { ProductionTimeline } from './components/ProductionTimeline'
import OEEDisplay from './components/OEEDisplay'
import MachineStatusGrid from './components/MachineStatusGrid'
import ProductionSchedule from './components/ProductionSchedule'
import QualityMetrics from './components/QualityMetrics'
import CapacityPlanning from './components/CapacityPlanning'
import ShiftHandover from './components/ShiftHandover'
import IoTStatusDisplay from './components/IoTStatusDisplay'
import { logError } from '../../utils/structuredLogger'

export default function ProductionDashboard() {
  const { user } = useAuth()
  const [selectedLine, setSelectedLine] = useState('all')
  const [selectedShift, setSelectedShift] = useState('current')
  const [timeRange, setTimeRange] = useState('24h')
  const [activeView, setActiveView] = useState('overview')

  const {
    data: metrics,
    loading,
    error,
    refetch,
    exportData,
    isRealTimeData,
    dataSource
  } = useProductionMetrics({
    line: selectedLine,
    shift: selectedShift,
    timeRange
  })

  // Role-based access control
  if (user?.role === 'viewer') {
    return <Navigate to="/dashboard" replace />
  }

  // Auto-refresh every 10 seconds for real-time production data
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 10 * 1000) // 10 seconds for real-time production monitoring
    return () => clearInterval(interval)
  }, [refetch])

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading production data...</p>
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
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Production Data</h3>
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
      logError('Export failed', err)
    }
  }

  const { oee, machines, schedule, quality, capacity, shifts, alerts } = metrics || {}

  const getOEEStatus = useMemo(() => (oeeValue) => {
    if (oeeValue >= 85) return { color: 'green', status: 'Excellent' }
    if (oeeValue >= 70) return { color: 'blue', status: 'Good' }
    if (oeeValue >= 60) return { color: 'yellow', status: 'Fair' }
    return { color: 'red', status: 'Poor' }
  }, [])

  const overallOEE = oee?.overall || 0
  const oeeStatus = useMemo(() => getOEEStatus(overallOEE), [overallOEE, getOEEStatus])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <CogIcon className="h-8 w-8 mr-3 text-blue-600" />
                Production Tracking
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time OEE monitoring, production scheduling, and quality control
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Production Line Filter */}
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Lines</option>
                <option value="line-1">Production Line 1</option>
                <option value="line-2">Production Line 2</option>
                <option value="line-3">Production Line 3</option>
                <option value="line-4">Production Line 4</option>
              </select>

              {/* Shift Filter */}
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="current">Current Shift</option>
                <option value="shift-1">Shift 1 (06:00-14:00)</option>
                <option value="shift-2">Shift 2 (14:00-22:00)</option>
                <option value="shift-3">Shift 3 (22:00-06:00)</option>
              </select>

              {/* Time Range */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="4h">Last 4 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    activeView === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('schedule')}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    activeView === 'schedule'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setActiveView('quality')}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    activeView === 'quality'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Quality
                </button>
              </div>

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
        {/* IoT System Status */}
        <div className="mb-8">
          <IoTStatusDisplay />
        </div>

        {/* Data Source Indicator */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isRealTimeData
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isRealTimeData ? 'bg-green-600 animate-pulse' : 'bg-yellow-600'
            }`} />
            {isRealTimeData ? 'Live IoT Data' : 'Simulated Data'} • {dataSource}
          </div>
        </div>

        {/* Critical Production Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Critical Production Alerts</h2>
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

        {/* OEE Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full bg-${oeeStatus.color}-100 dark:bg-${oeeStatus.color}-900/20`}>
                <ChartBarIcon className={`h-6 w-6 text-${oeeStatus.color}-600 dark:text-${oeeStatus.color}-400`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall OEE</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{overallOEE.toFixed(1)}%</p>
                  <span className={`ml-2 text-sm px-2 py-1 rounded-full bg-${oeeStatus.color}-100 text-${oeeStatus.color}-800`}>
                    {oeeStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <PlayIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Availability</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{oee?.availability || 0}%</p>
                  <span className={`ml-2 text-sm ${oee?.availabilityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {oee?.availabilityChange >= 0 ? '↑' : '↓'} {Math.abs(oee?.availabilityChange || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <ClockIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{oee?.performance || 0}%</p>
                  <span className={`ml-2 text-sm ${oee?.performanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {oee?.performanceChange >= 0 ? '↑' : '↓'} {Math.abs(oee?.performanceChange || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <CheckCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quality</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{oee?.quality || 0}%</p>
                  <span className={`ml-2 text-sm ${oee?.qualityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {oee?.qualityChange >= 0 ? '↑' : '↓'} {Math.abs(oee?.qualityChange || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Based on Active View */}
        {activeView === 'overview' && (
          <>
            {/* OEE Display and Machine Status Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <OEEDisplay data={oee} timeRange={timeRange} />
              <MachineStatusGrid machines={machines} />
            </div>

            {/* Production Timeline and Capacity Planning */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ProductionTimeline jobs={schedule?.jobs} />
              <CapacityPlanning data={capacity} />
            </div>
          </>
        )}

        {activeView === 'schedule' && (
          <div className="grid grid-cols-1 gap-6">
            <ProductionSchedule data={schedule} />
          </div>
        )}

        {activeView === 'quality' && (
          <div className="grid grid-cols-1 gap-6">
            <QualityMetrics data={quality} />
          </div>
        )}

        {/* Shift Handover Section */}
        <div className="mb-8">
          <ShiftHandover shifts={shifts} currentShift={selectedShift} />
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <PlayIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Start Job</span>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <PauseIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Pause Line</span>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <StopIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Emergency Stop</span>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}