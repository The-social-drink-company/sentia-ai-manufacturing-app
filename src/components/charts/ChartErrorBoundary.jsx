import React, { Component } from 'react';
import { ExclamationCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      chartType: this.props.chartType || 'unknown',
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Enhanced logging with structured data
    console.group('🚨 Chart Error Boundary Triggered');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Chart Type:', this.props.chartType);
    console.error('Props:', this.props);
    console.error('State:', this.state);
    console.groupEnd();

    // Log to structured logger if available
    if (window.structuredLogger) {
      window.structuredLogger.error('chart_rendering_error', errorDetails);
    }

    // Send to monitoring service if available
    if (window.monitoring) {
      window.monitoring.captureException(error, {
        tags: {
          component: 'ChartErrorBoundary',
          chartType: this.props.chartType || 'unknown'
        },
        extra: errorDetails
      });
    }

    // Send to analytics if available
    if (window.analytics) {
      window.analytics.track('Chart Error', {
        chartType: this.props.chartType,
        errorMessage: error.message,
        retryCount: this.state.retryCount
      });
    }

    this.setState({ 
      errorInfo,
      lastErrorTime: new Date()
    });
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Log retry attempt
    if (window.structuredLogger) {
      window.structuredLogger.info('chart_error_retry', {
        chartType: this.props.chartType,
        retryCount: newRetryCount,
        timestamp: new Date().toISOString()
      });
    }

    // Track retry in analytics
    if (window.analytics) {
      window.analytics.track('Chart Error Retry', {
        chartType: this.props.chartType,
        retryCount: newRetryCount
      });
    }

    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: newRetryCount
    });
  };

  getErrorSeverity = () => {
    if (this.state.retryCount >= 3) return 'critical';
    if (this.state.retryCount >= 1) return 'warning';
    return 'info';
  };

  getErrorIcon = () => {
    const severity = this.getErrorSeverity();
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mb-2" />;
      case 'warning':
        return <ExclamationCircleIcon className="w-8 h-8 text-yellow-500 mb-2" />;
      default:
        return <ExclamationCircleIcon className="w-8 h-8 text-gray-400 mb-2" />;
    }
  };

  getErrorMessage = () => {
    const severity = this.getErrorSeverity();
    const chartType = this.props.chartType || 'Chart';
    
    switch (severity) {
      case 'critical':
        return `${chartType} is experiencing persistent issues. Please contact support if this continues.`;
      case 'warning':
        return `${chartType} data is temporarily unavailable. Retrying...`;
      default:
        return `${chartType} data temporarily unavailable`;
    }
  };

  render() {
    if (this.state.hasError) {
      const severity = this.getErrorSeverity();
      const showDetails = this.props.showErrorDetails && process.env.NODE_ENV === 'development';

      return (
        <div className={`flex flex-col items-center justify-center p-6 border rounded-lg ${
          severity === 'critical' ? 'bg-red-50 border-red-200' :
          severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          {this.getErrorIcon()}
          
          <p className={`text-sm text-center mb-3 ${
            severity === 'critical' ? 'text-red-700' :
            severity === 'warning' ? 'text-yellow-700' :
            'text-gray-600'
          }`}>
            {this.getErrorMessage()}
          </p>

          {this.state.retryCount < 5 && (
            <button
              onClick={this.handleRetry}
              className={`flex items-center space-x-2 px-4 py-2 text-xs rounded-md transition-colors ${
                severity === 'critical' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                severity === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Retry ({this.state.retryCount}/5)</span>
            </button>
          )}

          {this.state.retryCount >= 5 && (
            <div className="text-center">
              <p className="text-xs text-red-600 mb-2">Maximum retries exceeded</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Refresh page
              </button>
            </div>
          )}

          {showDetails && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="text-xs text-gray-500 cursor-pointer">Error Details</summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                <div><strong>Error:</strong> {this.state.error.toString()}</div>
                {this.state.errorInfo && (
                  <div className="mt-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.errorInfo}</pre>
                  </div>
                )}
                <div className="mt-2"><strong>Retry Count:</strong> {this.state.retryCount}</div>
                <div><strong>Last Error:</strong> {this.state.lastErrorTime?.toLocaleString()}</div>
              </div>
            </details>
          )}

          {this.props.fallbackComponent && (
            <div className="mt-4 w-full">
              {this.props.fallbackComponent}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
