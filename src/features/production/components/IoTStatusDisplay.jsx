/**
 * IoT Status Display Component
 * Shows real-time status of IoT sensor connections and system health
 */

import { useState } from 'react'
import {
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SignalIcon,
  CpuChipIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useIoTIntegration, useIoTAlarms } from '../hooks/useIoTIntegration'

export default function IoTStatusDisplay() {
  const { connectionStatus, isConnected, lastDataReceived } = useIoTIntegration()
  const { criticalCount, totalCount } = useIoTAlarms()
  const [showDetails, setShowDetails] = useState(false)

  const formatLastReceived = (timestamp) => {
    if (!timestamp) return 'Never'
    const diff = new Date() - new Date(timestamp)
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`
    return `${seconds}s ago`
  }

  const getStatusColor = () => {
    if (!isConnected) return 'red'
    if (criticalCount > 0) return 'red'
    if (totalCount > 0) return 'yellow'
    return 'green'
  }

  const getStatusIcon = () => {
    const color = getStatusColor()
    const iconClass = `h-6 w-6 ${
      color === 'red' ? 'text-red-600' :
      color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
    }`

    if (!isConnected) return <WifiIcon className={iconClass} />
    if (criticalCount > 0) return <ExclamationTriangleIcon className={iconClass} />
    return <CheckCircleIcon className={iconClass} />
  }

  const getStatusMessage = () => {
    if (!isConnected) return 'IoT System Offline'
    if (criticalCount > 0) return `${criticalCount} Critical Alarms`
    if (totalCount > 0) return `${totalCount} Active Alarms`
    return 'All Systems Normal'
  }

  const connectionHealth = () => {
    if (!isConnected) return 'offline'
    if (!lastDataReceived) return 'connecting'

    const timeSinceData = new Date() - new Date(lastDataReceived)
    if (timeSinceData > 60000) return 'stale' // 1 minute
    if (timeSinceData > 10000) return 'delayed' // 10 seconds
    return 'healthy'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Main Status Bar */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                IoT System Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusMessage()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Health Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionHealth() === 'healthy' ? 'bg-green-500' :
                connectionHealth() === 'delayed' ? 'bg-yellow-500' :
                connectionHealth() === 'stale' ? 'bg-orange-500' : 'bg-red-500'
              } ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {connectionHealth().toUpperCase()}
              </span>
            </div>

            {/* Machine Count */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {connectionStatus.onlineMachines}/{connectionStatus.totalMachines}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Machines Online
              </div>
            </div>

            {/* Expand/Collapse Indicator */}
            <div className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Status (Collapsible) */}
      {showDetails && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-4">
            {/* Connection Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <WifiIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Connection
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Data:</span>
                    <span>{formatLastReceived(lastDataReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reconnect Attempts:</span>
                    <span>{connectionStatus.reconnectAttempts || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CpuChipIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Machines
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{connectionStatus.totalMachines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Online:</span>
                    <span className="font-medium text-green-600">
                      {connectionStatus.onlineMachines}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Offline:</span>
                    <span className="font-medium text-red-600">
                      {connectionStatus.totalMachines - connectionStatus.onlineMachines}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Alarms
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Critical:</span>
                    <span className={`font-medium ${criticalCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {criticalCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Active:</span>
                    <span className={`font-medium ${totalCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {totalCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      criticalCount > 0 ? 'text-red-600' :
                      totalCount > 0 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {criticalCount > 0 ? 'Critical' :
                       totalCount > 0 ? 'Warning' : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Performance Metrics */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-3">
                <SignalIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  System Performance
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {Math.round((connectionStatus.onlineMachines / connectionStatus.totalMachines) * 100)}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Availability</div>
                </div>

                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {isConnected ? '<1s' : 'N/A'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Latency</div>
                </div>

                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {isConnected ? '1Hz' : 'N/A'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Update Rate</div>
                </div>

                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {connectionStatus.connectionStartTime
                      ? Math.round((new Date() - new Date(connectionStatus.connectionStartTime)) / 60000)
                      : 0}m
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
              </div>
            </div>

            {/* Connection Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-3 w-3" />
                <span>
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {!isConnected && (
                  <button
                    onClick={() => {
                      // Trigger reconnection
                      window.location.reload()
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Reconnect
                  </button>
                )}

                <button
                  onClick={() => setShowDetails(false)}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Collapse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className={`px-4 py-2 border-t border-gray-200 dark:border-gray-700 ${
        getStatusColor() === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
        getStatusColor() === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
        'bg-red-50 dark:bg-red-900/20'
      }`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              getStatusColor() === 'green' ? 'bg-green-600' :
              getStatusColor() === 'yellow' ? 'bg-yellow-600' : 'bg-red-600'
            } ${isConnected ? 'animate-pulse' : ''}`} />
            <span className={`font-medium ${
              getStatusColor() === 'green' ? 'text-green-700 dark:text-green-300' :
              getStatusColor() === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
              'text-red-700 dark:text-red-300'
            }`}>
              {isConnected ? 'Real-time Data Active' : 'Using Simulated Data'}
            </span>
          </div>

          {isConnected && (
            <span className="text-gray-500 dark:text-gray-400">
              Data stream: {formatLastReceived(lastDataReceived)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}