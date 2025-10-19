import React from 'react'
import ErrorState from './ui/ErrorState'

/**
 * Error Boundary Component (BMAD-UI-003)
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs errors, and displays a fallback UI instead of crashing.
 *
 * Features:
 * - Catches errors during rendering, lifecycle methods, and constructors
 * - Displays user-friendly error message with retry option
 * - Logs error details to console for debugging
 * - Prevents entire application from crashing
 * - Provides error recovery mechanism
 *
 * Usage:
 * ```jsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * Note: Error boundaries do NOT catch errors for:
 * - Event handlers (use try-catch)
 * - Asynchronous code (setTimeout, promises)
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 *
 * @component
 * @example
 * <ErrorBoundary>
 *   <Dashboard />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  /**
   * Log error details to console and error reporting service
   */
  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo)

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    })

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  /**
   * Reset error boundary state to retry rendering
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
