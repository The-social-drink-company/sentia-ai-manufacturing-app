import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchJson } from '../utils/apiClient.js'

const mapTrends = (trends) => {
  if (!trends || typeof trends !== 'object') {
    return []
  }

  return Object.entries(trends).map(([period, status]) => ({
    id: period,
    label: period.charAt(0).toUpperCase() + period.slice(1),
    status
  }))
}

const WorkingCapitalPage = () => {
  const overviewQuery = useQuery({
    queryKey: ['working-capital', 'overview'],
    queryFn: () => fetchJson('/working-capital/overview'),
    staleTime: 60_000,
    refetchInterval: 60_000
  })

  const runwayQuery = useQuery({
    queryKey: ['working-capital', 'cash-runway'],
    queryFn: () => fetchJson('/working-capital/cash-runway'),
    staleTime: 60_000,
    refetchInterval: 60_000
  })

  const benchmarksQuery = useQuery({
    queryKey: ['working-capital', 'benchmarks'],
    queryFn: () => fetchJson('/working-capital/benchmarks'),
    staleTime: 60_000,
    refetchInterval: 300_000
  })

  const fundingQuery = useQuery({
    queryKey: ['working-capital', 'funding-scenarios'],
    queryFn: () => fetchJson('/working-capital/funding-scenarios'),
    staleTime: 60_000,
    refetchInterval: 300_000
  })

  const isLoading = overviewQuery.isLoading || runwayQuery.isLoading || benchmarksQuery.isLoading || fundingQuery.isLoading
  const isError = overviewQuery.isError || runwayQuery.isError || benchmarksQuery.isError || fundingQuery.isError

  const error = useMemo(() => {
    const queryWithError = [overviewQuery, runwayQuery, benchmarksQuery, fundingQuery].find((query) => query.isError)
    return queryWithError?.error ?? null
  }, [overviewQuery, runwayQuery, benchmarksQuery, fundingQuery])

  const overview = overviewQuery.data ?? {}
  const runway = runwayQuery.data ?? {}
  const benchmarks = benchmarksQuery.data ?? {}
  const funding = Array.isArray(fundingQuery.data?.scenarios) ? fundingQuery.data.scenarios : []

  const trends = useMemo(() => mapTrends(overview.trends), [overview.trends])

  return (
    <div className="flex min-h-full flex-col gap-8 bg-slate-950 px-6 py-8 text-slate-50">
      <header>
        <p className="text-sm uppercase tracking-widest text-slate-500">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Working Capital Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Monitor liquidity posture, cash runway, and benchmark alignment. Data refreshes automatically when new metrics arrive.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          Loading working capital insights…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
          <p className="font-medium">Unable to load working capital data.</p>
          <p className="mt-1 text-rose-300/80">{error?.message ?? 'An unexpected error occurred.'}</p>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Liquidity Position</h2>
            <p className="mt-1 text-sm text-slate-400">Snapshot from financial controllers</p>

            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Liquidity Score</dt>
                <dd className="text-2xl font-semibold text-emerald-400">{overview.liquidityScore ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Runway Days</dt>
                <dd className="text-2xl font-semibold text-white">{overview.runwayDays ?? '—'}</dd>
              </div>
            </dl>

            {trends.length > 0 ? (
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                {trends.map((trend) => (
                  <li key={trend.id} className="flex items-center justify-between rounded border border-slate-800/60 bg-slate-900/80 px-3 py-2">
                    <span className="text-slate-400">{trend.label}</span>
                    <span className="font-medium text-white">{String(trend.status)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Cash Runway</h2>
            <p className="mt-1 text-sm text-slate-400">Forecast based on treasury assumptions.</p>

            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Runway Months</dt>
                <dd className="text-2xl font-semibold text-amber-300">{runway.runwayMonths ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Scenario</dt>
                <dd className="text-lg font-medium text-white">{runway.scenario ?? '—'}</dd>
              </div>
            </dl>

            {Array.isArray(runway.highlights) && runway.highlights.length > 0 ? (
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                {runway.highlights.map((highlight, index) => (
                  <li key={index} className="rounded border border-slate-800/60 bg-slate-900/80 px-3 py-2">
                    {highlight}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Benchmark Alignment</h2>
            <p className="mt-1 text-sm text-slate-400">Compare with sector peers.</p>

            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Industry</dt>
                <dd className="text-lg font-medium text-white">{benchmarks.industry ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Percentile</dt>
                <dd className="text-2xl font-semibold text-sky-300">{benchmarks.percentile ?? '—'}</dd>
              </div>
            </dl>

            {funding.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-slate-500">Funding Scenarios</p>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                  {funding.map((scenario) => (
                    <li key={scenario} className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200">
                      {scenario}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default WorkingCapitalPage
