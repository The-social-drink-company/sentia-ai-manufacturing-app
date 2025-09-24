
import React, { Suspense, memo } from 'react';
import { logError } from '../../lib/logger';

// Premium loading component
const PremiumLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="sentia-loading w-8 h-8 mx-auto mb-4"></div>
      <p className="text-sm text-gray-600">Loading premium experience...</p>
    </div>
  </div>
);

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logError('Lazy component error', error, { component: 'LazyWrapper', errorInfo: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-600">Failed to load component. Please refresh.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy component wrapper with error boundary
export const withLazyLoading = (Component, 0>
        <Component {...props} />
      </Suspense>
    </LazyErrorBoundary>
  ));
};

// Preload utility for critical components
export const preloadComponent = (componentImport) => {
  if (typeof componentImport === 'function') {
    componentImport();
  }
};

export { PremiumLoader };
