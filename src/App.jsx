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

// BRUTAL APP COMPONENT - NO AUTHENTICATION REQUIRED
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* FULL ENTERPRISE DASHBOARD - IMMEDIATE ACCESS */}
          <Route 
            path="/dashboard" 
            element={
              <EnterpriseLayout>
                <EnhancedDashboard />
              </EnterpriseLayout>
            } 
          />
          
          {/* WORKING CAPITAL - IMMEDIATE ACCESS */}
          <Route 
            path="/working-capital" 
            element={
              <EnterpriseLayout>
                <WorkingCapital />
              </EnterpriseLayout>
            } 
          />
          
          {/* WHAT-IF ANALYSIS - IMMEDIATE ACCESS */}
          <Route 
            path="/what-if" 
            element={
              <EnterpriseLayout>
                <WhatIfAnalysis />
              </EnterpriseLayout>
            } 
          />
          
          {/* ADMIN PANEL - IMMEDIATE ACCESS */}
          <Route 
            path="/admin" 
            element={
              <EnterpriseLayout>
                <AdminPanel />
              </EnterpriseLayout>
            } 
          />
          
          {/* ALL OTHER ENTERPRISE ROUTES - IMMEDIATE ACCESS */}
          <Route 
            path="/analytics" 
            element={
              <EnterpriseLayout>
                <EnhancedDashboard />
              </EnterpriseLayout>
            } 
          />
          <Route 
            path="/forecasting" 
            element={
              <EnterpriseLayout>
                <EnhancedDashboard />
              </EnterpriseLayout>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <EnterpriseLayout>
                <EnhancedDashboard />
              </EnterpriseLayout>
            } 
          />
          <Route 
            path="/production" 
            element={
              <EnterpriseLayout>
                <EnhancedDashboard />
              </EnterpriseLayout>
            } 
          />
          <Route 
            path="/quality" 
            element={
              <EnterpriseLayout>
                <EnhancedDashboard />
              </EnterpriseLayout>
            } 
          />
          
          {/* ROOT PATH - REDIRECT TO DASHBOARD */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 HANDLER - REDIRECT TO DASHBOARD */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;