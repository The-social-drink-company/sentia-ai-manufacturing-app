import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DocumentChartBarIcon, 
  ArrowPathIcon, 
  CalendarIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import FinancialKPIStrip from '@/components/financial/FinancialKPIStrip'
import FinancialCharts from '@/components/financial/FinancialCharts'
import FinancialInsights from '@/components/financial/FinancialInsights'
import ProductPerformanceTable from '@/components/financial/ProductPerformanceTable'
import { useFinancialReportsData } from '@/hooks/useFinancialData'
import { cn } from '@/utils/cn'

const TimeRangeSelector = ({ value, onChange, className }) => {
  const ranges = [
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' }
  ]

  return (
    <div className={cn("flex items-center space-x-1 border border-border rounded-lg p-1", className)}>
      {ranges.map((range) => (
        <button
          key={range.key}
          onClick={() => onChange(range.key)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            value === range.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

const PageHeader = ({ 
  timeRange, 
  onTimeRangeChange, 
  isLoading, 
  onRefresh, 
  lastUpdated 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive financial analysis and insights
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <TimeRangeSelector 
          value={timeRange}
          onChange={onTimeRangeChange}
          className="hidden sm:flex"
        />
        
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowPathIcon className={cn(
            "w-4 h-4 mr-2",
            isLoading && "animate-spin"
          )} />
          Refresh
        </button>
      </div>
    </div>
  )
}

const ErrorBoundary = ({ error, onRetry }) => (
  <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
    <CardContent className="p-6">
      <div className="flex items-center space-x-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        <div className="flex-1">
          <h3 className="font-medium text-red-900 dark:text-red-100">
            Unable to load financial data
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error?.message || 'An unexpected error occurred while loading financial reports.'}
          </p>
          <button
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </CardContent>
  </Card>
)

const LoadingState = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    ))}
  </div>
)

const FinancialReports = () => {
  const [timeRange, setTimeRange] = useState('year')
  const [filters, setFilters] = useState({})
  
  const {
    kpiData,
    revenueData,
    profitMarginData,
    productData,
    insightsData,
    isLoading,
    error,
    refetch
  } = useFinancialReportsData({
    timeRange,
    filters
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader 
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
        <ErrorBoundary error={error} onRetry={handleRefresh} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        lastUpdated={insightsData?.lastUpdated}
      />

      {/* Mobile Time Range Selector */}
      <div className="sm:hidden">
        <TimeRangeSelector 
          value={timeRange}
          onChange={handleTimeRangeChange}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* Financial KPI Strip */}
          <FinancialKPIStrip 
            data={kpiData}
            loading={isLoading}
            error={error}
          />

          {/* Financial Charts */}
          <FinancialCharts 
            revenueData={revenueData}
            profitMarginData={profitMarginData}
            loading={isLoading}
            error={error}
          />

          {/* Two Column Layout for Insights and Product Performance */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FinancialInsights 
              data={insightsData}
              loading={isLoading}
              error={error}
            />
            
            <ProductPerformanceTable 
              data={productData}
              loading={isLoading}
              error={error}
            />
          </div>

          {/* Footer Information */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    Showing data for: {timeRange === 'year' ? 'Current Year' : 
                                     timeRange === 'quarter' ? 'Current Quarter' :
                                     timeRange === 'month' ? 'Current Month' : 'All Time'}
                  </span>
                </div>
                {insightsData?.lastUpdated && (
                  <span>
                    Last updated: {new Date(insightsData.lastUpdated).toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default FinancialReports