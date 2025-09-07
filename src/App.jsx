import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EnhancedDashboard from './pages/EnhancedDashboard';
import WorkingCapital from './components/WorkingCapital';
import WhatIfAnalysis from './components/analytics/WhatIfAnalysis';
import AdminPanel from './pages/AdminPanel';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import './index.css';

// NUCLEAR CLERK PRO CONFIGURATION - FULL AUTHENTICATION WITH COMPLETE DASHBOARD
const clerkPubKey = 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk';

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

// Protected Routes Component  
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  
  return children;
};

// NUCLEAR APP COMPONENT WITH CLERK AUTHENTICATION + FULL DASHBOARD ACCESS
function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="App">
          {/* SIGNED IN USERS GET FULL ENTERPRISE ACCESS */}
          <SignedIn>
            <Routes>
              {/* FULL ENTERPRISE DASHBOARD - ALL FEATURES */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <EnhancedDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* WORKING CAPITAL - FULL ACCESS */}
              <Route 
                path="/working-capital" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <WorkingCapital />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* WHAT-IF ANALYSIS - FULL ACCESS */}
              <Route 
                path="/what-if" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <WhatIfAnalysis />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* ADMIN PANEL - FULL ACCESS */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <AdminPanel />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* ALL OTHER ENTERPRISE ROUTES - FULL ACCESS */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <EnhancedDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/forecasting" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <EnhancedDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <EnhancedDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/production" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <EnhancedDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quality" 
                element={
                  <ProtectedRoute>
                    <EnterpriseLayout>
                      <EnhancedDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* ROOT PATH - REDIRECT TO DASHBOARD */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 HANDLER - REDIRECT TO DASHBOARD */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SignedIn>
          
          {/* SIGNED OUT USERS - CLERK AUTHENTICATION */}
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;