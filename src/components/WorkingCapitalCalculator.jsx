import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Calculator, RefreshCw } from 'lucide-react'

const WorkingCapitalCalculator = () => {
  const [form, setForm] = useState({
    receivables: 325000,
    payables: 210000,
    inventory: 185000,
    costOfGoodsSold: 1250000,
    netSales: 1750000
  })

  const metrics = useMemo(() => {
    const workingCapital = form.receivables + form.inventory - form.payables
    const currentRatio = (form.receivables + form.inventory) / Math.max(form.payables, 1)
    const inventoryDays = form.inventory / Math.max(form.costOfGoodsSold / 365, 1)
    const receivableDays = form.receivables / Math.max(form.netSales / 365, 1)
    const payableDays = form.payables / Math.max(form.costOfGoodsSold / 365, 1)
    const cashConversionCycle = receivableDays + inventoryDays - payableDays

    return {
      workingCapital,
      currentRatio,
      inventoryDays,
      receivableDays,
      payableDays,
      cashConversionCycle
    }
  }, [form])

  const handleChange = (field) => (event) => {
    const value = Number.parseFloat(event.target.value || '0')
    setForm((current) => ({ ...current, [field]: Number.isFinite(value) ? value : 0 }))
  }

  const resetForm = () => {
    setForm({
      receivables: 325000,
      payables: 210000,
      inventory: 185000,
      costOfGoodsSold: 1250000,
      netSales: 1750000
    })
  }

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)

  const formatNumber = (value) => new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1
  }).format(value)

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Working Capital Inputs
          </CardTitle>
          <CardDescription>Adjust balances to explore working capital scenarios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4">
            <Field label="Accounts Receivable" value={form.receivables} onChange={handleChange('receivables')} />
            <Field label="Inventory" value={form.inventory} onChange={handleChange('inventory')} />
            <Field label="Accounts Payable" value={form.payables} onChange={handleChange('payables')} />
          </div>

          <Separator />

          <div className="grid gap-4">
            <Field label="Net Sales (annual)" value={form.netSales} onChange={handleChange('netSales')} />
            <Field label="Cost of Goods Sold (annual)" value={form.costOfGoodsSold} onChange={handleChange('costOfGoodsSold')} />
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Metrics</CardTitle>
          <CardDescription>Calculated from the latest input values.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <MetricRow label="Working Capital" value={formatCurrency(metrics.workingCapital)} />
          <MetricRow label="Current Ratio" value={formatNumber(metrics.currentRatio)} helper="Target ≥ 1.2" />
          <Separator />
          <MetricRow label="Inventory Days" value={`${formatNumber(metrics.inventoryDays)} days`} />
          <MetricRow label="Receivable Days" value={`${formatNumber(metrics.receivableDays)} days`} />
          <MetricRow label="Payable Days" value={`${formatNumber(metrics.payableDays)} days`} />
          <Separator />
          <MetricRow
            label="Cash Conversion Cycle"
            value={`${formatNumber(metrics.cashConversionCycle)} days`}
            helper="Receivable + Inventory − Payable"
          />
        </CardContent>
      </Card>
    </section>
  )
}

const Field = ({ label, value, onChange }) => {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input type="number" value={value} min={0} onChange={onChange} />
    </div>
  )
}

const MetricRow = ({ label, value, helper }) => {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

export default WorkingCapitalCalculator
