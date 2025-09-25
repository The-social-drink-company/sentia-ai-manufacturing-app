import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { Card, CardBody, CardHeader } from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-in">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-8 w-8 text-red-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-gray-600">
                    We encountered an unexpected error
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardBody>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Error Details
                  </h3>
                  <p className="text-sm text-red-700 font-mono">
                    {this.state.error?.message || 'Unknown error occurred'}
                  </p>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                      Stack Trace (Development)
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-48">
                      {this.state.error?.stack}
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={this.handleRetry}
                    variant="primary"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="secondary"
                    className="flex-1"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AsyncErrorBoundaryProps extends Props {
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  resetOnPropsChange = false,
  resetKeys = [],
  children,
  ...props
}) => {
  const [resetCount, setResetCount] = React.useState(0);
  const prevResetKeys = React.useRef(resetKeys);

  React.useEffect(() => {
    if (resetOnPropsChange) {
      const hasChanged = resetKeys.some(
        (key, index) => prevResetKeys.current[index] !== key
      );
      if (hasChanged) {
        prevResetKeys.current = resetKeys;
        setResetCount(count => count + 1);
      }
    }
  }, [resetKeys, resetOnPropsChange]);

  return (
    <ErrorBoundary key={resetCount} {...props}>
      {children}
    </ErrorBoundary>
  );
};

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));
};