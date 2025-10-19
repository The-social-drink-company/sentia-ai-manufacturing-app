import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkingCapitalLiveData } from '@/hooks/useWorkingCapitalLiveData'
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus'
import { useState, useEffect } from 'react'
import WorkingCapitalEngine from '@/services/WorkingCapitalEngine'
import XeroSetupPrompt from '@/components/integrations/XeroSetupPrompt'

const RealWorkingCapital = () => {
  const { data, loading, error, metadata, retryConnection } = useWorkingCapitalLiveData()
  const integrations = useIntegrationStatus()
  const [enhancedData, setEnhancedData] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [engine] = useState(() => new WorkingCapitalEngine())

  // Enhance data with advanced analytics when base data loads
  useEffect(() => {
    if (data && !loading && !error) {
      setAnalysisLoading(true)
      engine
        .getWorkingCapitalAnalysis()
        .then(analysis => {
          setEnhancedData(analysis)
        })
        .catch(err => {
          console.error('Enhanced analysis failed:', err)
          setEnhancedData({ data, optimizationRecommendations: [] })
        })
        .finally(() => {
          setAnalysisLoading(false)
        })
    }
  }, [data, loading, error, engine])

  // Loading state
  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Working Capital Overview</h1>
          <p className="text-sm text-muted-foreground">Loading live financial data...</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
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
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Working Capital Overview</h1>
          <p className="text-sm text-muted-foreground">Unable to load financial data</p>
        </header>

        {/* Xero Setup Prompt - Shows when Xero is not configured */}
        {integrations.xero && integrations.xero.status !== 'connected' && (
          <XeroSetupPrompt xeroStatus={integrations.xero} />
        )}

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">🔴 {error.type}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-700">{error.message}</p>
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                <strong>Action required:</strong> {error.userAction}
              </p>
              {error.retryIn && (
                <p className="text-sm text-red-600">
                  <strong>Retry in:</strong> {error.retryIn}
                </p>
              )}
              <p className="text-xs text-red-500">
                Error occurred at: {new Date(error.timestamp).toLocaleString()}
              </p>
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
  const displayData = enhancedData?.data || data
  const recommendations = enhancedData?.optimizationRecommendations || []

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Working Capital Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live financial data with AI-powered optimization insights
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
          value={currency(displayData.workingCapital)}
          helper="Assets − Liabilities"
          tone="primary"
          dataSource="Sentia Database"
          trend={displayData.advanced?.efficiency?.workingCapitalTurnover}
        />
        <MetricCard
          label="Current Ratio"
          value={displayData.currentRatio?.toFixed(2) || 'N/A'}
          helper="Target ≥ 2.0"
          tone={displayData.currentRatio >= 2 ? 'success' : 'warning'}
          dataSource="Sentia Database"
        />
        <MetricCard
          label="Cash Conversion Cycle"
          value={`${Math.round(displayData.cashConversionCycle || 0)} days`}
          helper={
            displayData.advanced?.cashConversionCycle?.optimal?.total
              ? `Target: ${displayData.advanced.cashConversionCycle.optimal.total} days`
              : 'Industry benchmark'
          }
          tone={
            displayData.advanced?.cashConversionCycle?.metrics?.cccEfficiency < 1.2
              ? 'success'
              : 'warning'
          }
          dataSource="Sentia Database"
        />
        <MetricCard
          label="WC Efficiency"
          value={displayData.advanced?.efficiency?.efficiency?.category || 'Calculating...'}
          helper="Overall efficiency rating"
          tone={getEfficiencyTone(displayData.advanced?.efficiency?.efficiency?.category)}
          dataSource="AI Analysis"
        />
      </div>

      {/* Advanced Analytics Section */}
      {enhancedData?.data?.advanced && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Cash Conversion Cycle Analysis
                {analysisLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">DSO</p>
                  <p className="text-lg font-semibold">
                    {Math.round(enhancedData.data.advanced.cashConversionCycle.current.dso)} days
                  </p>
                  <p className="text-xs text-green-600">
                    Target: {enhancedData.data.advanced.cashConversionCycle.optimal.dso}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DIO</p>
                  <p className="text-lg font-semibold">
                    {Math.round(enhancedData.data.advanced.cashConversionCycle.current.dio)} days
                  </p>
                  <p className="text-xs text-green-600">
                    Target: {enhancedData.data.advanced.cashConversionCycle.optimal.dio}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DPO</p>
                  <p className="text-lg font-semibold">
                    {Math.round(enhancedData.data.advanced.cashConversionCycle.current.dpo)} days
                  </p>
                  <p className="text-xs text-green-600">
                    Target: {enhancedData.data.advanced.cashConversionCycle.optimal.dpo}
                  </p>
                </div>
              </div>
              {enhancedData.data.advanced.cashConversionCycle.metrics.improvementPotential > 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚡ Potential improvement:{' '}
                    <strong>
                      {Math.round(
                        enhancedData.data.advanced.cashConversionCycle.metrics.improvementPotential
                      )}{' '}
                      days
                    </strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Channel Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedData.data.advanced.channels?.channels ? (
                <div className="space-y-3">
                  {Object.entries(enhancedData.data.advanced.channels.channels)
                    .slice(0, 3)
                    .map(([channel, profile]) => (
                      <div
                        key={channel}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm font-medium">{channel}</span>
                        <div className="text-right">
                          <p className="text-sm">{profile.paymentTerms} days</p>
                          <p className="text-xs text-muted-foreground">
                            {(profile.commission * 100).toFixed(1)}% fee
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Channel analysis loading...</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 AI Optimization Recommendations
              <span className="text-sm font-normal text-muted-foreground">
                ({recommendations.length} insights)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`border-l-4 pl-4 py-3 ${
                  rec.priority === 'high'
                    ? 'border-red-500 bg-red-50'
                    : rec.priority === 'medium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{rec.title}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : rec.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-muted-foreground mb-3">{rec.description}</p>
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Action Items:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {rec.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="text-sm font-medium text-green-700">💰 {rec.impact}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Balance Summary (Live from Sentia Database)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <LineItem
            label="Receivables"
            value={currency(displayData.accountsReceivable || 0)}
            dataSource="Sentia Database"
          />
          <LineItem
            label="Payables"
            value={currency(displayData.accountsPayable || 0)}
            dataSource="Sentia Database"
          />
          <LineItem
            label="Inventory"
            value={currency(displayData.inventory || 0)}
            dataSource="Sentia Database"
          />
          <LineItem
            label="Cash Position"
            value={currency(displayData.cash || 0)}
            dataSource="Sentia Database"
          />
        </CardContent>
      </Card>
    </section>
  )
}

const getEfficiencyTone = category => {
  const toneMap = {
    excellent: 'success',
    good: 'success',
    fair: 'warning',
    poor: 'warning',
  }
  return toneMap[category] || 'primary'
}

const MetricCard = ({ label, value, helper, tone, dataSource, trend }) => {
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
          <span className="text-xs opacity-60 bg-white/50 px-2 py-1 rounded">📊 {dataSource}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold">{value}</p>
          {trend && (
            <span
              className={`text-sm ${
                trend > 2 ? 'text-green-600' : trend > 1 ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {trend > 2 ? '↗️' : trend > 1 ? '➡️' : '↘️'}
            </span>
          )}
        </div>
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

const currency = value =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

export default RealWorkingCapital
