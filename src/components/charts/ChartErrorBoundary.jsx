import React from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error for monitoring
    if (process.env.NODEENV = == 'development') {
      console.error('ChartErrorBoundary caught an error:', error, errorInfo);
    }

    // You can integrate with error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      isRetrying: true,
      retryCount: this.state.retryCount + 1
    });

    setTimeout(() {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      });
    }, 1000);
  };

  handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, isRetrying, retryCount } = this.state;
      const { fallback, showDetails = false, title = "Chart Error" } = this.props;

      // If a custom fallback is provided, use it
      if (fallback && typeof fallback === 'function') {
        return fallback(error, this.handleRetry, this.handleDismiss);
      }

      if (fallback && React.isValidElement(fallback)) {
        return fallback;
      }

      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {title}
                </h3>
                <button
                  onClick={this.handleDismiss}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error?.message || 'An unexpected error occurred while rendering the chart.'}
                </p>

                {showDetails && errorInfo && (
                  <details className="mt-3">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
                      Technical Details
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded border text-red-800 dark:text-red-200 overflow-x-auto">
                      {error?.stack || errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="mt-4 flex items-center space-x-3">
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying || retryCount >= 3}
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isRetrying || retryCount >= 3
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                  }`}
                >
                  {isRetrying ? (
                    <>
                      <ArrowPathIcon className="w-3 h-3 animate-spin" />
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-3 h-3" />
                      <span>
                        {retryCount >= 3 ? 'Max retries reached' : `Retry ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
                  <ChartBarIcon className="w-3 h-3" />
                  <span>Chart unavailable</span>
                </div>
              </div>

              {/* Fallback content suggestion */}
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
                <h4 className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                  Alternative Actions:
                </h4>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                  <li>• Check your data source connection</li>
                  <li>• Verify chart configuration</li>
                  <li>• Try refreshing the page</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
