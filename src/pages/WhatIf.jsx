export default function WhatIfPage() {
  return (
    <section className="flex flex-col gap-8">
      <header className="max-w-3xl space-y-4">
        <div>
          <h2 className="mb-3 text-[1.75rem] font-semibold text-crystal-pure">What-If Analysis</h2>
          <p className="text-crystal-border/80 leading-relaxed">
            Model demand shifts, supplier risk, and production constraints before committing.
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Scenario Workspace</h3>
          <p className="text-crystal-light/80">
            Iterate on sensitivity sliders and capture AI summary output for each saved scenario.
          </p>
        </article>
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Key Metrics</h3>
          <p className="text-crystal-light/80">
            Highlight cash runway impact, service level variance, and utilisation changes.
          </p>
        </article>
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Implementation Notes</h3>
          <ul className="list-disc space-y-2 pl-5 text-crystal-light/80">
            <li>Bring back MCP orchestrations to evaluate scenario feasibility.</li>
            <li>Persist scenario state in PostgreSQL with audit logging.</li>
            <li>Expose approval workflows for managers and directors.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
