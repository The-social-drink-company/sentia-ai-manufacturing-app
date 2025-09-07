import React from 'react';

const SimpleDashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manufacturing Dashboard</h1>
        <p className="text-gray-600">Welcome to your Sentia Manufacturing Intelligence Platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">$</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">$125,430</p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">#</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Orders</h3>
              <p className="text-2xl font-bold text-gray-900">1,329</p>
              <p className="text-sm text-green-600">+5% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Customers</h3>
              <p className="text-2xl font-bold text-gray-900">892</p>
              <p className="text-sm text-green-600">+18% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Products</h3>
              <p className="text-2xl font-bold text-gray-900">156</p>
              <p className="text-sm text-red-600">-2% from last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Production Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Production Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Daily Target</span>
              <span className="font-semibold">2,500 units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Production</span>
              <span className="font-semibold text-green-600">2,340 units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Efficiency</span>
              <span className="font-semibold">93.6%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{width: '93.6%'}}></div>
            </div>
          </div>
        </div>

        {/* Quality Control */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quality Control</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pass Rate</span>
              <span className="font-semibold text-green-600">98.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Defect Rate</span>
              <span className="font-semibold text-red-600">1.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inspections Today</span>
              <span className="font-semibold">847</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                On Track
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Working Capital Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Working Capital</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Cash Flow</p>
            <p className="text-2xl font-bold text-green-600">+$45,320</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Inventory</p>
            <p className="text-2xl font-bold text-blue-600">$234,890</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Receivables</p>
            <p className="text-2xl font-bold text-orange-600">$123,560</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">📊</div>
            <span className="text-sm text-gray-700">Analytics</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">📈</div>
            <span className="text-sm text-gray-700">Forecasting</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">💰</div>
            <span className="text-sm text-gray-700">Working Capital</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">🔧</div>
            <span className="text-sm text-gray-700">What-If</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;