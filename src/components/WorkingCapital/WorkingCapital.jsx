import React, { useState, useEffect } from 'react'
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Sub-components
import KPIDashboard from './KPIDashboard'
import CashFlowProjections from './CashFlowProjections'
import ScenarioAnalysis from './ScenarioAnalysis'
import PolicyManagement from './PolicyManagement'
import SystemDiagnostics from './SystemDiagnostics'
import WorkingCapitalExpert from './WorkingCapitalExpert'

const WorkingCapital = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Real data loaded from API
  const [workingCapitalData, setWorkingCapitalData] = useState(null)

  useEffect(() => {
    const fetchWorkingCapitalData = async () => {
      try {
        setLoading(true)
        
        const response = await fetch('/api/working-capital/overview')
        
        if (response.ok) {
          const data = await response.json()
          setWorkingCapitalData(data)
        } else {
          console.error('Failed to load working capital data - API error')
          setWorkingCapitalData(null) // NO MOCK DATA - Real data only
        }
      } catch (error) {
        console.error('Error fetching working capital data:', error)
        setWorkingCapitalData(null) // NO MOCK DATA - Real data only
      } finally {
        setLoading(false)
      }
    }

    fetchWorkingCapitalData()
  }, [])

  // REMOVED: getMockData function - NO MOCK DATA ALLOWED per user requirements

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'expert', label: 'Expert Calculator', icon: BanknotesIcon },
    { id: 'projections', label: 'Cash Flow', icon: ArrowTrendingUpIcon },
    { id: 'scenarios', label: 'What-If Analysis', icon: DocumentTextIcon },
    { id: 'policies', label: 'Policies', icon: CogIcon },
    { id: 'diagnostics', label: 'Diagnostics', icon: ExclamationTriangleIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Working Capital Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive financial analysis and optimization tools
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Last updated</div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <ClockIcon className="w-4 h-4 mr-1" />
              {workingCapitalData.lastUpdated}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : workingCapitalData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Working Capital</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{((workingCapitalData.current || 0) / 1000000).toFixed(2)}M
                </p>
                <div className="flex items-center mt-1">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">{workingCapitalData.trend || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Projected (30 days)</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{((workingCapitalData.projected || 0) / 1000000).toFixed(2)}M
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  +£{(((workingCapitalData.projected || 0) - (workingCapitalData.current || 0)) / 1000).toFixed(0)}K improvement
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Optimization Potential</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{workingCapitalData.optimizationPct || '0'}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  £{(((workingCapitalData.current || 0) * ((workingCapitalData.optimizationPct || 0) / 100)) / 1000).toFixed(0)}K available
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Unable to load working capital data. Please check your API connection.</p>
        </div>
      )}

      {/* Alerts */}
      {workingCapitalData?.alerts && workingCapitalData.alerts.length > 0 && (
        <div className="space-y-3">
          {workingCapitalData.alerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'warning' 
                  ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-600' 
                  : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
              }`}
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className={`w-5 h-5 mr-3 ${
                  alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <p className={`text-sm ${
                  alert.type === 'warning' 
                    ? 'text-yellow-800 dark:text-yellow-200' 
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <KPIDashboard data={workingCapitalData} />}
        {activeTab === 'expert' && <WorkingCapitalExpert />}
        {activeTab === 'projections' && <CashFlowProjections />}
        {activeTab === 'scenarios' && <ScenarioAnalysis />}
        {activeTab === 'policies' && <PolicyManagement />}
        {activeTab === 'diagnostics' && <SystemDiagnostics />}
      </div>
    </div>
  )
}

export default WorkingCapital