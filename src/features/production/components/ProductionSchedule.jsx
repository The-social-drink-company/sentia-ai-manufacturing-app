import { useState, useMemo } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  FlagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../../components/ui'

export default function ProductionSchedule({ data }) {
  const [selectedView, setSelectedView] = useState('timeline') // timeline, table, analytics
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Mock data fallback
  const scheduleData = data || {
    jobs: [],
    plannedProduction: 45000,
    actualProduction: 42300,
    onTimeDelivery: 87,
    variance: {
      schedule: -6.2,
      efficiency: +3.1
    }
  }

  const jobs = scheduleData.jobs || []

  // Filter jobs based on selections
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const priorityMatch = selectedPriority === 'all' || job.priority === selectedPriority
      const statusMatch = selectedStatus === 'all' || job.status === selectedStatus
      return priorityMatch && statusMatch
    })
  }, [jobs, selectedPriority, selectedStatus])

  const getStatusConfig = (status) => {
    const configs = {
      'completed': {
        color: 'green',
        variant: 'success',
        icon: CheckCircleIcon,
        label: 'Completed'
      },
      'in-progress': {
        color: 'blue',
        variant: 'info',
        icon: PlayIcon,
        label: 'In Progress'
      },
      'scheduled': {
        color: 'gray',
        variant: 'default',
        icon: ClockIcon,
        label: 'Scheduled'
      },
      'delayed': {
        color: 'red',
        variant: 'destructive',
        icon: ExclamationTriangleIcon,
        label: 'Delayed'
      }
    }
    return configs[status] || configs['scheduled']
  }

  const getPriorityConfig = (priority) => {
    const configs = {
      'high': { color: 'red', label: 'High', variant: 'destructive' },
      'medium': { color: 'yellow', label: 'Medium', variant: 'warning' },
      'low': { color: 'green', label: 'Low', variant: 'success' }
    }
    return configs[priority] || configs['medium']
  }

  const calculateVariance = (planned, actual) => {
    if (!planned || !actual) return 0
    return ((new Date(actual) - new Date(planned)) / (1000 * 60 * 60)) // Hours difference
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${Math.round(hours / 24)}d ${Math.round(hours % 24)}h`
  }

  const TimelineView = () => {
    const groupedJobs = filteredJobs.reduce((groups, job) => {
      const date = new Date(job.plannedStart).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(job)
      return groups
    }, {})

    return (
      <div className="space-y-6">
        {Object.entries(groupedJobs).map(([date, dateJobs]) => (
          <div key={date} className="relative">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 sticky top-0 bg-white dark:bg-gray-900 py-2 border-b">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

              {dateJobs
                .sort((a, b) => new Date(a.plannedStart) - new Date(b.plannedStart))
                .map((job, index) => {
                  const statusConfig = getStatusConfig(job.status)
                  const priorityConfig = getPriorityConfig(job.priority)
                  const scheduleVariance = calculateVariance(job.plannedStart, job.actualStart)
                  const StatusIcon = statusConfig.icon

                  return (
                    <div key={job.id} className="relative mb-6">
                      <div className="absolute left-0 w-8 h-8 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                        <StatusIcon className={`h-4 w-4 text-${statusConfig.color}-600`} />
                      </div>

                      <div className="ml-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{job.id}</h4>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            <Badge variant={priorityConfig.variant} className="text-xs">
                              {priorityConfig.label} Priority
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDateTime(job.plannedStart)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Product</p>
                            <p className="font-medium text-gray-900 dark:text-white">{job.product}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Quantity</p>
                            <p className="font-medium text-gray-900 dark:text-white">{job.quantity?.toLocaleString()} units</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Line</p>
                            <p className="font-medium text-gray-900 dark:text-white">{job.lineId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Operator</p>
                            <p className="font-medium text-gray-900 dark:text-white">{job.operator}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {job.status === 'in-progress' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Progress</span>
                              <span className="text-gray-900 dark:text-white">{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Schedule Variance */}
                        {job.actualStart && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Schedule Variance:</span>
                            <span className={`flex items-center ${
                              scheduleVariance <= 0 ? 'text-green-600' : scheduleVariance <= 2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {scheduleVariance <= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                              )}
                              {scheduleVariance <= 0 ? 'On Time' : `+${formatDuration(scheduleVariance)}`}
                            </span>
                          </div>
                        )}

                        {/* Notes */}
                        {job.notes && (
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm text-gray-700 dark:text-gray-300">
                            <strong>Notes:</strong> {job.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const TableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredJobs.map((job) => {
              const statusConfig = getStatusConfig(job.status)
              const priorityConfig = getPriorityConfig(job.priority)
              const variance = calculateVariance(job.plannedStart, job.actualStart)

              return (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {job.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {job.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {job.quantity?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDateTime(job.plannedStart)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDateTime(job.actualStart)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {job.actualStart ? (
                      <span className={`${
                        variance <= 0 ? 'text-green-600' : variance <= 2 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {variance <= 0 ? 'On Time' : `+${formatDuration(variance)}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.status === 'in-progress' ? (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">{job.progress}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        {job.status === 'completed' ? '100%' : 'N/A'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const AnalyticsView = () => {
    const totalJobs = filteredJobs.length
    const completedJobs = filteredJobs.filter(job => job.status === 'completed').length
    const inProgressJobs = filteredJobs.filter(job => job.status === 'in-progress').length
    const delayedJobs = filteredJobs.filter(job => job.status === 'delayed').length

    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
    const onTimeJobs = filteredJobs.filter(job =>
      job.actualStart && calculateVariance(job.plannedStart, job.actualStart) <= 0
    ).length
    const onTimeRate = completedJobs > 0 ? (onTimeJobs / completedJobs) * 100 : 0

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {completedJobs} ({completionRate.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <PlayIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{inProgressJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delayed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{delayedJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">On-Time Delivery Rate</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {onTimeRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      onTimeRate >= 90 ? 'bg-green-500' :
                      onTimeRate >= 80 ? 'bg-blue-500' :
                      onTimeRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${onTimeRate}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Schedule Variance</span>
                  <span className={`text-lg font-semibold ${
                    scheduleData.variance?.schedule <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {scheduleData.variance?.schedule?.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Efficiency Variance</span>
                  <span className={`text-lg font-semibold ${
                    scheduleData.variance?.efficiency >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {scheduleData.variance?.efficiency >= 0 ? '+' : ''}{scheduleData.variance?.efficiency?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Production Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Planned Production</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {scheduleData.plannedProduction?.toLocaleString()} units
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Actual Production</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {scheduleData.actualProduction?.toLocaleString()} units
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{
                      width: `${Math.min((scheduleData.actualProduction / scheduleData.plannedProduction) * 100, 100)}%`
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Production Achievement</span>
                  <span className={`text-lg font-semibold ${
                    (scheduleData.actualProduction / scheduleData.plannedProduction) >= 0.95 ? 'text-green-600' :
                    (scheduleData.actualProduction / scheduleData.plannedProduction) >= 0.85 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {((scheduleData.actualProduction / scheduleData.plannedProduction) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Production Schedule & Variance Analysis
          </CardTitle>

          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg">
              {['timeline', 'table', 'analytics'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`px-3 py-1 text-sm capitalize rounded-lg transition ${
                    selectedView === view
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Filters */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {selectedView === 'timeline' && <TimelineView />}
        {selectedView === 'table' && <TableView />}
        {selectedView === 'analytics' && <AnalyticsView />}
      </CardContent>
    </Card>
  )
}