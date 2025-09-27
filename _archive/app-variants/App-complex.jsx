import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './App.css'

// Import components
import LandingPage from './components/LandingPage'
import DashboardLayout from './components/DashboardLayout'
import ExecutiveDashboard from './components/ExecutiveDashboard'
import WorkingCapitalCalculator from './components/WorkingCapitalCalculator'
import WhatIfAnalysis from './components/WhatIfAnalysis'
import FinancialReports from './components/FinancialReports'
import DemandForecasting from './components/DemandForecasting'
import InventoryManagement from './components/InventoryManagement'
import ProductionTracking from './components/ProductionTracking'
import QualityControl from './components/QualityControl'
import DataImport from './components/DataImport'
import AdminPanel from './components/AdminPanel'

// Clerk configuration
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZXhhbXBsZS1jbGVyay1rZXk'

// Protected Route Component
function ProtectedRoute({ children }) {
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

// Dashboard Routes Component
function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ExecutiveDashboard />} />
        <Route path="/working-capital" element={<WorkingCapitalCalculator />} />
        <Route path="/what-if-analysis" element={<WhatIfAnalysis />} />
        <Route path="/financial-reports" element={<FinancialReports />} />
        <Route path="/demand-forecasting" element={<DemandForecasting />} />
        <Route path="/inventory-management" element={<InventoryManagement />} />
        <Route path="/production-tracking" element={<ProductionTracking />} />
        <Route path="/quality-control" element={<QualityControl />} />
        <Route path="/data-import" element={<DataImport />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
      </Routes>
    </DashboardLayout>
  )
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Protected Dashboard Routes */}
              <Route 
                path="/app/*" 
                element={
                  <ProtectedRoute>
                    <DashboardRoutes />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Global Toast Notifications */}
            <Toaster 
              position="top-right" 
              expand={true}
              richColors
              closeButton
            />
          </div>
        </Router>
      </ThemeProvider>
    </ClerkProvider>
  )
}

export default App
