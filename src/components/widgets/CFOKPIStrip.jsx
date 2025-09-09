/**
 * CFO KPI Strip Widget
 * Executive-level KPIs for CFO Global Preset
 */

import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { queryKeys, queryConfigs } from '../../services/queryClient'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { cn } from '../../lib/utils'

const CFOKPICard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  suffix = '', 
  prefix = '',
  loading = false,
  status = 'neutral',
  icon: Icon,
  trend = null,
  target = null
}) => {
  const statusColors = {
    excellent: 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    good: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20', 
    warning: 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    critical: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
    neutral: 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
  }
  
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400'
  }
  
  if (loading) {
    return (
      <div className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2 dark:bg-gray-600"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-1 dark:bg-gray-600"></div>
          <div className="h-3 bg-gray-200 rounded w-12 dark:bg-gray-600"></div>
        </div>
      </div>
    )
  }
  
  const TrendIcon = changeType === 'positive' ? ArrowTrendingUpIcon : 
                   changeType === 'negative' ? ArrowTrendingDownIcon : null
  
  // Format value with Intl API for proper localization
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (title.includes('%')) {
        return new Intl.NumberFormat('en-GB', { 
          style: 'percent', 
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(val / 100)
      }
      if (prefix === '£' || suffix.includes('£')) {
        return new Intl.NumberFormat('en-GB', { 
          style: 'currency', 
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)
      }
      return new Intl.NumberFormat('en-GB').format(val)
    }
    return val
  }
  
  return (
    <div className={cn(
      "flex-1 min-w-0 border rounded-lg p-4 transition-all duration-200 hover:shadow-md",
      statusColors[status]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            {Icon && <Icon className="w-4 h-4 mr-2 text-current" />}
            <p className="text-sm font-medium text-current truncate">
              {title}
            </p>
          </div>
          
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {prefix}{formatValue(value)}{suffix}
            </p>
            
            {target && (
              <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                / {prefix}{formatValue(target)}{suffix}
              </p>
            )}
          </div>
          
          {change !== undefined && change !== null && (
            <div className="flex items-center mt-1">
              {TrendIcon && <TrendIcon className="w-3 h-3 mr-1" />}
              <p className={cn("text-xs font-medium", changeColors[changeType])}>
                {change > 0 ? '+' : ''}{change}%
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  vs last period
                </span>
              </p>
            </div>
          )}
          
          {trend && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    status === 'excellent' && "bg-green-500",
                    status === 'good' && "bg-blue-500",
                    status === 'warning' && "bg-yellow-500",
                    status === 'critical' && "bg-red-500",
                    status === 'neutral' && "bg-gray-400"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, trend))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CFOKPIStrip = ({ timeRange = '90d', currency = 'GBP', region = 'consolidated' }) => {
  const { hasTrustBadges, hasBenchmarks } = useFeatureFlags()
  
  // Fetch CFO-specific KPIs
  const { data: forecastAccuracy, isLoading: loadingForecast } = useQuery({
    queryKey: queryKeys.forecast.accuracy(timeRange, region),
    queryFn: () => queryConfigs.forecast.accuracy(timeRange, region),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000 // 15 minutes
  })
  
  const { data: workingCapital, isLoading: loadingWC } = useQuery({
    queryKey: queryKeys.workingCapital.kpis(timeRange, region),
    queryFn: () => queryConfigs.workingCapital.kpis(timeRange, region),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000
  })
  
  const { data: cashPosition, isLoading: loadingCash } = useQuery({
    queryKey: queryKeys.workingCapital.cashPosition(region),
    queryFn: () => queryConfigs.workingCapital.cashPosition(region),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000
  })
  
  const { data: facilityUtilization, isLoading: loadingFacility } = useQuery({
    queryKey: queryKeys.optimization.facilityUtilization(region),
    queryFn: () => queryConfigs.optimization.facilityUtilization(region),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000
  })
  
  // Calculate derived KPIs
  const kpis = useMemo(() => {
    if (!workingCapital || !cashPosition || !forecastAccuracy) {
      return []
    }
    
    return [
      {
        id: 'forecast_accuracy',
        title: 'Forecast Accuracy %',
        value: forecastAccuracy?.mape ? (100 - forecastAccuracy.mape) : 0,
        change: forecastAccuracy?.change || 0,
        changeType: forecastAccuracy?.change > 0 ? 'positive' : 'negative',
        suffix: '%',
        status: forecastAccuracy?.mape < 10 ? 'excellent' : 
                forecastAccuracy?.mape < 20 ? 'good' : 
                forecastAccuracy?.mape < 30 ? 'warning' : 'critical',
        icon: ChartBarIcon,
        target: hasBenchmarks ? 90 : null,
        trustLevel: hasTrustBadges ? (forecastAccuracy?.dataQuality || 'good') : null
      },
      {
        id: 'ccc_trend',
        title: 'CCC Trend (days)',
        value: workingCapital?.cashConversionCycle || 0,
        change: workingCapital?.cccChange || 0,
        changeType: (workingCapital?.cccChange || 0) < 0 ? 'positive' : 'negative',
        suffix: 'd',
        status: workingCapital?.cashConversionCycle < 45 ? 'excellent' :
                workingCapital?.cashConversionCycle < 55 ? 'good' :
                workingCapital?.cashConversionCycle < 65 ? 'warning' : 'critical',
        icon: CurrencyDollarIcon,
        target: hasBenchmarks ? 45 : null,
        trend: workingCapital?.cccTrend
      },
      {
        id: 'min_cash_90d',
        title: 'Min Cash (90d)',
        value: cashPosition?.minCash90d || 0,
        change: cashPosition?.minCashChange || 0,
        changeType: (cashPosition?.minCashChange || 0) > 0 ? 'positive' : 'negative',
        prefix: '£',
        status: cashPosition?.minCash90d > 1000000 ? 'excellent' :
                cashPosition?.minCash90d > 500000 ? 'good' :
                cashPosition?.minCash90d > 100000 ? 'warning' : 'critical',
        icon: BanknotesIcon,
        target: hasBenchmarks ? 500000 : null
      },
      {
        id: 'facility_utilization',
        title: 'Facility Utilization',
        value: facilityUtilization?.overallUtilization || 0,
        change: facilityUtilization?.utilizationChange || 0,
        changeType: facilityUtilization?.utilizationChange > 0 ? 'positive' : 'negative',
        suffix: '%',
        status: facilityUtilization?.overallUtilization > 85 ? 'excellent' :
                facilityUtilization?.overallUtilization > 70 ? 'good' :
                facilityUtilization?.overallUtilization > 50 ? 'warning' : 'critical',
        icon: BuildingOfficeIcon,
        target: hasBenchmarks ? 85 : null,
        trend: facilityUtilization?.overallUtilization
      },
      {
        id: 'wc_unlocked_qtd',
        title: 'WC Unlocked (QTD)',
        value: workingCapital?.wcUnlockedQTD || 0,
        change: workingCapital?.wcUnlockedChange || 0,
        changeType: workingCapital?.wcUnlockedChange > 0 ? 'positive' : 'negative',
        prefix: '£',
        status: workingCapital?.wcUnlockedQTD > 200000 ? 'excellent' :
                workingCapital?.wcUnlockedQTD > 100000 ? 'good' :
                workingCapital?.wcUnlockedQTD > 50000 ? 'warning' : 'neutral',
        icon: ArrowTrendingUpIcon,
        target: hasBenchmarks ? 250000 : null
      },
      {
        id: 'fx_exposure',
        title: 'FX Exposure (net)',
        value: cashPosition?.fxExposureNet || 0,
        change: cashPosition?.fxExposureChange || 0,
        changeType: Math.abs(cashPosition?.fxExposureChange || 0) < 0 ? 'positive' : 'negative',
        prefix: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£',
        status: Math.abs(cashPosition?.fxExposureNet || 0) < 100000 ? 'excellent' :
                Math.abs(cashPosition?.fxExposureNet || 0) < 500000 ? 'good' :
                Math.abs(cashPosition?.fxExposureNet || 0) < 1000000 ? 'warning' : 'critical',
        icon: GlobeAltIcon,
        target: hasBenchmarks ? 0 : null
      }
    ]
  }, [workingCapital, cashPosition, forecastAccuracy, facilityUtilization, currency, hasBenchmarks, hasTrustBadges])
  
  const isLoading = loadingForecast || loadingWC || loadingCash || loadingFacility
  
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center space-x-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }, (_, i) => (
            <CFOKPICard key={i} loading={true} />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Executive KPIs
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {region === 'consolidated' ? 'Global' : region.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timeRange} view
          </span>
          {hasTrustBadges && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-green-600 dark:text-green-400">
                Data Fresh
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-start space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 dark:scrollbar-track-gray-800 dark:scrollbar-thumb-gray-600">
        {kpis.map((kpi) => (
          <CFOKPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeType={kpi.changeType}
            suffix={kpi.suffix}
            prefix={kpi.prefix}
            status={kpi.status}
            icon={kpi.icon}
            trend={kpi.trend}
            target={kpi.target}
          />
        ))}
      </div>
    </div>
  )
}

export default CFOKPIStrip