import React, { useState } from 'react'
import './App.css'

function AppSimple() {
  const [showDashboard, setShowDashboard] = useState(false)

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Sentia Manufacturing Dashboard</h1>
          <p className="text-xl text-gray-600">Enterprise Working Capital Intelligence Platform</p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">£3.17M</div>
              <div className="text-gray-600">Monthly Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">£170.3K</div>
              <div className="text-gray-600">Working Capital</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">94.8%</div>
              <div className="text-gray-600">Efficiency Rate</div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowDashboard(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Access Dashboard
            </button>
            <p className="mt-4 text-sm text-gray-500">No authentication required (Demo Mode)</p>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>✓ Real-time Analytics | ✓ AI-Powered Insights | ✓ Multi-Channel Integration</p>
        </div>
      </div>
    </div>
  )

  // Simple Dashboard Component
  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={() => setShowDashboard(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Landing
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
            <p className="text-2xl font-bold mt-2">£3.17M</p>
            <p className="text-sm text-green-600 mt-1">↑ 12.3% from last month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Working Capital</h3>
            <p className="text-2xl font-bold mt-2">£170.3K</p>
            <p className="text-sm text-green-600 mt-1">Healthy ratio: 2.76</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Production</h3>
            <p className="text-2xl font-bold mt-2">12,543 units</p>
            <p className="text-sm text-green-600 mt-1">94.2% efficiency</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Quality Score</h3>
            <p className="text-2xl font-bold mt-2">98.2%</p>
            <p className="text-sm text-green-600 mt-1">0.8% defect rate</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">API Status</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Xero: Error</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Shopify: Connected</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Unleashed: Connected</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>AI: Connected</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> This is a simplified version without authentication. Full
            features available in production mode.
          </p>
        </div>
      </main>
    </div>
  )

  return showDashboard ? <Dashboard /> : <LandingPage />
}

export default AppSimple
