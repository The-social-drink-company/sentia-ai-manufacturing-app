const mockKpis = [
  { label: 'Overall Equipment Effectiveness', value: '92.4%', change: '+1.3%' },
  { label: 'Working Capital', value: '$15.4M', change: '+$0.6M' },
  { label: 'On-time Orders', value: '97.1%', change: '+0.4%' }
]

const mockActivities = [
  { time: '08:12', message: 'Packaging line A restarted after maintenance window' },
  { time: '07:48', message: 'New AI insight: inventory coverage projected to dip below 14 days' },
  { time: '07:02', message: 'Western facility reported real-time efficiency gain of 2.1%' }
]

const DashboardPage = () => (
  <main className="min-h-screen bg-slate-950 p-8 text-slate-50">
    <header className="mb-10 flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Operations overview</h1>
      <p className="text-sm text-slate-400">Latest production metrics, financial posture, and AI recommendations.</p>
    </header>

    <section className="grid gap-6 lg:grid-cols-3">
      {mockKpis.map((kpi) => (
        <article key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
          <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
          <p className="mt-3 text-2xl font-semibold">{kpi.value}</p>
          <p className="mt-1 text-xs text-emerald-400">{kpi.change} vs. last week</p>
        </article>
      ))}
    </section>

    <section className="mt-10 grid gap-6 lg:grid-cols-2">
      <article className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
        <h2 className="text-sm font-semibold text-slate-200">AI highlights</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-400">
          <li>Forecast suggests cash conversion cycle improves by 3.2 days if receivables automation stays on track.</li>
          <li>Inventory levels remain balanced; reorder threshold for fasteners due within 5 days.</li>
          <li>Predictive maintenance flagged kiln #3 for inspection during tonight's second shift.</li>
        </ul>
      </article>
      <article className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
        <h2 className="text-sm font-semibold text-slate-200">Activity log</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          {mockActivities.map((item) => (
            <li key={item.time} className="flex items-baseline gap-3">
              <span className="text-xs font-mono text-slate-500">{item.time}</span>
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  </main>
)

export default DashboardPage