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

const InventoryModule = () => {
  const levelsQuery = useQuery({
    queryKey: ['inventory', 'levels'],
    queryFn: () => apiGet('/api/inventory/levels'),
    refetchInterval: 90_000
  })

  const movementsQuery = useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: () => apiGet('/api/inventory/movements'),
    refetchInterval: 90_000
  })

  const optimizeMutation = useMutation({
    mutationFn: (objectives) => apiPost('/api/inventory/optimize', { objectives }),
    onSuccess: (payload) => {
      toast.success(payload?.message || 'Inventory optimisation queued')
    },
    onError: (error) => {
      toast.error(error.message || 'Optimisation failed')
    }
  })

  const inventoryLevels = useMemo(() => levelsQuery.data?.levels || [], [levelsQuery.data])
  const inventoryMovements = useMemo(() => movementsQuery.data?.movements || [], [movementsQuery.data])

  const handleOptimise = () => {
    const objectives = ['reduce-stockouts', 'minimise-carrying-costs', 'prioritise-fast-movers']
    optimizeMutation.mutate(objectives)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Operations Intelligence</p>
          <h1 className="text-3xl font-semibold text-white">Inventory Control Hub</h1>
          <p className="text-sm text-slate-400">Track stock health, monitor recent movements, and launch optimisation runs.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Current stock levels</h2>
              <button
                type="button"
                onClick={() => levelsQuery.refetch()}
                className="text-xs text-cyan-300 transition hover:text-cyan-200"
              >
                Refresh
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/70">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {inventoryLevels.length ? (
                    inventoryLevels.map((item) => {
                      const status = item.quantity <= (item.reorderPoint ?? 50) ? 'Reorder' : 'Healthy'
                      return (
                        <tr key={item.sku || item.id} className="hover:bg-slate-900/60">
                          <td className="px-4 py-3 font-medium text-white">{item.sku || item.id}</td>
                          <td className="px-4 py-3 text-right text-slate-100">
                            {typeof item.quantity === 'number' ? item.quantity.toLocaleString('en-GB') : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400">{status}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                        {levelsQuery.isLoading ? 'Loading inventory levels...' : 'No inventory data returned.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <h2 className="text-lg font-semibold text-white">Optimisation toolkit</h2>
            <p className="mt-2 text-xs text-slate-400">
              Queue a balanced optimisation run targeting the most common manufacturing objectives.
            </p>
            <button
              type="button"
              onClick={handleOptimise}
              disabled={optimizeMutation.isPending}
              className="mt-5 w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {optimizeMutation.isPending ? 'Submitting...' : 'Queue optimisation run'}
            </button>
            {optimizeMutation.isError ? (
              <p className="mt-3 text-xs text-rose-300">{optimizeMutation.error.message}</p>
            ) : null}
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <p className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2">
                <span>Objectives used</span>
                <span>Reduce stockouts · Minimise carrying costs · Prioritise fast movers</span>
              </p>
              <p className="rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                Optimisation runs request insights from the manufacturing control plane and surface recommendations in the inbox.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent movements</h2>
            <button
              type="button"
              onClick={() => movementsQuery.refetch()}
              className="text-xs text-cyan-300 transition hover:text-cyan-200"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {inventoryMovements.length ? (
              inventoryMovements.map((movement, index) => (
                <div
                  key={`${movement.sku || movement.id || 'movement'}-${index}`}
                  className="rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="font-semibold">{movement.sku || movement.id}</span>
                    <span className={movement.delta < 0 ? 'text-rose-300' : 'text-emerald-300'}>
                      {movement.delta > 0 ? '+' : ''}
                      {movement.delta ?? 0}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Reason: {movement.reason || 'Not specified'}</p>
                  {movement.timestamp ? (
                    <p className="mt-1 text-xs text-slate-500">{new Date(movement.timestamp).toLocaleString('en-GB')}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                {movementsQuery.isLoading ? 'Loading movement history...' : 'No recent inventory movements returned.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default InventoryModule
