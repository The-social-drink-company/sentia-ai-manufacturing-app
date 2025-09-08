import React from 'react'

const ProductionTracking = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor production schedules, capacity, and performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Jobs</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
          <p className="text-sm text-gray-500 mt-1">Currently running</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Capacity</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">87%</p>
          <p className="text-sm text-gray-500 mt-1">Utilization rate</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Efficiency</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">94%</p>
          <p className="text-sm text-gray-500 mt-1">Overall equipment</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Output</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">1,234</p>
          <p className="text-sm text-gray-500 mt-1">Units today</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Production Overview</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Real-time production monitoring and analytics for manufacturing operations.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductionTracking
