import { Badge } from '@/components/ui/badge'

const enterpriseHighlights = [
  { label: 'Global entities', value: '12', helper: 'Orchestrated across APAC + EMEA' },
  { label: 'Liquidity runway', value: '218 days', helper: 'Pro forma after MCP adjustments' },
  { label: 'Operational ROI', value: '28%', helper: 'Based on last 4 transformation programmes' }
]

const LandingPageEnterprise = () => (
  <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8 text-left">
    <section className="space-y-4">
      <Badge variant="outline" className="uppercase tracking-[0.3em]">Enterprise</Badge>
      <h1 className="text-4xl font-semibold tracking-tight">Sentia manufacturing control tower</h1>
      <p className="text-sm text-muted-foreground sm:text-base">
        Align treasury, operations, and procurement with a single source of truth for global working capital.
      </p>
    </section>

    <section className="grid gap-4 sm:grid-cols-3">
      {enterpriseHighlights.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-muted/20 p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
          <p className="text-2xl font-semibold text-foreground">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.helper}</p>
        </div>
      ))}
    </section>
  </main>
)

export default LandingPageEnterprise
