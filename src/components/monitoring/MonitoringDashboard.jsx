import React, { useState, useEffect, useCallback } from 'react'
import { logError } from '../../utils/structuredLogger.js'
import {
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  SignalIcon,
  BoltIcon,
  Cog8ToothIcon
} from '@heroicons/react/24/solid'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import { healthMonitor } from '../../services/monitoring/healthMonitor'
import { performanceMonitor } from '../../services/monitoring/performanceMonitor'
import { securityMonitor } from '../../services/monitoring/securityMonitor'

const MonitoringDashboard = () => {
  const [systemHealth, setSystemHealth] = useState(null)
  const [performanceData, setPerformanceData] = useState(null)
  const [securityData, setSecurityData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Refresh monitoring data
  const refreshData = useCallback(async () => {
    try {
      // Get system health
      const health = healthMonitor.getSystemHealth()
      setSystemHealth(health)

      // Get performance metrics
      const performance = performanceMonitor.generatePerformanceReport()
      setPerformanceData(performance)

      // Get security report
      const security = securityMonitor.generateSecurityReport()
      setSecurityData(security)

      // Combine alerts from all monitoring services
      const allAlerts = [
        ...(health?.metrics?.alertsTriggered || []),
        ...(performance?.alerts || []),
        ...(security?.summary?.criticalAlerts > 0 ? [{
          type: 'security',
          severity: 'critical',
          message: `${security.summary.criticalAlerts} critical security alerts`,
          timestamp: Date.now()
        }] : [])
      ].sort((a, b) => b.timestamp - a.timestamp)

      setAlerts(allAlerts.slice(0, 10)) // Show top 10 most recent
      setLoading(false)

    } catch (error) {
      logError('Failed to refresh monitoring data', error)
    }
  }, [])

  // Auto-refresh setup
  useEffect(() => {
    refreshData()

    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [refreshData, autoRefresh])

  // Set up monitoring service alert handlers
  useEffect(() => {
    const alertHandler = (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)])
    }

    healthMonitor.onAlert(alertHandler)
    securityMonitor.onAlert(alertHandler)

    return () => {
      healthMonitor.offAlert(alertHandler)
      securityMonitor.offAlert(alertHandler)
    }
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (_severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200'
      case 'high':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'medium':
        return 'text-blue-600 bg-blue-100 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatUptime = (uptime) => {
    if (!uptime) return 'Unknown'

    const hours = Math.floor(uptime / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const formatValue = (value, format = 'number') => {
    if (typeof value !== 'number' || isNaN(value)) return '--'

    switch (format) {
      case 'ms':
        return `${Math.round(value)}ms`
      case 'mb':
        return `${Math.round(value)}MB`
      case 'percentage':
        return `${Math.round(value)}%`
      case 'bytes':
        return `${(value / 1024 / 1024).toFixed(1)}MB`
      default:
        return value.toLocaleString()
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Cog8ToothIcon className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading monitoring data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
            System Monitoring
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time system health, performance, and security monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BoltIcon className="h-4 w-4 mr-1 inline" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className={`h-8 w-8 ${
                  systemHealth?.overall?.healthy ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">System Status</p>
                <p className={`text-lg font-semibold ${getStatusColor(systemHealth?.overall?.status)}`}>
                  {systemHealth?.overall?.status || 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SignalIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-lg font-semibold">
                  {formatUptime(systemHealth?.metrics?.uptime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Performance</p>
                <p className="text-lg font-semibold">
                  {formatValue(performanceData?.coreWebVitals?.lcp, 'ms')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className={`h-8 w-8 ${
                  securityData?.summary?.criticalAlerts === 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Security</p>
                <p className="text-lg font-semibold">
                  {securityData?.summary?.criticalAlerts || 0} Alerts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, _index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity?.toUpperCase()}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {alert.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {alert.message}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Health Score</span>
                <span className="font-semibold">
                  {systemHealth?.overall?.percentage || '--'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Health Checks</span>
                <span className="font-semibold">
                  {systemHealth?.checks?.healthy || 0}/{systemHealth?.checks?.total || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Systems</span>
                <span className="font-semibold">
                  {systemHealth?.checks?.criticalHealthy || 0}/{systemHealth?.checks?.critical || 0}
                </span>
              </div>

              {/* Health Check Details */}
              {systemHealth?.checks && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Check Status</h4>
                  <div className="space-y-2">
                    {systemHealth.checks.slice(0, 5).map((check, _index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {check.name?.replace('', ' ')}
                        </span>
                        <div className="flex items-center">
                          {check.lastResult?.healthy ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                          )}
                          <span className="ml-1 text-xs text-gray-500">
                            {formatValue(check.successRate, 'percentage')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CpuChipIcon className="h-5 w-5 mr-2 text-purple-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData?.coreWebVitals && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">FCP</span>
                    <span className="font-semibold">
                      {formatValue(performanceData.coreWebVitals.fcp, 'ms')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">LCP</span>
                    <span className="font-semibold">
                      {formatValue(performanceData.coreWebVitals.lcp, 'ms')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">FID</span>
                    <span className="font-semibold">
                      {formatValue(performanceData.coreWebVitals.fid, 'ms')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CLS</span>
                    <span className="font-semibold">
                      {formatValue(performanceData.coreWebVitals.cls * 100, 'percentage')}
                    </span>
                  </div>
                </>
              )}

              {performanceData?.apiPerformance && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">API Performance</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Response</span>
                    <span className="font-semibold">
                      {formatValue(performanceData.apiPerformance.averageResponseTime, 'ms')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Requests</span>
                    <span className="font-semibold">
                      {formatValue(performanceData.apiPerformance.totalRequests)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityData?.summary && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Events</span>
                    <span className="font-semibold">
                      {formatValue(securityData.summary.totalEvents)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Critical Alerts</span>
                    <span className={`font-semibold ${
                      securityData.summary.criticalAlerts === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatValue(securityData.summary.criticalAlerts)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CSP Violations</span>
                    <span className="font-semibold">
                      {formatValue(securityData.summary.cspViolations)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High-Risk Sessions</span>
                    <span className={`font-semibold ${
                      securityData.summary.highRiskSessions === 0 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {formatValue(securityData.summary.highRiskSessions)}
                    </span>
                  </div>
                </>
              )}

              {securityData?.topThreats && securityData.topThreats.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Top Threats</h4>
                  <div className="space-y-2">
                    {securityData.topThreats.slice(0, 3).map((threat, _index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {threat.threat.replace('', ' ')}
                        </span>
                        <span className="font-semibold text-red-600">
                          {threat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            Last updated: {new Date().toLocaleString()}
          </span>
          <span>Monitoring: {autoRefresh ? 'Active' : 'Paused'}</span>
        </div>
        <div>
          System Monitoring v1.0
        </div>
      </div>
    </div>
  )
}

export default MonitoringDashboard