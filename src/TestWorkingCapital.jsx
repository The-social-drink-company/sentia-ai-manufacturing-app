import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function TestWorkingCapital() {
  const [chartData, setChartData] = useState({
    workingCapitalTrend: null,
    cashFlowAnalysis: null
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Mock data for demonstration
  const mockData = {
    cashFlow: {
      current: 450000,
      trend: '+12.5%',
      status: 'healthy'
    },
    receivables: {
      total: 1250000,
      overdue: 125000,
      dso: 45
    },
    payables: {
      total: 780000,
      due: 95000,
      dpo: 38
    },
    inventory: {
      value: 2100000,
      turnover: 8.2,
      daysOnHand: 44
    }
  }

  useEffect(() => {
    // Generate working capital trend data
    const generateWorkingCapitalData = () => {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      const workingCapitalData = [2850000, 2920000, 2780000, 3100000, 3250000, 3400000]
      const cashFlowData = [420000, 385000, 450000, 510000, 485000, 520000]
      
      return {
        labels,
        datasets: [
          {
            label: 'Working Capital ($)',
            data: workingCapitalData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Cash Flow ($)',
            data: cashFlowData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      }
    }

    // Generate cash flow analysis data
    const generateCashFlowData = () => {
      const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      const inflows = [180000, 220000, 195000, 240000]
      const outflows = [165000, 185000, 170000, 195000]
      
      return {
        labels,
        datasets: [
          {
            label: 'Cash Inflows',
            data: inflows,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2
          },
          {
            label: 'Cash Outflows',
            data: outflows,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2
          }
        ]
      }
    }

    setChartData({
      workingCapitalTrend: generateWorkingCapitalData(),
      cashFlowAnalysis: generateCashFlowData()
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">SENTIA Manufacturing</h1>
            <nav className="hidden md:flex gap-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Dashboard</Link>
              <Link to="/ai-dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">AI Dashboard</Link>
              <Link to="/working-capital" className="text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-2 rounded-md bg-blue-50">Working Capital</Link>
              <Link to="/data-import" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Data Import</Link>
              <Link to="/admin" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Admin</Link>
            </nav>
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <nav className="flex flex-col gap-2">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Dashboard</Link>
            <Link to="/ai-dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">AI Dashboard</Link>
            <Link to="/working-capital" className="text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-2 rounded-md bg-blue-50">Working Capital</Link>
            <Link to="/data-import" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Data Import</Link>
            <Link to="/admin" className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-50">Admin</Link>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Working Capital Management</h2>
          <p className="text-gray-600">Monitor and optimize your financial operations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Cash Flow</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${(mockData.cashFlow.current / 1000).toFixed(0)}k</p>
            <p className="text-sm text-green-600 font-medium">{mockData.cashFlow.trend} from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Accounts Receivable</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${(mockData.receivables.total / 1000000).toFixed(2)}M</p>
            <p className="text-sm text-blue-600 font-medium">DSO: {mockData.receivables.dso} days</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Accounts Payable</h3>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${(mockData.payables.total / 1000).toFixed(0)}k</p>
            <p className="text-sm text-yellow-600 font-medium">DPO: {mockData.payables.dpo} days</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Inventory Value</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">${(mockData.inventory.value / 1000000).toFixed(1)}M</p>
            <p className="text-sm text-purple-600 font-medium">Turnover: {mockData.inventory.turnover}x</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Conversion Cycle</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Days Sales Outstanding</span>
                  <span className="text-sm font-medium">{mockData.receivables.dso} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Days Inventory Outstanding</span>
                  <span className="text-sm font-medium">{mockData.inventory.daysOnHand} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '44%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Days Payable Outstanding</span>
                  <span className="text-sm font-medium">{mockData.payables.dpo} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Cash Conversion Cycle</span>
                  <span className="text-lg font-bold text-green-600">
                    {mockData.receivables.dso + mockData.inventory.daysOnHand - mockData.payables.dpo} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Working Capital Trend</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">6 months</span>
              </div>
            </div>
            <div className="h-64">
              {chartData.workingCapitalTrend ? (
                <Line 
                  data={chartData.workingCapitalTrend} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      x: {
                        display: true,
                        title: {
                          display: true,
                          text: 'Month'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Working Capital ($)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Cash Flow ($)'
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse bg-gray-300 h-4 w-20 rounded mb-2 mx-auto"></div>
                    <p className="text-gray-400 text-sm">Loading chart...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Current: $3.4M</span>
              <span className="text-green-600 font-medium">↑ 19.3% vs last year</span>
            </div>
          </div>
        </div>

        {/* Additional Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cash Flow Analysis</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Weekly</span>
              </div>
            </div>
            <div className="h-64">
              {chartData.cashFlowAnalysis ? (
                <Bar 
                  data={chartData.cashFlowAnalysis} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse bg-gray-300 h-4 w-20 rounded mb-2 mx-auto"></div>
                    <p className="text-gray-400 text-sm">Loading chart...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Net Flow: $75k/week</span>
              <span className="text-green-600 font-medium">Positive trend</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Ratios</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Ratio</span>
                  <span className="text-lg font-bold text-blue-600">2.4</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full relative" style={{ width: '80%' }}>
                    <div className="absolute right-0 top-0 h-3 w-1 bg-blue-700 rounded-r-full"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: 2.0+ (Healthy)</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Quick Ratio</span>
                  <span className="text-lg font-bold text-green-600">1.8</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full relative" style={{ width: '90%' }}>
                    <div className="absolute right-0 top-0 h-3 w-1 bg-green-700 rounded-r-full"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: 1.0+ (Excellent)</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Working Capital Ratio</span>
                  <span className="text-lg font-bold text-purple-600">1.6</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full relative" style={{ width: '65%' }}>
                    <div className="absolute right-0 top-0 h-3 w-1 bg-purple-700 rounded-r-full"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: 1.2+ (Good)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Review Overdue Receivables</p>
                  <p className="text-sm text-gray-600">${(mockData.receivables.overdue / 1000).toFixed(0)}k in overdue payments require immediate attention</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Optimize Payment Terms</p>
                  <p className="text-sm text-gray-600">Consider negotiating extended payment terms with suppliers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Strong Inventory Turnover</p>
                  <p className="text-sm text-gray-600">Current turnover rate of {mockData.inventory.turnover}x is above industry average</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TestWorkingCapital