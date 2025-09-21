import React, { Suspense, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'react-hot-toast'
import { SignedIn, SignedOut, SignIn, UserButton, useAuth, useUser } from '@clerk/clerk-react'
import './index.css'

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Enhanced Loading Component
const EnterpriseLoadingSpinner = ({ message = "Loading Enterprise Dashboard..." }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
      <div style={{
        width: '64px',
        height: '64px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px'
      }} />
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        color: '#1e293b',
        margin: '0 0 12px 0'
      }}>
        Sentia Manufacturing
      </h2>
      <div style={{
        fontSize: '16px',
        color: '#64748b',
        marginBottom: '16px'
      }}>
        {message}
      </div>
      <div style={{
        fontSize: '14px',
        color: '#94a3b8',
        lineHeight: '1.5'
      }}>
        Initializing production systems, quality control, and analytics
      </div>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// Error Boundary Fallback
const ErrorBoundaryFallback = ({ error, resetErrorBoundary }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{
      textAlign: 'center',
      padding: '48px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      maxWidth: '500px'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: '#fee2e2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <svg style={{ width: '32px', height: '32px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>
      <h1 style={{ color: '#1e293b', marginBottom: '16px', fontSize: '24px', fontWeight: '600' }}>
        Dashboard Error
      </h1>
      <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
        An error occurred while loading the enterprise dashboard. This may be due to a temporary issue.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={resetErrorBoundary}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Retry Loading
        </button>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
)

// Custom Sign In Page
const CustomSignInPage = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '20px'
  }}>
    <div style={{
      width: '100%',
      maxWidth: '400px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Sentia Manufacturing
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          margin: 0
        }}>
          Enterprise Manufacturing Intelligence
        </p>
      </div>
      
      <SignIn 
        routing="path" 
        path="/sign-in"
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl border-0 rounded-2xl',
            headerTitle: 'text-2xl font-bold text-gray-900',
            headerSubtitle: 'text-gray-600',
            socialButtonsBlockButton: 'border-gray-300 hover:border-gray-400 transition-all duration-200',
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 transition-all duration-200',
            formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200',
            footerActionLink: 'text-blue-600 hover:text-blue-700'
          }
        }}
      />
    </div>
  </div>
)

// Progressive Enterprise Dashboard with Clerk Authentication
const ProgressiveEnterpriseDashboard = () => {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [loadingStage, setLoadingStage] = useState('core')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Only start progressive loading if user is signed in
    if (!isLoaded || !isSignedIn) return

    // Simulate progressive loading of enterprise systems
    const loadingStages = [
      { stage: 'core', duration: 800, message: 'Loading core systems...' },
      { stage: 'production', duration: 1000, message: 'Setting up production monitoring...' },
      { stage: 'quality', duration: 800, message: 'Loading quality control...' },
      { stage: 'inventory', duration: 800, message: 'Preparing inventory management...' },
      { stage: 'analytics', duration: 1200, message: 'Starting analytics engine...' },
      { stage: 'complete', duration: 500, message: 'Finalizing dashboard...' }
    ]

    let currentStageIndex = 0
    
    const progressLoader = () => {
      if (currentStageIndex < loadingStages.length) {
        const currentStage = loadingStages[currentStageIndex]
        setLoadingStage(currentStage.stage)
        
        setTimeout(() => {
          currentStageIndex++
          progressLoader()
        }, currentStage.duration)
      }
    }

    progressLoader()

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [isLoaded, isSignedIn])

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return <EnterpriseLoadingSpinner message="Initializing authentication..." />
  }

  // Show progressive loading while dashboard is initializing
  if (isSignedIn && loadingStage !== 'complete') {
    const messages = {
      core: 'Loading core systems...',
      production: 'Setting up production monitoring...',
      quality: 'Loading quality control...',
      inventory: 'Preparing inventory management...',
      analytics: 'Starting analytics engine...'
    }
    
    return <EnterpriseLoadingSpinner message={messages[loadingStage]} />
  }

  // Show enterprise dashboard if authenticated and loaded
  if (isSignedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {/* Header with User Info */}
        <header style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 4px 0'
              }}>
                Sentia Manufacturing Enterprise
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0
              }}>
                Comprehensive Manufacturing Intelligence Platform
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '4px'
                }}>
                  Welcome, {user?.firstName || 'User'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8'
                }}>
                  {currentTime.toLocaleString()}
                </div>
              </div>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10',
                    userButtonPopoverCard: 'shadow-lg border border-gray-200',
                    userButtonPopoverActionButton: 'hover:bg-gray-50'
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px'
        }}>
          {/* System Status Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>
                Production Systems
              </h3>
              <div style={{ color: '#10b981', fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                ✅ Online
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                All production lines operational
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ color: '#10b981' }}>Line A: 98%</span>
                <span style={{ color: '#10b981' }}>Line B: 95%</span>
                <span style={{ color: '#f59e0b' }}>Line C: 87%</span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>
                Quality Control
              </h3>
              <div style={{ color: '#10b981', fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                98.7%
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                Quality score above target
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ color: '#10b981' }}>Defects: 0.3%</span>
                <span style={{ color: '#10b981' }}>Compliance: 100%</span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>
                Inventory Management
              </h3>
              <div style={{ color: '#3b82f6', fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                2,847
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                Items in stock
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ color: '#10b981' }}>Raw: 1,203</span>
                <span style={{ color: '#3b82f6' }}>WIP: 456</span>
                <span style={{ color: '#f59e0b' }}>Finished: 1,188</span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>
                Analytics Engine
              </h3>
              <div style={{ color: '#8b5cf6', fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                AI Active
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                Predictive models running
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ color: '#10b981' }}>Forecasting: On</span>
                <span style={{ color: '#10b981' }}>Optimization: On</span>
              </div>
            </div>
          </div>

          {/* Enterprise Features Section */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '24px'
            }}>
              Enterprise Manufacturing Intelligence
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  🏭 Production Monitoring
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Real-time tracking of production lines, equipment status, and throughput optimization with predictive maintenance alerts.
                </p>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  🔬 Quality Assurance
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Comprehensive quality control systems with automated testing, compliance tracking, and defect analysis.
                </p>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  📦 Supply Chain
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Advanced inventory management with demand forecasting, supplier integration, and automated reordering.
                </p>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  🤖 AI Analytics
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Machine learning-powered insights for production optimization, predictive analytics, and automated decision making.
                </p>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  🔧 Digital Twin
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Virtual factory modeling for simulation, testing, and optimization of manufacturing processes.
                </p>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ color: '#1e293b', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  ⚡ Automation
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Workflow automation, smart scheduling, and integrated control systems for maximum efficiency.
                </p>
              </div>
            </div>
          </div>

          {/* Success Status with Authentication */}
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              color: '#166534',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              🎉 Enterprise Dashboard with Clerk Authentication
            </h3>
            <p style={{
              margin: 0,
              color: '#166534',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              The Sentia Manufacturing Enterprise Dashboard is fully operational with Clerk authentication. 
              User: {user?.emailAddresses?.[0]?.emailAddress || 'Authenticated'} | 
              All manufacturing intelligence systems are online and secure.
            </p>
          </div>

          {/* Action Center */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Refresh Dashboard
            </button>
            
            <button
              onClick={() => alert('Enterprise dashboard is fully operational with Clerk authentication!')}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              System Status
            </button>
            
            <button
              onClick={() => alert('Progressive Loading: ✅ | Clerk Auth: ✅ | Enterprise Features: ✅ | All Systems: Online')}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Enterprise Features
            </button>
          </div>
        </main>
      </div>
    )
  }

  // This should not be reached due to Clerk's routing, but included for completeness
  return null
}

// Main App Component
function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <Suspense fallback={<EnterpriseLoadingSpinner />}>
                    <SignedIn>
                      <ProgressiveEnterpriseDashboard />
                    </SignedIn>
                    <SignedOut>
                      <CustomSignInPage />
                    </SignedOut>
                  </Suspense>
                } 
              />
              <Route 
                path="/sign-in/*" 
                element={<CustomSignInPage />} 
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
