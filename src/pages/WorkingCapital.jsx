import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

const parsePayload = (payload) => {
  if (payload && typeof payload === 'object') {
    if (payload.data) {
      return payload.data
    }

    if (payload.result) {
      return payload.result
    }
  }

  return payload
}

const apiGet = async (endpoint) => {
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const payload = await response.json()
  return parsePayload(payload)
}

const apiPost = async (endpoint, body) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => 'Unable to submit request')
    throw new Error(detail)
  }

  const payload = await response.json()
  return parsePayload(payload)
}

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/60 px-4 py-3">
    <p className="text-sm text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-white">{value ?? 'N/A'}</p>
  </div>
)

const WorkingCapitalPage = () => {
  const queryClient = useQueryClient()
  const [strategy, setStrategy] = useState('stabilise')

  const overviewQuery = useQuery({
    queryKey: ['working-capital', 'overview'],
    queryFn: () => apiGet('/api/working-capital/overview'),
    refetchInterval: 120_000
  })

  const runwayQuery = useQuery({
    queryKey: ['working-capital', 'cash-runway'],
    queryFn: () => apiGet('/api/working-capital/cash-runway'),
    refetchInterval: 180_000
  })

  const benchmarksQuery = useQuery({
    queryKey: ['working-capital', 'benchmarks'],
    queryFn: () => apiGet('/api/working-capital/benchmarks'),
    refetchInterval: 300_000
  })

  const scenariosQuery = useQuery({
    queryKey: ['working-capital', 'funding-scenarios'],
    queryFn: () => apiGet('/api/working-capital/funding-scenarios'),
    refetchInterval: 300_000
  })

  const optimizeMutation = useMutation({
    mutationFn: (selectedStrategy) => apiPost('/api/working-capital/optimize', { strategy: selectedStrategy }),
    onSuccess: (data) => {
      toast.success(data?.recommendation || data?.message || 'Optimisation queued')
      queryClient.invalidateQueries({ queryKey: ['working-capital'] })
    },
    onError: (error) => {
      toast.error(error.message || 'Optimisation request failed')
    }
  })

  const overview = overviewQuery.data ?? {}
  const runway = runwayQuery.data ?? {}
  const benchmarks = benchmarksQuery.data ?? {}
  const scenarios = scenariosQuery.data ?? {}

  const workingCapitalSummary = useMemo(
    () => ({
      liquidityScore: overview.liquidityScore ?? null,
      runwayDays: overview.runwayDays ?? null,
      trend: overview.trends?.weekly ?? overview.trend ?? null,
      runwayMonths: runway.runwayMonths ?? null,
      runwayScenario: runway.scenario ?? 'base'
    }),
    [overview, runway]
  )

  const handleOptimize = useCallback(
    (event) => {
      event.preventDefault()
      optimizeMutation.mutate(strategy)
    },
    [optimizeMutation, strategy]
  )

  const isLoading = overviewQuery.isLoading || runwayQuery.isLoading

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Financial Intelligence</p>
          <h1 className="text-3xl font-semibold text-white">Working Capital Control Center</h1>
          <p className="text-sm text-slate-400">
            Monitor liquidity, model funding paths, and queue optimisation recommendations without leaving the dashboard.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">Liquidity score</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {isLoading ? '-' : workingCapitalSummary.liquidityScore ?? 'Not reported'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Composite working capital health indicator.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cash runway</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {isLoading ? '-' : workingCapitalSummary.runwayDays ? `${workingCapitalSummary.runwayDays} days` : 'Not reported'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Scenario: {workingCapitalSummary.runwayScenario}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">Funding plan</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {scenarios?.scenarios?.length ? `${scenarios.scenarios.length} scenarios` : 'Define strategies'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Funding mix options queued for evaluation.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">Benchmark percentile</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {benchmarks.percentile ? `${benchmarks.percentile}th` : 'Pending'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Industry: {benchmarks.industry || 'Manufacturing'}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Optimisation workspace</h2>
              <span className="text-xs text-slate-500">Auto-refresh every 2 min</span>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleOptimize}>
              <label className="block text-sm font-medium text-slate-200">
                Select optimisation strategy
                <select
                  value={strategy}
                  onChange={(event) => setStrategy(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="stabilise">Stabilise: reduce DSO and tighten cash conversion</option>
                  <option value="accelerate">Accelerate: support expansion with hybrid funding</option>
                  <option value="conserve">Conserve: extend runway and defer capex</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={optimizeMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {optimizeMutation.isPending ? 'Submitting...' : 'Queue optimisation insight'}
              </button>
              {optimizeMutation.isError ? (
                <p className="text-sm text-rose-300">{optimizeMutation.error.message}</p>
              ) : null}
            </form>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <InfoRow label="Last recommendation" value={optimizeMutation.data?.recommendation || 'Awaiting submission'} />
              <InfoRow
                label="Estimated turnaround"
                value={optimizeMutation.data?.etaMinutes ? `${optimizeMutation.data.etaMinutes} minutes` : '5 minutes'}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <h2 className="text-lg font-semibold text-white">Benchmark telemetry</h2>
            <div className="mt-4 space-y-3">
              <InfoRow label="Industry" value={benchmarks.industry || 'Manufacturing'} />
              <InfoRow label="Percentile" value={benchmarks.percentile ? `${benchmarks.percentile}th` : 'Pending'} />
              <InfoRow label="Runway scenario" value={workingCapitalSummary.runwayScenario} />
              <InfoRow label="Trend" value={workingCapitalSummary.trend || 'Stable'} />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Funding scenarios</h2>
            <button
              type="button"
              onClick={() => scenariosQuery.refetch()}
              className="text-xs text-emerald-300 transition hover:text-emerald-200"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(scenarios.scenarios || []).length ? (
              scenarios.scenarios.map((option) => (
                <div key={option} className="rounded-xl border border-slate-800/70 bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-white capitalize">{option}</p>
                  <p className="mt-2 text-xs text-slate-400">Queue optimisation to evaluate this scenario.</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No funding scenarios returned from the service.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default WorkingCapitalPage
