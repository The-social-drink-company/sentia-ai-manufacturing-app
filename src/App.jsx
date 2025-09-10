import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, SignInButton, UserButton } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'react-hot-toast'
import './index.css'
import './styles/themes.css'
import './styles/landing.css'
import ThemeProvider from './components/ui/ThemeProvider'
import { logInfo, logWarn } from './services/observability/structuredLogger.js'

// Import Chart.js setup early to ensure registration
import './lib/chartSetup'

// Layout Components
import DashboardLayout from './components/layout/DashboardLayout'
import WorldClassLayout from './components/layout/WorldClassLayout'
import { LoadingSpinner } from './components/LoadingStates'
import ErrorBoundaryFallback from './components/ErrorBoundary'
// Lazy Load Pages for Performance
const LandingPage = lazy(() => import('./pages/LandingPage'))
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard'))
const WorldClassEnterpriseDashboard = lazy(() => import('./pages/WorldClassEnterpriseDashboard'))
const EnterpriseEnhancedDashboard = lazy(() => import('./pages/EnterpriseEnhancedDashboard'))
const SimpleDashboard = lazy(() => import('./pages/SimpleDashboard'))
// Removed: WorkingEnterpriseDashboard (deleted file - replaced with WorldClassEnterpriseDashboard)
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'))
const WhatIfAnalysisDashboard = lazy(() => import('./components/analytics/WhatIfAnalysisDashboard'))
const WorkingCapital = lazy(() => import('./components/WorkingCapital/WorkingCapital'))
const EnhancedWorkingCapital = lazy(() => import('./components/WorkingCapital/EnhancedWorkingCapital'))
const EnhancedWorkingCapitalAnalysis = lazy(() => import('./components/analytics/EnhancedWorkingCapitalAnalysis'))
const DataImportDashboard = lazy(() => import('./components/DataImport/DataImportDashboard'))
const EnhancedDataImportDashboard = lazy(() => import('./components/DataImport/EnhancedDataImportDashboard'))
const InventoryManagement = lazy(() => import('./components/inventory/InventoryManagement'))
const AdvancedInventoryManagement = lazy(() => import('./components/inventory/AdvancedInventoryManagement'))
const ProductionTracking = lazy(() => import('./components/production/ProductionTracking'))
const ProductionOptimization = lazy(() => import('./components/production/ProductionOptimization'))
const QualityControl = lazy(() => import('./components/quality/QualityControl'))
const QualityManagementSystem = lazy(() => import('./components/quality/QualityManagementSystem'))
const DemandForecasting = lazy(() => import('./components/forecasting/DemandForecasting'))
const EnhancedAIForecasting = lazy(() => import('./components/forecasting/EnhancedAIForecasting'))
const Analytics = lazy(() => import('./components/analytics/Analytics'))
const AdvancedAnalyticsDashboard = lazy(() => import('./components/analytics/AdvancedAnalyticsDashboard'))
const AIAnalyticsDashboard = lazy(() => import('./components/AI/AIAnalyticsDashboard'))
const PredictiveAnalyticsDashboard = lazy(() => import('./components/AI/PredictiveAnalyticsDashboard'))
const RealTimeMonitoring = lazy(() => import('./components/monitoring/RealTimeMonitoring'))
const MaintenanceManagement = lazy(() => import('./components/admin/pages/AdminMaintenance'))
// MCPConnectionStatus component removed - not required for enterprise dashboard
const SystemSettings = lazy(() => import('./components/settings/Settings'))
const APIStatusDiagnostic = lazy(() => import('./components/diagnostics/APIStatusDiagnostic'))

// Additional Enterprise Components
const FinancialReports = lazy(() => import('./components/financial/FinancialReports'))
const CostAnalysis = lazy(() => import('./components/financial/CostAnalysis'))
const AIInsights = lazy(() => import('./components/AI/AIInsights'))
const SmartAutomation = lazy(() => import('./components/automation/SmartAutomation'))
const AuditLogs = lazy(() => import('./components/admin/AuditLogs'))
const TestMonitorDashboard = lazy(() => import('./pages/TestMonitorDashboard'))
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))
const UIShowcase = lazy(() => import('./components/ui/UIShowcase'))
const UserPreferences = lazy(() => import('./pages/UserPreferences'))
const MobileFloor = lazy(() => import('./pages/MobileFloor'))
const MissionControl = lazy(() => import('./pages/MissionControl'))
const FactoryDigitalTwin = lazy(() => import('./components/3d/FactoryDigitalTwin'))

// AI Support Chatbot Component
const AISupportChatbot = lazy(() => import('./components/chatbot/AISupportChatbot'))
const AIStatusDashboard = lazy(() => import('./components/AI/AIStatusDashboard'))

// Enhanced Admin System Components
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminOverview = lazy(() => import('./components/admin/pages/AdminOverview'))
const AdminUsers = lazy(() => import('./components/admin/pages/AdminUsers'))
const AdminAPI = lazy(() => import('./components/admin/pages/AdminAPI'))
const AdminSettings = lazy(() => import('./components/admin/pages/AdminSettings'))
const AdminLogs = lazy(() => import('./components/admin/pages/AdminLogs'))
const AdminErrors = lazy(() => import('./components/admin/pages/AdminErrors'))
const AdminFeatureFlags = lazy(() => import('./components/admin/pages/AdminFeatureFlags'))
const AdminIntegrations = lazy(() => import('./components/admin/pages/AdminIntegrations'))
const AdminWebhooks = lazy(() => import('./components/admin/pages/AdminWebhooks'))


logInfo('Starting Sentia Enterprise Manufacturing Dashboard', { 
  deploymentTime: new Date().toISOString(), 
  continuousDeployment: true, 
  cycle: 4, 
  status: 'active', 
  railwaySync: 'confirmed',
  clerkProviderCheck: 'SINGLE_PROVIDER_ONLY',
  buildDate: '2025-09-08'
})

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Handle missing Clerk key gracefully
if (!clerkPubKey) {
  logWarn('VITE_CLERK_PUBLISHABLE_KEY is not set - running in guest mode')
} else {
  logInfo('Clerk key loaded', { keyPrefix: clerkPubKey.substring(0, 20) + '...' })
}

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.status === 404) return false
        return failureCount < 3
      }
    }
  }
})

// Protected route wrapper with guest access support
const ProtectedRoute = ({ children, allowGuest = false }) => {
  // If Clerk is not configured, always allow access
  if (!clerkPubKey) {
    return children
  }
  
  // Allow guest access for demo purposes
  if (allowGuest) {
    return children
  }
  
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

// Dashboard Route Component with Fallback Support
const DashboardRoute = () => {
  const [searchParams] = useSearchParams()
  const fallback = searchParams.get('fallback')
  
  if (fallback === 'true') {
    return <SimpleDashboard />
  }
  
  return (
    <ErrorBoundary 
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
            <p className="text-gray-600 mb-4">Enterprise dashboard failed to load.</p>
            <div className="flex space-x-3">
              <button 
                onClick={resetErrorBoundary}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard?fallback=true'}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Simple Mode
              </button>
            </div>
          </div>
        </div>
      )}
      onReset={() => window.location.reload()}
    >
      <WorldClassDashboard />
    </ErrorBoundary>
  )
}

// Fallback auth provider for when Clerk is not configured
const FallbackAuthProvider = ({ children }) => {
  return <div data-auth-provider="fallback">{children}</div>
}

function App() {
  // Use ClerkProvider if key is available, otherwise use fallback
  const AuthProvider = clerkPubKey ? ClerkProvider : FallbackAuthProvider
  const authProps = clerkPubKey ? { publishableKey: clerkPubKey, afterSignOutUrl: "/" } : {}
  
  return (
    <AuthProvider {...authProps}>
      <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Router>
            <div className="App">
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <LandingPage />
                  </Suspense>
                } />
                
                {/* Protected Routes with World-Class Layout - Guest Access Enabled */}
                <Route 
                  path="/dashboard/*" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <Routes>
                        <Route index element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <DashboardRoute />
                          </Suspense>
                        } />
                        <Route path="basic" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <WorldClassLayout>
                              <SimpleDashboard />
                            </WorldClassLayout>
                          </Suspense>
                        } />
                      </Routes>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Enterprise Pages with World-Class Layout - Guest Access Enabled */}
                <Route 
                  path="/working-capital" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ErrorBoundary 
                            FallbackComponent={({ error, resetErrorBoundary }) => (
                              <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Working Capital Error</h2>
                                  <p className="text-gray-600 mb-4">Enhanced working capital dashboard failed to load.</p>
                                  <div className="flex space-x-3">
                                    <button 
                                      onClick={resetErrorBoundary}
                                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                      Retry Enhanced
                                    </button>
                                    <button 
                                      onClick={() => window.location.href = '/working-capital/basic'}
                                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                    >
                                      Basic Mode
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          >
                            <EnhancedWorkingCapital />
                          </ErrorBoundary>
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/working-capital/basic" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <WorkingCapital />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/working-capital/enhanced" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <EnhancedWorkingCapital />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/what-if" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <WhatIfAnalysisDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/forecasting" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <EnhancedAIForecasting />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/forecasting/basic" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <DemandForecasting />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdvancedInventoryManagement />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/inventory/basic" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <InventoryManagement />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/production" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ProductionOptimization />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/production/tracking" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ProductionTracking />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/production/optimization" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ProductionOptimization />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/quality" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <QualityManagementSystem />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/quality/basic" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <QualityControl />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/quality/management" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <QualityManagementSystem />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdvancedAnalyticsDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/data-import" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <EnhancedDataImportDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/templates" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <DataImportDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/ai-analytics" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AIAnalyticsDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/ai-status" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AIStatusDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/api-status" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <APIStatusDiagnostic />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/predictive-analytics" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <PredictiveAnalyticsDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/maintenance" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <MaintenanceManagement />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                {/* MCP Status route removed - component not available */}

                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SystemSettings />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* User Preferences */}
                <Route 
                  path="/preferences" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <UserPreferences />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* User Profile (Clerk Pro Integration) */}
                <Route 
                  path="/user-profile" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Account Settings
                          </h1>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Manage your account settings, security, and profile information using Clerk Pro features.
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            This page integrates with your Clerk Pro account settings.
                          </p>
                        </div>
                      </div>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/monitoring" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <RealTimeMonitoring />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Enhanced Admin System with Nested Routes */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminLayout />
                      </Suspense>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminOverview />
                    </Suspense>
                  } />
                  <Route path="users" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminUsers />
                    </Suspense>
                  } />
                  <Route path="api" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminAPI />
                    </Suspense>
                  } />
                  <Route path="settings" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminSettings />
                    </Suspense>
                  } />
                  <Route path="logs" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminLogs />
                    </Suspense>
                  } />
                  <Route path="errors" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminErrors />
                    </Suspense>
                  } />
                  <Route path="feature-flags" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminFeatureFlags />
                    </Suspense>
                  } />
                  <Route path="integrations" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminIntegrations />
                    </Suspense>
                  } />
                  <Route path="webhooks" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminWebhooks />
                    </Suspense>
                  } />
                  <Route path="maintenance" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <MaintenanceManagement />
                    </Suspense>
                  } />
                  
                  {/* Legacy Admin Panel Route for Backward Compatibility */}
                  <Route path="legacy" element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminPanel />
                    </Suspense>
                  } />
                </Route>
                
                {/* Financial Management Routes */}
                <Route 
                  path="/financial-reports" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <FinancialReports />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/cost-analysis" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <CostAnalysis />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* AI & Integration Routes */}
                <Route 
                  path="/ai-insights" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AIInsights />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/automation" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SmartAutomation />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/audit-logs" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AuditLogs />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Alternative Dashboard Routes */}
                <Route 
                  path="/dashboard/enhanced" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <EnhancedDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/dashboard/enterprise" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <WorldClassEnterpriseDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/dashboard/test-monitor" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <TestMonitorDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* UI Experience Showcase */}
                <Route 
                  path="/ui-showcase" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <Suspense fallback={<LoadingSpinner />}>
                        <UIShowcase />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Mobile Manufacturing Floor Interface */}
                <Route 
                  path="/mobile" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <Suspense fallback={<LoadingSpinner />}>
                        <MobileFloor />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Redirect to dashboard for any other route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              
              {/* Global Toast Notifications */}
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
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App;