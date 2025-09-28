import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const forecastSeries = {
  horizon: '12 months',
  points: [
    { month: 'Sep 25', forecast: 12800 },
    { month: 'Oct 25', forecast: 13500 },
    { month: 'Nov 25', forecast: 14200 },
    { month: 'Dec 25', forecast: 15800 },
    { month: 'Jan 26', forecast: 13200 },
    { month: 'Feb 26', forecast: 12800 }
  ]
}

const Forecasting = () => {
  const [model, setModel] = useState('arima')
  const [horizon, setHorizon] = useState('12m')

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Demand Forecasting</h1>
          <p className="text-sm text-muted-foreground">Projected monthly volume based on rolling 12‑month window.</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export forecast
        </button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Forecast Controls</span>
            <ChartBarIcon className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Control label="Model">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="arima">ARIMA (recommended)</SelectItem>
                <SelectItem value="lstm">LSTM ensemble</SelectItem>
                <SelectItem value="holt">Holt–Winters</SelectItem>
              </SelectContent>
            </Select>
          </Control>
          <Control label="Horizon">
            <Select value={horizon} onValueChange={setHorizon}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">6 months</SelectItem>
                <SelectItem value="12m">12 months</SelectItem>
                <SelectItem value="24m">24 months</SelectItem>
              </SelectContent>
            </Select>
          </Control>
          <Metric label="Accuracy" value="92%" helper="Rolling 3-month MAPE" />
          <Metric label="Alerts" value="2" helper="Watch December demand" tone="warning" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{forecastSeries.horizon} outlook</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastSeries.points}>
              <XAxis dataKey="month" stroke="currentColor" tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" tickFormatter={(value) => value.toLocaleString()} tickCount={6} />
              <Tooltip formatter={(value) => value.toLocaleString()} labelFormatter={(label) => `Month ${label}`} />
              <Line type="monotone" dataKey="forecast" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  )
}

const Control = ({ label, children }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    {children}
  </div>
)

const Metric = ({ label, value, helper, tone }) => {
  const tint = tone === 'warning' ? 'text-amber-600' : 'text-emerald-600'
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${tint}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

export default Forecasting
