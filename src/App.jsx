import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import './index.css';

// Get Clerk publishable key with fallback
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk';

// Enterprise Layout with Full Navigation
const EnterpriseLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected Layout Wrapper
const ProtectedLayout = ({ children, requireAdmin = false, requiredRole = null }) => {
  return (
    <SignedIn>
      <ProtectedRoute requireAdmin={requireAdmin} requiredRole={requiredRole}>
        <EnterpriseLayout>
          {children}
        </EnterpriseLayout>
      </ProtectedRoute>
    </SignedIn>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* FULL ENTERPRISE DASHBOARD - AUTHENTICATED ACCESS */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedLayout>
                    <EnhancedDashboard />
                  </ProtectedLayout>
                } 
              />
              
              {/* WORKING CAPITAL - MANAGER+ ACCESS */}
              <Route 
                path="/working-capital" 
                element={
                  <ProtectedLayout requiredRole="manager">
                    <WorkingCapital />
                  </ProtectedLayout>
                } 
              />
              
              {/* WHAT-IF ANALYSIS - MANAGER+ ACCESS */}
              <Route 
                path="/what-if" 
                element={
                  <ProtectedLayout requiredRole="manager">
                    <WhatIfAnalysis />
                  </ProtectedLayout>
                } 
              />
              
              {/* ADMIN PANEL - ADMIN ONLY */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedLayout requireAdmin={true}>
                    <AdminPanel />
                  </ProtectedLayout>
                } 
              />
              
              {/* ANALYTICS - AUTHENTICATED ACCESS */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedLayout>
                    <EnhancedDashboard />
                  </ProtectedLayout>
                } 
              />
              
              {/* FORECASTING - AUTHENTICATED ACCESS */}
              <Route 
                path="/forecasting" 
                element={
                  <ProtectedLayout>
                    <EnhancedDashboard />
                  </ProtectedLayout>
                } 
              />
              
              {/* INVENTORY - AUTHENTICATED ACCESS */}
              <Route 
                path="/inventory" 
                element={
                  <ProtectedLayout>
                    <EnhancedDashboard />
                  </ProtectedLayout>
                } 
              />
              
              {/* PRODUCTION - AUTHENTICATED ACCESS */}
              <Route 
                path="/production" 
                element={
                  <ProtectedLayout>
                    <EnhancedDashboard />
                  </ProtectedLayout>
                } 
              />
              
              {/* QUALITY - AUTHENTICATED ACCESS */}
              <Route 
                path="/quality" 
                element={
                  <ProtectedLayout>
                    <EnhancedDashboard />
                  </ProtectedLayout>
                } 
              />
              
              {/* PUBLIC LANDING PAGE */}
              <Route path="/" element={<LandingPage />} />
              
              {/* 404 HANDLER - REDIRECT TO DASHBOARD */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            {/* Redirect unauthenticated users to sign in */}
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </div>
        </Router>
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;