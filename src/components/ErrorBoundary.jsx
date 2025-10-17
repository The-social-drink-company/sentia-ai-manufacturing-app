import React from 'react'
import { AlertTriangleIcon, RefreshCcwIcon, HomeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error caught:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Log to external service in production
    if (import.meta.env.NODE_ENV === 'production') {
      // TODO: Send error to logging service
      console.error('Production error:', { error, errorInfo })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment =
        import.meta.env.VITE_DEVELOPMENT_MODE === 'true' ||
        import.meta.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-900 rounded-lg border border-slate-800 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <AlertTriangleIcon className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-slate-400">
                {this.props.fallbackMessage || 'An unexpected error occurred in the application'}
              </p>
            </div>

            {isDevelopment && this.state.error && (
              <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="text-sm font-medium text-red-400 mb-2">
                  Development Error Details:
                </h3>
                <div className="text-xs text-slate-300 font-mono space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCcwIcon className="w-4 h-4" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <HomeIcon className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {isDevelopment && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  <strong>Development Mode:</strong> Check the browser console for more detailed
                  error information.
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, fallbackMessage) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallbackMessage={fallbackMessage}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for programmatic error reporting
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('[useErrorHandler] Error:', error)

    // In production, send to error reporting service
    if (import.meta.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service
      console.error('Production error reported:', { error, errorInfo })
    }
  }
}

export default ErrorBoundary

