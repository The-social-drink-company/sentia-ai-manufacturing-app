export default function WhatIfPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h2 className="page__title">What-If Analysis</h2>
        <p className="page__subtitle">
          Model demand shifts, supplier risk, and production constraints before committing.
        </p>
      </header>
      <div className="page__grid">
        <article className="page__card">
          <h3>Scenario Workspace</h3>
          <p>
            Iterate on sensitivity sliders and capture AI summary output for each saved scenario.
          </p>
        </article>
        <article className="page__card">
          <h3>Key Metrics</h3>
          <p>Highlight cash runway impact, service level variance, and utilisation changes.</p>
        </article>
        <article className="page__card">
          <h3>Implementation Notes</h3>
          <ul>
            <li>Bring back MCP orchestrations to evaluate scenario feasibility.</li>
            <li>Persist scenario state in PostgreSQL with audit logging.</li>
            <li>Expose approval workflows for managers and directors.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
