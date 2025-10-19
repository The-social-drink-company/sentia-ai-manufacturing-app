import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Error State Component (BMAD-UI-003)
 *
 * Displays a user-friendly error message when an error boundary catches an error.
 * Provides a retry button to attempt recovery.
 *
 * Features:
 * - Clean, centered error display
 * - User-friendly error message
 * - Retry button for error recovery
 * - Optional error details in development mode
 * - Accessibility-friendly (ARIA labels, semantic HTML)
 *
 * @component
 * @param {Object} props
 * @param {Error} props.error - The error object caught by ErrorBoundary
 * @param {Object} props.errorInfo - React error info with component stack
 * @param {Function} props.onReset - Callback to reset error boundary and retry
 *
 * @example
 * <ErrorState
 *   error={new Error('Something went wrong')}
 *   errorInfo={{ componentStack: '...' }}
 *   onReset={() => console.log('Retry')}
 * />
 */
export default function ErrorState({ error, errorInfo, onReset }) {
  const isDevelopment = import.meta.env.MODE === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="max-w-2xl w-full border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-100">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User-friendly message */}
          <div className="text-center space-y-2">
            <p className="text-slate-700 dark:text-slate-300">
              We encountered an unexpected error while rendering this page.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't worry - your data is safe. Try refreshing the page or contact support if the
              problem persists.
            </p>
          </div>

          {/* Retry button */}
          <div className="flex justify-center">
            <button
              onClick={onReset}
              className={cn(
                'inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg',
                'bg-blue-600 text-white hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'transition-colors shadow-md hover:shadow-lg',
                'dark:bg-blue-500 dark:hover:bg-blue-600'
              )}
              aria-label="Retry loading the page"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Try Again
            </button>
          </div>

          {/* Development mode: Show error details */}
          {isDevelopment && error && (
            <details className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                Show error details (development mode)
              </summary>
              <div className="mt-4 space-y-4">
                {/* Error message */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Error Message
                  </h4>
                  <pre className="text-xs text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 p-3 rounded overflow-x-auto">
                    {error.toString()}
                  </pre>
                </div>

                {/* Component stack */}
                {errorInfo?.componentStack && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Component Stack
                    </h4>
                    <pre className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {/* Error stack */}
                {error?.stack && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Error Stack
                    </h4>
                    <pre className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Help text */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              If this error continues, please contact support at{' '}
              <a
                href="mailto:support@sentiamanufacturing.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@sentiamanufacturing.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
