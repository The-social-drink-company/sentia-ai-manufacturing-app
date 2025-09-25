import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  CircleStackIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../../lib/utils'

const StatCard = ({ title, value, change, changeType, suffix = '', icon: Icon, status = 'normal' }) => {
  const statusColors = {
    good: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    normal: 'text-secondary bg-secondary'
  }

  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-tertiary'
  }

  return (
    <div className="bg-elevated rounded-lg p-6 border border-light">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={cn("p-2 rounded-lg", statusColors[status])}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-secondary">
              {title}
            </p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {value}{suffix}
          </p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center text-sm mt-1",
              changeColors[changeType]
            )}>
              <span>{changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}{Math.abs(change)}%</span>
              <span className="ml-1 text-tertiary">vs last hour</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const TimelineChart = ({ data, title }) => {
  const maxValue = Math.max(...data)
  
  return (
    <div className="bg-elevated rounded-lg p-6 border border-light">
      <h3 className="text-lg font-medium text-primary mb-4">{title}</h3>
      <div className="flex items-end justify-between h-32 space-x-1">
        {data.map((value, index) => (
          <div
            key={index}
            className="bg-blue-500 rounded-t"
            style={{
              height: `${(value / maxValue) * 100}%`,
              width: '100%'
            }}
            title={`${value} at ${new Date(Date.now() - (data.length - index) * 5 * 60 * 1000).toLocaleTimeString()}`}
          />
        ))}
      </div>
    </div>
  )
}

const IncidentBanner = ({ incidents }) => {
  if (incidents.length === 0) return null

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 dark:bg-red-900/20 dark:border-red-600">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Active Incidents ({incidents.length})
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            {incidents.map((incident, index) => (
              <div key={index} className="mb-1">
                <span className="font-medium">{incident.title}</span>
                <span className="ml-2 text-xs">Started {incident.startedAt}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <button className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100">
              View Error Explorer â†’
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AdminOverview = () => {
  const [timeRange, setTimeRange] = useState('1h')

  // Fetch system health metrics
  const { data: healthMetrics, isLoading } = useQuery({
    queryKey: ['admin', 'health', timeRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        uptime: {
          value: '99.9',
          status: 'good',
          since: '2025-01-01T00:00:00Z'
        },
        errorRate: {
          value: '0.2',
          change: -15,
          changeType: 'positive',
          status: 'good'
        },
        latencyP95: {
          value: '145',
          change: 5,
          changeType: 'negative',
          status: 'warning'
        },
        queueDepth: {
          value: '12',
          change: -8,
          changeType: 'positive',
          status: 'good'
        },
        dbConnections: {
          value: '45',
          total: 100,
          status: 'good'
        },
        redisStatus: {
          value: 'Connected',
          memoryUsage: '67%',
          status: 'good'
        },
        timeline: {
          errorRate: [0.1, 0.2, 0.3, 0.2, 0.1, 0.2, 0.2, 0.1, 0.3, 0.2, 0.1, 0.2],
          latency: [120, 135, 140, 145, 150, 148, 142, 138, 145, 149, 152, 145],
          requests: [1200, 1350, 1100, 1400, 1250, 1300, 1180, 1420, 1380, 1150, 1290, 1310]
        }
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const incidents = [
    // Example incidents - would come from API
    // { title: 'High latency on forecast API', startedAt: '5 minutes ago', severity: 'high' }
  ]

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-tertiary rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="h-16 bg-tertiary rounded mb-4"></div>
                <div className="h-8 bg-tertiary rounded mb-2"></div>
                <div className="h-4 bg-tertiary rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">System Overview</h1>
          <p className="text-secondary mt-1">
            Real-time system health and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="5m">Last 5 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
      </div>

      {/* Incident banner */}
      <IncidentBanner incidents={incidents} />

      {/* System metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="System Uptime"
          value={healthMetrics?.uptime.value}
          suffix="%"
          icon={ServerIcon}
          status={healthMetrics?.uptime.status}
        />
        
        <StatCard
          title="Error Rate"
          value={healthMetrics?.errorRate.value}
          suffix="%"
          change={healthMetrics?.errorRate.change}
          changeType={healthMetrics?.errorRate.changeType}
          icon={ExclamationTriangleIcon}
          status={healthMetrics?.errorRate.status}
        />
        
        <StatCard
          title="P95 Latency"
          value={healthMetrics?.latencyP95.value}
          suffix="ms"
          change={healthMetrics?.latencyP95.change}
          changeType={healthMetrics?.latencyP95.changeType}
          icon={SignalIcon}
          status={healthMetrics?.latencyP95.status}
        />
        
        <StatCard
          title="Queue Depth"
          value={healthMetrics?.queueDepth.value}
          change={healthMetrics?.queueDepth.change}
          changeType={healthMetrics?.queueDepth.changeType}
          icon={ClockIcon}
          status={healthMetrics?.queueDepth.status}
        />
        
        <StatCard
          title="DB Connections"
          value={healthMetrics?.dbConnections.value}
          suffix={`/${healthMetrics?.dbConnections.total}`}
          icon={CircleStackIcon}
          status={healthMetrics?.dbConnections.status}
        />
        
        <StatCard
          title="Redis Status"
          value={healthMetrics?.redisStatus.value}
          icon={CpuChipIcon}
          status={healthMetrics?.redisStatus.status}
        />
      </div>

      {/* Timeline charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TimelineChart
          data={healthMetrics?.timeline.errorRate || []}
          title="Error Rate Timeline"
        />
        <TimelineChart
          data={healthMetrics?.timeline.latency || []}
          title="Latency Timeline"
        />
        <TimelineChart
          data={healthMetrics?.timeline.requests || []}
          title="Request Volume"
        />
      </div>

      {/* Quick actions */}
      <div className="bg-elevated rounded-lg p-6 border border-light">
        <h3 className="text-lg font-medium text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">
            View Error Logs
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">
            System Maintenance
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">
            Manage Users
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">
            Check Integrations
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminOverview
