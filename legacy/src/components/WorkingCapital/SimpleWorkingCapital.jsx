import React from 'react'

const SimpleWorkingCapital = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          ðŸ­ Working Capital Management
        </h1>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          âœ… <strong>Success!</strong> The Working Capital page is loading correctly.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Ratio</h3>
            <div className="text-3xl font-bold text-blue-600">2.34</div>
            <p className="text-sm text-blue-600 mt-1">Strong liquidity position</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Cash Conversion</h3>
            <div className="text-3xl font-bold text-green-600">45 days</div>
            <p className="text-sm text-green-600 mt-1">Efficient cash cycle</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Working Capital</h3>
            <div className="text-3xl font-bold text-purple-600">Â£2.4M</div>
            <p className="text-sm text-purple-600 mt-1">Healthy buffer maintained</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              ðŸ“Š View Cash Flow
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              ðŸ“ˆ Run Forecast
            </button>
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              ðŸŽ¯ Optimize Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleWorkingCapital
