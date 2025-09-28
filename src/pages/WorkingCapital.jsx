import { useState, useMemo } from 'react'
import {
  ArrowPathIcon,
  BanknotesIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useWorkingCapitalData } from '../hooks/useWorkingCapitalData'

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return '--'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined) {
    return '--'
  }

  return Number(value).toFixed(digits)
}

function TrendBadge({ value }) {
  if (value === null || value === undefined) {
    return null
  }

  const isPositive = value >= 0

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPositive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-rose-100 text-rose-700'
      }`}
    >
      {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function SummaryCard({ title, value, change, icon: Icon, description }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className="rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <TrendBadge value={change} />
        {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
    </div>
  )
}

function AlertPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className={`flex items-start gap-3 rounded-lg border p-4 shadow-sm ${
            alert.severity === 'critical'
              ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/40'
              : alert.severity === 'warning'
              ? 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/40'
              : 'border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/40'
          }`}
        >
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{alert.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{alert.description}</p>
            {alert.action && (
              <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-300">{alert.action}</p>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}

function DataBlock({ label, value, help }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {help && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{help}</p>}
    </div>
  )
}

function CashFlowTable({ insight }) {
  if (!insight || insight.series.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        No cash flow entries are available for the selected period.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Date</th>
              <th scope="col" className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Operating</th>
              <th scope="col" className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Investing</th>
              <th scope="col" className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Financing</th>
              <th scope="col" className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {insight.series.slice(-30).map((row) => (
              <tr key={row.date}>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                  {new Date(row.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(row.operating)}</td>
                <td className="px-4 py-2 text-right text-amber-600 dark:text-amber-400">{formatCurrency(row.investing)}</td>
                <td className="px-4 py-2 text-right text-blue-600 dark:text-blue-400">{formatCurrency(row.financing)}</td>
                <td
                  className={`px-4 py-2 text-right ${
                    row.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(row.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const PERIOD_OPTIONS = [
  { value: 'current', label: 'Current snapshot' },
  { value: 'mtd', label: 'Month to date' },
  { value: 'qtd', label: 'Quarter to date' },
  { value: 'ytd', label: 'Year to date' },
]

export default function WorkingCapitalPage() {
  const [period, setPeriod] = useState('current')
  const { loading, error, data, refetch } = useWorkingCapitalData(period)

  const totals = useMemo(() => {
    if (!data?.cashFlow?.totals) {
      return null
    }

    return {
      operating: data.cashFlow.totals.operating,
      investing: data.cashFlow.totals.investing,
      financing: data.cashFlow.totals.financing,
      net: data.cashFlow.totals.net,
    }
  }, [data])

  return (
    <div className="min-h-screen bg-slate-100 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Working Capital Command Centre</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Real-time visibility across cash conversion, liquidity runway, and cash flow operations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={refetch}
                className="inline-flex items-center gap-2 rounded-md border border-blue-500 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-400/10"
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
          {data?.dataSource && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Data sources: working capital ({data.dataSource.workingCapital}), cash flow ({data.dataSource.cashFlow}).
            </div>
          )}
        </header>

        {loading && (
          <div className="mt-12 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ArrowPathIcon className="mx-auto h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Loading live working capital metrics…</p>
          </div>
        )}

        {error && (
          <div className="mt-12 rounded-lg border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/40">
            <h2 className="text-base font-semibold text-rose-700 dark:text-rose-300">Unable to load working capital data</h2>
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{error.message}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="mt-10 space-y-10">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liquidity headline metrics</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Comparison vs previous period where available.</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Working capital"
                  value={formatCurrency(data.summary?.workingCapital)}
                  change={data.summary?.workingCapitalChange}
                  icon={BanknotesIcon}
                />
                <SummaryCard
                  title="Cash conversion cycle"
                  value={data.summary?.cashConversionCycle !== null ? `${Math.round(data.summary.cashConversionCycle)} days` : '--'}
                  change={data.summary?.cccChange}
                  icon={ChartPieIcon}
                  description="DSO + DIO – DPO"
                />
                <SummaryCard
                  title="Current ratio"
                  value={formatNumber(data.summary?.currentRatio, 2)}
                  change={data.summary?.currentRatioChange}
                  icon={ArrowTrendingUpIcon}
                />
                <SummaryCard
                  title="Quick ratio"
                  value={formatNumber(data.summary?.quickRatio, 2)}
                  change={data.summary?.quickRatioChange}
                  icon={ArrowTrendingDownIcon}
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Active alerts</h3>
                <AlertPanel alerts={data.alerts} />
                {(!data.alerts || data.alerts.length === 0) && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    No material risk indicators detected for the selected period.
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                <DataBlock
                  label="Accounts receivable"
                  value={formatCurrency(data.receivables.total)}
                  help={data.receivables.dso ? `DSO ${Math.round(data.receivables.dso)} days` : undefined}
                />
                <DataBlock
                  label="Accounts payable"
                  value={formatCurrency(data.payables.total)}
                  help={data.payables.dpo ? `DPO ${Math.round(data.payables.dpo)} days` : undefined}
                />
                <DataBlock
                  label="Inventory on hand"
                  value={formatCurrency(data.inventory.total)}
                  help={data.inventory.dio ? `DIO ${Math.round(data.inventory.dio)} days` : undefined}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cash flow history</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Detailed operating, investing, and financing movements.</p>
                </div>
                {totals && (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Operating {formatCurrency(totals.operating)}</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">Investing {formatCurrency(totals.investing)}</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">Financing {formatCurrency(totals.financing)}</span>
                    <span
                      className={`font-semibold ${
                        totals.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      Net {formatCurrency(totals.net)}
                    </span>
                  </div>
                )}
              </div>
              <CashFlowTable insight={data.cashFlow} />
            </section>

            <section>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Working capital ledger</h3>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Date</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Current assets</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Current liabilities</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Working capital</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">CCC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.history.slice(0, 12).map((entry) => {
                        const workingCapital = (entry.currentAssets ?? 0) - (entry.currentLiabilities ?? 0)
                        return (
                          <tr key={entry.id}>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-200">{formatCurrency(entry.currentAssets ?? null)}</td>
                            <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-200">{formatCurrency(entry.currentLiabilities ?? null)}</td>
                            <td className="px-4 py-2 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(workingCapital)}</td>
                            <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">
                              {entry.cashConversionCycle !== null && entry.cashConversionCycle !== undefined
                                ? `${Math.round(entry.cashConversionCycle)} days`
                                : '--'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
