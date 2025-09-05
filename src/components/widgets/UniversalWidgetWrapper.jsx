import React, { Component } from 'react'

// Universal error boundary for all widgets
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Widget error in ${this.props.widgetName}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ 
            fontSize: '1.125rem', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            {this.props.widgetName || 'Widget'} Loading...
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Connecting to real-time data sources
          </div>
          <div style={{
            marginTop: '1rem',
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading state component
export const WidgetLoading = ({ name }) => (
  <div style={{
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e5e7eb',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '1rem'
    }}></div>
    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
      Loading {name}...
    </div>
  </div>
)

// No data state component
export const WidgetNoData = ({ name, message }) => (
  <div style={{
    padding: '2rem',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px dashed #d1d5db',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <svg 
      style={{ width: '48px', height: '48px', marginBottom: '1rem', color: '#9ca3af' }}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
      />
    </svg>
    <div style={{ 
      fontSize: '1rem', 
      fontWeight: '500', 
      color: '#6b7280',
      marginBottom: '0.5rem'
    }}>
      {name} - No Data Available
    </div>
    <div style={{ 
      fontSize: '0.875rem', 
      color: '#9ca3af',
      textAlign: 'center',
      maxWidth: '300px'
    }}>
      {message || 'Waiting for real-time data from external sources'}
    </div>
  </div>
)

// Universal widget wrapper
const UniversalWidgetWrapper = ({ 
  children, 
  widgetName, 
  loading = false, 
  hasData = true,
  error = null,
  noDataMessage = null 
}) => {
  // Show loading state
  if (loading) {
    return <WidgetLoading name={widgetName} />
  }

  // Show no data state
  if (!hasData && !error) {
    return <WidgetNoData name={widgetName} message={noDataMessage} />
  }

  // Show error state
  if (error) {
    return <WidgetNoData name={widgetName} message="Unable to connect to data source" />
  }

  // Wrap children with error boundary
  return (
    <WidgetErrorBoundary widgetName={widgetName}>
      {children}
    </WidgetErrorBoundary>
  )
}

export default UniversalWidgetWrapper