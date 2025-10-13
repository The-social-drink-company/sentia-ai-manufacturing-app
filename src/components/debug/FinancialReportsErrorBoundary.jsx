import React from 'react'

class FinancialReportsErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    console.error('[Navigation Debug] FinancialReportsErrorBoundary caught error:', error)
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Navigation Debug] FinancialReportsErrorBoundary componentDidCatch:', {
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'FinancialReportsErrorBoundary'
    })
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Log additional context
    console.log('[Navigation Debug] Current URL when error occurred:', window.location.href)
    console.log('[Navigation Debug] Error boundary props:', this.props)
  }

  render() {
    if (this.state.hasError) {
      console.log('[Navigation Debug] FinancialReportsErrorBoundary rendering error UI')
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.804-.833-2.574 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  Financial Reports Error
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  There was an error loading the Financial Reports page.
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <div className="text-sm">
                <strong>Error:</strong> {this.state.error && this.state.error.toString()}
              </div>
              {this.state.errorInfo && this.state.errorInfo.componentStack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-red-800">
                    Component Stack (click to expand)
                  </summary>
                  <pre className="text-xs mt-1 overflow-auto max-h-32 text-red-700">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('[Navigation Debug] User clicked "Try Again" in error boundary')
                  this.setState({ hasError: false, error: null, errorInfo: null })
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  console.log('[Navigation Debug] User clicked "Go to Dashboard" in error boundary')
                  window.location.href = '/app/dashboard'
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Go to Dashboard
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Check the browser console for detailed debugging information.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default FinancialReportsErrorBoundary