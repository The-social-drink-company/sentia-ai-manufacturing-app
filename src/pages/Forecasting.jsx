import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { AlertTriangle, TrendingUp, Database, CheckCircle } from 'lucide-react'

const Forecasting = () => {
  const [modelKey, setModelKey] = useState('arima')
  const [confidence, setConfidence] = useState('95')
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch real forecast data from API
  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Fetching real demand forecast data...')
        const response = await fetch('/api/forecasting/demand')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}: Failed to fetch forecast data`)
        }
        
        if (data.success && data.models) {
          console.log('Real forecast data loaded:', data)
          setForecastData(data)
        } else {
          throw new Error(data.error || 'Invalid forecast data format')
        }
      } catch (err) {
        console.error('Failed to fetch forecast data:', err)
        setError({
          message: err.message,
          suggestions: err.suggestions || ['Check server logs', 'Verify data connections']
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchForecastData()
  }, [])

  // Use real data if available, otherwise show loading/error state
  const models = forecastData?.models || {}
  const productInsights = forecastData?.productInsights || []
  const metadata = forecastData?.metadata || {}
  
  const model = models[modelKey] || {
    label: 'Loading...',
    accuracy: 0,
    bias: '0%',
    series: []
  }

  const chartData = useMemo(() => {
    if (!model.series || model.series.length === 0) {
      console.log('No series data available for chart')
      return []
    }
    
    const data = model.series.map((point) => ({
      month: point.month,
      forecast: point.forecast,
      actual: point.actual ?? undefined
    }))
    
    console.log('Chart data prepared:', data)
    return data
  }, [model.series])

  const nextMonth = model.series?.find(p => p.actual === null)?.forecast ?? 0
  const runRate = chartData.length > 0 ? 
    Math.round(chartData.reduce((sum, p) => sum + (p.forecast ?? 0), 0) / chartData.length) : 0

  // Show loading state
  if (loading) {
    return (
      <section className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Demand Forecasting</h1>
            <p className="text-sm text-muted-foreground">
              Loading real demand forecast data from Shopify and historical sales...
            </p>
          </div>
          <Badge variant="outline" className="animate-pulse">Loading...</Badge>
        </header>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Generating forecast from real sales data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Demand Forecasting</h1>
            <p className="text-sm text-muted-foreground">
              Unable to load real forecast data - check data connections
            </p>
          </div>
          <Badge variant="destructive">Data Error</Badge>
        </header>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Forecast Data Unavailable
            </CardTitle>
            <CardDescription>Unable to generate real demand forecasts from available data sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">Error: {error.message}</p>
              </div>
              
              {error.suggestions && error.suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Retry Loading Data
              </button>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Demand Forecasting</h1>
          <p className="text-sm text-muted-foreground">
            Real demand forecasts based on {metadata.dataSource === 'real_data' ? 'historical sales data' : 'Shopify sales trends'} - 
            {metadata.historicalDataPoints} months of data, 6-month projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Confidence {confidence}%</Badge>
          <Badge variant={metadata.dataSource === 'real_data' ? 'default' : 'secondary'} className="flex items-center gap-1">
            {metadata.dataSource === 'real_data' ? <Database className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {metadata.dataSource === 'real_data' ? 'Database' : 'Shopify'}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Forecast Controls
          </CardTitle>
          <CardDescription>
            Real forecasting models using {metadata.algorithm || 'ensemble methods'} - 
            Generated {metadata.generatedAt ? new Date(metadata.generatedAt).toLocaleString() : 'recently'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Control label="Model">
            <Select value={modelKey} onValueChange={setModelKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(models).map(([key, model]) => (
                  <SelectItem key={key} value={key}>
                    {model.label} ({Math.round(model.accuracy * 100)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Control>
          <Control label="Confidence interval">
            <Select value={confidence} onValueChange={setConfidence}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
                <SelectItem value="99">99%</SelectItem>
              </SelectContent>
            </Select>
          </Control>
          <Metric 
            label="Next month" 
            value={`${nextMonth.toLocaleString()} units`} 
            helper={`${model.label} projection`} 
          />
          <Metric 
            label="Run rate" 
            value={`${runRate.toLocaleString()} units`} 
            helper="6-month average" 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{model.label}</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Accuracy:</span>
              <Badge variant="secondary">{Math.round(model.accuracy * 100)}%</Badge>
              <span className="text-muted-foreground">Bias:</span>
              <Badge variant={model.bias.startsWith('+') ? 'destructive' : 'default'}>{model.bias}</Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Historical actuals with projected demand for the next six months using real sales data
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip 
                  formatter={(value, name) => [value?.toLocaleString() || 'N/A', name === 'forecast' ? 'Forecast' : 'Actual']} 
                  labelFormatter={(label) => `Month: ${label}`} 
                />
                <Line type="monotone" dataKey="forecast" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 4 }} />
                <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Chart Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chart will appear when forecast data contains time series information
                </p>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <p>Data Source: {metadata.dataSource || 'Unknown'}</p>
                  <p>Historical Points: {metadata.historicalDataPoints || 0}</p>
                  <p>Algorithm: {metadata.algorithm || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month-by-Month Forecast Data</CardTitle>
          <CardDescription>
            Detailed forecast and actual values by month from {model.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Month</th>
                    <th className="px-4 py-2 font-medium">Forecast</th>
                    <th className="px-4 py-2 font-medium">Actual</th>
                    <th className="px-4 py-2 font-medium">Variance</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {chartData.map((row, index) => {
                    const forecast = row.forecast || 0
                    const actual = row.actual
                    const variance = actual !== undefined ? actual - forecast : null
                    const variancePercent = actual !== undefined && forecast > 0 ? 
                      ((variance / forecast) * 100) : null
                    
                    return (
                      <tr key={index} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-foreground">{row.month}</td>
                        <td className="px-4 py-3 text-blue-600 font-medium">
                          {forecast.toLocaleString()} units
                        </td>
                        <td className="px-4 py-3">
                          {actual !== undefined ? (
                            <span className="text-cyan-600 font-medium">
                              {actual.toLocaleString()} units
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Projected</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {variance !== null ? (
                            <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {variance >= 0 ? '+' : ''}{variance.toLocaleString()}
                              {variancePercent !== null && (
                                <span className="text-xs ml-1">
                                  ({variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {actual !== undefined ? (
                            <Badge variant="default" className="text-xs">
                              Historical
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Forecast
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Forecast data table will appear when time series data is available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Insights</CardTitle>
          <CardDescription>
            Growth expectations and forecast accuracy by product SKU based on real sales patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productInsights.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Product</th>
                    <th className="px-4 py-2 font-medium">Growth</th>
                    <th className="px-4 py-2 font-medium">Risk</th>
                    <th className="px-4 py-2 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productInsights.map((row) => (
                    <tr key={row.sku}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={row.growth.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}>
                          {row.growth}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={row.risk === 'low' ? 'default' : row.risk === 'medium' ? 'secondary' : 'destructive'} 
                          className="text-xs capitalize"
                        >
                          {row.risk}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{row.accuracy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Product-level insights will appear when sufficient sales data is available</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {metadata.aiInsights && metadata.aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Insights & Recommendations</CardTitle>
            <CardDescription>Intelligence-driven insights from demand pattern analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metadata.aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.severity === 'warning' ? 'bg-orange-500' : 
                    insight.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-blue-700 mt-2 font-medium">
                        Recommendation: {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

const Control = ({ label, children }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    {children}
  </div>
)

const Metric = ({ label, value, helper }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-lg font-semibold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{helper}</p>
  </div>
)

export default Forecasting
