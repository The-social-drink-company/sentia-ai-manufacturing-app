import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, LineChart, Line, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

const DATA_MODELS = {
  arima: {
    label: 'ARIMA Ensemble',
    accuracy: 0.93,
    bias: '+1.2%',
    series: [
      { month: '2025-09', actual: 12500, forecast: 12800 },
      { month: '2025-10', actual: 13200, forecast: 13540 },
      { month: '2025-11', actual: null, forecast: 14260 },
      { month: '2025-12', actual: null, forecast: 15780 },
      { month: '2026-01', actual: null, forecast: 13820 },
      { month: '2026-02', actual: null, forecast: 13140 },
      { month: '2026-03', actual: null, forecast: 14560 }
    ]
  },
  lstm: {
    label: 'LSTM Neural Net',
    accuracy: 0.9,
    bias: '+2.8%',
    series: [
      { month: '2025-09', actual: 12500, forecast: 12930 },
      { month: '2025-10', actual: 13200, forecast: 13750 },
      { month: '2025-11', actual: null, forecast: 14410 },
      { month: '2025-12', actual: null, forecast: 16180 },
      { month: '2026-01', actual: null, forecast: 13990 },
      { month: '2026-02', actual: null, forecast: 13440 },
      { month: '2026-03', actual: null, forecast: 14920 }
    ]
  },
  holt: {
    label: 'Holt-Winters',
    accuracy: 0.88,
    bias: '-1.5%',
    series: [
      { month: '2025-09', actual: 12500, forecast: 12340 },
      { month: '2025-10', actual: 13200, forecast: 13020 },
      { month: '2025-11', actual: null, forecast: 13610 },
      { month: '2025-12', actual: null, forecast: 14820 },
      { month: '2026-01', actual: null, forecast: 13040 },
      { month: '2026-02', actual: null, forecast: 12710 },
      { month: '2026-03', actual: null, forecast: 13870 }
    ]
  }
}

const PRODUCT_INSIGHTS = [
  { sku: 'SENT-RED-500', name: 'Sentia Red 500ml', growth: '+12%', risk: 'low', accuracy: '94%' },
  { sku: 'SENT-GOLD-500', name: 'Sentia Gold 500ml', growth: '+7%', risk: 'medium', accuracy: '91%' },
  { sku: 'SENT-WHITE-500', name: 'Sentia White 500ml', growth: '+3%', risk: 'low', accuracy: '92%' }
]

const Forecasting = () => {
  const [modelKey, setModelKey] = useState('arima')
  const [confidence, setConfidence] = useState('95')

  const model = DATA_MODELS[modelKey]

  const chartData = useMemo(
    () =>
      model.series.map((point) => ({
        month: point.month,
        forecast: point.forecast,
        actual: point.actual ?? undefined
      })),
    [model.series]
  )

  const nextMonth = model.series[2]?.forecast ?? 0
  const runRate = Math.round(chartData.reduce((sum, p) => sum + (p.forecast ?? 0), 0) / chartData.length)

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Demand Forecasting</h1>
          <p className="text-sm text-muted-foreground">
            Compare model projections and review product-level signals before locking production plans.
          </p>
        </div>
        <Badge variant="outline">Confidence {confidence}%</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Forecast controls</CardTitle>
          <CardDescription>Switch between forecasting models and adjust confidence interval.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Control label="Model">
            <Select value={modelKey} onValueChange={setModelKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DATA_MODELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
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
          <Metric label="Next month" value={`${nextMonth.toLocaleString()} units`} helper="Model projection" />
          <Metric label="Run rate" value={`${runRate.toLocaleString()} units`} helper="Mean of forecast horizon" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{DATA_MODELS[modelKey].label}</CardTitle>
          <CardDescription>Historical actuals with projected demand for the next six months.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip formatter={(value) => value.toLocaleString()} labelFormatter={(label) => `Month ${label}`} />
              <Area type="monotone" dataKey="forecast" stroke="#2563eb" fill="#2563eb22" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={2} dot activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product insights</CardTitle>
          <CardDescription>Model-level growth expectations and confidence by SKU.</CardDescription>
        </CardHeader>
        <CardContent>
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
                {PRODUCT_INSIGHTS.map((row) => (
                  <tr key={row.sku}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-emerald-600">{row.growth}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs capitalize">{row.risk}</Badge>
                    </td>
                    <td className="px-4 py-3">{row.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
