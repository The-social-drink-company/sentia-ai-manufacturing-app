import { ExclamationCircleIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

/**
 * Xero Setup Prompt Component
 *
 * Displays setup instructions when Xero is not configured
 * Shows configuration errors with specific missing environment variables
 * Provides links to documentation and setup guides
 *
 * @param {Object} xeroStatus - Status object from Xero health check
 * @param {string} xeroStatus.status - Current status (connected, configuration_error, not_authenticated, etc.)
 * @param {string} xeroStatus.message - Status message
 * @param {Object} xeroStatus.details - Additional details (missing env vars, etc.)
 */
export default function XeroSetupPrompt({ xeroStatus }) {
  const isDevelopmentEnv =
    import.meta.env.MODE === 'development' || import.meta.env.VITE_DEVELOPMENT_MODE === 'true'
  // Don't show if Xero is connected
  if (!xeroStatus || xeroStatus.status === 'connected') {
    return null
  }

  const getStatusIcon = () => {
    if (xeroStatus.status === 'configuration_error') {
      return <ExclamationCircleIcon className="mx-auto h-12 w-12 text-amber-500" />
    }
    return <ExclamationCircleIcon className="mx-auto h-12 w-12 text-slate-400" />
  }

  const getStatusColor = () => {
    switch (xeroStatus.status) {
      case 'configuration_error':
        return 'border-amber-300 bg-amber-50'
      case 'api_error':
        return 'border-red-300 bg-red-50'
      default:
        return 'border-slate-300 bg-slate-50'
    }
  }

  return (
    <div className={cn('rounded-lg border-2 border-dashed p-8', getStatusColor())}>
      <div className="mx-auto max-w-2xl text-center">
        {getStatusIcon()}

        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Connect Xero to View Financial Data
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          {xeroStatus.message || 'Xero integration not configured'}
        </p>

        {/* Configuration Error - Show Missing Variables */}
        {xeroStatus.status === 'configuration_error' && xeroStatus.details && (
          <div className="mt-6 rounded-md bg-amber-100 p-4 text-left">
            <p className="text-sm font-medium text-amber-800 mb-3">Missing Configuration:</p>
            <ul className="space-y-2 text-sm text-amber-700">
              {xeroStatus.details.missing?.map(envVar => (
                <li key={envVar} className="flex items-center gap-2">
                  <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
                  <code className="font-mono text-xs bg-amber-200 px-2 py-1 rounded">{envVar}</code>
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
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                1
              </span>
              <div>
                <span className="font-medium">Create Xero Developer Account</span>
                <p className="mt-1 text-xs text-slate-500">
                  Sign up at{' '}
                  <a
                    href="https://developer.xero.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    developer.xero.com
                  </a>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                2
              </span>
              <div>
                <span className="font-medium">Create Custom Connection</span>
                <p className="mt-1 text-xs text-slate-500">
                  In the Developer Portal, create a new "Custom Connection" app
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                3
              </span>
              <div>
                <span className="font-medium">Configure Environment Variables</span>
                <p className="mt-1 text-xs text-slate-500">
                  Add <code className="font-mono text-xs bg-slate-100 px-1">XERO_CLIENT_ID</code>{' '}
                  and{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1">XERO_CLIENT_SECRET</code> to
                  your environment
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                4
              </span>
              <div>
                <span className="font-medium">Restart Application</span>
                <p className="mt-1 text-xs text-slate-500">
                  The service will automatically authenticate on startup
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/docs/integrations/xero-setup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Setup Instructions
            <ArrowRightIcon className="h-4 w-4" />
          </a>

          <a
            href="https://developer.xero.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Xero Developer Portal
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Technical Details (for developers) */}
        {isDevelopmentEnv && xeroStatus.details && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(xeroStatus, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
