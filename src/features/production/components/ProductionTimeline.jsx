import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { useState, useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle , Badge } from '../../../components/ui'
import { cn } from '../../../utils/cn'

const generateMockJobs = () => {
  const statuses = ['scheduled', 'in-progress', 'completed', 'delayed', 'failed']
  const products = ['SNTG-001', 'SNTG-002', 'SNTB-001', 'SNTB-002', 'SNTR-001']

  return Array.from({ length: 10 }, (_, i) => ({
    id: `JOB-${1000 + i}`,
    product: products[Math.floor(Math.random() * products.length)],
    quantity: Math.floor(Math.random() * 5000) + 1000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    startTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    endTime: new Date(Date.now() + Math.random() * 86400000).toISOString(),
    progress: Math.floor(Math.random() * 100),
    machine: `Line ${Math.floor(Math.random() * 4) + 1}`,
    operator: `Operator ${Math.floor(Math.random() * 10) + 1}`,
    efficiency: Math.floor(Math.random() * 30) + 70
  }))
}

export function ProductionTimeline({ jobs, onJobClick, view = 'timeline' }) {
  const [selectedJob, setSelectedJob] = useState(null)
  const productionJobs = useMemo(() => jobs || generateMockJobs(), [jobs])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'in-progress':
        return <PlayIcon className="h-5 w-5 text-blue-600" />
      case 'scheduled':
        return <ClockIcon className="h-5 w-5 text-gray-600" />
      case 'delayed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return <PauseIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'in-progress': 'info',
      'scheduled': 'default',
      'delayed': 'warning',
      'failed': 'destructive'
    }
    return variants[status] || 'default'
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const renderTimelineView = () => {
    const groupedJobs = productionJobs.reduce((acc, job) => {
      const date = formatDate(job.startTime)
      if (!acc[date]) acc[date] = []
      acc[date].push(job)
      return acc
    }, {})

    return (
      <div className="space-y-6">
        {Object.entries(groupedJobs).map(([date, dateJobs]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              {date}
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

              {dateJobs.map((job) => (
                <div
                  key={job.id}
                  className="relative flex items-start mb-6"
                  onClick={() => {
                    setSelectedJob(job)
                    onJobClick && onJobClick(job)
                  }}
                >
                  <div className="absolute left-0 w-8 h-8 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                    {getStatusIcon(job.status)}
                  </div>

                  <div className="ml-12 flex-1 cursor-pointer">
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{job.id}</h4>
                            <Badge variant={getStatusBadge(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatTime(job.startTime)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Product</p>
                            <p className="font-medium">{job.product}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Quantity</p>
                            <p className="font-medium">{job.quantity.toLocaleString()} units</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Machine</p>
                            <p className="font-medium">{job.machine}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Efficiency</p>
                            <p className="font-medium">{job.efficiency}%</p>
                          </div>
                        </div>

                        {job.status === 'in-progress' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderListView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Machine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {productionJobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  setSelectedJob(job)
                  onJobClick && onJobClick(job)
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {job.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {job.product}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusBadge(job.status)}>
                    {job.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {job.quantity.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {job.machine}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <span className="text-sm">{job.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={cn(
                    'font-medium',
                    job.efficiency >= 90 && 'text-green-600',
                    job.efficiency >= 70 && job.efficiency < 90 && 'text-blue-600',
                    job.efficiency < 70 && 'text-red-600'
                  )}>
                    {job.efficiency}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Production Timeline</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedJob(null)}
              className={cn(
                "px-3 py-1 text-sm rounded",
                view === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Timeline
            </button>
            <button
              className={cn(
                "px-3 py-1 text-sm rounded",
                view === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              List
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === 'timeline' ? renderTimelineView() : renderListView()}
      </CardContent>
    </Card>
  )
}