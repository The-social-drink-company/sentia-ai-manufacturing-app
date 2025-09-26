import { useDashboardSummary } from '../hooks/useDashboardSummary.js'

const formatNumber = (value, unit) =>
  typeof value === 'number'
    ? `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`
    : '�'

const formatTrend = trend => {
  if (typeof trend !== 'number') {
    return null
  }

  const direction = trend === 0 ? 'stable' : trend > 0 ? 'up' : 'down'
  const symbol = trend === 0 ? '?' : trend > 0 ? '?' : '?'
  const className = `metric-card__trend metric-card__trend--${direction}`

  return (
    <span className={className} aria-label={`Trend ${direction}`}>
      {symbol} {Math.abs(trend).toFixed(1)}%
    </span>
  )
}

const MetricCard = ({ title, metric }) => (
  <article className="metric-card">
    <h3>{title}</h3>
    <p className="metric-card__value">{formatNumber(metric?.value, metric?.unit)}</p>
    {formatTrend(metric?.trend)}
  </article>
)

const AlertBanner = ({ alert }) => (
  <div className={`alert alert--${alert.severity}`} role="status">
    <span className="alert__severity">{alert.severity}</span>
    <span className="alert__message">{alert.message}</span>
  </div>
)

export default function DashboardPage() {
  const summary = useDashboardSummary()

  return (
    <section className="page">
      <header className="page__header">
        <h2 className="page__title">Operations Pulse</h2>
        <p className="page__subtitle">
          Real-time visibility into production, inventory, and working capital health. Data sourced
          from the MCP baseline with automatic mock fallback when offline.
        </p>
        {summary.source === 'mock' ? (
          <p className="page__note">
            Using mock data fallback. Configure MCP endpoint to enable live metrics.
          </p>
        ) : (
          <p className="page__note">Live metrics streamed from MCP service.</p>
        )}
      </header>

      <div className="page__grid page__grid--metrics">
        <MetricCard title="Throughput" metric={summary.data?.metrics?.throughput} />
        <MetricCard title="Forecast Accuracy" metric={summary.data?.metrics?.forecastAccuracy} />
        <MetricCard title="Cash Runway" metric={summary.data?.metrics?.cashRunway} />
        <MetricCard title="Queue Depth" metric={summary.data?.metrics?.queueDepth} />
      </div>

      <section className="page__section">
        <h3>Alerts & Notables</h3>
        <div className="alerts">
          {summary.data?.alerts?.length ? (
            summary.data.alerts.map(alert => <AlertBanner key={alert.id} alert={alert} />)
          ) : (
            <p className="page__muted">No active alerts.</p>
          )}
        </div>
      </section>

      <section className="page__section">
        <h3>Next Steps</h3>
        <ul className="page__list">
          <li>Connect Amazon SP-API and Shopify feeds through the Render-hosted MCP server.</li>
          <li>Surface SSE-backed production events and real integration statuses.</li>
          <li>Promote the shell to `test` and `production` once MCP connectivity is verified.</li>
        </ul>
      </section>
    </section>
  )
}
