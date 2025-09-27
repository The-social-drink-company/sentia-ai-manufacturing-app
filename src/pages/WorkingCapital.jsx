export default function WorkingCapitalPage() {
  return (
    <section className="flex flex-col gap-8">
      <header className="max-w-3xl space-y-4">
        <div>
          <h2 className="mb-3 text-[1.75rem] font-semibold text-crystal-pure">Working Capital Control Tower</h2>
          <p className="text-crystal-border/80 leading-relaxed">
            Track the cash conversion cycle, runway, and mitigation plans across Sentia regions.
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Cash Conversion Cycle</h3>
          <p className="text-crystal-light/80">
            Placeholder for CCC metrics, AR/AP aging, and inventory turns visualisations.
          </p>
        </article>
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Scenario Planning</h3>
          <p className="text-crystal-light/80">
            Inject AI-driven scenarios comparing forecast models and capital allocation decisions.
          </p>
        </article>
        <article className="grid gap-3 rounded-2xl border border-crystal-border/15 bg-quantum-overlay/60 p-6 shadow-glow-blue">
          <h3 className="text-lg font-semibold text-crystal-pure">Follow-up Tasks</h3>
          <ul className="list-disc space-y-2 pl-5 text-crystal-light/80">
            <li>Reinstate Prisma models for cash forecasts.</li>
            <li>Restore BullMQ jobs that publish liquidity alerts.</li>
            <li>Reconnect finance export pipeline (CSV, JSON).</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
