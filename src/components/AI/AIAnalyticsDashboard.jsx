import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusCards = [
  { label: 'Latency', value: '42 ms' },
  { label: 'Requests', value: '1,240' },
  { label: 'Errors', value: '0' },
  { label: 'Last Checked', value: new Date().toLocaleTimeString() }
]

const predictions = [
  { category: 'Sales Forecast', value: '+23%', confidence: 92 },
  { category: 'Inventory Optimization', value: '-15%', confidence: 88 },
  { category: 'Production Efficiency', value: '+8%', confidence: 95 }
]

const AIAnalyticsDashboard = () => {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">AI Analytics Central</h1>
        <p className="text-sm text-muted-foreground">
          Summary of model predictions and automated actions powered by MCP.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>MCP Server Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {statusCards.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Predictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {predictions.map((prediction) => (
            <div key={prediction.category} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium">{prediction.category}</p>
                <p className="text-xs text-muted-foreground">Confidence {prediction.confidence}%</p>
              </div>
              <span className="text-sm font-semibold text-primary">{prediction.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

export default AIAnalyticsDashboard
