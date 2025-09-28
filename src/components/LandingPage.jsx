import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const FEATURES = [
  {
    title: 'Unified working capital view',
    description: 'Blend banking, ERP, and MCP streams into one live liquidity workspace.'
  },
  {
    title: 'AI-assisted scenario planning',
    description: 'Model demand shocks, supplier delays, or pricing strategies in seconds.'
  },
  {
    title: 'Executive-ready reporting',
    description: 'Generate board-ready packs with drill-through to operational data.'
  }
]

const HIGHLIGHTS = [
  { label: 'Monthly revenue', value: '$2.5M', helper: '+15% vs prior period' },
  { label: 'Active orders', value: '1,240', helper: 'Demand holding steady' },
  { label: 'Inventory value', value: '$820K', helper: 'Optimised for 32 days' },
  { label: 'Active customers', value: '842', helper: '+12% YoY' }
]

const LandingPage = () => {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 p-8 text-center">
      <section className="space-y-4">
        <Badge variant="secondary" className="mx-auto w-fit uppercase tracking-[0.2em]">Sentia manufacturing</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Working capital intelligence for modern finance teams
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          One dashboard to understand liquidity, forecast cash, and coordinate production decisions across the plant.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg">Launch dashboard</Button>
          <Button size="lg" variant="outline">
            View product tour
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HIGHLIGHTS.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-muted/30 p-5 text-left">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className="text-2xl font-semibold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 sm:grid-cols-3 text-left">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  )
}

export default LandingPage
