const SettingsPage = () => (
  <main className="min-h-screen bg-slate-100 p-8">
    <div className="mx-auto w-full max-w-3xl space-y-8 rounded-xl bg-white p-8 shadow">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Workspace settings</h1>
        <p className="text-sm text-slate-500">Manage alert thresholds, integrations, and shared dashboards.</p>
      </header>
      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Weekly executive summary</p>
            <p className="text-xs text-slate-500">Email a PDF digest to leadership every Monday.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Enabled</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Real-time anomaly alerts</p>
            <p className="text-xs text-slate-500">Notify the operations team when production dips beyond tolerance.</p>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Coming soon</span>
        </div>
      </section>
    </div>
  </main>
)

export default SettingsPage
