import { useIntegrationStatus } from '@/hooks/useIntegrationStatus'
import ShopifySetupPrompt from '@/components/integrations/ShopifySetupPrompt'
import UnleashedSetupPrompt from '@/components/integrations/UnleashedSetupPrompt'
import { DashboardSkeleton } from '@/components/ui/skeletons/DashboardSkeleton'

const InventoryDashboard = () => {
  const integrations = useIntegrationStatus()

  // Show setup prompts when integrations are not configured
  const showShopifySetup =
    integrations.shopify &&
    (!integrations.shopify.connected ||
      integrations.shopify.activeStores < integrations.shopify.totalStores)
  const showUnleashedSetup = integrations.unleashed && integrations.unleashed.status !== 'connected'

  // Show loading skeleton while integration status is loading
  if (integrations.loading) {
    return <DashboardSkeleton title="Inventory Management" subtitle="Loading inventory data..." />
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">
          Real-time inventory tracking and optimization
        </p>
      </header>

      {/* Shopify Setup Prompt */}
      {showShopifySetup && <ShopifySetupPrompt shopifyStatus={integrations.shopify} />}

      {/* Unleashed ERP Setup Prompt */}
      {showUnleashedSetup && <UnleashedSetupPrompt unleashedStatus={integrations.unleashed} />}

      {/* Placeholder for inventory metrics */}
      {!showShopifySetup && !showUnleashedSetup && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Inventory metrics will display here once data integrations are connected.
        </div>
      )}
    </div>
  )
}

export default InventoryDashboard
