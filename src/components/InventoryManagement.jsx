import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus'
import AmazonSetupPrompt from '@/components/integrations/AmazonSetupPrompt'
import UnleashedSetupPrompt from '@/components/integrations/UnleashedSetupPrompt'
import { KPIStripSkeleton, TableSkeleton } from '@/components/skeletons'

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-GB')

const InventoryManagement = () => {
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check integration status for inventory-related services
  const { amazon: amazonStatus, unleashed: unleashedStatus, loading: integrationLoading } = useIntegrationStatus()

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(apiBase + '/inventory/current')
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}))
          throw new Error(detail?.error || 'Request failed with status ' + response.status)
        }

        const data = await response.json()
        setInventory(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [apiBase])

  const lowStockItems = useMemo(() => {
    if (!inventory?.items) return []
    return inventory.items
      .filter(item => Number(item.quantity ?? 0) <= Number(item.reorderPoint ?? 0))
      .sort((a, b) => Number(a.quantity ?? 0) - Number(b.quantity ?? 0))
      .slice(0, 5)
  }, [inventory])

  // Show setup prompts if integrations are not connected
  const showAmazonPrompt = !integrationLoading && amazonStatus && amazonStatus.status !== 'connected'
  const showUnleashedPrompt = !integrationLoading && unleashedStatus && unleashedStatus.status !== 'connected'

  if (showAmazonPrompt || showUnleashedPrompt) {
    return (
      <div className="space-y-6">
        {showAmazonPrompt && <AmazonSetupPrompt amazonStatus={amazonStatus} />}
        {showUnleashedPrompt && <UnleashedSetupPrompt unleashedStatus={unleashedStatus} />}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary KPIs Skeleton (BMAD-UI-002) */}
        <KPIStripSkeleton count={4} />

        {/* Low Stock Alerts Table Skeleton (BMAD-UI-002) */}
        <TableSkeleton rows={5} columns={3} showHeader={true} />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Inventory data unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!inventory) {
    return null
  }

  const summary = inventory.summary || {}
  const items = inventory.items || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Inventory Value"
          value={currencyFormatter.format(summary.totalValue || 0)}
          helper="Across all SKUs"
        />
        <SummaryCard
          title="Low Stock Items"
          value={numberFormatter.format(summary.lowStock || 0)}
          helper="Below reorder point"
        />
        <SummaryCard
          title="Out of Stock"
          value={numberFormatter.format(summary.outOfStock || 0)}
          helper="Requires replenishment"
        />
        <SummaryCard
          title="Active SKUs"
          value={numberFormatter.format(summary.totalSKUs || 0)}
          helper="Tracked in database"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-500">No low stock alerts at this time.</p>
          ) : (
            <ul className="space-y-3">
              {lowStockItems.map(item => (
                <li
                  key={item.id || item.sku}
                  className="p-3 bg-amber-50 border border-amber-100 rounded-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800">{item.sku || item.name}</p>
                      <p className="text-xs text-amber-700">
                        Available:{' '}
                        {numberFormatter.format(
                          Number(item.quantity ?? item.availableQuantity ?? 0)
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-amber-700">
                      Reorder Point: {numberFormatter.format(Number(item.reorderPoint ?? 0))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CubeIcon className="w-5 h-5" />
            Inventory Details
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Value</th>
                <th className="px-4 py-2 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.slice(0, 20).map(item => (
                <tr key={item.id || item.sku}>
                  <td className="px-4 py-2 font-medium text-slate-700">{item.sku || 'N/A'}</td>
                  <td className="px-4 py-2 text-slate-500">{item.location || 'Unassigned'}</td>
                  <td className="px-4 py-2 text-right">
                    {numberFormatter.format(Number(item.quantity ?? item.totalQuantity ?? 0))}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {currencyFormatter.format(Number(item.value ?? item.totalValue ?? 0))}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-500">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length > 20 && (
            <p className="mt-3 text-xs text-slate-500">Showing first 20 items</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const SummaryCard = ({ title, value, helper }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-slate-500">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
    </CardContent>
  </Card>
)

export default InventoryManagement
