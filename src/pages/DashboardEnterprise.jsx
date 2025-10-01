import { Suspense, lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCwIcon, WifiIcon, WifiOffIcon } from 'lucide-react'
import { useDashboardSummary, useWorkingCapital, useAnalyticsKPIs } from '@/hooks/useDashboardData'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'

const RegionalContributionChart = lazy(() => import('@/components/dashboard/RegionalContributionChart'))
const KPIWidget = lazy(() => import('@/components/dashboard/KPIWidget'))
const ProductionMetrics = lazy(() => import('@/components/dashboard/ProductionMetrics'))
const InventoryOverview = lazy(() => import('@/components/dashboard/InventoryOverview'))

const DashboardEnterprise = () => {
  // API data hooks
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useDashboardSummary()
  const { data: workingCapitalData, isLoading: wcLoading } = useWorkingCapital()
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsKPIs()

  // Real-time updates
  const { connectionStatus, isConnected, refreshAll, lastUpdate } = useRealtimeUpdates()

  // Format data for display
  const formatCurrency = (value) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value) => {
    if (!value) return '0%'
    return `${value.toFixed(1)}%`
  }

  // Get capital KPIs from API data
  const getCapitalKpis = () => {
    if (!summaryData) return []
    
    return [
      {
        label: 'Global working capital',
        value: formatCurrency(summaryData.workingCapital?.current),
        helper: `Ratio: ${summaryData.workingCapital?.ratio?.toFixed(2) || '0.00'}`,
        trend: summaryData.workingCapital?.current > 0 ? 'up' : 'neutral'
      },
      {
        label: 'Monthly Revenue',
        value: formatCurrency(summaryData.revenue?.monthly),
        helper: `Growth: ${formatPercentage(summaryData.revenue?.growth)}`,
        trend: summaryData.revenue?.growth > 0 ? 'up' : 'down'
      },
      {
        label: 'Production Efficiency',
        value: formatPercentage(summaryData.production?.efficiency),
        helper: `OEE: ${formatPercentage(summaryData.production?.oeeScore)}`,
        trend: summaryData.production?.efficiency > 85 ? 'up' : 'neutral'
      },
      {
        label: 'Inventory Value',
        value: formatCurrency(summaryData.inventory?.value),
        helper: `${summaryData.inventory?.lowStock || 0} items low stock`,
        trend: summaryData.inventory?.lowStock > 5 ? 'down' : 'up'
      }
    ]
  }

  const capitalKpis = getCapitalKpis()

  // Loading state
  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading enterprise dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (summaryError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard data</p>
          <Button onClick={refreshAll} variant="outline">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Enterprise Dashboard</h1>
          <p className="text-sm text-slate-400">
            Real-time manufacturing intelligence and performance analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">
            {isConnected ? (
              <WifiIcon className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOffIcon className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-slate-300">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Data Source Badge */}
          <Badge 
            variant="outline" 
            className={`${summaryData?.dataSource === 'fallback-offline' ? 'border-yellow-500 text-yellow-400' : 'border-green-500 text-green-400'}`}
          >
            {summaryData?.dataSource === 'fallback-offline' ? 'Offline Mode' : 'Live Data'}
          </Badge>

          {/* Refresh Button */}
          <Button onClick={refreshAll} variant="outline" size="sm">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Key Performance Indicators</CardTitle>
          <CardDescription className="text-slate-400">
            Real-time metrics updated every 30 seconds
            {lastUpdate && (
              <span className="ml-2 text-xs">
                Last update: {lastUpdate.timestamp.toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capitalKpis.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-lg font-semibold text-white">{item.value}</p>
              <p className="text-xs text-slate-500">{item.helper}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Production Metrics */}
      <Suspense fallback={<div className="h-64 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">Loading production metrics...</div>}>
        <ProductionMetrics data={summaryData} />
      </Suspense>

      {/* Working Capital Overview */}
      {workingCapitalData && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Working Capital Overview</CardTitle>
            <CardDescription className="text-slate-400">
              Financial liquidity and cash flow management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-slate-400">Current Assets</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(workingCapitalData.latest?.currentAssets)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Current Liabilities</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(workingCapitalData.latest?.currentLiabilities)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Working Capital</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(workingCapitalData.latest?.workingCapital)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Summary */}
      {analyticsData && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Analytics Summary</CardTitle>
            <CardDescription className="text-slate-400">
              Performance metrics and efficiency indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-400 mb-2">Revenue Performance</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white">Current</span>
                    <span className="text-green-400">{formatCurrency(analyticsData.revenue?.value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target</span>
                    <span className="text-slate-300">{formatCurrency(analyticsData.revenue?.target)}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (analyticsData.revenue?.achievement || 0) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-400 mb-2">Operational Efficiency</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white">OEE</span>
                    <span className="text-blue-400">{formatPercentage(analyticsData.efficiency?.oee * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Utilization</span>
                    <span className="text-blue-400">{formatPercentage(analyticsData.efficiency?.utilization * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Productivity</span>
                    <span className="text-blue-400">{formatPercentage(analyticsData.efficiency?.productivity * 100)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-400 mb-2">Quality Metrics</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white">Defect Rate</span>
                    <span className="text-yellow-400">{formatPercentage(analyticsData.quality?.defectRate * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Customer Satisfaction</span>
                    <span className="text-green-400">{formatPercentage(analyticsData.quality?.customerSatisfaction * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">On-Time Delivery</span>
                    <span className="text-green-400">{formatPercentage(analyticsData.quality?.onTimeDelivery * 100)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

export default DashboardEnterprise
