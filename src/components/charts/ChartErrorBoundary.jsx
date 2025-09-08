import React, { Component } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Chart rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <ExclamationCircleIcon className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 text-center">
            Chart data temporarily unavailable
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;