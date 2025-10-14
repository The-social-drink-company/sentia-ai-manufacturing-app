import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkingCapitalLiveData } from '@/hooks/useWorkingCapitalLiveData'
import { useXero } from '@/contexts/XeroContext'

const RealWorkingCapital = () => {
  const { data, loading, error, metadata, retryConnection } = useWorkingCapitalLiveData()
  const { isConnected: xeroConnected } = useXero()

  // Loading state
  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Working Capital Overview</h1>
          <p className="text-sm text-muted-foreground">
            Loading live financial data...
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="space-y-2 p-5">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  // Error state - no fallback data, show clear error
  if (error) {
    const isXeroConnectionError = error.message?.includes('Xero connection') || 
                                 error.message?.includes('requires Xero') ||
                                 error.message?.includes('financial data')
    
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Working Capital Overview</h1>
          <p className="text-sm text-muted-foreground">
            Unable to load financial data
          </p>
        </header>
        
        {/* Xero connection banners removed - custom connections don't require user interaction */}
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              🔴 {error.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-700">{error.message}</p>
            <div className="space-y-2">
              <p className="text-sm text-red-600"><strong>Action required:</strong> {error.userAction}</p>
              {error.retryIn && (
                <p className="text-sm text-red-600"><strong>Retry in:</strong> {error.retryIn}</p>
              )}
              <p className="text-xs text-red-500">Error occurred at: {new Date(error.timestamp).toLocaleString()}</p>
            </div>
            <button 
              onClick={retryConnection}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry Connection
            </button>
          </CardContent>
        </Card>
      </section>
    )
  }

  // Success state with live data
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Working Capital Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live financial data from Xero
        </p>
      </header>

      {/* Xero connection banners removed - custom connections don't require user interaction */}

      {/* Data Status Banner */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-800 font-medium">Live Data Connected</span>
            </div>
            {metadata && (
              <div className="text-right text-sm text-green-700">
                <p>Last updated: {new Date(metadata.lastUpdated).toLocaleString()}</p>
                <p>Response time: {metadata.responseTime}</p>
              </div>
            )}
          </div>
          {metadata && metadata.services && (
            <div className="mt-2 flex gap-4 text-xs text-green-600">
              <span>🟢 MCP Server: {metadata.services.mcpServer?.status || 'unknown'}</span>
              <span>🟢 Xero API: {metadata.services.xero?.status || 'unknown'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          label="Working Capital" 
          value={currency(data.workingCapital)} 
          helper="Assets − Liabilities" 
          tone="primary"
          dataSource="Xero API"
        />
        <MetricCard 
          label="Current Ratio" 
          value={data.currentRatio?.toFixed(2) || 'N/A'} 
          helper="Target ≥ 2.0" 
          tone="success"
          dataSource="Xero API"
        />
        <MetricCard 
          label="Quick Ratio" 
          value={data.quickRatio?.toFixed(2) || 'N/A'} 
          helper="Target ≥ 1.5" 
          tone="success"
          dataSource="Xero API"
        />
        <MetricCard 
          label="Cash Available" 
          value={currency(data.cash)} 
          helper="Immediate liquidity" 
          tone="warning"
          dataSource="Xero API"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance Summary (Live from Xero)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <LineItem label="Receivables" value={currency(data.receivables)} dataSource="Xero API" />
          <LineItem label="Payables" value={currency(data.payables)} dataSource="Xero API" />
        </CardContent>
      </Card>
    </section>
  )
}

const MetricCard = ({ label, value, helper, tone, dataSource }) => {
  const palette =
    tone === 'primary'
      ? 'bg-blue-50 text-blue-900'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-900'
        : 'bg-amber-50 text-amber-900'

  return (
    <Card className={palette}>
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium opacity-80">{label}</p>
          <span className="text-xs opacity-60 bg-white/50 px-2 py-1 rounded">
            📊 {dataSource}
          </span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs opacity-70">{helper}</p>
      </CardContent>
    </Card>
  )
}

const LineItem = ({ label, value, dataSource }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-4">
    <div className="flex items-center justify-between mb-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className="text-xs text-muted-foreground/70">📊 {dataSource}</span>
    </div>
    <p className="text-lg font-semibold">{value}</p>
  </div>
)

const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)

export default RealWorkingCapital
