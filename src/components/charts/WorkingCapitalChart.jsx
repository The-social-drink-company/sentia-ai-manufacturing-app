import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from 'recharts'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, Cog6ToothIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { queryKeys, queryConfigs } from '../../services/queryClient'
import DateContextEngine from '../../services/DateContextEngine'
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const WorkingCapitalChart = ({ timeRange = '12M', scenario = 'baseline' }) => {
  const [chartType, setChartType] = useState('line')
  const [showProjections, setShowProjections] = useState(true)
  const [dateEngine] = useState(() => new DateContextEngine())
  
  // Fetch working capital projections
  const { data: projectionsData, isLoading, error } = useQuery({
    queryKey: queryKeys.workingCapital.projections(timeRange, scenario),
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || null
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
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || null
      const response = await fetch(`${apiBaseUrl}/working-capital/kpis`)
      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.statusText}`)
      }
      return response.json()
    },
    ...queryConfigs.operational
  })

  // Calculate period in days from timeRange
  const periodDays = useMemo(() => {
    const rangeMappings = {
      '7D': 7, '14D': 14, '30D': 30, '60D': 60, '90D': 90,
      '3M': 90, '6M': 180, '12M': 365, '24M': 730
    };
    return rangeMappings[timeRange] || 0;
  }, [timeRange]);

  const chartData = useMemo(() => {
    // If we have API data, use it; otherwise generate realistic projections
    if (projectionsData?.data && projectionsData.data.length > 0) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      return projectionsData.data.map(item => {
        const [year, month] = item.month.split('-').map(num => parseInt(num));
        const itemDate = new Date(year, month - 1, 1);
        
        return {
          month: itemDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          fullDate: item.month,
          operatingCash: Math.round(item.operatingCashFlow / 1000),
          investmentCash: Math.round(item.investmentCashFlow / 1000),
          financingCash: Math.round(item.financingCashFlow / 1000),
          netCashFlow: Math.round(item.netCashFlow / 1000),
          cumulativeCash: Math.round(item.cumulativeCash / 1000),
          trend: item.netCashFlow > 0 ? 'positive' : 'negative',
          isCurrent: year === currentYear && month === currentMonth,
          isFuture: itemDate > currentDate,
          isPast: itemDate < currentDate
        };
      });
    }
    
    // Generate realistic calendar-based projections when API data unavailable
    try {
      const projections = dateEngine.calculateWorkingCapitalByPeriod(null, periodDays, {
        dsoTarget: scenario === 'optimistic' ? 30 : scenario === 'pessimistic' ? 60 : 45,
        dpoTarget: scenario === 'optimistic' ? 75 : scenario === 'pessimistic' ? 45 : 60,
        inventoryDays: scenario === 'optimistic' ? 25 : scenario === 'pessimistic' ? 45 : 30,
        currentRevenue: 40000000
      });

      // Group daily projections by month for chart display
      const monthlyData = new Map();
      
      projections.projections.forEach(projection => {
        const date = new Date(projection.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthLabel,
            fullDate: monthKey,
            operatingCash: 0,
            investmentCash: 0,
            financingCash: 0,
            netCashFlow: 0,
            cumulativeCash: 0,
            workingCapital: 0,
            count: 0,
            trend: 'neutral',
            isFuture: date > new Date(),
            isPast: date < new Date(),
            isCurrent: false
          });
        }
        
        const monthData = monthlyData.get(monthKey);
        monthData.operatingCash += projection.cashIn;
        monthData.financingCash += projection.cashOut;
        monthData.netCashFlow += projection.netCashFlow;
        monthData.workingCapital += projection.workingCapital;
        monthData.count++;
      });

      // Convert to array and calculate averages
      return Array.from(monthlyData.values()).map(month => ({
        ...month,
        operatingCash: Math.round(month.operatingCash / month.count / 1000), // Average and convert to thousands
        financingCash: Math.round(month.financingCash / month.count / 1000),
        netCashFlow: Math.round(month.netCashFlow / month.count / 1000),
        cumulativeCash: Math.round(month.workingCapital / month.count / 1000),
        trend: month.netCashFlow > 0 ? 'positive' : 'negative',
        isCurrent: month.month.includes(new Date().toLocaleDateString('en-US', { year: '2-digit' }))
      })).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
      
    } catch (error) {
      logError('Error generating working capital projections:', error);
      return [];
    }
  }, [projectionsData, periodDays, scenario, dateEngine])

  // Currency formatting utility
  const formatCurrency = (value, currency = 'GBP', locale = 'en-GB') => {
    if (typeof value !== 'number' || isNaN(value)) return '£0';
    
    // Convert thousands to actual value for proper formatting
    const actualValue = value * 1000;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: actualValue >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(actualValue);
  };

  const formatTooltipValue = (value, name) => {
    const labels = {
      operatingCash: 'Operating Cash Flow',
      investmentCash: 'Investment Cash Flow', 
      financingCash: 'Financing Cash Flow',
      netCashFlow: 'Net Cash Flow',
      cumulativeCash: 'Cumulative Cash'
    }
    
    // Use proper currency formatting in tooltips
    const formattedValue = formatCurrency(value, projectionsData?.currency || null);
    return [formattedValue, labels[name] || name]
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
              {periodDays} days forecast • {scenario} scenario • {chartData.length} data points
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
                    tickFormatter={(value) => formatCurrency(value, projectionsData?.currency || null)}
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
                  <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value, projectionsData?.currency || null)} />
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
                  <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value, projectionsData?.currency || null)} />
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
                  <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value, projectionsData?.currency || null)} />
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