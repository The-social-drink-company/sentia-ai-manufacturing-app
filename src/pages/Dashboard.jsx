import { useDashboardSummary } from '../hooks/useDashboardSummary.js'

const formatNumber = (value, unit) =>
  typeof value === 'number'
    ? `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`
    : '--'

const formatTrend = trend => {
  if (typeof trend !== 'number') {
    return null
  }

  const direction = trend === 0 ? 'stable' : trend > 0 ? 'up' : 'down'
  const symbol = trend === 0 ? 'STABLE' : trend > 0 ? 'UP' : 'DOWN'
  const toneByDirection = {
    up: 'text-success-400/85',
    down: 'text-error-400/85',
    stable: 'text-crystal-border/80',
  }

  return (
    <span
      className={`text-xs uppercase tracking-[0.08em] ${toneByDirection[direction]}`}
      aria-label={`Trend ${direction}`}
    >
      {symbol} {Math.abs(trend).toFixed(1)}%
    </span>
  )
}

const MetricCard = ({ title, metric }) => (
  <article className="grid gap-2 rounded-2xl border border-sky-400/25 bg-quantum-overlay/60 p-6 shadow-glow-blue">
    <h3 className="text-lg font-semibold text-crystal-pure">{title}</h3>
    <p className="text-2xl font-semibold text-crystal-pure">{formatNumber(metric?.value, metric?.unit)}</p>
    {formatTrend(metric?.trend)}
  </article>
)

const alertToneBySeverity = {
  warning: 'border-warning-500/45 bg-warning-500/20',
  info: 'border-info-500/45 bg-info-500/20',
  default: 'border-crystal-border/15 bg-quantum-overlay/60',
}

const AlertBanner = ({ alert }) => (
  <div
    className={`grid grid-cols-[auto,1fr] items-center gap-3 rounded-xl border px-4 py-3 ${
      alertToneBySeverity[alert.severity] ?? alertToneBySeverity.default
    }`}
    role="status"
  >
    <span className="text-xs uppercase tracking-[0.2em] text-sky-300">{alert.severity}</span>
    <span className="text-crystal-light/90">{alert.message}</span>
  </div>
)

export default function DashboardPage() {
  const summary = useDashboardSummary()

  return (
    <section className="flex flex-col gap-8">
      <header className="max-w-3xl space-y-4">
        <div>
          <h2 className="mb-3 text-[1.75rem] font-semibold text-crystal-pure">Operations Pulse</h2>
          <p className="text-crystal-border/80 leading-relaxed">
            Real-time visibility into production, inventory, and working capital health. Data sourced
            from the MCP baseline with automatic mock fallback when offline.
          </p>
        </div>
        {summary.source === 'mock' ? (
          <p className="mt-3 text-sm text-sky-300/80">
            Using mock data fallback. Configure MCP endpoint to enable live metrics.
          </p>
        ) : (
          <p className="mt-3 text-sm text-sky-300/80">Live metrics streamed from MCP service.</p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Throughput" metric={summary.data?.metrics?.throughput} />
        <MetricCard title="Forecast Accuracy" metric={summary.data?.metrics?.forecastAccuracy} />
        <MetricCard title="Cash Runway" metric={summary.data?.metrics?.cashRunway} />
        <MetricCard title="Queue Depth" metric={summary.data?.metrics?.queueDepth} />
      </div>

      <section className="grid gap-4">
        <h3 className="text-lg font-semibold text-crystal-pure">Alerts & Notables</h3>
        <div className="grid gap-3">
          {summary.data?.alerts?.length ? (
            summary.data.alerts.map(alert => <AlertBanner key={alert.id} alert={alert} />)
          ) : (
            <p className="text-sm text-crystal-border/75">No active alerts.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-lg font-semibold text-crystal-pure">Next Steps</h3>
        <ul className="list-disc space-y-2 pl-5 text-crystal-light/80">
          <li>Connect Amazon SP-API and Shopify feeds through the Render-hosted MCP server.</li>
          <li>Surface SSE-backed production events and real integration statuses.</li>
          <li>Promote the shell to `test` and `production` once MCP connectivity is verified.</li>
        </ul>
      </section>
    </section>
  )
}
