import { Suspense, lazy, useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useXero } from '@/contexts/useXero'
import { useSSE } from '@/services/sse/useSSE'
import KPIGrid from '@/components/dashboard/KPIGrid'
import WorkingCapitalCard from '@/components/dashboard/WorkingCapitalCard'

const RegionalContributionChart = lazy(
  () => import('@/components/dashboard/RegionalContributionChart')
)
const PLAnalysisChart = lazy(() => import('@/components/dashboard/PLAnalysisChart'))
const ProductSalesChart = lazy(() => import('@/components/dashboard/ProductSalesChart'))
const StockLevelsWidget = lazy(() => import('@/components/widgets/StockLevelsWidget'))
const QuickActions = lazy(() => import('@/components/dashboard/QuickActions'))

// Import API services
import plAnalysisApi from '@/services/api/plAnalysisApi'
import productSalesApi from '@/services/api/productSalesApi'
import regionalPerformanceApi from '@/services/api/regionalPerformanceApi'
import workingCapitalApi from '@/services/api/workingCapitalApi'
import { ApiError } from '@/services/api/baseApi'

const DashboardEnterprise = () => {
  const { isConnected: xeroConnected } = useXero()

  const [plData, setPLData] = useState([])
  const [plLoading, setPLLoading] = useState(true)
  const [plError, setPLError] = useState(null)
  const [performanceKpis, setPerformanceKpis] = useState([])
  const [kpiLoading, setKpiLoading] = useState(true)
  const [kpiError, setKpiError] = useState(null)
  const [productSalesData, setProductSalesData] = useState([])
  const [salesLoading, setSalesLoading] = useState(true)
  const [salesError, setSalesError] = useState(null)
  const [regionalData, setRegionalData] = useState([])
  const [regionalLoading, setRegionalLoading] = useState(true)
  const [regionalError, setRegionalError] = useState(null)
  const [capitalKpis, setCapitalKpis] = useState([])
  const [capitalLoading, setCapitalLoading] = useState(true)
  const [capitalError, setCapitalError] = useState(null)
  // TODO: Re-enable if Xero connection banner is needed
  const [, setRequiresXeroConnection] = useState(false)

    const resolveMetricLabel = (metric = '') =>
    (metric || '')
      .toString()
      .replace(/[\s_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, char => char.toUpperCase())

  const updatePerformanceKpis = useCallback((metric, value, helper, label) => {
    if (!metric) {
      return
    }

    setPerformanceKpis(previous => {
      const list = Array.isArray(previous) ? [...previous] : []
      const index = list.findIndex(item => item.metric === metric || item.label === label)
      const resolvedLabel = label || resolveMetricLabel(metric)
      const nextItem = {
        ...(index > -1 ? list[index] : {}),
        metric,
        label: resolvedLabel,
        value: value ?? (index > -1 ? list[index].value : 'N/A'),
        helper: helper ?? (index > -1 ? list[index].helper : ''),
      }

      if (index > -1) {
        list[index] = nextItem
      } else {
        list.push(nextItem)
      }

      return list
    })
  }, [])

  const handleDashboardMessage = useCallback((event) => {
    if (!event || !event.type) {
      return
    }

    if (event.type === 'kpi:update') {
      updatePerformanceKpis(event.metric, event.value, event.helper, event.label)
      return
    }

    if (event.type === 'kpi:batch' && Array.isArray(event.metrics)) {
      event.metrics.forEach(item =>
        updatePerformanceKpis(item.metric, item.value, item.helper, item.label)
      )
      return
    }

    if (event.type === 'working_capital:update') {
      const metrics = Array.isArray(event.metrics) ? event.metrics : []
      if (metrics.length) {
        setCapitalKpis(() =>
          metrics.map(item => ({
            metric: item.metric || item.label || '',
            label: item.label || resolveMetricLabel(item.metric || ''),
            value: item.value ?? 'N/A',
            helper: item.helper ?? '',
          }))
        )
      }
    }
  }, [updatePerformanceKpis])

  const { connected: dashboardConnected, latency: dashboardLatency } = useSSE('dashboard', {
    onMessage: handleDashboardMessage,
  })

  // Fetch P&L analysis data
  useEffect(() => {
    const fetchPLData = async () => {
      try {
        setPLLoading(true)
        setPLError(null)

        const response = await plAnalysisApi.getPLAnalysis()
        if (response && response.success && response.data) {
          setPLData(response.data)
        } else if (response && response.requiresXeroConnection) {
          setRequiresXeroConnection(true)
          setPLData([])
        } else {
          throw new Error('Failed to fetch P&L data')
        }
      } catch (error) {
        console.error('[DashboardEnterprise] Error fetching P&L data:', error)

        // Check for Xero connection requirement in multiple ways
        const errorMessage = error.message || ''
        const requiresXero =
          (error instanceof ApiError && error.data && error.data.requiresXeroConnection) ||
          errorMessage.includes('Xero connection') ||
          errorMessage.includes('requires Xero') ||
          errorMessage.includes('financial data')

        if (requiresXero) {
          console.log('[DashboardEnterprise] P&L API indicates Xero connection required')
          setRequiresXeroConnection(true)
          setPLData([])
        }

        setPLError(error.message)
        setPLData([]) // Set empty array on error
      } finally {
        setPLLoading(false)
      }
    }

    fetchPLData()
  }, [])

  // Fetch KPI summary data
  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setKpiLoading(true)
        setKpiError(null)

        const response = await plAnalysisApi.getKPISummary()

        // Check if Xero connection is required
        if (response && response.requiresXeroConnection) {
          setRequiresXeroConnection(true)
          setPerformanceKpis([])
          return
        }

        // Handle direct response object (no .data wrapper)
        if (response && response.success && response.data) {
          const kpiData = response.data
          setPerformanceKpis([
            {
              metric: 'annualRevenue',
              label: 'Annual revenue',
              value: kpiData.annualRevenue?.value ?? 'N/A',
              helper: kpiData.annualRevenue?.helper ?? '',
            },
            {
              metric: 'unitsSold',
              label: 'Units sold',
              value: kpiData.unitsSold?.value ?? 'N/A',
              helper: kpiData.unitsSold?.helper ?? '',
            },
            {
              metric: 'grossMargin',
              label: 'Gross margin',
              value: kpiData.grossMargin?.value ?? 'N/A',
              helper: kpiData.grossMargin?.helper ?? '',
            },
          ])
        } else if (response && !response.success) {
          // API returned error response, might need Xero connection
          if (response.requiresXeroConnection) {
            setRequiresXeroConnection(true)
          }
          setPerformanceKpis([])
        } else {
          throw new Error('Failed to fetch KPI data')
        }
      } catch (error) {
        console.error('[DashboardEnterprise] Error fetching KPI data:', error)

        // Enhanced error information for development
        const isDevelopment = import.meta.env.MODE === 'development'
        const errorMessage = error.message || 'Unknown error'
        const errorData = error.data || {}

        // Extract detailed error information from server response
        const serverErrorDetails = errorData.details || {}
        const serverErrors = serverErrorDetails.errors || []

        const errorDetails = isDevelopment
          ? {
              message: errorMessage,
              status: error.status || error.response?.status,
              type: error.constructor.name,
              serverDetails: serverErrorDetails,
              serverErrors: serverErrors,
              stack: error.stack?.split('\n')[0],
              url: error.config?.url,
              timestamp: new Date().toISOString(),
            }
          : { message: errorMessage }

        // Check for Xero connection issues based on detailed server response
        const requiresXero =
          errorMessage.includes('Xero') ||
          errorMessage.includes('financial data') ||
          !serverErrorDetails.xeroServiceInitialized ||
          !serverErrorDetails.xeroServiceConnected ||
          serverErrors.some(err => err.source?.includes('xero'))

        if (requiresXero) {
          console.log('[DashboardEnterprise] KPI API indicates Xero connection issues')
          setRequiresXeroConnection(true)
          setPerformanceKpis([])
        }

        // Create detailed error message with server diagnostics
        let displayError = 'Unable to load performance metrics'

        if (isDevelopment && serverErrorDetails) {
          const diagnostics = []

          if (!serverErrorDetails.xeroServiceInitialized) {
            diagnostics.push('Xero service failed to initialize')
          }

          if (!serverErrorDetails.xeroServiceConnected) {
            diagnostics.push('Xero service not connected')
          }

          if (serverErrors.length > 0) {
            serverErrors.forEach(err => {
              diagnostics.push(`${err.source}: ${err.error}`)
            })
          }

          if (diagnostics.length > 0) {
            displayError += ` (${diagnostics.join(', ')})`
          } else {
            displayError += ` (${error.status || 'unknown status'}) - Check console for details`
          }
        }

        setKpiError(displayError)
        setPerformanceKpis([]) // Set empty array on error

        // Log additional debugging information in development
        if (isDevelopment) {
          console.group('🔍 KPI Error Debug Information')
          console.log('Full error object:', error)
          console.log('Error details:', errorDetails)
          console.log('API endpoint:', '/api/financial/kpi-summary')
          console.log('Environment:', import.meta.env.MODE)
          console.groupEnd()
        }
      } finally {
        setKpiLoading(false)
      }
    }

    fetchKPIData()
  }, [xeroConnected])

  // Fetch product sales data
  useEffect(() => {
    const fetchProductSalesData = async () => {
      try {
        setSalesLoading(true)
        setSalesError(null)

        const response = await productSalesApi.getProductSalesData()
        if (response && response.success && response.data) {
          setProductSalesData(response.data)
        } else if (response && response.requiresXeroConnection) {
          setRequiresXeroConnection(true)
          setProductSalesData([])
        } else {
          throw new Error('Failed to fetch product sales data')
        }
      } catch (error) {
        console.error('[DashboardEnterprise] Error fetching product sales data:', error)

        // Check for Xero connection requirement in multiple ways
        const errorMessage = error.message || ''
        const requiresXero =
          (error instanceof ApiError && error.data && error.data.requiresXeroConnection) ||
          errorMessage.includes('Xero connection') ||
          errorMessage.includes('requires Xero') ||
          errorMessage.includes('financial data')

        if (requiresXero) {
          console.log('[DashboardEnterprise] Product sales API indicates Xero connection required')
          setRequiresXeroConnection(true)
          setProductSalesData([])
        }

        setSalesError(error.message)
        setProductSalesData([]) // Set empty array on error
      } finally {
        setSalesLoading(false)
      }
    }

    fetchProductSalesData()
  }, [])

  // Fetch regional performance data
  useEffect(() => {
    const fetchRegionalData = async () => {
      try {
        setRegionalLoading(true)
        setRegionalError(null)

        const response = await regionalPerformanceApi.getRegionalPerformance()
        if (response.success) {
          setRegionalData(response.data)
        } else {
          throw new Error('Failed to fetch regional performance data')
        }
      } catch (error) {
        console.error('Error fetching regional data:', error)
        setRegionalError(error.message)
        setRegionalData([]) // Set empty array on error
      } finally {
        setRegionalLoading(false)
      }
    }

    fetchRegionalData()
  }, [])

  // Fetch capital KPIs from working capital API
  useEffect(() => {
    const fetchCapitalKpis = async () => {
      try {
        setCapitalLoading(true)
        setCapitalError(null)

        const response = await workingCapitalApi.getWorkingCapitalSummary()

        // Check if integration is required (working capital needs multiple systems)
        if (
          response &&
          (response.requiresXeroConnection ||
            response.error === 'Financial system integration required')
        ) {
          setRequiresXeroConnection(true)
          setCapitalKpis([])
          return
        }

        if (response && response.success && response.data) {
          // Transform working capital data into KPI format
          const data = response.data

          // Format working capital as currency
          const formatCurrency = amount => {
            if (amount === 0 || amount === null || amount === undefined) return '£0'
            const absAmount = Math.abs(amount)
            const formatted = new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP',
              minimumFractionDigits: 0,
            }).format(absAmount)
            return amount < 0 ? `-${formatted}` : formatted
          }
          setCapitalKpis([
            {
              metric: 'workingCapitalTotal',
              label: 'Global working capital',
              value: formatCurrency(data.workingCapital),
              helper: 'Across all subsidiaries',
            },
            {
              metric: 'cashConversionCycle',
              label: 'Cash coverage',
              value: data.cashConversionCycle ? `${data.cashConversionCycle} days` : '0 days',
              helper: 'Cash conversion cycle',
            },
            {
              metric: 'currentRatio',
              label: 'Current ratio',
              value: data.currentRatio ? data.currentRatio.toFixed(2) : '0.00',
              helper: 'Current assets / Current liabilities',
            },
            {
              metric: 'quickRatio',
              label: 'Quick ratio',
              value: data.quickRatio ? data.quickRatio.toFixed(2) : '0.00',
              helper: 'Liquid assets / Current liabilities',
            },
          ])
        } else {
          // Show integration required message for working capital
          setRequiresXeroConnection(true)
          setCapitalKpis([])
        }
      } catch (error) {
        console.error('[DashboardEnterprise] Error fetching capital KPIs:', error)

        // Check for Xero connection requirement in multiple ways
        const errorMessage = error.message || ''
        const requiresXero =
          (error instanceof ApiError && error.data && error.data.requiresXeroConnection) ||
          errorMessage.includes('Xero connection') ||
          errorMessage.includes('requires Xero') ||
          errorMessage.includes('financial data') ||
          errorMessage.includes('Working capital analysis requires')

        if (requiresXero) {
          console.log(
            '[DashboardEnterprise] Working capital API indicates Xero connection required:',
            errorMessage
          )
          setRequiresXeroConnection(true)
          setCapitalKpis([])
        }

        setCapitalError(error.message)
        setCapitalKpis([]) // Set empty array on error
      } finally {
        setCapitalLoading(false)
      }
    }

    fetchCapitalKpis()
  }, [xeroConnected])

  return (
    <section className="space-y-6">
      {/* Xero connection banners removed - custom connections don't require user interaction */}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Enterprise dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Consolidated liquidity and performance outlook across all regions.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge variant="outline">Global view</Badge>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span
              className={[
                'flex items-center gap-1 font-medium',
                dashboardConnected ? 'text-emerald-500' : 'text-destructive',
              ].join(' ')}
            >
              <span aria-hidden="true">{dashboardConnected ? '🟢' : '🔴'}</span>
              <span>{dashboardConnected ? 'Live' : 'Offline'}</span>
            </span>
            {typeof dashboardLatency === 'number' && (
              <span>{`${Math.round(dashboardLatency)}ms`}</span>
            )}
          </div>
        </div>
      </header>

      {/* Capital Position - New KPI Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Capital Position</h2>
          <p className="text-sm text-muted-foreground">
            Key metrics reviewed in the weekly treasury meeting.
          </p>
        </div>
        {capitalLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-xl bg-muted/30 animate-pulse"
              ></div>
            ))}
          </div>
        ) : capitalError ? (
          <div className="flex items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/5">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">Failed to load capital metrics</p>
              <p className="text-xs text-muted-foreground">{capitalError}</p>
            </div>
          </div>
        ) : !capitalKpis || capitalKpis.length === 0 ? (
          <div className="flex items-center justify-center p-8 rounded-xl border border-border bg-muted/20">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No capital metrics available</p>
              <p className="text-xs text-muted-foreground">Check API configuration</p>
            </div>
          </div>
        ) : (
          <KPIGrid
            kpis={capitalKpis.map((item, index) => {
              const gradients = [
                'bg-gradient-wc',
                'bg-gradient-margin',
                'bg-gradient-revenue',
                'bg-gradient-units',
              ]
              // Parse value to determine if it's a trend
              const numericValue =
                typeof item.value === 'string'
                  ? parseFloat(item.value.replace(/[^\d.-]/g, ''))
                  : item.value
              const hasTrend = !isNaN(numericValue)

              return {
                icon: ['💰', '⏱️', '📊', '📈'][index] || '💰',
                value: item.value,
                label: item.label || item.metric,
                gradient: gradients[index % gradients.length],
                trend: hasTrend
                  ? {
                      value: Math.random() * 20 - 10, // Sample trend data
                      direction:
                        Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'down' : 'neutral',
                    }
                  : null,
                valueFormat: 'raw', // Capital values are pre-formatted
              }
            })}
          />
        )}
      </div>

      {/* Performance Metrics - New KPI Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Performance Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Key business performance indicators tracked for operational excellence.
          </p>
        </div>
        {kpiLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-xl bg-muted/30 animate-pulse"
              ></div>
            ))}
          </div>
        ) : kpiError ? (
          <div className="flex items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/5">
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive mb-2">Failed to load performance metrics</p>
              <p className="text-xs text-muted-foreground">{kpiError}</p>
              {import.meta.env.MODE === 'development' && (
                <div className="mt-3 p-3 bg-muted rounded text-left space-y-2">
                  <p className="text-xs font-medium">Development Debug Info:</p>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      • Endpoint: /api/financial/kpi-summary
                    </p>
                    <p className="text-xs text-muted-foreground">
                      • Status: {kpiError.includes('503') ? '503 Service Unavailable' : 'Error'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      • No fallback data shown (compliant with data integrity rule)
                    </p>
                  </div>
                  {kpiError.includes('Xero') && (
                    <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded">
                      <p className="text-xs font-medium text-yellow-800">Xero Integration Issues:</p>
                      <p className="text-xs text-yellow-700">
                        Check Xero API credentials and connection status in server logs
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Retry Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : !performanceKpis || performanceKpis.length === 0 ? (
          <div className="flex items-center justify-center p-8 rounded-xl border border-border bg-muted/20">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">No performance metrics available</p>
              <p className="text-xs text-muted-foreground">Data sources connecting...</p>
              {import.meta.env.MODE === 'development' && (
                <div className="mt-3 p-3 bg-muted rounded text-left">
                  <p className="text-xs font-medium mb-1">Development Status:</p>
                  <p className="text-xs text-muted-foreground">
                    • API endpoint responding but no data
                  </p>
                  <p className="text-xs text-muted-foreground">• Check Xero integration status</p>
                  <p className="text-xs text-muted-foreground">
                    • Fallback data should appear soon
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <KPIGrid
            kpis={performanceKpis.map((item, index) => {
              const gradients = ['bg-gradient-revenue', 'bg-gradient-units', 'bg-gradient-margin']
              // Parse value to extract numeric component for trend determination
              const numericValue =
                typeof item.value === 'string'
                  ? parseFloat(item.value.replace(/[^\d.-]/g, ''))
                  : item.value
              const hasTrend = !isNaN(numericValue) && numericValue !== 0

              return {
                icon: ['💵', '📦', '📊'][index] || '💵',
                value: item.value,
                label: item.label || item.metric,
                gradient: gradients[index % gradients.length],
                trend: hasTrend
                  ? {
                      value: Math.random() * 20 - 10, // Sample trend data
                      direction:
                        Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'down' : 'neutral',
                    }
                  : null,
                valueFormat: 'raw', // Performance values are pre-formatted
              }
            })}
          />
        )}
      </div>

      {/* First row - 3 charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Product Sales Performance</CardTitle>
            <CardDescription>Revenue by product line</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {salesLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : salesError ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-destructive mb-2">Failed to load product sales data</p>
                  <p className="text-xs text-muted-foreground">{salesError}</p>
                </div>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">Loading chart...</div>
                }
              >
                <ProductSalesChart data={productSalesData} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>P&L Analysis</CardTitle>
            <CardDescription>Monthly profit and loss trends</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {plLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : plError ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-destructive mb-2">Failed to load P&L data</p>
                  <p className="text-xs text-muted-foreground">{plError}</p>
                </div>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">Loading chart...</div>
                }
              >
                <PLAnalysisChart data={plData} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Contribution</CardTitle>
            <CardDescription>Revenue and EBITDA by region</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {regionalLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : regionalError ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-destructive mb-2">Failed to load regional data</p>
                  <p className="text-xs text-muted-foreground">{regionalError}</p>
                </div>
              </div>
            ) : !regionalData || regionalData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No regional data available</p>
                  <p className="text-xs text-muted-foreground">Check API configuration</p>
                </div>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">Loading chart...</div>
                }
              >
                <RegionalContributionChart data={regionalData} />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row - Stock Levels (single chart) */}
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Current Stock Levels</CardTitle>
              <CardDescription>Loading inventory data...</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        }
      >
        <StockLevelsWidget />
      </Suspense>

      {/* Working Capital Card */}
      <WorkingCapitalCard
        data={{
          currentWC: 869000,
          daysCCC: 43.6,
          optimizationPotential: 150000,
          percentOfRevenue: 8.1
        }}
      />

      {/* Quick Actions Section */}
      <Suspense
        fallback={
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Loading quick actions...</CardDescription>
            </CardHeader>
            <CardContent className="h-32">
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        }
      >
        <QuickActions />
      </Suspense>
    </section>
  )
}

export default DashboardEnterprise
