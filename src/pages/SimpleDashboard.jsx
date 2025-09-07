import React from 'react';

// Simple, reliable dashboard that always works
export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sentia Manufacturing Dashboard</h1>
          <p className="text-gray-600 mt-2">Enterprise Manufacturing Analytics & Control Center</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500">Production Output</h3>
            <p className="text-2xl font-bold text-gray-900">1,234 units</p>
            <p className="text-sm text-green-600">↗ +12% from yesterday</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500">Efficiency Rate</h3>
            <p className="text-2xl font-bold text-gray-900">94.2%</p>
            <p className="text-sm text-green-600">↗ +2.1% from last week</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium text-gray-500">Quality Score</h3>
            <p className="text-2xl font-bold text-gray-900">98.7%</p>
            <p className="text-sm text-yellow-600">→ Stable</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
            <p className="text-2xl font-bold text-gray-900">87</p>
            <p className="text-sm text-blue-600">24 urgent priority</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Production Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Line A - Assembly</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Running</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Line B - Packaging</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Running</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Line C - Quality Check</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-700">Order #12345 completed</span>
                <span className="text-gray-500 text-sm">2 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-700">Quality inspection passed</span>
                <span className="text-gray-500 text-sm">5 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-700">Maintenance scheduled</span>
                <span className="text-gray-500 text-sm">10 min ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Working Capital Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Working Capital Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">£1.2M</p>
              <p className="text-gray-600">Cash Flow</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">£890K</p>
              <p className="text-gray-600">Accounts Receivable</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">£450K</p>
              <p className="text-gray-600">Inventory Value</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}