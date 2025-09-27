import { useState, useEffect } from 'react'

import { Alert, AlertDescription, AlertTitle , Badge } from '../components/ui'
import { useAuthRole } from '../features/auth/hooks/useAuthRole'
import { MetricsGrid } from '../features/executive-dashboard/components/MetricsGrid'
import { InventoryHeatmap } from '../features/inventory/components/InventoryHeatmap'
import { ScenarioBuilder } from '../features/what-if/components/ScenarioBuilder'
import { CashFlowChart } from '../features/working-capital/components/CashFlowChart'
import { useSSE } from '../hooks/useSSE'

export default function EnhancedDashboard() {
  const [selectedView, setSelectedView] = useState('overview')
  const [loading, setLoading] = useState(true)

  const { userRole, canAccess } = useAuthRole()

  const { data: sseData, isConnected } = useSSE([
    'metrics-update',
    'alert',
    'production-status'
  ])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const renderConnectionStatus = () => {
    return (
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>
    )
  }

  const renderViewSelector = () => {
    const views = [
      { id: 'overview', label: 'Overview', access: 'dashboard' },
      { id: 'financials', label: 'Financials', access: 'workingCapital' },
      { id: 'inventory', label: 'Inventory', access: 'inventory' },
      { id: 'scenarios', label: 'What-If', access: 'whatIf' }
    ]

    return (
      <div className="flex gap-2">
        {views.map(view => {
          if (!canAccess(view.access)) return null

          return (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {view.label}
            </button>
          )
        })}
      </div>
    )
  }

  const renderContent = () => {
    switch (selectedView) {
      case 'overview':
        return (
          <div className="space-y-6">
            <MetricsGrid loading={loading} />

            {sseData.alert && (
              <Alert variant="warning">
                <AlertTitle>System Alert</AlertTitle>
                <AlertDescription>{sseData.alert.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowChart height={300} />
              {canAccess('inventory') && <InventoryHeatmap />}
            </div>
          </div>
        )

      case 'financials':
        return (
          <div className="space-y-6">
            <CashFlowChart height={500} showForecast={true} />
          </div>
        )

      case 'inventory':
        return (
          <div className="space-y-6">
            <InventoryHeatmap _onCellClick={(sku, _location) => {
              console.log('Clicked:', sku, location)
            }} />
          </div>
        )

      case 'scenarios':
        return (
          <div className="space-y-6">
            <ScenarioBuilder _onScenarioChange={(scenario) => {
              console.log('Scenario changed:', scenario)
            }} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sentia Manufacturing Dashboard
              </h1>
              <Badge variant="info">{userRole}</Badge>
            </div>
            {renderConnectionStatus()}
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {renderViewSelector()}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {renderContent()}
      </div>
    </div>
  )
}