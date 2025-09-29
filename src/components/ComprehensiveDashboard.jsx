import React, { useState, useEffect } from 'react';
import { UserButton } from '@clerk/clerk-react';
import {
  LayoutDashboardIcon, LineChartIcon, Package2Icon, FactoryIcon,
  FlaskConicalIcon, BrainIcon, DollarSignIcon, LayersIcon,
  DatabaseIcon, ShieldCheckIcon, MenuIcon, XIcon, BellIcon,
  SearchIcon, SettingsIcon, HelpCircleIcon
} from 'lucide-react';

// Import all page components
import DashboardEnterprise from '@/pages/DashboardEnterprise';
import WorkingCapitalComprehensive from '@/pages/WorkingCapitalComprehensive';
import WhatIfAnalysisComprehensive from '@/pages/WhatIfAnalysisComprehensive';
import EnterpriseAIChatbot from '@/components/EnterpriseAIChatbot';

// Placeholder components for other pages
const DemandForecasting = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Demand Forecasting</h1>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600">Advanced demand forecasting with AI-powered predictions coming soon...</p>
    </div>
  </div>
);

const InventoryManagement = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Inventory Management</h1>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600">Comprehensive inventory optimization and management tools coming soon...</p>
    </div>
  </div>
);

const ProductionTracking = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Production Tracking</h1>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600">Real-time production monitoring and analytics coming soon...</p>
    </div>
  </div>
);

const QualityControl = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Quality Control</h1>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600">Statistical process control and quality metrics coming soon...</p>
    </div>
  </div>
);

const AIAnalytics = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Analytics</h1>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600">Advanced AI-powered business analytics coming soon...</p>
    </div>
  </div>
);

const DataImport = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Import</h1>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600">Enterprise data integration and import tools coming soon...</p>
    </div>
  </div>
);

const AdminPanel = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel</h1>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600">System administration and user management coming soon...</p>
    </div>
  </div>
);

const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboardIcon, component: DashboardEnterprise }
    ]
  },
  {
    title: 'PLANNING & ANALYTICS',
    items: [
      { id: 'forecasting', label: 'Demand Forecasting', icon: LineChartIcon, component: DemandForecasting },
      { id: 'inventory', label: 'Inventory Management', icon: Package2Icon, component: InventoryManagement },
      { id: 'production', label: 'Production Tracking', icon: FactoryIcon, component: ProductionTracking },
      { id: 'quality', label: 'Quality Control', icon: FlaskConicalIcon, component: QualityControl }
    ]
  },
  {
    title: 'FINANCIAL MANAGEMENT',
    items: [
      { id: 'working-capital', label: 'Working Capital', icon: DollarSignIcon, component: WorkingCapitalComprehensive },
      { id: 'what-if', label: 'What-If Analysis', icon: LayersIcon, component: WhatIfAnalysisComprehensive },
      { id: 'analytics', label: 'Financial Reports', icon: BrainIcon, component: AIAnalytics }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { id: 'data-import', label: 'Data Import', icon: DatabaseIcon, component: DataImport },
      { id: 'admin', label: 'Admin Panel', icon: ShieldCheckIcon, component: AdminPanel }
    ]
  }
];

const ComprehensiveDashboard = () => {
  const [activePageId, setActivePageId] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Find the active page component
  const getActiveComponent = () => {
    for (const section of NAV_SECTIONS) {
      const item = section.items.find(item => item.id === activePageId);
      if (item) {
        return item.component;
      }
    }
    return DashboardEnterprise; // Default fallback
  };

  const ActiveComponent = getActiveComponent();

  const handleNavigation = (pageId) => {
    setActivePageId(pageId);
    console.log(`Navigating to: ${pageId}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg">Sentia</h1>
                  <p className="text-xs text-slate-400">Manufacturing</p>
                  <p className="text-xs text-slate-500">Enterprise Dashboard</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-slate-700"
            >
              {sidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* System Status */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b border-slate-700">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">All Systems Operational</span>
            </div>
            <div className="flex items-center space-x-2 text-xs mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-400">Live Data Connected</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const isActive = activePageId === item.id;
                  const globalIndex = sectionIndex * 10 + itemIndex + 1;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavigation(item.id)}
                        className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg mx-2 transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                            isActive ? 'bg-blue-700' : 'bg-slate-600'
                          }`}>
                            {globalIndex}
                          </div>
                          <item.icon className="h-5 w-5" />
                          {sidebarOpen && <span>{item.label}</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-slate-400">
              <p>Version 2.0.0-bulletproof</p>
              <p>© 2025 Sentia Manufacturing</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {NAV_SECTIONS.flatMap(s => s.items).find(item => item.id === activePageId)?.label || 'Dashboard'}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Dashboard</span>
                <span>•</span>
                <span>Manufacturing Intelligence</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All Systems Operational</span>
                </div>
                <span>•</span>
                <span>{new Date().toLocaleDateString('en-GB', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1 rounded">
                  ⌘K
                </kbd>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 bg-red-400 rounded-full"></span>
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <SettingsIcon className="h-5 w-5" />
              </button>

              {/* Help */}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <HelpCircleIcon className="h-5 w-5" />
              </button>

              {/* User */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">User • Enterprise</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
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
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <ActiveComponent />
        </main>
      </div>

      {/* AI Chatbot */}
      <EnterpriseAIChatbot />
    </div>
  );
};

export default ComprehensiveDashboard;
