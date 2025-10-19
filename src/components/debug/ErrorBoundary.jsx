import { Component } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Component error caught:', {
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
    })

    this.setState({
      error: error,
      errorInfo: errorInfo,
    })

    // Optional: Send error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      const errorName = this.props.name || 'Component'

      return (
        <div className="min-h-96 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-900 mb-2">{errorName} Error</h3>
                <p className="text-sm text-red-700 mb-4">
                  Something went wrong while loading this component. Please check the browser
                  console for more details.
                </p>

                {this.props.showDetails && this.state.error && (
                  <details className="mb-4">
                    <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                      Error Details
                    </summary>
                    <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
