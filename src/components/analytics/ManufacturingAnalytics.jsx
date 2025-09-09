import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, ScatterChart, Scatter
} from 'recharts'
import { 
  ChartBarIcon, 
  Cog6ToothIcon, 
  ArrowArrowTrendingUpIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { queryKeys, queryConfigs } from '../../services/queryClient'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

const ManufacturingAnalytics = () => {
  const [activeTab, setActiveTab] = useState('efficiency')
  const [timeRange, setTimeRange] = useState('7d')

  // Fetch KPI metrics for manufacturing analytics
  const { data: kpiData, isLoading } = useQuery({
    queryKey: queryKeys.kpi.metrics(timeRange),
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBaseUrl}/kpi-metrics?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch KPI metrics')
      }
      return response.json()
    },
    ...queryConfigs.operational
  })

  // Generate time series data for charts
  const timeSeriesData = useMemo(() => {
    if (!kpiData?.data) return []
    
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
    const interval = timeRange === '24h' ? 1 : timeRange === '7d' ? 4 : 24
    
    return Array.from({ length: Math.floor(hours / interval) }, (_, i) => {
      const baseTime = new Date()
      baseTime.setHours(baseTime.getHours() - hours + (i * interval))
      
      // Simulate realistic manufacturing data with trends
      const cyclicFactor = Math.sin(i * 0.1) * 0.1
      const trendFactor = i * 0.001
      const randomFactor = (Math.random() - 0.5) * 0.05
      
      return {
        time: baseTime.toISOString(),
        timestamp: baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        efficiency: Math.max(70, Math.min(100, 85 + cyclicFactor * 20 + trendFactor * 10 + randomFactor * 20)),
        throughput: Math.max(60, Math.min(100, 80 + cyclicFactor * 15 + randomFactor * 15)),
        quality: Math.max(90, Math.min(100, 96 + cyclicFactor * 5 + randomFactor * 3)),
        uptime: Math.max(85, Math.min(100, 95 + cyclicFactor * 8 + randomFactor * 5)),
        temperature: Math.max(18, Math.min(26, 22 + cyclicFactor * 3 + randomFactor * 2)),
        pressure: Math.max(0.8, Math.min(1.2, 1.0 + cyclicFactor * 0.1 + randomFactor * 0.1))
      }
    })
  }, [kpiData, timeRange])

  // Process efficiency distribution
  const efficiencyDistribution = useMemo(() => {
    if (!timeSeriesData.length) return []
    
    const ranges = [
      { range: '90-100%', min: 90, max: 100, color: '#10B981' },
      { range: '80-90%', min: 80, max: 90, color: '#F59E0B' },
      { range: '70-80%', min: 70, max: 80, color: '#EF4444' },
      { range: '<70%', min: 0, max: 70, color: '#6B7280' }
    ]
    
    return ranges.map(range => ({
      name: range.range,
      value: timeSeriesData.filter(d => d.efficiency >= range.min && d.efficiency < range.max).length,
      color: range.color
    }))
  }, [timeSeriesData])

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!timeSeriesData.length) return {}
    
    const latest = timeSeriesData[timeSeriesData.length - 1]
    const previous = timeSeriesData[Math.max(0, timeSeriesData.length - 10)]
    
    return {
      efficiency: {
        current: latest?.efficiency?.toFixed(1) || 0,
        change: ((latest?.efficiency - previous?.efficiency) || 0).toFixed(1),
        trend: (latest?.efficiency > previous?.efficiency) ? 'up' : 'down'
      },
      throughput: {
        current: latest?.throughput?.toFixed(1) || 0,
        change: ((latest?.throughput - previous?.throughput) || 0).toFixed(1),
        trend: (latest?.throughput > previous?.throughput) ? 'up' : 'down'
      },
      quality: {
        current: latest?.quality?.toFixed(1) || 0,
        change: ((latest?.quality - previous?.quality) || 0).toFixed(1),
        trend: (latest?.quality > previous?.quality) ? 'up' : 'down'
      },
      uptime: {
        current: latest?.uptime?.toFixed(1) || 0,
        change: ((latest?.uptime - previous?.uptime) || 0).toFixed(1),
        trend: (latest?.uptime > previous?.uptime) ? 'up' : 'down'
      }
    }
  }, [timeSeriesData])

  const tabs = [
    { id: 'efficiency', label: 'Production Efficiency', icon: ChartBarIcon },
    { id: 'quality', label: 'Quality Metrics', icon: CheckCircleIcon },
    { id: 'alerts', label: 'System Alerts', icon: ExclamationTriangleIcon },
    { id: 'environment', label: 'Environmental', icon: Cog6ToothIcon }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'efficiency':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficiency Trend */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Efficiency Trend</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="timestamp" fontSize={12} />
                    <YAxis domain={[70, 100]} fontSize={12} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Efficiency Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Efficiency Distribution</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={efficiencyDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {efficiencyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Multi-metric Performance */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Multi-Metric Performance</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="timestamp" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={2} name="Efficiency %" />
                    <Line type="monotone" dataKey="throughput" stroke="#10B981" strokeWidth={2} name="Throughput %" />
                    <Line type="monotone" dataKey="quality" stroke="#F59E0B" strokeWidth={2} name="Quality %" />
                    <Line type="monotone" dataKey="uptime" stroke="#EF4444" strokeWidth={2} name="Uptime %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )

      case 'quality':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Score Radial */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quality Score</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[
                    { name: 'Quality', value: parseFloat(performanceMetrics.quality?.current || 0), fill: '#10B981' }
                  ]}>
                    <RadialBar dataKey="value" cornerRadius={10} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
                      {performanceMetrics.quality?.current}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quality vs Throughput Scatter */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quality vs Throughput</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="throughput" name="Throughput" unit="%" />
                    <YAxis dataKey="quality" name="Quality" unit="%" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={timeSeriesData} fill="#8B5CF6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )

      case 'environment':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature and Pressure */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Environmental Conditions</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="timestamp" fontSize={12} />
                    <YAxis yAxisId="temp" orientation="left" />
                    <YAxis yAxisId="pressure" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="temp" 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Temperature (°C)" 
                    />
                    <Line 
                      yAxisId="pressure" 
                      type="monotone" 
                      dataKey="pressure" 
                      stroke="#06B6D4" 
                      strokeWidth={2}
                      name="Pressure (bar)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )

      case 'alerts':
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Recent System Alerts</h4>
            <div className="space-y-3">
              {kpiData?.data?.alertsCount?.value > 0 ? (
                Array.from({ length: Math.min(5, kpiData.data.alertsCount.value) }, (_, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Production efficiency below target threshold
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {Math.floor(Math.random() * 30)} minutes ago • Line {i + 1}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircleIcon className="w-8 h-8 mr-2 text-green-500" />
                  <span>No active alerts - All systems operating normally</span>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(performanceMetrics).map(([key, metric]) => (
          <div key={key} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.current}%
                </p>
              </div>
              {metric.trend === 'up' ? (
                <ArrowArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
              ) : (
                <ArrowArrowTrendingUpIcon className="w-8 h-8 text-red-500 transform rotate-180" />
              )}
            </div>
            <div className="mt-2">
              <span className={`text-sm ${
                parseFloat(metric.change) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(metric.change) >= 0 ? '+' : ''}{metric.change}% from previous period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Manufacturing Analytics Dashboard
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}

export default ManufacturingAnalytics