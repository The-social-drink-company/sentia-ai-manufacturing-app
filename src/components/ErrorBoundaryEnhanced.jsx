import React from 'react';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


class ErrorBoundaryEnhanced extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      logError('[ErrorBoundary] Caught error:', error);
      logError('[ErrorBoundary] Error info:', errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to monitoring service (if configured)
    try {
      if (window.logError) {
        window.logError('ErrorBoundary', {
          message: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });
      }
    } catch (loggingError) {
      logError('Failed to log error:', loggingError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Optionally reload the page if errors persist
    if (this.state.errorCount > 2) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportIssue = () => {
    const errorDetails = {
      message: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    alert('Error details copied to clipboard. Please include them when reporting the issue.');
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleReset
        });
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Error Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-3">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Something went wrong
                    </h1>
                    <p className="text-red-100 mt-1">
                      An unexpected error has occurred
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Error Message */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">
                      Error Message
                    </h3>
                    <p className="text-red-700 font-mono text-sm">
                      {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                  </div>

                  {/* Show Details (Development Mode) */}
                  {(showDetails || process.env.NODE_ENV === 'development') && (
                    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <summary className="cursor-pointer font-semibold text-gray-700">
                        Technical Details
                      </summary>
                      <div className="mt-3 space-y-3">
                        {/* Stack Trace */}
                        {this.state.error?.stack && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-1">
                              Stack Trace:
                            </h4>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}

                        {/* Component Stack */}
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-1">
                              Component Stack:
                            </h4>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Error Count Warning */}
                  {this.state.errorCount > 1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        This error has occurred {this.state.errorCount} times.
                        If the problem persists, try refreshing the page.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Try Again</span>
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    <span>Go to Dashboard</span>
                  </button>

                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={this.handleReportIssue}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Copy Error Details</span>
                    </button>
                  )}
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    If this problem continues, please contact support or try using{' '}
                    <a
                      href="/dashboard/basic"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Basic Mode
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryEnhanced;