import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import Sidebar from './components/Sidebar';
import WorkingCapitalCalculator from './components/WorkingCapitalCalculator';
import AIAnalyticsDashboard from './components/AI/AIAnalyticsDashboard';
import DataManagementCenter from './components/data/DataManagementCenter';
import ClerkAuthGuard from './components/auth/ClerkAuthGuard';
import ChatBot from './components/ChatBot';
import AIChatbot from './components/ai-chatbot/AIChatbot';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [activeSection, setActiveSection] = useState('executive-dashboard');

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl font-bold">🏭</span>
            </div>
            <h1 className="text-5xl font-bold">Sentia Manufacturing</h1>
          </div>
          <h2 className="text-2xl text-blue-200 mb-6">Enterprise Manufacturing Intelligence Platform</h2>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Advanced manufacturing analytics, AI-powered insights, and working capital optimization 
            for Fortune 500 enterprises. Transform your manufacturing operations with real-time 
            intelligence and predictive analytics.
          </p>
        </div>

        <div className="flex justify-center space-x-6 mb-12">
          <Button 
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
          >
            Enter Dashboard →
          </Button>
          <Button 
            onClick={() => setCurrentView('calculator')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
          >
            Working Capital Calculator 📊
          </Button>
          <Button 
            onClick={() => setCurrentView('ai-insights')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
          >
            AI Insights 🤖
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <CardTitle className="text-xl font-bold">Working Capital</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Optimize cash flow with £767K potential unlock and advanced financial modeling.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <CardTitle className="text-xl font-bold">AI Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                $354K savings potential through AI-powered manufacturing insights and optimization.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <CardTitle className="text-xl font-bold">Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Comprehensive data integration with 28,914 records and real-time synchronization.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <CardTitle className="text-xl font-bold">Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Live production monitoring with OEE tracking and predictive maintenance alerts.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-6">Enterprise Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold mb-2">🏭 Production Analytics</h4>
              <p className="text-gray-300 text-sm">Real-time OEE, throughput monitoring, and bottleneck analysis</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold mb-2">📱 Mobile Dashboard</h4>
              <p className="text-gray-300 text-sm">Operator-friendly mobile interface for floor management</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold mb-2">🔧 Predictive Maintenance</h4>
              <p className="text-gray-300 text-sm">AI-powered equipment failure prediction and scheduling</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold mb-2">📈 Executive Reports</h4>
              <p className="text-gray-300 text-sm">Board-ready reports with KPI tracking and variance analysis</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold mb-2">🔒 Enterprise Security</h4>
              <p className="text-gray-300 text-sm">Role-based access control and audit trail management</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold mb-2">🌐 API Integration</h4>
              <p className="text-gray-300 text-sm">Seamless ERP, MES, and SCADA system integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardLayout = () => (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto">
        <div className="p-4 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setCurrentView('landing')}
              className="bg-green-600 hover:bg-green-700"
            >
              ← Back to Landing
            </Button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                System Status: <span className="text-green-600 font-semibold">Online</span>
              </div>
              <div className="text-sm text-gray-600">
                Last Updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {activeSection === 'executive-dashboard' && <ExecutiveDashboard />}
          {activeSection === 'ai-analytics' && <AIAnalyticsDashboard />}
          {activeSection === 'data-management' && <DataManagementCenter />}
          {activeSection === 'working-capital' && <WorkingCapitalCalculator />}
          {activeSection === 'production' && <ProductionDashboard />}
          {activeSection === 'quality' && <QualityDashboard />}
          {activeSection === 'inventory' && <InventoryDashboard />}
          {activeSection === 'mobile' && <MobileDashboard />}
          {activeSection === 'reports' && <ReportsDashboard />}
          {activeSection === 'admin' && <AdminDashboard />}
        </div>
      </div>
      <ChatBot />
    </div>
  );

  const Calculator = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setCurrentView('landing')}
              className="bg-green-600 hover:bg-green-700"
            >
              ← Back to Landing
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Working Capital Calculator</h1>
            <div className="text-sm text-gray-600">
              Enterprise Financial Analysis
            </div>
          </div>
        </div>
        
        <WorkingCapitalCalculator />
      </div>
    </div>
  );

  const AIInsightsView = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setCurrentView('landing')}
              className="bg-green-600 hover:bg-green-700"
            >
              ← Back to Landing
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">AI Manufacturing Insights</h1>
            <div className="text-sm text-gray-600">
              Powered by Machine Learning
            </div>
          </div>
        </div>
        
        <AIAnalyticsDashboard />
      </div>
    </div>
  );

  // Placeholder components for dashboard sections
  const ExecutiveDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Executive Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">£2.1M</div>
            <p className="text-sm text-gray-600">+12.5% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Production Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">94.2%</div>
            <p className="text-sm text-gray-600">+2.1% vs target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">98.7%</div>
            <p className="text-sm text-gray-600">+0.3% improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">£354K</div>
            <p className="text-sm text-gray-600">AI-driven optimization</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={() => setActiveSection('working-capital')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Working Capital Analysis
          </Button>
          <Button 
            onClick={() => setActiveSection('ai-analytics')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            AI Insights
          </Button>
          <Button 
            onClick={() => setActiveSection('data-management')}
            className="bg-green-600 hover:bg-green-700"
          >
            Data Management
          </Button>
          <Button 
            onClick={() => setActiveSection('production')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Production Monitor
          </Button>
        </div>
      </div>
    </div>
  );

  // Additional placeholder components
  const ProductionDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Production Dashboard</h2>
      <p className="text-gray-600">Real-time production monitoring and OEE analysis coming soon...</p>
    </div>
  );

  const QualityDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Quality Control</h2>
      <p className="text-gray-600">SPC charts and quality metrics coming soon...</p>
    </div>
  );

  const InventoryDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Inventory Management</h2>
      <p className="text-gray-600">Advanced inventory analytics and optimization coming soon...</p>
    </div>
  );

  const MobileDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Mobile Dashboard</h2>
      <p className="text-gray-600">Mobile-optimized operator interface coming soon...</p>
    </div>
  );

  const ReportsDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
      <p className="text-gray-600">Board-ready report generation coming soon...</p>
    </div>
  );

  const AdminDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Administration</h2>
      <p className="text-gray-600">User management and system administration coming soon...</p>
    </div>
  );

  const AppContent = () => {
    if (currentView === 'dashboard') return <DashboardLayout />;
    if (currentView === 'calculator') return <Calculator />;
    if (currentView === 'ai-insights') return <AIInsightsView />;
    return <LandingPage />;
  };

  return (
    <ClerkAuthGuard>
      <AppContent />
      <AIChatbot />
    </ClerkAuthGuard>
  );
}

export default App;
