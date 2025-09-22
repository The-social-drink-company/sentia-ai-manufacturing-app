import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import Sidebar from './components/Sidebar';
import ExecutiveDashboardAdvanced from './components/ExecutiveDashboardAdvanced';
import ChatBot from './components/ChatBot';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [activeSection, setActiveSection] = useState('executive-dashboard');

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl font-bold">📊</span>
            </div>
            <h1 className="text-5xl font-bold">Sentia Manufacturing</h1>
          </div>
          <h2 className="text-2xl text-blue-200 mb-6">Enterprise Working Capital Intelligence Platform</h2>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Advanced cash flow analysis and optimization for manufacturing enterprises. 
            Answer the critical questions: How much cash do you need? When do you need it? 
            How can you optimize working capital for growth?
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
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <CardTitle className="text-xl font-bold">Cash Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                How much cash in the bank do I need to cover expenses for 30, 60, 90, 120, 180 days?
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <CardTitle className="text-xl font-bold">Cash Injection Needs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Do I need investment, overdraft, or equity injection to fund current operations?
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <CardTitle className="text-xl font-bold">Growth Funding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                If I want to grow at xxx%, how much cash injection do I need to fund my growth?
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const DashboardLayout = () => (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <Button 
            onClick={() => setCurrentView('landing')}
            className="mb-4 bg-green-600 hover:bg-green-700"
          >
            ← Back to Landing
          </Button>
        </div>
        <ExecutiveDashboardAdvanced />
      </div>
      <ChatBot />
    </div>
  );

  const Calculator = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={() => setCurrentView('landing')}
          className="mb-6 bg-green-600 hover:bg-green-700"
        >
          ← Back to Landing
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Working Capital Calculator</h1>
          <p className="text-gray-600">Advanced cash flow analysis and optimization recommendations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Cash Flow Analysis</CardTitle>
            <p className="text-gray-600">Calculate your working capital requirements and optimization opportunities</p>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Working Capital Calculator functionality will be implemented here with:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Annual Revenue input and analysis</li>
              <li>• Debtor and Creditor days optimization</li>
              <li>• Cash flow projections for 30, 60, 90, 120, 180 days</li>
              <li>• Growth scenario modeling</li>
              <li>• AI-powered industry benchmarking</li>
              <li>• Board-ready talking points generation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (currentView === 'dashboard') return <DashboardLayout />;
  if (currentView === 'calculator') return <Calculator />;
  return <LandingPage />;
}

export default App;
