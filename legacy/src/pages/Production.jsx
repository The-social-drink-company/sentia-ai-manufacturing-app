import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
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
    throw new Error(Request failed with status )
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

const ProductionPage = () => {
  const metricsQuery = useQuery({
    queryKey: ['production', 'metrics'],
    queryFn: () => apiGet('/api/production/metrics'),
    refetchInterval: 60_000
  })

  const jobsQuery = useQuery({
    queryKey: ['production', 'jobs'],
    queryFn: () => apiGet('/api/production/jobs'),
    refetchInterval: 60_000
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => apiPost('/api/production/update', payload),
    onSuccess: (data) => {
      toast.success(data?.message || 'Production job update queued')
      jobsQuery.refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to update production job')
    }
  })

  const metrics = useMemo(() => metricsQuery.data || {}, [metricsQuery.data])
  const jobs = useMemo(() => jobsQuery.data?.jobs || [], [jobsQuery.data])

  const handleAdvanceJob = (job) => {
    updateMutation.mutate({ jobId: job.id, status: 'completed' })
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Production Intelligence</p>
          <h1 className="text-3xl font-semibold text-white">Manufacturing Performance Center</h1>
          <p className="text-sm text-slate-400">Monitor throughput, keep downtime in check, and progress jobs in real time.</p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">Throughput</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {metricsQuery.isLoading ? '—' : metrics.throughput ? ${metrics.throughput}% : 'Not reported'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Units completed per production window.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">Downtime</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {metricsQuery.isLoading ? '—' : metrics.downtimeMinutes ? ${metrics.downtimeMinutes} min : 'Stable'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Total planned + unplanned interruptions.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">Utilisation</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {metrics.utilisation ? ${metrics.utilisation}% : 'Awaiting data'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Calculated from live telemetry feed.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <p className="text-xs uppercase tracking-wide text-slate-500">On-time shipments</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {metrics.onTimeShipments ? ${Math.round(metrics.onTimeShipments * 100)}% : 'Awaiting data'}
            </p>
            <p className="mt-2 text-xs text-slate-500">Orders delivered inside SLA this period.</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active production jobs</h2>
            <button
              type="button"
              onClick={() => jobsQuery.refetch()}
              className="text-xs text-amber-300 transition hover:text-amber-200"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {jobs.length ? (
              jobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <div>
                      <p className="font-semibold text-white">{job.id}</p>
                      <p className="text-xs text-slate-400">Status: {job.status || 'unknown'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">Priority {job.priority || 'standard'}</span>
                      <button
                        type="button"
                        onClick={() => handleAdvanceJob(job)}
                        disabled={updateMutation.isPending}
                        className="rounded-md bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {updateMutation.isPending ? 'Queuing…' : 'Mark complete'}
                      </button>
                    </div>
                  </div>
                  {job.note ? <p className="mt-2 text-xs text-slate-400">{job.note}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                {jobsQuery.isLoading ? 'Loading production jobs…' : 'No active jobs reported.'}
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow text-sm text-slate-300">
          <h2 className="text-lg font-semibold text-white">Operational guidance</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5 text-slate-400">
            <li>Use the optimisation queue only when capacity planning approves the change.</li>
            <li>Completed jobs automatically notify the logistics team for fulfilment.</li>
            <li>Downtime spikes trigger anomaly alerts routed to the maintenance inbox.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}

export default ProductionPage