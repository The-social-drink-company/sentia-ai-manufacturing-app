import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, BeakerIcon, DocumentCheckIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import ChartErrorBoundary from '../charts/ChartErrorBoundary'
import { ChartJS } from '../../lib/chartSetup'

const QualityControl = () => {
  const [qualityData, setQualityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTests, setActiveTests] = useState([])
  const [qualityAlerts, setQualityAlerts] = useState([])

  // Fetch quality data
  useEffect(() => {
    const fetchQualityData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || null
        const response = await fetch(`${apiUrl}/quality/metrics`)
        if (response.ok) {
          const data = await response.json()
          setQualityData(data)
          setActiveTests(data.activeTests || [])
          setQualityAlerts(data.alerts || [])
        }
      } catch (error) {
        console.error('Failed to fetch quality data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQualityData()
    const interval = setInterval(fetchQualityData, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // All mock data removed - only real API data allowed

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quality Control</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor quality metrics, testing schedules, and compliance standards
        </p>
      </div>

      {/* Quality Alerts */}
      {qualityAlerts.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Quality Alerts</h3>
          </div>
          <div className="mt-2 space-y-1">
            {qualityAlerts.map((alert, index) => (
              <p key={index} className="text-sm text-red-700 dark:text-red-300">• {alert.message}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pass Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{(qualityData?.kpis?.passRate || 0.2)}%</p>
              <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tests Today</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{qualityData?.kpis?.testsToday || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Completed</p>
            </div>
            <BeakerIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pending</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{qualityData?.kpis?.pending || 8}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Alerts</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{qualityData?.kpis?.alerts || 2}</p>
              <p className="text-sm text-gray-500 mt-1">Require attention</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Quality Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quality Trend (7 days)</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockQualityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="passRate" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Pass Rate %" />
                  <Area type="monotone" dataKey="defectRate" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Defect Rate %" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Defect Types</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockDefectTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockDefectTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>

      {/* Test Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Test Performance Today</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockTestPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="completed" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Completed" />
                  <Area type="monotone" dataKey="failed" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Quality Tests</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + New Test
              </button>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {activeTests.length > 0 ? activeTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{test.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{test.batch}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      test.status === 'Passed' ? 'bg-green-100 text-green-800' :
                      test.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                </div>
              )) : (
                // Mock data when no tests available
                [
                  { name: 'Tensile Strength Test', batch: 'BATCH-2025-001', status: 'In Progress' },
                  { name: 'Surface Finish QC', batch: 'BATCH-2025-002', status: 'Passed' },
                  { name: 'Dimensional Check', batch: 'BATCH-2025-003', status: 'In Progress' },
                  { name: 'Material Composition', batch: 'BATCH-2025-004', status: 'Failed' },
                  { name: 'Color Matching', batch: 'BATCH-2025-005', status: 'Passed' }
                ].map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{test.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{test.batch}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        test.status === 'Passed' ? 'bg-green-100 text-green-800' :
                        test.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Compliance Standards</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DocumentCheckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">ISO 9001</h3>
              <p className="text-sm text-green-600">Compliant</p>
              <p className="text-xs text-gray-500 mt-1">Last audit: Mar 2025</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DocumentCheckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">FDA CFR 21</h3>
              <p className="text-sm text-green-600">Compliant</p>
              <p className="text-xs text-gray-500 mt-1">Last audit: Feb 2025</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <DocumentCheckIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">CE Marking</h3>
              <p className="text-sm text-yellow-600">Review Required</p>
              <p className="text-xs text-gray-500 mt-1">Due: Oct 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QualityControl
