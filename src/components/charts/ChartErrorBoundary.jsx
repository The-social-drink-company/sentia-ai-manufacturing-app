import React from 'react'
import { AlertTriangleIcon, RefreshCcwIcon } from 'lucide-react'

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ChartErrorBoundary] Chart rendering error:', error)
    console.error('[ChartErrorBoundary] Component stack:', errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[300px] w-full bg-slate-900/50 rounded-lg border border-slate-800">
          <div className="text-center p-6 max-w-md">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-3">
              <AlertTriangleIcon className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Chart Error</h3>
            <p className="text-sm text-slate-400 mb-4">
              {this.props.fallbackMessage || 'Unable to render this chart. Please try again.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 bg-slate-800 rounded text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCcwIcon className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ChartErrorBoundary
