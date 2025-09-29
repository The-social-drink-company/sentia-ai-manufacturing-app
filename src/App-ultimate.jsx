import React, { useState, useEffect } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  LayoutDashboardIcon, LineChartIcon, Package2Icon, FactoryIcon,
  FlaskConicalIcon, BrainIcon, DollarSignIcon, LayersIcon,
  DatabaseIcon, ShieldCheckIcon, MenuIcon, XIcon, BellIcon,
  SearchIcon, SettingsIcon, HelpCircleIcon, TrendingUpIcon,
  BarChart3Icon, PieChartIcon, ActivityIcon, CalendarIcon,
  FilterIcon, RefreshCwIcon, DownloadIcon, ShareIcon
} from 'lucide-react'

// Import the magnificent enterprise components
import LandingPage from './LandingPage'
import ExecutiveDashboard from './components/ExecutiveDashboard'
import DemandForecasting from './components/DemandForecasting'
import InventoryManagement from './components/InventoryManagement'
import FinancialReports from './components/FinancialReports'
import DataImport from './components/DataImport'
import AdminPanel from './components/AdminPanel'
import WhatIfAnalysisComprehensive from './pages/WhatIfAnalysisComprehensive'
import WorkingCapitalComprehensive from './pages/WorkingCapitalComprehensive'

// Import additional enterprise components
import ProductionTracking from './components/ProductionTracking'
import QualityControl from './components/QualityControl'
import EnterpriseAIChatbot from './components/EnterpriseAIChatbot'

const queryClient = new QueryClient()

// Production Tracking Component
const ProductionTrackingComponent = () => {
  const [productionData, setProductionData] = useState({
    dailyOutput: 2450,
    efficiency: 94.2,
    downtime: 3.8,
    qualityRate: 98.5,
    oee: 91.7
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Production Tracking</h1>
          <p className="text-blue-200 mt-2">Real-time manufacturing operations monitoring</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <RefreshCwIcon className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Daily Output</p>
              <p className="text-2xl font-bold">{productionData.dailyOutput.toLocaleString()}</p>
              <p className="text-blue-200 text-sm">Units</p>
            </div>
            <FactoryIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">Efficiency</p>
              <p className="text-2xl font-bold">{productionData.efficiency}%</p>
              <p className="text-green-200 text-sm">Target: 95%</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-200 text-sm">Downtime</p>
              <p className="text-2xl font-bold">{productionData.downtime}%</p>
              <p className="text-yellow-200 text-sm">Target: <5%</p>
            </div>
            <ActivityIcon className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Quality Rate</p>
              <p className="text-2xl font-bold">{productionData.qualityRate}%</p>
              <p className="text-purple-200 text-sm">Target: 99%</p>
            </div>
            <FlaskConicalIcon className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm">OEE</p>
              <p className="text-2xl font-bold">{productionData.oee}%</p>
              <p className="text-indigo-200 text-sm">Overall Equipment Effectiveness</p>
            </div>
            <BarChart3Icon className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Production Line Status</h2>
        <div className="space-y-4">
          {[
            { line: 'Line A - GABA Production', status: 'Running', efficiency: 96.2, output: 850 },
            { line: 'Line B - Nootropic Blending', status: 'Running', efficiency: 92.8, output: 720 },
            { line: 'Line C - Packaging', status: 'Maintenance', efficiency: 0, output: 0 },
            { line: 'Line D - Quality Control', status: 'Running', efficiency: 98.1, output: 880 }
          ].map((line, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${line.status === 'Running' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div>
                  <p className="text-white font-medium">{line.line}</p>
                  <p className="text-slate-400 text-sm">Status: {line.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{line.efficiency}% Efficiency</p>
                <p className="text-slate-400 text-sm">{line.output} units/hour</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Quality Control Component
const QualityControlComponent = () => {
  const [qualityMetrics, setQualityMetrics] = useState({
    defectRate: 1.5,
    firstPassYield: 98.5,
    customerComplaints: 0.2,
    returnRate: 0.8,
    certificationStatus: 'ISO 9001:2015'
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quality Control</h1>
          <p className="text-blue-200 mt-2">Comprehensive quality management and monitoring</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <FlaskConicalIcon className="w-4 h-4" />
            <span>Run Tests</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm">Defect Rate</p>
              <p className="text-2xl font-bold">{qualityMetrics.defectRate}%</p>
              <p className="text-red-200 text-sm">Target: <2%</p>
            </div>
            <ActivityIcon className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">First Pass Yield</p>
              <p className="text-2xl font-bold">{qualityMetrics.firstPassYield}%</p>
              <p className="text-green-200 text-sm">Target: >98%</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Customer Complaints</p>
              <p className="text-2xl font-bold">{qualityMetrics.customerComplaints}%</p>
              <p className="text-blue-200 text-sm">Target: <0.5%</p>
            </div>
            <BellIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Return Rate</p>
              <p className="text-2xl font-bold">{qualityMetrics.returnRate}%</p>
              <p className="text-purple-200 text-sm">Target: <1%</p>
            </div>
            <Package2Icon className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm">Certification</p>
              <p className="text-lg font-bold">ISO 9001</p>
              <p className="text-indigo-200 text-sm">Valid until 2026</p>
            </div>
            <ShieldCheckIcon className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quality Control Tests</h2>
        <div className="space-y-4">
          {[
            { test: 'Chemical Composition Analysis', status: 'Passed', score: 98.2, lastRun: '2 hours ago' },
            { test: 'Microbiological Testing', status: 'Passed', score: 99.1, lastRun: '4 hours ago' },
            { test: 'Physical Properties Test', status: 'Passed', score: 97.8, lastRun: '1 hour ago' },
            { test: 'Packaging Integrity Check', status: 'In Progress', score: null, lastRun: 'Running now' },
            { test: 'Label Accuracy Verification', status: 'Passed', score: 100, lastRun: '30 minutes ago' }
          ].map((test, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  test.status === 'Passed' ? 'bg-green-500' : 
                  test.status === 'In Progress' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-white font-medium">{test.test}</p>
                  <p className="text-slate-400 text-sm">Last run: {test.lastRun}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{test.status}</p>
                {test.score && <p className="text-slate-400 text-sm">Score: {test.score}%</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('executive-dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigationItems = [
    { id: 'executive-dashboard', label: 'Executive Dashboard', icon: LayoutDashboardIcon, number: 1 },
    { id: 'demand-forecasting', label: 'Demand Forecasting', icon: LineChartIcon, number: 2 },
    { id: 'inventory-management', label: 'Inventory Management', icon: Package2Icon, number: 3 },
    { id: 'production-tracking', label: 'Production Tracking', icon: FactoryIcon, number: 4 },
    { id: 'quality-control', label: 'Quality Control', icon: FlaskConicalIcon, number: 5 },
    { id: 'working-capital', label: 'Working Capital', icon: DollarSignIcon, number: 6 },
    { id: 'what-if-analysis', label: 'What-If Analysis', icon: BrainIcon, number: 7 },
    { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3Icon, number: 8 },
    { id: 'data-import', label: 'Data Import', icon: DatabaseIcon, number: 9 },
    { id: 'admin-panel', label: 'Admin Panel', icon: SettingsIcon, number: 10 }
  ]

  const getActiveComponent = () => {
    switch (currentPage) {
      case 'executive-dashboard':
        return <ExecutiveDashboard />
      case 'demand-forecasting':
        return <DemandForecasting />
      case 'inventory-management':
        return <InventoryManagement />
      case 'production-tracking':
        return <ProductionTrackingComponent />
      case 'quality-control':
        return <QualityControlComponent />
      case 'working-capital':
        return <WorkingCapitalComprehensive />
      case 'what-if-analysis':
        return <WhatIfAnalysisComprehensive />
      case 'financial-reports':
        return <FinancialReports />
      case 'data-import':
        return <DataImport />
      case 'admin-panel':
        return <AdminPanel />
      default:
        return <ExecutiveDashboard />
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <SignedOut>
          <LandingPage />
        </SignedOut>
        
        <SignedIn>
          <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-20'} bg-slate-800/90 backdrop-blur-sm border-r border-slate-700 transition-all duration-300 flex flex-col`}>
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    {sidebarOpen && (
                      <div>
                        <h1 className="text-white font-bold text-lg">Sentia Manufacturing</h1>
                        <p className="text-slate-400 text-sm">Enterprise Dashboard</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {sidebarOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-6">
                <div className="space-y-1 px-3">
                  {/* Overview Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">OVERVIEW</p>}
                    <button
                      onClick={() => setCurrentPage('executive-dashboard')}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                        currentPage === 'executive-dashboard'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white text-sm font-bold">
                        1
                      </div>
                      {sidebarOpen && <span className="font-medium">Executive Dashboard</span>}
                    </button>
                  </div>

                  {/* Planning & Analytics Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">PLANNING & ANALYTICS</p>}
                    <div className="space-y-1">
                      {navigationItems.slice(1, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setCurrentPage(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            currentPage === item.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-lg text-white text-sm font-bold">
                            {item.number}
                          </div>
                          {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial Management Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">FINANCIAL MANAGEMENT</p>}
                    <div className="space-y-1">
                      {navigationItems.slice(5, 8).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setCurrentPage(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            currentPage === item.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-lg text-white text-sm font-bold">
                            {item.number}
                          </div>
                          {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Operations Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">OPERATIONS</p>}
                    <div className="space-y-1">
                      {navigationItems.slice(8, 10).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setCurrentPage(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            currentPage === item.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-lg text-white text-sm font-bold">
                            {item.number}
                          </div>
                          {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Bar */}
              <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium">All Systems Operational</span>
                      <span className="text-slate-400">•</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-400 font-medium">Live Data Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <SearchIcon className="w-5 h-5" />
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <BellIcon className="w-5 h-5" />
                    </button>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8"
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div className="flex-1 overflow-y-auto">
                {getActiveComponent()}
              </div>
            </div>
          </div>

          {/* AI Chatbot */}
          <EnterpriseAIChatbot />
        </SignedIn>
      </div>
    </QueryClientProvider>
  )
}

export default App
