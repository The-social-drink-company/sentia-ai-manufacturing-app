import React from 'react'

import ErrorBoundary from './ErrorBoundary.jsx'

export const withErrorBoundary = (Component, fallbackMessage) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallbackMessage={fallbackMessage}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('[useErrorHandler] Error:', error)

    if (import.meta.env.NODE_ENV === 'production') {
      console.error('Production error reported:', { error, errorInfo })
    }
  }
}
