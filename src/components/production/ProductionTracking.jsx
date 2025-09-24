import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChartJS } from '../../lib/chartSetup'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  PlayCircleIcon as PlayCircle, 
  PauseCircleIcon as PauseCircle, 
  StopCircleIcon as StopCircle, 
  Cog6ToothIcon as Settings,
  ArrowTrendingUpIcon as TrendingUp, 
  ExclamationTriangleIcon as AlertTriangle, 
  CheckCircleIcon as CheckCircle, 
  ClockIcon as Clock,
  ChartBarIcon as Activity, 
  ChartBarIcon as BarChart3, 
  ArrowPathIcon as RefreshCw, 
  ArrowDownTrayIcon as Download, 
  PlusIcon as Plus
} from '@heroicons/react/24/outline'

const ProductionTracking = () => {
  const [selectedLine, setSelectedLine] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [refreshInterval, setRefreshInterval] = useState(30000)

  // Live production data query
  const { data: productionData, isLoading, refetch } = useQuery({
    queryKey: ['production-data', selectedLine, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/production/live?line=${selectedLine}&range=${timeRange}`)
      if (!response.ok) {
        // No fallback data - only use real API data
        throw new Error('Production API unavailable - no mock data allowed')
      }
      return response.json()
    },
    refetchInterval: refreshInterval
  })

  // Production control mutations
  const startJobMutation = useMutation({
    mutationFn: async (jobData) => {
      const response = await fetch('/api/production/jobs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      })
      return response.json()
    },
    onSuccess: () => refetch()
  })

  const pauseJobMutation = useMutation({
    mutationFn: async (jobId) => {
      const response = await fetch(`/api/production/jobs/${jobId}/pause`, { method: 'POST' })
      return response.json()
    },
    onSuccess: () => refetch()
  })

  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, refetch])

  const chartData = {
    labels: productionData?.hourlyProduction?.map(h => h.hour) || [],
    datasets: [
      {
        label: 'Target Production',
        data: productionData?.hourlyProduction?.map(h => h.target) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Actual Production',
        data: productionData?.hourlyProduction?.map(h => h.actual) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'running': return <PlayCircle className="w-5 h-5 text-green-500" />
      case 'paused': return <PauseCircle className="w-5 h-5 text-yellow-500" />
      case 'maintenance': return <Settings className="w-5 h-5 text-red-500" />
      default: return <StopCircle className="w-5 h-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600 dark:text-gray-400">Loading production data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring of production lines, schedules, and performance
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last Week</option>
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Jobs</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{productionData?.metrics?.activeJobs || 0}</p>
              <p className="text-sm text-gray-500 mt-1">of {productionData?.metrics?.totalJobs || 0} total</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Capacity</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{productionData?.metrics?.capacity || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Utilization rate</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Efficiency</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{productionData?.metrics?.efficiency || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Overall equipment</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Output Today</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{productionData?.metrics?.outputToday || 0}</p>
              <p className="text-sm text-gray-500 mt-1">of {productionData?.metrics?.outputTarget || 0} target</p>
            </div>
            <CheckCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Production Lines Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Production Lines</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {productionData?.lines?.map((line) => (
              <div key={line.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">{line.name}</h3>
                  {getStatusIcon(line.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                    <span className="font-medium">{line.efficiency}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Output:</span>
                    <span className="font-medium">{line.output} units</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${line.efficiency}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Jobs</h2>
            <button className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              New Job
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {productionData?.activeJobs?.map((job) => (
                <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{job.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{job.product} - {job.line}</p>
                    </div>
                    <div className="flex space-x-2">
                      {job.status === 'running' ? (
                        <button
                          onClick={() => pauseJobMutation.mutate(job.id)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        >
                          <PauseCircle className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startJobMutation.mutate(job)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <PlayCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          job.status === 'running' ? 'bg-green-600' : 
                          job.status === 'paused' ? 'bg-yellow-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>Started: {new Date(job.startTime).toLocaleTimeString()}</span>
                    <span>ETA: {new Date(job.estimatedEnd).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Production Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hourly Production</h2>
          </div>
          <div className="p-6">
            <div style={{ height: '300px' }}>
              <Line 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Units'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Time'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductionTracking