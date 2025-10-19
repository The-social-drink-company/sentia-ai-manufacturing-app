import { ExclamationCircleIcon, ArrowRightIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

/**
 * Shopify Setup Prompt Component
 *
 * Displays setup instructions when Shopify is not configured
 * Shows store connection status for UK/EU and USA stores
 * Provides links to documentation and Shopify Admin
 *
 * @param {Object} shopifyStatus - Status object from Shopify getConnectionStatus()
 * @param {boolean} shopifyStatus.connected - Overall connection status
 * @param {number} shopifyStatus.activeStores - Number of active stores
 * @param {number} shopifyStatus.totalStores - Total configured stores
 * @param {Array} shopifyStatus.stores - Individual store status details
 */
export default function ShopifySetupPrompt({ shopifyStatus }) {
  const isDevelopmentEnv =
    import.meta.env.MODE === 'development' || import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

  // Don't show if all stores are connected
  if (
    !shopifyStatus ||
    (shopifyStatus.connected && shopifyStatus.activeStores === shopifyStatus.totalStores)
  ) {
    return null
  }

  const getStatusIcon = () => {
    if (shopifyStatus.activeStores > 0 && shopifyStatus.activeStores < shopifyStatus.totalStores) {
      // Partial connection
      return <ExclamationCircleIcon className="mx-auto h-12 w-12 text-amber-500" />
    } else if (!shopifyStatus.connected) {
      // No connection
      return <ShoppingBagIcon className="mx-auto h-12 w-12 text-slate-400" />
    }
    return <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
  }

  const getStatusColor = () => {
    if (shopifyStatus.activeStores > 0) {
      return 'border-amber-300 bg-amber-50' // Partial connection
    }
    return 'border-slate-300 bg-slate-50' // No connection
  }

  const getMessage = () => {
    if (shopifyStatus.activeStores > 0 && shopifyStatus.activeStores < shopifyStatus.totalStores) {
      return `${shopifyStatus.activeStores} of ${shopifyStatus.totalStores} Shopify stores connected. Configure remaining stores for complete sales data.`
    }
    return 'Connect your Shopify stores to view real-time sales data, track 2.9% transaction fees, and analyze regional performance.'
  }

  return (
    <div className={cn('rounded-lg border-2 border-dashed p-8', getStatusColor())}>
      <div className="mx-auto max-w-2xl text-center">
        {getStatusIcon()}

        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Connect Shopify to View Sales Data
        </h3>

        <p className="mt-2 text-sm text-slate-600">{getMessage()}</p>

        {/* Store Connection Status */}
        {shopifyStatus.stores && shopifyStatus.stores.length > 0 && (
          <div className="mt-6 rounded-md bg-white p-4 text-left shadow-sm">
            <p className="text-sm font-medium text-slate-900 mb-3">Store Connection Status:</p>
            <div className="space-y-2">
              {shopifyStatus.stores.map(store => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-3 rounded-md border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-900">{store.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {store.region.toUpperCase()}
                      {store.lastSync &&
                        ` • Last sync: ${new Date(store.lastSync).toLocaleTimeString()}`}
                    </div>
                  </div>
                  {store.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                      {store.error || 'Not configured'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Environment Variables */}
        <div className="mt-6 rounded-md bg-blue-100 p-4 text-left">
          <p className="text-sm font-medium text-blue-800 mb-3">Required Environment Variables:</p>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <code className="font-mono text-xs bg-blue-200 px-2 py-1 rounded">
                  SHOPIFY_UK_SHOP_DOMAIN
                </code>
                <span className="text-xs text-blue-600 ml-2">
                  - UK/EU store domain (e.g., sentia-uk-eu)
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <code className="font-mono text-xs bg-blue-200 px-2 py-1 rounded">
                  SHOPIFY_UK_ACCESS_TOKEN
                </code>
                <span className="text-xs text-blue-600 ml-2">
                  - UK/EU access token (starts with shpat_)
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <code className="font-mono text-xs bg-blue-200 px-2 py-1 rounded">
                  SHOPIFY_US_SHOP_DOMAIN
                </code>
                <span className="text-xs text-blue-600 ml-2">
                  - USA store domain (e.g., sentia-usa)
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <code className="font-mono text-xs bg-blue-200 px-2 py-1 rounded">
                  SHOPIFY_US_ACCESS_TOKEN
                </code>
                <span className="text-xs text-blue-600 ml-2">
                  - USA access token (starts with shpat_)
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Setup Steps */}
        <div className="mt-6 rounded-md bg-white p-6 text-left shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Quick Setup Steps:</h4>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                1
              </span>
              <div>
                <span className="font-medium">Create Shopify Custom App</span>
                <p className="mt-1 text-xs text-slate-500">
                  In Shopify Admin → Settings → Apps and sales channels → Develop apps → Create an
                  app
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                2
              </span>
              <div>
                <span className="font-medium">Configure API Scopes</span>
                <p className="mt-1 text-xs text-slate-500">
                  Enable scopes:{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1">read_orders</code>,{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1">read_products</code>,{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1">read_customers</code>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                3
              </span>
              <div>
                <span className="font-medium">Get Access Tokens</span>
                <p className="mt-1 text-xs text-slate-500">
                  Copy Admin API access token from each store (UK/EU and USA)
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                4
              </span>
              <div>
                <span className="font-medium">Configure on Render</span>
                <p className="mt-1 text-xs text-slate-500">
                  Add environment variables to{' '}
                  <a
                    href="https://dashboard.render.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Render Dashboard
                  </a>{' '}
                  → Environment tab
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Key Features */}
        <div className="mt-6 rounded-md bg-gradient-to-br from-green-50 to-blue-50 p-4 text-left">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">What You'll Get:</h4>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Real-time Sales Data:</strong> Live order tracking from UK/EU and USA stores
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Commission Tracking:</strong> Automatic 2.9% Shopify transaction fee
                calculations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Regional Breakdown:</strong> Compare UK (GBP) vs USA (USD) performance
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Product Analytics:</strong> Top sellers, units sold, revenue by SKU
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>
                <strong>Auto-Sync:</strong> Data refreshes every 15 minutes automatically
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/docs/integrations/shopify-setup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Setup Instructions
            <ArrowRightIcon className="h-4 w-4" />
          </a>

          <a
            href="https://dashboard.render.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Configure on Render
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Technical Details (for developers) */}
        {isDevelopmentEnv && shopifyStatus && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(shopifyStatus, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
