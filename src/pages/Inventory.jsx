import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchJson } from '../utils/apiClient.js'

const InventoryPage = () => {
  const levelsQuery = useQuery({
    queryKey: ['inventory', 'levels'],
    queryFn: () => fetchJson('/inventory/levels'),
    staleTime: 60_000,
    refetchInterval: 60_000
  })

  const movementsQuery = useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: () => fetchJson('/inventory/movements'),
    staleTime: 60_000,
    refetchInterval: 120_000
  })

  const isLoading = levelsQuery.isLoading || movementsQuery.isLoading
  const isError = levelsQuery.isError || movementsQuery.isError

  const error = useMemo(() => {
    const queryWithError = [levelsQuery, movementsQuery].find((query) => query.isError)
    return queryWithError?.error ?? null
  }, [levelsQuery, movementsQuery])

  const levels = Array.isArray(levelsQuery.data?.levels) ? levelsQuery.data.levels : []
  const movements = Array.isArray(movementsQuery.data?.movements) ? movementsQuery.data.movements : []

  return (
    <div className="flex min-h-full flex-col gap-8 bg-slate-950 px-6 py-8 text-slate-50">
      <header>
        <p className="text-sm uppercase tracking-widest text-slate-500">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Inventory Control</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Inspect current stock positions and recent movements to keep production schedules aligned with demand.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          Loading inventory data…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
          <p className="font-medium">Unable to load inventory data.</p>
          <p className="mt-1 text-rose-300/80">{error?.message ?? 'An unexpected error occurred.'}</p>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Stock Levels</h2>
                <p className="mt-1 text-sm text-slate-400">Most recent system snapshot.</p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{levels.length} SKUs</span>
            </div>

            <div className="mt-6 overflow-hidden rounded border border-slate-800/60">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {levels.length > 0 ? (
                    levels.map((item) => (
                      <tr key={item.sku} className="odd:bg-slate-900/30">
                        <td className="px-4 py-3 font-medium text-slate-100">{item.sku}</td>
                        <td className="px-4 py-3 text-right text-slate-200">{item.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-3 text-sm text-slate-400" colSpan={2}>
                        No inventory records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent Movements</h2>
                <p className="mt-1 text-sm text-slate-400">Inbound and outbound adjustments.</p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{movements.length} entries</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              {movements.length > 0 ? (
                movements.map((movement, index) => (
                  <li
                    key={`${movement.sku}-${index}`}
                    className="rounded border border-slate-800/60 bg-slate-900/80 px-4 py-3"
                  >
                    <div className="flex items-center justify-between text-slate-200">
                      <span className="font-medium">{movement.sku}</span>
                      <span className={movement.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        {movement.delta >= 0 ? '+' : ''}
                        {movement.delta}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{movement.reason ?? 'unspecified'}</p>
                  </li>
                ))
              ) : (
                <li className="rounded border border-slate-800/60 bg-slate-900/80 px-4 py-3 text-slate-400">
                  No recent movements recorded.
                </li>
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default InventoryPage
