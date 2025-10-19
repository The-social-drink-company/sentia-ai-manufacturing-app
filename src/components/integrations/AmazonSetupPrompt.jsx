import {
  ExclamationCircleIcon,
  ArrowRightIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

/**
 * Amazon SP-API Setup Prompt Component
 *
 * Displays setup instructions when Amazon SP-API is not configured
 * Shows configuration errors with specific missing environment variables
 * Provides links to documentation and setup guides
 *
 * @param {Object} amazonStatus - Status object from Amazon SP-API health check
 * @param {boolean} amazonStatus.connected - Current connection status
 * @param {string} amazonStatus.status - Status message
 * @param {Object} amazonStatus.details - Additional details (missing env vars, error messages, etc.)
 */
export default function AmazonSetupPrompt({ amazonStatus }) {
  const isDevelopmentEnv =
    import.meta.env.MODE === 'development' || import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

  // Don't show if Amazon is connected
  if (!amazonStatus || amazonStatus.connected === true) {
    return null
  }

  const hasConfigError = amazonStatus.details?.missing && amazonStatus.details.missing.length > 0

  const getStatusIcon = () => {
    if (hasConfigError) {
      return <ExclamationCircleIcon className="mx-auto h-12 w-12 text-orange-500" />
    }
    return <ShoppingCartIcon className="mx-auto h-12 w-12 text-slate-400" />
  }

  const getStatusColor = () => {
    if (hasConfigError) {
      return 'border-orange-300 bg-orange-50'
    }
    return 'border-slate-300 bg-slate-50'
  }

  return (
    <div className={cn('rounded-lg border-2 border-dashed p-8', getStatusColor())}>
      <div className="mx-auto max-w-2xl text-center">
        {getStatusIcon()}

        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Connect Amazon SP-API to View FBA Data
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          {amazonStatus.status || 'Amazon Selling Partner API not configured'}
        </p>

        {/* Configuration Error - Show Missing Variables */}
        {hasConfigError && (
          <div className="mt-6 rounded-md bg-orange-100 p-4 text-left">
            <p className="text-sm font-medium text-orange-800 mb-3">Missing Configuration:</p>
            <ul className="space-y-2 text-sm text-orange-700">
              {amazonStatus.details.missing.map(envVar => (
                <li key={envVar} className="flex items-center gap-2">
                  <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
                  <code className="font-mono text-xs bg-orange-200 px-2 py-1 rounded">
                    {envVar}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Setup Steps */}
        <div className="mt-6 rounded-md bg-white p-6 text-left shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Quick Setup Steps:</h4>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                1
              </span>
              <div>
                <span className="font-medium">Register as Amazon Developer</span>
                <p className="mt-1 text-xs text-slate-500">
                  Sign up at{' '}
                  <a
                    href="https://developer.amazonservices.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-800 underline"
                  >
                    developer.amazonservices.com
                  </a>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                2
              </span>
              <div>
                <span className="font-medium">Create SP-API Application</span>
                <p className="mt-1 text-xs text-slate-500">
                  In Seller Central, go to Apps & Services → Develop Apps → Add new app client
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                3
              </span>
              <div>
                <span className="font-medium">Authorize Your Application</span>
                <p className="mt-1 text-xs text-slate-500">
                  Complete OAuth flow to obtain your{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1">AMAZON_REFRESH_TOKEN</code>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                4
              </span>
              <div>
                <span className="font-medium">Configure Environment Variables</span>
                <p className="mt-1 text-xs text-slate-500">
                  Add the following to your Render environment variables:
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>
                    <code className="font-mono bg-slate-100 px-1">AMAZON_REFRESH_TOKEN</code>
                  </li>
                  <li>
                    <code className="font-mono bg-slate-100 px-1">AMAZON_LWA_APP_ID</code>
                  </li>
                  <li>
                    <code className="font-mono bg-slate-100 px-1">AMAZON_LWA_CLIENT_SECRET</code>
                  </li>
                  <li>
                    <code className="font-mono bg-slate-100 px-1">AMAZON_SP_ROLE_ARN</code>
                  </li>
                  <li>
                    <code className="font-mono bg-slate-100 px-1">AMAZON_SELLER_ID</code>
                  </li>
                  <li>
                    <code className="font-mono bg-slate-100 px-1">AMAZON_REGION</code> (default:
                    us-east-1)
                  </li>
                </ul>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                5
              </span>
              <div>
                <span className="font-medium">Restart Application</span>
                <p className="mt-1 text-xs text-slate-500">
                  The service will automatically connect and start syncing FBA inventory and orders
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/docs/integrations/amazon-setup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Setup Instructions
            <ArrowRightIcon className="h-4 w-4" />
          </a>

          <a
            href="https://developer.amazonservices.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Amazon Developer Portal
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Technical Details (for developers) */}
        {isDevelopmentEnv && amazonStatus.details && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(amazonStatus, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
