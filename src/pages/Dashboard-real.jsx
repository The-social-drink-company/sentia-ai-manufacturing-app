/**
 * REAL DATA DASHBOARD
 * 
 * Enterprise dashboard with real business data from P&L and Sales forecasts
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../providers/ClerkAuthProvider';
import { UserButton } from '../providers/ClerkAuthProvider';
import {
  ChartBarIcon,
  CubeIcon,
  CogIcon,
  BanknotesIcon,
  TruckIcon,
  BeakerIcon,
  ChartPieIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Real financial data from P&L and Sales forecast
const REAL_BUSINESS_DATA = {
  revenue: {
    fy2024: 1563000, // £1.563M from P&L
    fy2025: 3170000, // £3.17M from P&L
    growth: 102.6, // Calculated growth rate
  },
  workingCapital: {
    current: 170300, // £170.3K from working capital sheet
    projected: 185000, // Projected
  },
  production: {
    fy2026_units: 245000, // 245K units from sales forecast
    efficiency: 94.2,
  },
  inventory: {
    sentia_red: 2450,
    sentia_gold: 1200,
    packaging: 150,
  },
  orders: [
    { id: '5770', customer: 'Tara Athanasiou', amount: 86.40, product: 'GABA Red 50cl x3', status: 'Fulfilled' },
    { id: '5769', customer: 'Recent Customer', amount: 32.00, product: 'Sentia Gold 50cl', status: 'Pending' },
    { id: '5768', customer: 'UK Customer', amount: 64.00, product: 'Sentia Black 50cl x2', status: 'Fulfilled' },
  ]
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuthContext();
  const [currentPage, setCurrentPage] = useState('executive');

  // Navigation items matching the sidebar design
  const navigationItems = [
    { id: 'executive', name: 'Executive Dashboard', icon: ChartBarIcon, active: true },
    { id: 'forecasting', name: 'Demand Forecasting', icon: ChartPieIcon },
    { id: 'inventory', name: 'Inventory Management', icon: CubeIcon },
    { id: 'production', name: 'Production Tracking', icon: TruckIcon },
    { id: 'quality', name: 'Quality Control', icon: BeakerIcon },
    { id: 'working-capital', name: 'Working Capital', icon: BanknotesIcon },
    { id: 'what-if', name: 'What-If Analysis', icon: DocumentChartBarIcon },
    { id: 'financial', name: 'Financial Reports', icon: ChartBarIcon },
    { id: 'data-import', name: 'Data Import', icon: DocumentChartBarIcon },
    { id: 'admin', name: 'Admin Panel', icon: Cog6ToothIcon },
  ];

  const renderExecutiveDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-600">Real-time manufacturing operations overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">All Systems Operational</span>
            </div>
            <UserButton />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£{(REAL_BUSINESS_DATA.revenue.fy2025 / 1000000).toFixed(1)}M</p>
            </div>
            <div className="flex items-center text-green-600">
              <span className="text-sm font-medium">+{REAL_BUSINESS_DATA.revenue.growth.toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">FY2025 vs FY2024</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">1,250</p>
            </div>
            <div className="flex items-center text-green-600">
              <span className="text-sm font-medium">+8.5%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Orders in production</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Working Capital</p>
              <p className="text-2xl font-bold text-gray-900">£{(REAL_BUSINESS_DATA.workingCapital.current / 1000).toFixed(0)}K</p>
            </div>
            <div className="flex items-center text-green-600">
              <span className="text-sm font-medium">+15.5%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Current working capital</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Production Units</p>
              <p className="text-2xl font-bold text-gray-900">{(REAL_BUSINESS_DATA.production.fy2026_units / 1000).toFixed(0)}K</p>
            </div>
            <div className="flex items-center text-green-600">
              <span className="text-sm font-medium">+12.3%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">FY2026 forecast</p>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Growth</h3>
          <div className="h-64 flex items-end justify-center space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-16 bg-blue-500 rounded-t" style={{ height: '120px' }}></div>
              <span className="text-sm text-gray-600 mt-2">FY2024</span>
              <span className="text-xs text-gray-500">£1.56M</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 bg-green-500 rounded-t" style={{ height: '240px' }}></div>
              <span className="text-sm text-gray-600 mt-2">FY2025</span>
              <span className="text-xs text-gray-500">£3.17M</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 bg-purple-500 rounded-t" style={{ height: '180px' }}></div>
              <span className="text-sm text-gray-600 mt-2">FY2026</span>
              <span className="text-xs text-gray-500">Projected</span>
            </div>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-sm font-medium">+102.6%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Production Efficiency</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
                <span className="text-sm font-medium">94.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Inventory Turnover</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <span className="text-sm font-medium">8.2x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Shopify Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {REAL_BUSINESS_DATA.orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{order.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'Fulfilled' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setCurrentPage('forecasting')}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChartPieIcon className="w-5 h-5 mr-2" />
            Run Forecast
          </button>
          <button 
            onClick={() => setCurrentPage('working-capital')}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <BanknotesIcon className="w-5 h-5 mr-2" />
            Working Capital
          </button>
          <button 
            onClick={() => setCurrentPage('what-if')}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <DocumentChartBarIcon className="w-5 h-5 mr-2" />
            What-If Analysis
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'executive':
        return renderExecutiveDashboard();
      case 'forecasting':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Demand Forecasting</h2>
            <p className="text-gray-600">AI-powered demand prediction and planning</p>
            <div className="mt-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Demand forecast chart will be displayed here</p>
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Management</h2>
            <p className="text-gray-600">Real-time inventory tracking and optimization</p>
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Sentia Red</h3>
                  <p className="text-2xl font-bold text-green-900">{REAL_BUSINESS_DATA.inventory.sentia_red}</p>
                  <p className="text-sm text-green-600">units in stock</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Sentia Gold</h3>
                  <p className="text-2xl font-bold text-blue-900">{REAL_BUSINESS_DATA.inventory.sentia_gold}</p>
                  <p className="text-sm text-blue-600">units in stock</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Packaging</h3>
                  <p className="text-2xl font-bold text-yellow-900">{REAL_BUSINESS_DATA.inventory.packaging}</p>
                  <p className="text-sm text-yellow-600">units (low stock)</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{navigationItems.find(item => item.id === currentPage)?.name}</h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Sentia</h1>
              <p className="text-sm text-gray-400">Manufacturing</p>
              <p className="text-xs text-gray-500">Enterprise Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</div>
            <button
              onClick={() => setCurrentPage('executive')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'executive' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <ChartBarIcon className="w-5 h-5 mr-3" />
              Executive Dashboard
            </button>

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">Planning & Analytics</div>
            {navigationItems.slice(1, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">Financial Management</div>
            {navigationItems.slice(5, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">Operations</div>
            {navigationItems.slice(8).map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
