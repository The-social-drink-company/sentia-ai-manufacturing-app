import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const workingCapitalSnapshot = {
  workingCapital: 3120000,
  currentRatio: 2.4,
  quickRatio: 1.8,
  cash: 1525000,
  receivables: 1280000,
  payables: 670000
}

const RealWorkingCapital = () => {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Working Capital Overview</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of current assets, liabilities, and liquidity ratios.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Working Capital" value={currency(workingCapitalSnapshot.workingCapital)} helper="Assets − Liabilities" tone="primary" />
        <MetricCard label="Current Ratio" value={workingCapitalSnapshot.currentRatio.toFixed(2)} helper="Target ≥ 2.0" tone="success" />
        <MetricCard label="Quick Ratio" value={workingCapitalSnapshot.quickRatio.toFixed(2)} helper="Target ≥ 1.5" tone="success" />
        <MetricCard label="Cash Available" value={currency(workingCapitalSnapshot.cash)} helper="Immediate liquidity" tone="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <LineItem label="Receivables" value={currency(workingCapitalSnapshot.receivables)} />
          <LineItem label="Payables" value={currency(workingCapitalSnapshot.payables)} />
        </CardContent>
      </Card>
    </section>
  )
}

const MetricCard = ({ label, value, helper, tone }) => {
  const palette =
    tone === 'primary'
      ? 'bg-blue-50 text-blue-900'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-900'
        : 'bg-amber-50 text-amber-900'

  return (
    <Card className={palette}>
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs opacity-70">{helper}</p>
      </CardContent>
    </Card>
  )
}

const LineItem = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
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
