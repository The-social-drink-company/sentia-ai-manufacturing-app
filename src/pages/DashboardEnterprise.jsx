import { Suspense, lazy, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const regionalPerformance = [
  { region: 'UK', revenue: 4200000, ebitda: 980000 },
  { region: 'US', revenue: 3850000, ebitda: 820000 },
  { region: 'EU', revenue: 6150000, ebitda: 1140000 }
]

const capitalKpis = [
  { label: 'Global working capital', value: '$9.2M', helper: 'Across all subsidiaries' },
  { label: 'Cash coverage', value: '214 days', helper: 'Including credit facilities' },
  { label: 'Intercompany exposure', value: '$1.1M', helper: 'Pending settlements' },
  { label: 'FX sensitivity', value: '$380K', helper: '±1% USD/EUR/JPY' }
]

const defaultPerformanceKpis = [
  { label: 'Annual revenue', value: '$14.2M', helper: 'Year to date' },
  { label: 'Units sold', value: '568K', helper: 'Current quarter' },
  { label: 'Gross margin', value: '62.3%', helper: 'Average margin' }
]

const RegionalContributionChart = lazy(() => import('@/components/dashboard/RegionalContributionChart'))
const PLAnalysisChart = lazy(() => import('@/components/dashboard/PLAnalysisChart'))
const ProductSalesChart = lazy(() => import('@/components/dashboard/ProductSalesChart'))
const StockLevelsWidget = lazy(() => import('@/components/widgets/StockLevelsWidget'))

// Import API services
import plAnalysisApi from '@/services/api/plAnalysisApi'
import productSalesApi from '@/services/api/productSalesApi'

const DashboardEnterprise = () => {
  const [plData, setPLData] = useState([])
  const [plLoading, setPLLoading] = useState(true)
  const [plError, setPLError] = useState(null)
  const [performanceKpis, setPerformanceKpis] = useState(defaultPerformanceKpis)
  const [kpiLoading, setKpiLoading] = useState(true)
  const [kpiError, setKpiError] = useState(null)
  const [productSalesData, setProductSalesData] = useState([])
  const [salesLoading, setSalesLoading] = useState(true)
  const [salesError, setSalesError] = useState(null)

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
        
        // Use mock data as fallback
        const mockResponse = plAnalysisApi.getMockData()
        setPLData(mockResponse.data)
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
        
        // Keep default KPIs as fallback
        setPerformanceKpis(defaultPerformanceKpis)
      } finally {
        setKpiLoading(false)
      }
    }

    fetchKPIData()
  }, [])

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
        
        // Use mock data as fallback
        const mockResponse = productSalesApi.getMockData()
        setProductSalesData(mockResponse.data)
      } finally {
        setSalesLoading(false)
      }
    }

    fetchProductSalesData()
  }, [])

  return (
    <section className="space-y-6">
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
          {capitalKpis.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-lg font-semibold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.helper}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance metrics</CardTitle>
          <CardDescription>Key business performance indicators tracked for operational excellence.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {performanceKpis.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-lg font-semibold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.helper}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Sales Performance</CardTitle>
          <CardDescription>Revenue performance by product line for last year showing GABA Red, Black, and Gold sales.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {salesLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading product sales data...</p>
              </div>
            </div>
          ) : salesError ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">Error loading product sales data</p>
                <p className="text-xs text-muted-foreground">Using sample data for demonstration</p>
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
          <CardDescription>Monthly profit and loss analysis showing revenue, gross profit, EBITDA, and margin trends.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {plLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading P&L data...</p>
              </div>
            </div>
          ) : plError ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">Error loading P&L data</p>
                <p className="text-xs text-muted-foreground">Using sample data for demonstration</p>
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
          <CardTitle>Regional contribution</CardTitle>
          <CardDescription>Revenue and EBITDA by operating region for the current quarter.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Suspense fallback={<div className="flex h-full items-center justify-center">Loading chart...</div>}>
            <RegionalContributionChart data={regionalPerformance} />
          </Suspense>
        </CardContent>
      </Card>

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
    </section>
  )
}

export default DashboardEnterprise
