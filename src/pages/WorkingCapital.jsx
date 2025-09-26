export default function WorkingCapitalPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h2 className="page__title">Working Capital Control Tower</h2>
        <p className="page__subtitle">
          Track the cash conversion cycle, runway, and mitigation plans across Sentia regions.
        </p>
      </header>
      <div className="page__grid">
        <article className="page__card">
          <h3>Cash Conversion Cycle</h3>
          <p>Placeholder for CCC metrics, AR/AP aging, and inventory turns visualisations.</p>
        </article>
        <article className="page__card">
          <h3>Scenario Planning</h3>
          <p>
            Inject AI-driven scenarios comparing forecast models and capital allocation decisions.
          </p>
        </article>
        <article className="page__card">
          <h3>Follow-up Tasks</h3>
          <ul>
            <li>Reinstate Prisma models for cash forecasts.</li>
            <li>Restore BullMQ jobs that publish liquidity alerts.</li>
            <li>Reconnect finance export pipeline (CSV, JSON).</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
