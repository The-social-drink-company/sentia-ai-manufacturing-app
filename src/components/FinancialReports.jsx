import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DocumentChartBarIcon, 
  ArrowPathIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

const FinancialReports = () => {
  const [data, setData] = useState({
    workingCapital: null,
    kpiSummary: null,
    plAnalysis: null,
    cashFlow: null
  })
  const [historicalData, setHistoricalData] = useState({
    previousMonth: null,
    previousQuarter: null,
    trends: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('year')
  const [lastUpdated, setLastUpdated] = useState(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current and historical data
      const [workingCapitalRes, kpiRes, plRes, cashFlowRes, historicalRes] = await Promise.allSettled([
        fetch(`${apiBase}/financial/working-capital`),
        fetch(`${apiBase}/financial/kpi-summary`),
        fetch(`${apiBase}/financial/pl-analysis`),
        fetch(`${apiBase}/financial/cash-flow`),
        // Fetch historical sales data for trend analysis
        fetch(`${apiBase}/sales/product-performance?period=6months`)
      ])

      const results = {}
      
      // Process working capital data
      if (workingCapitalRes.status === 'fulfilled' && workingCapitalRes.value.ok) {
        results.workingCapital = await workingCapitalRes.value.json()
      }
      
      // Process KPI data
      if (kpiRes.status === 'fulfilled' && kpiRes.value.ok) {
        results.kpiSummary = await kpiRes.value.json()
      }
      
      // Process P&L data
      if (plRes.status === 'fulfilled' && plRes.value.ok) {
        results.plAnalysis = await plRes.value.json()
      }
      
      // Process cash flow data
      if (cashFlowRes.status === 'fulfilled' && cashFlowRes.value.ok) {
        results.cashFlow = await cashFlowRes.value.json()
      }

      // Process historical data for trends
      if (historicalRes.status === 'fulfilled' && historicalRes.value.ok) {
        const historical = await historicalRes.value.json()
        setHistoricalData(calculateTrends(historical, results))
      }

      setData(results)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
  }, [timeRange])

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/A'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value) => {
    if (typeof value !== 'number') return 'N/A'
    return `${(value * 100).toFixed(1)}%`
  }

  const calculateTrends = (historicalData, currentData) => {
    if (!historicalData?.success || !historicalData.data) {
      return { trends: {} }
    }

    const sales = historicalData.data.sales || []
    if (sales.length < 2) {
      return { trends: {} }
    }

    // Sort by date to get chronological order
    const sortedSales = sales.sort((a, b) => new Date(a.date) - new Date(b.date))
    const currentMonth = sortedSales[sortedSales.length - 1]
    const previousMonth = sortedSales[sortedSales.length - 2]
    
    if (!currentMonth || !previousMonth) {
      return { trends: {} }
    }

    // Calculate month-over-month changes
    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    const trends = {
      revenue: {
        current: currentMonth.totalRevenue || 0,
        previous: previousMonth.totalRevenue || 0,
        change: calculateChange(currentMonth.totalRevenue, previousMonth.totalRevenue),
        direction: currentMonth.totalRevenue > previousMonth.totalRevenue ? 'up' : 'down'
      },
      orders: {
        current: currentMonth.totalOrders || 0,
        previous: previousMonth.totalOrders || 0,
        change: calculateChange(currentMonth.totalOrders, previousMonth.totalOrders),
        direction: currentMonth.totalOrders > previousMonth.totalOrders ? 'up' : 'down'
      },
      averageOrderValue: {
        current: currentMonth.averageOrderValue || 0,
        previous: previousMonth.averageOrderValue || 0,
        change: calculateChange(currentMonth.averageOrderValue, previousMonth.averageOrderValue),
        direction: currentMonth.averageOrderValue > previousMonth.averageOrderValue ? 'up' : 'down'
      }
    }

    return {
      previousMonth,
      currentMonth,
      trends
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
              <p className="text-slate-600 dark:text-slate-400">Comprehensive financial analysis for Sentia Manufacturing</p>
            </div>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
            <p className="text-slate-600 dark:text-slate-400">Comprehensive financial analysis for Sentia Manufacturing</p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Unable to load financial data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchFinancialData}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
            <p className="text-slate-600 dark:text-slate-400">Real-time financial analysis for Sentia Manufacturing</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFinancialData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Working Capital"
          value={formatCurrency(data.workingCapital?.data?.workingCapital)}
          icon={CurrencyDollarIcon}
          trend={data.workingCapital?.data?.currentRatio >= 2 ? 'up' : 'down'}
          description="Current assets minus liabilities"
          color="blue"
        />
        
        <MetricCard
          title="Current Ratio"
          value={data.workingCapital?.data?.currentRatio?.toFixed(2) || 'N/A'}
          icon={TrendingUpIcon}
          trend={data.workingCapital?.data?.currentRatio >= 2 ? 'up' : 'down'}
          description="Liquidity health indicator"
          color="green"
        />
        
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(historicalData.trends?.revenue?.current || 0)}
          icon={CurrencyDollarIcon}
          trend={historicalData.trends?.revenue?.direction || 'neutral'}
          changePercent={historicalData.trends?.revenue?.change}
          description="Current month revenue"
          color="purple"
        />
        
        <MetricCard
          title="Inventory Value"
          value={formatCurrency(data.workingCapital?.data?.inventory)}
          icon={ChartBarIcon}
          trend="up"
          description="Total stock value"
          color="yellow"
        />
      </div>

      {/* Month-over-Month Performance */}
      {historicalData.trends && Object.keys(historicalData.trends).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Month-over-Month Performance
              <span className="text-sm font-normal text-muted-foreground">
                Comparing latest data with previous period
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(historicalData.trends).map(([key, trend]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <TrendIndicator change={trend.change} direction={trend.direction} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-blue-600">
                      {key === 'revenue' ? formatCurrency(trend.current) : 
                       key === 'averageOrderValue' ? formatCurrency(trend.current) :
                       Math.round(trend.current).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Previous: {key === 'revenue' ? formatCurrency(trend.previous) : 
                                key === 'averageOrderValue' ? formatCurrency(trend.previous) :
                                Math.round(trend.previous).toLocaleString()}
                    </p>
                    <p className={`text-sm font-medium ${
                      trend.change > 0 ? 'text-green-600' : 
                      trend.change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}% vs last month
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Working Capital Analysis */}
      {data.workingCapital && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Working Capital Analysis
              {data.workingCapital.dataSource === 'sentia_database' && (
                <span className="text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded">
                  Live Data
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Cash Conversion Cycle</h4>
                <p className="text-2xl font-semibold text-blue-600">
                  {Math.round(data.workingCapital.data.cashConversionCycle || 0)} days
                </p>
                <p className="text-sm text-gray-600">Time to convert investments to cash</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Accounts Receivable</h4>
                <p className="text-2xl font-semibold text-green-600">
                  {formatCurrency(data.workingCapital.data.accountsReceivable)}
                </p>
                <p className="text-sm text-gray-600">Outstanding customer payments</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Accounts Payable</h4>
                <p className="text-2xl font-semibold text-orange-600">
                  {formatCurrency(data.workingCapital.data.accountsPayable)}
                </p>
                <p className="text-sm text-gray-600">Outstanding supplier payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* P&L Analysis */}
      {data.plAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Profit & Loss Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(data.plAnalysis.data || {}).map(([key, value]) => (
                <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {typeof value === 'number' ? formatCurrency(value) : value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Source Information */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
              <CalendarIcon className="w-4 h-4" />
              <span>Data sourced from Sentia manufacturing database</span>
            </div>
            {lastUpdated && (
              <span className="text-blue-600 dark:text-blue-400">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            Financial reports based on real transaction data from 9-SKU, 5-channel operation
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const TrendIndicator = ({ change, direction }) => {
  const getColor = () => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getIcon = () => {
    if (direction === 'up') return ArrowUpIcon
    if (direction === 'down') return ArrowDownIcon
    return null
  }

  const IconComponent = getIcon()

  return (
    <div className={`flex items-center gap-1 ${getColor()}`}>
      {IconComponent && <IconComponent className="w-4 h-4" />}
      <span className="text-sm font-medium">
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  )
}

const MetricCard = ({ title, value, icon: Icon, trend, description, color, changePercent }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200'
  }

  const trendIcon = {
    up: '📈',
    down: '📉',
    neutral: '➡️'
  }

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="w-8 h-8" />
            <div>
              <p className="text-sm font-medium opacity-80">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {changePercent !== undefined && (
                <p className={`text-xs font-medium ${
                  changePercent > 0 ? 'text-green-600' : 
                  changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}% MoM
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl">{trendIcon[trend]}</span>
            {changePercent !== undefined && (
              <TrendIndicator change={changePercent} direction={trend} />
            )}
          </div>
        </div>
        <p className="text-xs opacity-70 mt-2">{description}</p>
      </CardContent>
    </Card>
  )
}

export default FinancialReports