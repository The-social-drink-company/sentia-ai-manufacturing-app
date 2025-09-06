import { devLog } from '../lib/devLog.js';\nimport React from 'react'
import './App.css'

// Simple fallback dashboard without complex dependencies
function FallbackDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Sentia Manufacturing Dashboard
          </h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4" style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '0.375rem' }}>
            <p className="text-sm text-yellow-800">
              <strong>Authentication Disabled:</strong> Running without Clerk authentication.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div className="bg-blue-50 p-4 rounded-lg" style={{ backgroundColor: '#dbeafe', padding: '1rem' }}>
              <h3 className="font-semibold text-blue-900">Production Dashboard</h3>
              <p className="text-sm text-blue-700 mt-2">
                Monitor production metrics and KPIs
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg" style={{ backgroundColor: '#d1fae5', padding: '1rem' }}>
              <h3 className="font-semibold text-green-900">Forecasting</h3>
              <p className="text-sm text-green-700 mt-2">
                Demand and inventory predictions
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg" style={{ backgroundColor: '#ede9fe', padding: '1rem' }}>
              <h3 className="font-semibold text-purple-900">Analytics</h3>
              <p className="text-sm text-purple-700 mt-2">
                Real-time data and insights
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Dashboard Components</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold">KPI Metrics</h3>
              <div className="grid grid-cols-4 gap-4 mt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">98.5%</div>
                  <div className="text-sm text-gray-600">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1,234</div>
                  <div className="text-sm text-gray-600">Units/Day</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">45</div>
                  <div className="text-sm text-gray-600">Active Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">$2.3M</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  devLog.log('App-fixed.jsx is rendering')
  
  // Check for Clerk but don't fail if it's not available
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  if (!clerkPubKey) {
    devLog.log('Clerk not configured, showing fallback dashboard')
    return <FallbackDashboard />
  }
  
  // If we have Clerk key but it's not working, still show fallback
  return <FallbackDashboard />
}

export default App