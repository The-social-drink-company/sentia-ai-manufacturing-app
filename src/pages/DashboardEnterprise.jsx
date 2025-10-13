import { Suspense, lazy, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import XeroConnectionBanner from '@/components/XeroConnectionBanner'
import { useXero } from '@/contexts/XeroContext'

const RegionalContributionChart = lazy(() => import('@/components/dashboard/RegionalContributionChart'))
const PLAnalysisChart = lazy(() => import('@/components/dashboard/PLAnalysisChart'))
const ProductSalesChart = lazy(() => import('@/components/dashboard/ProductSalesChart'))
const StockLevelsWidget = lazy(() => import('@/components/widgets/StockLevelsWidget'))
const QuickActions = lazy(() => import('@/components/dashboard/QuickActions'))

// Import API services
import plAnalysisApi from '@/services/api/plAnalysisApi'
import productSalesApi from '@/services/api/productSalesApi'
import regionalPerformanceApi from '@/services/api/regionalPerformanceApi'
import workingCapitalApi from '@/services/api/workingCapitalApi'

const DashboardEnterprise = () => {
  const { isConnected: xeroConnected, isLoading: xeroLoading } = useXero()
  
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
  const [requiresXeroConnection, setRequiresXeroConnection] = useState(false)

  // Fetch P&L analysis data
  useEffect(() => {
    const fetchPLData = async () => {
      try {
        setPLLoading(true)
        setPLError(null)
        
        const response = await plAnalysisApi.getPLAnalysis()
        if (response.success) {
          setPLData(response.data)
        } else {
          throw new Error('Failed to fetch P&L data')
        }
      } catch (error) {
        console.error('Error fetching P&L data:', error)
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
        if (response.requiresXeroConnection) {
          setRequiresXeroConnection(true)
          setPerformanceKpis([])
          return
        }
        
        if (response.success && response.data) {
          const kpiData = response.data
          setPerformanceKpis([
            { label: 'Annual revenue', value: kpiData.annualRevenue.value, helper: kpiData.annualRevenue.helper },
            { label: 'Units sold', value: kpiData.unitsSold.value, helper: kpiData.unitsSold.helper },
            { label: 'Gross margin', value: kpiData.grossMargin.value, helper: kpiData.grossMargin.helper }
          ])
        } else {
          throw new Error('Failed to fetch KPI data')
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error)
        setKpiError(error.message)
        setPerformanceKpis([]) // Set empty array on error
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
        if (response.success) {
          setProductSalesData(response.data)
        } else {
          throw new Error('Failed to fetch product sales data')
        }
      } catch (error) {
        console.error('Error fetching product sales data:', error)
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
        
        // Check if Xero connection is required
        if (response.requiresXeroConnection) {
          setRequiresXeroConnection(true)
          setCapitalKpis([])
          return
        }
        
        if (response.success && response.data) {
          // Transform working capital data into KPI format
          const data = response.data
          setCapitalKpis([
            { label: 'Global working capital', value: data.totalWorkingCapital || '$0', helper: 'Across all subsidiaries' },
            { label: 'Cash coverage', value: data.cashCoverage || '0 days', helper: 'Including credit facilities' },
            { label: 'Intercompany exposure', value: data.intercompanyExposure || '$0', helper: 'Pending settlements' },
            { label: 'FX sensitivity', value: data.fxSensitivity || '$0', helper: '±1% USD/EUR/JPY' }
          ])
        } else {
          throw new Error('Failed to fetch capital KPIs')
        }
      } catch (error) {
        console.error('Error fetching capital KPIs:', error)
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
      {/* Xero Connection Banner - Show when connection is required */}
      {requiresXeroConnection && !xeroConnected && (
        <XeroConnectionBanner 
          variant="full"
          showDismiss={false}
          className="mb-6"
        />
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Enterprise dashboard</h1>
          <p className="text-sm text-muted-foreground">Consolidated liquidity and performance outlook across all regions.</p>
        </div>
        <Badge variant="outline">Global view</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Capital position</CardTitle>
          <CardDescription>Key metrics reviewed in the weekly treasury meeting.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capitalLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="h-3 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))
          ) : capitalError ? (
            <div className="col-span-full flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">Failed to load capital metrics</p>
                <p className="text-xs text-muted-foreground">{capitalError}</p>
              </div>
            </div>
          ) : (!capitalKpis || capitalKpis.length === 0) ? (
            <div className="col-span-full flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No capital metrics available</p>
                <p className="text-xs text-muted-foreground">Check API configuration</p>
              </div>
            </div>
          ) : (
            (capitalKpis || []).map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.helper}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance metrics</CardTitle>
          <CardDescription>Key business performance indicators tracked for operational excellence.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpiLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="h-3 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))
          ) : kpiError ? (
            <div className="col-span-full flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">Failed to load performance metrics</p>
                <p className="text-xs text-muted-foreground">{kpiError}</p>
              </div>
            </div>
          ) : (!performanceKpis || performanceKpis.length === 0) ? (
            <div className="col-span-full flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No performance metrics available</p>
                <p className="text-xs text-muted-foreground">Check API configuration</p>
              </div>
            </div>
          ) : (
            (performanceKpis || []).map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.helper}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
              <Suspense fallback={<div className="flex h-full items-center justify-center">Loading chart...</div>}>
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
              <Suspense fallback={<div className="flex h-full items-center justify-center">Loading chart...</div>}>
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
            ) : (!regionalData || regionalData.length === 0) ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No regional data available</p>
                  <p className="text-xs text-muted-foreground">Check API configuration</p>
                </div>
              </div>
            ) : (
              <Suspense fallback={<div className="flex h-full items-center justify-center">Loading chart...</div>}>
                <RegionalContributionChart data={regionalData} />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row - Stock Levels (single chart) */}
      <Suspense fallback={
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
      }>
        <StockLevelsWidget />
      </Suspense>

      {/* Quick Actions Section */}
      <Suspense fallback={
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
      }>
        <QuickActions />
      </Suspense>
    </section>
  )
}

export default DashboardEnterprise
