import { Button } from '@/components/ui/button'

const LandingPage = () => {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 p-8 text-center">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sentia Manufacturing</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Working capital intelligence for modern finance teams
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          One dashboard to understand liquidity, forecast cash, and coordinate production decisions.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg">Launch dashboard</Button>
          <Button size="lg" variant="outline">
            View product tour
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Highlight headline="$2.5M" subhead="Monthly revenue" helper="+15% vs last period" />
        <Highlight headline="1,240" subhead="Active orders" helper="Demand holding steady" />
        <Highlight headline="$820K" subhead="Inventory value" helper="Optimized for 32 days" />
        <Highlight headline="842" subhead="Active customers" helper="Growing 12% YoY" />
      </section>
    </main>
  )
}

const Highlight = ({ headline, subhead, helper }) => (
  <div className="rounded-xl border border-border bg-muted/30 p-5 text-left">
    <p className="text-2xl font-semibold">{headline}</p>
    <p className="text-sm text-muted-foreground">{subhead}</p>
    <p className="text-xs text-muted-foreground">{helper}</p>
  </div>
)

export default LandingPage
