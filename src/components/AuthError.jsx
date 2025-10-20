import { AlertCircle } from 'lucide-react'

const AuthError = ({ error, onRetry }) => {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
          <p className="mt-1 text-sm text-red-700">
            {error?.message || 'An error occurred during authentication. Please try again.'}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-600 transition-colors hover:text-red-500"
            >
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AuthError
