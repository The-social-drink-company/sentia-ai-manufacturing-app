import React, { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import { queryKeys, queryConfigs } from '../../services/queryClient'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { CombinedTrustBadge } from '../ui/TrustBadge'
import { ExportButton } from '../ui/ExportButton'
import { cn } from '../../lib/utils'

const KPICard = memo(({ 
  title, 
  value, 
  change, 
  changeType, 
  suffix = '', 
  loading = false,
  status = 'neutral',
  trustLevel = 'good',
  freshness = 'fresh',
  lastUpdated = null
}) => {
  const statusColors = {
    excellent: 'text-green-600 dark:text-green-400',
    good: 'text-blue-600 dark:text-blue-400', 
    warning: 'text-yellow-600 dark:text-yellow-400',
    critical: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  }
  
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400'
  }
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2 dark:bg-gray-600"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-1 dark:bg-gray-600"></div>
          <div className="h-3 bg-gray-200 rounded w-12 dark:bg-gray-600"></div>
        </div>
      </div>
    )
  }
  
  const { hasTrustBadges } = useFeatureFlags()
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {hasTrustBadges && (
              <CombinedTrustBadge
                trustLevel={trustLevel}
                freshness={freshness}
                lastUpdated={lastUpdated}
                size="xs"
                layout="horizontal"
              />
            )}
          </div>
          <p className={cn(
            "text-2xl font-bold mt-1",
            statusColors[status]
          )}>
            {value}{suffix}
          </p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center text-sm mt-1",
              changeColors[changeType]
            )}>
              {changeType === 'positive' && <ArrowUpIcon className="w-4 h-4 mr-1" aria-hidden="true" />}
              {changeType === 'negative' && <ArrowDownIcon className="w-4 h-4 mr-1" aria-hidden="true" />}
              <span>
                <span className="sr-only">
                  {changeType === 'positive' ? 'Increase of' : changeType === 'negative' ? 'Decrease of' : 'Change of'} 
                </span>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

const KPIStrip = memo(() => {
  const { hasBoardExport } = useFeatureFlags()
  
  // Fetch real-time KPI data from API
  const { data: kpiData, isLoading } = useQuery({
    queryKey: queryKeys.kpiMetrics('24h', {}),
    queryFn: async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBaseUrl}/kpi-metrics?timeRange=24h&filters={}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch KPI metrics: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data; // Return just the metrics data
    },
    ...queryConfigs.realtime
  })
  
  const kpiCards = [
    {
      key: 'revenue',
      title: 'Revenue (24h)',
      value: kpiData?.totalRevenue.value ? `£${(kpiData.totalRevenue.value / 1000).toFixed(0)}K` : '—',
      change: kpiData?.totalRevenue.change,
      changeType: kpiData?.totalRevenue.changeType,
      status: kpiData?.totalRevenue.status,
      trustLevel: kpiData?.totalRevenue.trustLevel,
      freshness: kpiData?.totalRevenue.freshness,
      lastUpdated: kpiData?.totalRevenue.lastUpdated
    },
    {
      key: 'stock',
      title: 'Stock Level',
      value: kpiData?.stockLevel.value?.toFixed(1) || '—',
      suffix: '%',
      change: kpiData?.stockLevel.change,
      changeType: kpiData?.stockLevel.changeType,
      status: kpiData?.stockLevel.status,
      trustLevel: kpiData?.stockLevel.trustLevel,
      freshness: kpiData?.stockLevel.freshness,
      lastUpdated: kpiData?.stockLevel.lastUpdated
    },
    {
      key: 'forecast',
      title: 'Forecast Accuracy',
      value: kpiData?.forecastAccuracy.value?.toFixed(1) || '—',
      suffix: '%',
      change: kpiData?.forecastAccuracy.change,
      changeType: kpiData?.forecastAccuracy.changeType,
      status: kpiData?.forecastAccuracy.status,
      trustLevel: kpiData?.forecastAccuracy.trustLevel,
      freshness: kpiData?.forecastAccuracy.freshness,
      lastUpdated: kpiData?.forecastAccuracy.lastUpdated
    },
    {
      key: 'capacity',
      title: 'Capacity Utilization',
      value: kpiData?.capacityUtilization.value?.toFixed(1) || '—',
      suffix: '%',
      change: kpiData?.capacityUtilization.change,
      changeType: kpiData?.capacityUtilization.changeType,
      status: kpiData?.capacityUtilization.status,
      trustLevel: kpiData?.capacityUtilization.trustLevel,
      freshness: kpiData?.capacityUtilization.freshness,
      lastUpdated: kpiData?.capacityUtilization.lastUpdated
    },
    {
      key: 'cash',
      title: 'Cash Position',
      value: kpiData?.cashPosition.value ? `£${kpiData.cashPosition.value}K` : '—',
      change: kpiData?.cashPosition.change,
      changeType: kpiData?.cashPosition.changeType,
      status: kpiData?.cashPosition.status,
      trustLevel: kpiData?.cashPosition.trustLevel,
      freshness: kpiData?.cashPosition.freshness,
      lastUpdated: kpiData?.cashPosition.lastUpdated
    },
    {
      key: 'alerts',
      title: 'Active Alerts',
      value: kpiData?.alertsCount.value || '—',
      change: kpiData?.alertsCount.change,
      changeType: kpiData?.alertsCount.changeType,
      status: kpiData?.alertsCount.status,
      trustLevel: kpiData?.alertsCount.trustLevel,
      freshness: kpiData?.alertsCount.freshness,
      lastUpdated: kpiData?.alertsCount.lastUpdated
    }
  ]
  
  // Prepare export data
  const exportData = kpiData ? kpiCards.map(kpi => ({
    metric: kpi.title,
    value: kpi.value,
    suffix: kpi.suffix || '',
    change_percent: kpi.change || 0,
    change_type: kpi.changeType || 'neutral',
    status: kpi.status || 'neutral',
    trust_level: kpi.trustLevel || 'good',
    freshness: kpi.freshness || 'fresh',
    last_updated: kpi.lastUpdated || new Date().toISOString()
  })) : []
  
  return (
    <div className="h-full flex flex-col" data-widget-id="kpi-strip">
      {/* Header with export button */}
      {hasBoardExport && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="kpi-strip-heading">
            Key Performance Indicators
          </h3>
          <ExportButton
            widgetId="kpi-strip"
            widgetTitle="KPI Strip"
            data={exportData}
            formats={['csv', 'png']}
            size="sm"
          />
        </div>
      )}
      
      <div 
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-full"
        role="region"
        aria-labelledby="kpi-strip-heading"
        aria-live="polite"
      >
        {kpiCards.map((kpi) => (
          <KPICard
            key={kpi.key}
            title={kpi.title}
            value={kpi.value}
            suffix={kpi.suffix}
            change={kpi.change}
            changeType={kpi.changeType}
            status={kpi.status}
            trustLevel={kpi.trustLevel}
            freshness={kpi.freshness}
            lastUpdated={kpi.lastUpdated}
            loading={isLoading}
          />
        ))}
      </div>
      
      {/* Last updated indicator */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1" aria-hidden="true"></div>
          <span aria-label="Live data indicator">Live</span>
        </span>
      </div>
    </div>
  )
})

export default KPIStrip