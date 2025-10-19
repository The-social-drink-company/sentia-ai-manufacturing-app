import { ExclamationCircleIcon, ArrowRightIcon, CogIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * Unleashed ERP Setup Prompt Component
 *
 * Displays setup instructions when Unleashed ERP is not configured
 * Shows configuration errors with specific missing environment variables
 * Provides links to documentation and setup guides
 *
 * @param {Object} unleashedStatus - Status object from Unleashed ERP health check
 * @param {boolean} unleashedStatus.connected - Current connection status
 * @param {string} unleashedStatus.status - Status message
 * @param {Object} unleashedStatus.details - Additional details (missing env vars, error messages, etc.)
 */
export default function UnleashedSetupPrompt({ unleashedStatus }) {
  const isDevelopmentEnv = import.meta.env.MODE === 'development' || import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

  // Don't show if Unleashed is connected
  if (!unleashedStatus || unleashedStatus.connected === true) {
    return null;
  }

  const hasConfigError = unleashedStatus.details?.missing && unleashedStatus.details.missing.length > 0;

  const getStatusIcon = () => {
    if (hasConfigError) {
      return <ExclamationCircleIcon className="mx-auto h-12 w-12 text-purple-500" />;
    }
    return <CogIcon className="mx-auto h-12 w-12 text-slate-400" />;
  };

  const getStatusColor = () => {
    if (hasConfigError) {
      return 'border-purple-300 bg-purple-50';
    }
    return 'border-slate-300 bg-slate-50';
  };

  return (
    <div className={cn(
      'rounded-lg border-2 border-dashed p-8',
      getStatusColor()
    )}>
      <div className="mx-auto max-w-2xl text-center">
        {getStatusIcon()}

        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Connect Unleashed ERP to View Manufacturing Data
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          {unleashedStatus.status || 'Unleashed ERP integration not configured'}
        </p>

        {/* Configuration Error - Show Missing Variables */}
        {hasConfigError && (
          <div className="mt-6 rounded-md bg-purple-100 p-4 text-left">
            <p className="text-sm font-medium text-purple-800 mb-3">
              Missing Configuration:
            </p>
            <ul className="space-y-2 text-sm text-purple-700">
              {unleashedStatus.details.missing.map((envVar) => (
                <li key={envVar} className="flex items-center gap-2">
                  <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
                  <code className="font-mono text-xs bg-purple-200 px-2 py-1 rounded">
                    {envVar}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Setup Steps */}
        <div className="mt-6 rounded-md bg-white p-6 text-left shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">
            Quick Setup Steps:
          </h4>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                1
              </span>
              <div>
                <span className="font-medium">Access Unleashed ERP Account</span>
                <p className="mt-1 text-xs text-slate-500">
                  Log in to your Unleashed account at{' '}
                  <a
                    href="https://app.unleashedsoftware.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline"
                  >
                    app.unleashedsoftware.com
                  </a>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                2
              </span>
              <div>
                <span className="font-medium">Generate API Credentials</span>
                <p className="mt-1 text-xs text-slate-500">
                  Go to Integration → Unleashed API → Create API Keys
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Copy your <strong>API ID</strong> and <strong>API Key</strong>
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                3
              </span>
              <div>
                <span className="font-medium">Configure Environment Variables</span>
                <p className="mt-1 text-xs text-slate-500">
                  Add the following to your Render environment variables:
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li><code className="font-mono bg-slate-100 px-1">UNLEASHED_API_ID</code> - Your API ID (GUID format)</li>
                  <li><code className="font-mono bg-slate-100 px-1">UNLEASHED_API_KEY</code> - Your API Key for HMAC signature</li>
                  <li><code className="font-mono bg-slate-100 px-1">UNLEASHED_API_URL</code> (optional, default: https://api.unleashedsoftware.com)</li>
                </ul>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                4
              </span>
              <div>
                <span className="font-medium">Restart Application</span>
                <p className="mt-1 text-xs text-slate-500">
                  The service will automatically connect and start syncing manufacturing data every 15 minutes
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Known Limitations Callout */}
        <div className="mt-6 rounded-md bg-yellow-50 border border-yellow-200 p-4 text-left">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <ExclamationCircleIcon className="h-4 w-4 text-yellow-600" />
            Known Limitations
          </h4>
          <p className="text-xs text-yellow-800">
            <strong>Stock Movements Endpoint</strong>: The <code className="bg-yellow-100 px-1 font-mono">/StockMovements</code> endpoint may return 403 Forbidden depending on your Unleashed subscription plan. Stock movements are calculated from Sales Orders and Purchase Orders instead.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/docs/integrations/unleashed-erp-setup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            Setup Instructions
            <ArrowRightIcon className="h-4 w-4" />
          </a>

          <a
            href="https://apidocs.unleashedsoftware.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Unleashed API Docs
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Technical Details (for developers) */}
        {isDevelopmentEnv && unleashedStatus.details && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(unleashedStatus, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
