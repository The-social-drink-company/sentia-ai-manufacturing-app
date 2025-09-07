import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EnhancedDashboard from './pages/EnhancedDashboard';
import WorkingCapital from './components/WorkingCapital';
import WhatIfAnalysis from './components/analytics/WhatIfAnalysis';
import AdminPanel from './pages/AdminPanel';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import './index.css';

// NUCLEAR SOLUTION: 100% OPEN ACCESS - NO AUTHENTICATION BARRIERS

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

// NO PROTECTION - EVERYONE GETS FULL ACCESS
const OpenRoute = ({ children }) => {
  return children;
};

// NUCLEAR APP COMPONENT - 100% OPEN ACCESS - NO AUTHENTICATION BARRIERS
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* FULL ENTERPRISE DASHBOARD - 100% OPEN ACCESS */}
          <Route 
            path="/dashboard" 
            element={
              <EnterpriseLayout>
                <EnhancedDashboard />
              </EnterpriseLayout>
            } 
          />
          
          {/* WORKING CAPITAL - 100% OPEN ACCESS */}
          <Route 
            path="/working-capital" 
            element={
              <EnterpriseLayout>
                <WorkingCapital />
              </EnterpriseLayout>
            } 
          />
          
          {/* WHAT-IF ANALYSIS - 100% OPEN ACCESS */}
          <Route 
            path="/what-if" 
            element={
              <EnterpriseLayout>
                <WhatIfAnalysis />
              </EnterpriseLayout>
            } 
          />
          
          {/* ADMIN PANEL - 100% OPEN ACCESS */}
          <Route 
            path="/admin" 
            element={
              <EnterpriseLayout>
                <AdminPanel />
              </EnterpriseLayout>
            } 
          />
          
          {/* ALL OTHER ENTERPRISE ROUTES - 100% OPEN ACCESS */}
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