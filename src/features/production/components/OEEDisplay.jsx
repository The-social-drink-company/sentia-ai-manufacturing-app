import { useState, useMemo, memo } from 'react'
import {
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui'

const OEEDisplay = memo(function OEEDisplay({ data, timeRange = '24h', loading = false, error = null }) {
  const [selectedLine] = useState('all')

  // Real data processing
  const oeeData = useMemo(() => data || {
    overall: 0,
    availability: 0,
    performance: 0,
    quality: 0,
    target: 85,
    worldClass: 90,
    availabilityChange: 0,
    performanceChange: 0,
    qualityChange: 0,
    lineBreakdown: []
  }, [data])

  const getOEEStatus = useMemo(() => (oeeValue) => {
    if (oeeValue >= 85) return { color: 'green', status: 'Excellent', bgColor: 'bg-green-100', textColor: 'text-green-800' }
    if (oeeValue >= 70) return { color: 'blue', status: 'Good', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
    if (oeeValue >= 60) return { color: 'yellow', status: 'Fair', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' }
    return { color: 'red', status: 'Poor', bgColor: 'bg-red-100', textColor: 'text-red-800' }
  }, [])

  const statusData = useMemo(() => ({
    overall: getOEEStatus(oeeData.overall),
    availability: getOEEStatus(oeeData.availability),
    performance: getOEEStatus(oeeData.performance),
    quality: getOEEStatus(oeeData.quality)
  }), [oeeData, getOEEStatus])

  const formatChange = (change) => {
    if (!change) return null
    const isPositive = change >= 0
    return (
      <span className={`flex items-center ml-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4 mr-1" /> : <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    )
  }

  const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = 'blue' }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    const colorMap = {
      green: '#10B981',
      blue: '#3B82F6',
      yellow: '#F59E0B',
      red: '#EF4444'
    }

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorMap[color]}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {value.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              OEE
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ComponentBar = ({ label, value, target, icon: Icon, color, change }) => {
    const percentage = Math.min((value / target) * 100, 100)
    const status = getOEEStatus(value)

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-${status.color}-100 dark:bg-${status.color}-900/20`}>
              <Icon className={`h-5 w-5 text-${status.color}-600 dark:text-${status.color}-400`} />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {value.toFixed(1)}%
                </span>
                {formatChange(change)}
              </div>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
            {status.status}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Progress to Target ({target}%)</span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 bg-${status.color}-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          {percentage > 100 && (
            <div className="flex items-center text-xs text-green-600">
              <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
              Exceeding target by {(percentage - 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Overall Equipment Effectiveness (OEE)
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Target: {oeeData.target}% | World Class: {oeeData.worldClass}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading OEE data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">Failed to load OEE data</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : !data || Object.keys(data).length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No OEE data available</p>
              <p className="text-xs text-muted-foreground">Check API configuration</p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall OEE Circle */}
          <div className="flex flex-col items-center justify-center p-6">
            <CircularProgress
              value={oeeData.overall}
              color={statusData.overall.color}
              size={160}
              strokeWidth={12}
            />
            <div className="mt-4 text-center">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusData.overall.bgColor} ${statusData.overall.textColor}`}>
                {statusData.overall.status}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* OEE Components */}
          <div className="space-y-4">
            <ComponentBar
              label="Availability"
              value={oeeData.availability}
              target={90}
              icon={ClockIcon}
              color={statusData.availability.color}
              change={oeeData.availabilityChange}
            />

            <ComponentBar
              label="Performance"
              value={oeeData.performance}
              target={95}
              icon={CogIcon}
              color={statusData.performance.color}
              change={oeeData.performanceChange}
            />

            <ComponentBar
              label="Quality"
              value={oeeData.quality}
              target={99}
              icon={CheckCircleIcon}
              color={statusData.quality.color}
              change={oeeData.qualityChange}
            />
          </div>
        </div>

        {/* OEE Formula */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">OEE Calculation</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center">
              <span className="text-lg font-mono">
                {oeeData.availability.toFixed(1)}%
              </span>
              <span className="mx-2 text-gray-400">×</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-lg font-mono">
                {oeeData.performance.toFixed(1)}%
              </span>
              <span className="mx-2 text-gray-400">×</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-lg font-mono">
                {oeeData.quality.toFixed(1)}%
              </span>
              <span className="mx-2 text-gray-400">=</span>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-xl font-mono font-bold text-blue-600">
              {oeeData.overall.toFixed(1)}% OEE
            </span>
          </div>
        </div>

        {/* Line Breakdown (if available) */}
        {oeeData.lineBreakdown && oeeData.lineBreakdown.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">OEE by Production Line</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Line</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Availability</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Performance</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Quality</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Overall OEE</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {oeeData.lineBreakdown.map((line) => {
                    const lineStatus = getOEEStatus(line.overall)
                    const statusConfig = {
                      'running': { color: 'green', label: 'Running' },
                      'setup': { color: 'yellow', label: 'Setup' },
                      'down': { color: 'red', label: 'Down' },
                      'idle': { color: 'gray', label: 'Idle' }
                    }
                    const status = statusConfig[line.status] || statusConfig['idle']

                    return (
                      <tr key={line.lineId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 bg-${status.color}-500`}></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {line.lineName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-sm">{line.availability.toFixed(1)}%</td>
                        <td className="px-4 py-2 text-center text-sm">{line.performance.toFixed(1)}%</td>
                        <td className="px-4 py-2 text-center text-sm">{line.quality.toFixed(1)}%</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${lineStatus.bgColor} ${lineStatus.textColor}`}>
                            {line.overall.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-blue-600" />
            Performance Insights
          </h4>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {oeeData.overall < oeeData.target && (
              <p>• Overall OEE is {(oeeData.target - oeeData.overall).toFixed(1)}% below target. Focus on improving the lowest performing component.</p>
            )}
            {oeeData.availability < 90 && (
              <p>• Availability could be improved by {(90 - oeeData.availability).toFixed(1)}% through better preventive maintenance.</p>
            )}
            {oeeData.performance < 95 && (
              <p>• Performance efficiency has potential for {(95 - oeeData.performance).toFixed(1)}% improvement through process optimization.</p>
            )}
            {oeeData.quality < 99 && (
              <p>• Quality rate can be enhanced by {(99 - oeeData.quality).toFixed(1)}% with improved process control.</p>
            )}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
})

export default OEEDisplay
