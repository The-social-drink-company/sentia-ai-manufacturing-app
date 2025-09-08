import React from 'react'

const QualityControl = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quality Control</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor quality metrics, testing schedules, and compliance standards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pass Rate</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">98.2%</p>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tests Today</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">47</p>
          <p className="text-sm text-gray-500 mt-1">Completed</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pending</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">8</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Alerts</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">2</p>
          <p className="text-sm text-gray-500 mt-1">Require attention</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quality Overview</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive quality control system monitoring all production batches and compliance metrics.
          </p>
        </div>
      </div>
    </div>
  )
}

export default QualityControl
