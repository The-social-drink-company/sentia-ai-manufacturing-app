import { BeakerIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const summaryMetrics = [
  { label: 'Pass rate', value: '96.2%', helper: 'Target ≥ 95%' },
  { label: 'Defect rate', value: '2.8%', helper: 'YTD 3.1%' },
  { label: 'Scrap rate', value: '1.1%', helper: 'Includes rework' },
  { label: 'Critical issues', value: '2', helper: 'Open CAPAs' }
]

const productBreakdown = [
  { product: 'Sentia Red 500ml', inspected: 456, passRate: '96.3%', defects: 12 },
  { product: 'Sentia Gold 500ml', inspected: 328, passRate: '95.1%', defects: 9 },
  { product: 'Sentia White 500ml', inspected: 234, passRate: '95.3%', defects: 8 }
]

const defectCategories = [
  { category: 'Labeling issues', percentage: 28.1, severity: 'Minor' },
  { category: 'Fill variance', percentage: 21.9, severity: 'Major' },
  { category: 'Cap alignment', percentage: 18.8, severity: 'Minor' },
  { category: 'Package integrity', percentage: 12.5, severity: 'Critical' }
]

const Quality = () => {
  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Quality Assurance Overview</h1>
          <p className="text-sm text-muted-foreground">
            Snapshot of current inspection performance and open issues across production lines.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          <CheckCircleIcon className="h-4 w-4" />
          All inspection cells online
        </span>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top inspection lines</h2>
            <span className="text-xs text-muted-foreground">Rolling 7 days</span>
          </header>
          <table className="w-full table-auto text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-2">Product</th>
                <th className="pb-2">Inspected</th>
                <th className="pb-2">Pass rate</th>
                <th className="pb-2">Defects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productBreakdown.map((item) => (
                <tr key={item.product}>
                  <td className="py-2 font-medium">{item.product}</td>
                  <td className="py-2">{item.inspected.toLocaleString()}</td>
                  <td className="py-2">{item.passRate}</td>
                  <td className="py-2">{item.defects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <header className="mb-4 flex items-center gap-2">
            <BeakerIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Defect categories</h2>
          </header>
          <ul className="space-y-3 text-sm">
            {defectCategories.map((entry) => (
              <li key={entry.category} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div>
                  <p className="font-medium">{entry.category}</p>
                  <p className="text-xs text-muted-foreground">Severity: {entry.severity}</p>
                </div>
                <span className="text-sm font-semibold">{entry.percentage}%</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <header className="mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Open corrective actions</h2>
        </header>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
            Packaging integrity audit scheduled for 09:00 tomorrow
          </li>
          <li className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
            Labeling line calibration pending confirmation
          </li>
        </ul>
      </section>
    </div>
  )
}

export default Quality
