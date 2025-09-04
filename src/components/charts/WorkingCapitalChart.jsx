import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from 'recharts'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, Cog6ToothIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { queryKeys, queryConfigs } from '../../services/queryClient'

const WorkingCapitalChart = ({ timeRange = '12M', scenario = 'baseline' }) => {
  const [chartType, setChartType] = useState('line')
  const [showProjections, setShowProjections] = useState(true)
  
  // Fetch working capital projections
  const { data: projectionsData, isLoading, error } = useQuery({
    queryKey: queryKeys.workingCapital.projections(timeRange, scenario),
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBaseUrl}/working-capital/projections?timeRange=${timeRange}&scenario=${scenario}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch projections: ${response.statusText}`)
      }
      return response.json()
    },
    ...queryConfigs.operational
  })

  // Fetch KPI data for trend analysis
  const { data: kpiData } = useQuery({
    queryKey: queryKeys.workingCapital.kpis(),
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBaseUrl}/working-capital/kpis`)
      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.statusText}`)
      }
      return response.json()
    },
    ...queryConfigs.operational
  })

  const chartData = useMemo(() => {
    if (!projectionsData?.data) return []
    
    return projectionsData.data.map(item => ({
      month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      operatingCash: Math.round(item.operatingCashFlow / 1000), // Convert to thousands
      investmentCash: Math.round(item.investmentCashFlow / 1000),
      financingCash: Math.round(item.financingCashFlow / 1000),
      netCashFlow: Math.round(item.netCashFlow / 1000),
      cumulativeCash: Math.round(item.cumulativeCash / 1000),
      // Add trend indicators
      trend: item.netCashFlow > 0 ? 'positive' : 'negative'
    }))
  }, [projectionsData])

  const formatTooltipValue = (value, name) => {
    const labels = {
      operatingCash: 'Operating Cash Flow',
      investmentCash: 'Investment Cash Flow', 
      financingCash: 'Financing Cash Flow',
      netCashFlow: 'Net Cash Flow',
      cumulativeCash: 'Cumulative Cash'
    }
    return [`${value}k`, labels[name] || name]
  }

  const exportData = () => {
    const csvData = chartData.map(row => ({
      Month: row.month,
      'Operating Cash Flow (k)': row.operatingCash,
      'Investment Cash Flow (k)': row.investmentCash,
      'Financing Cash Flow (k)': row.financingCash,
      'Net Cash Flow (k)': row.netCashFlow,
      'Cumulative Cash (k)': row.cumulativeCash
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `working-capital-projections-${scenario}-${timeRange}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center text-center">
        <div className="text-red-600 dark:text-red-400">
          <ArrowTrendingDownIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Failed to load projections</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Working Capital Projections
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {timeRange} forecast • {scenario} scenario
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="composed">Combined View</option>
            </select>
            
            <button
              onClick={exportData}
              disabled={!chartData.length}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              title="Export to CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* KPI Summary */}
        {kpiData?.data && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {kpiData.data.daysSalesOutstanding.current}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">DSO Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {kpiData.data.daysPayableOutstanding.current}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">DPO Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {kpiData.data.cashConversionCycle.current}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">CCC Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {kpiData.data.workingCapitalRatio.current}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">WC Ratio</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse flex space-x-4 w-full">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded col-span-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded col-span-1"></div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' && (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => `${value}k`}
                  />
                  <Tooltip 
                    formatter={formatTooltipValue}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="operatingCash" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Operating Cash Flow"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netCashFlow" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Net Cash Flow"
                  />
                  {showProjections && (
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeCash" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="Cumulative Cash"
                    />
                  )}
                </LineChart>
              )}

              {chartType === 'area' && (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(value) => `${value}k`} />
                  <Tooltip formatter={formatTooltipValue} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="operatingCash"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Operating Cash Flow"
                  />
                  <Area
                    type="monotone"
                    dataKey="investmentCash"
                    stackId="1"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                    name="Investment Cash Flow"
                  />
                </AreaChart>
              )}

              {chartType === 'bar' && (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(value) => `${value}k`} />
                  <Tooltip formatter={formatTooltipValue} />
                  <Legend />
                  <Bar dataKey="operatingCash" fill="#3B82F6" name="Operating" />
                  <Bar dataKey="investmentCash" fill="#F59E0B" name="Investment" />
                  <Bar dataKey="financingCash" fill="#EF4444" name="Financing" />
                </BarChart>
              )}

              {chartType === 'composed' && (
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(value) => `${value}k`} />
                  <Tooltip formatter={formatTooltipValue} />
                  <Legend />
                  <Bar dataKey="operatingCash" fill="#3B82F6" name="Operating" />
                  <Bar dataKey="investmentCash" fill="#F59E0B" name="Investment" />
                  <Line 
                    type="monotone" 
                    dataKey="netCashFlow" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Net Cash Flow"
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Last updated: {projectionsData ? new Date(projectionsData.timestamp).toLocaleTimeString() : '—'}
          </span>
          <span>
            {chartData.length} data points
          </span>
        </div>
      </div>
    </div>
  )
}

export default WorkingCapitalChart