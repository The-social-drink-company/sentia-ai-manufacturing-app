export default function AdminPage() {
  return (
    <section className="flex flex-col gap-8">
      <header className="max-w-3xl space-y-4">
        <div>
          <h2 className="mb-3 text-[1.75rem] font-semibold text-crystal-pure">Administration & Observability</h2>
          <p className="text-crystal-border/80 leading-relaxed">
            Manage environments, feature flags, integrations, and audit evidence from a single
            workspace.
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Environment Health</h3>
          <p className="text-crystal-light/80">
            Surface Render deployment status for development, test, and production branches.
          </p>
        </article>
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Security & Access</h3>
          <p className="text-crystal-light/80">
            List Clerk roles, recent logins, and pending approval workflows.
          </p>
        </article>
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Action Items</h3>
          <ul className="list-disc space-y-2 pl-5 text-crystal-light/80">
            <li>Re-enable audit logging sinks.</li>
            <li>Hook SLO metrics into monitoring dashboards.</li>
            <li>Restore automated deployment verification scripts.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
