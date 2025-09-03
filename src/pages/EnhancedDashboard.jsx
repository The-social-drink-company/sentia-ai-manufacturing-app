import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useHotkeys } from 'react-hotkeys-hook'
import { motion, AnimatePresence } from 'framer-motion'

// Layout components
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Grid from '../components/layout/Grid'

// Widgets
import KPIStrip from '../components/widgets/KPIStrip'
import DemandForecastWidget from '../components/widgets/DemandForecastWidget'
import CashFlowProjections from '../components/WorkingCapital/CashFlowProjections'
import KPIDashboard from '../components/WorkingCapital/KPIDashboard'

// Hooks and stores
import { useAuthRole } from '../hooks/useAuthRole.jsx'
import { useLayoutStore } from '../stores/layoutStore'
import { useSSE } from '../hooks/useSSE'
import { queryClient } from '../services/queryClient'
import { cn } from '../lib/utils'

// Simple widget components for demonstration
const StockStatusWidget = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Stock Status</h3>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          3 Alerts
        </span>
      </div>
      
      <div className="flex-1 space-y-4">
        {[
          { sku: 'SKU-001', level: 45, rop: 50, status: 'low' },
          { sku: 'SKU-002', level: 120, rop: 75, status: 'good' },
          { sku: 'SKU-003', level: 15, rop: 30, status: 'critical' }
        ].map(item => (
          <div key={item.sku} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-sm">{item.sku}</div>
              <div className="text-xs text-gray-500">ROP: {item.rop}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{item.level}</div>
              <div className={cn(
                "text-xs px-2 py-1 rounded",
                item.status === 'critical' && "bg-red-100 text-red-700",
                item.status === 'low' && "bg-yellow-100 text-yellow-700", 
                item.status === 'good' && "bg-green-100 text-green-700"
              )}>
                {item.status}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t">
        <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          View All Stock
        </button>
      </div>
    </div>
  )
}

const CapacityWidget = () => {
  const facilities = [
    { name: 'Infusion Line 1', utilization: 78.5, status: 'good' },
    { name: 'Bottling Line 2', utilization: 92.1, status: 'high' },
    { name: 'Packaging Unit', utilization: 65.3, status: 'good' }
  ]
  
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-medium mb-4">Capacity Utilization</h3>
      
      <div className="flex-1 space-y-4">
        {facilities.map(facility => (
          <div key={facility.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{facility.name}</span>
              <span className="text-sm">{facility.utilization}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  facility.status === 'high' ? "bg-red-500" : "bg-blue-500"
                )}
                style={{ width: `${facility.utilization}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t text-xs text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}

const SystemHealthWidget = () => {
  const healthMetrics = [
    { metric: 'API Response Time', value: '145ms', status: 'good' },
    { metric: 'Database Connection', value: 'Connected', status: 'good' },
    { metric: 'Queue Processing', value: '12 jobs', status: 'good' },
    { metric: 'Memory Usage', value: '67%', status: 'warning' }
  ]
  
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-medium mb-4">System Health</h3>
      
      <div className="flex-1 space-y-3">
        {healthMetrics.map(metric => (
          <div key={metric.metric} className="flex items-center justify-between">
            <span className="text-sm">{metric.metric}</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{metric.value}</span>
              <div className={cn(
                "w-3 h-3 rounded-full",
                metric.status === 'good' && "bg-green-400",
                metric.status === 'warning' && "bg-yellow-400",
                metric.status === 'error' && "bg-red-400"
              )} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t">
        <div className="text-xs text-gray-500">
          All systems operational
        </div>
      </div>
    </div>
  )
}

const RecentJobsWidget = () => {
  const [jobs] = useState([
    { id: 1, type: 'Forecast', status: 'completed', duration: '2m 34s', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
    { id: 2, type: 'Stock Optimization', status: 'running', duration: '1m 12s', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: 3, type: 'Working Capital', status: 'completed', duration: '45s', timestamp: new Date(Date.now() - 1000 * 60 * 30) }
  ])
  
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-medium mb-4">Recent Jobs</h3>
      
      <div className="flex-1 space-y-3">
        {jobs.map(job => (
          <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-sm">{job.type}</div>
              <div className="text-xs text-gray-500">
                {job.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">{job.duration}</div>
              <div className={cn(
                "text-xs px-2 py-1 rounded",
                job.status === 'completed' && "bg-green-100 text-green-700",
                job.status === 'running' && "bg-blue-100 text-blue-700",
                job.status === 'failed' && "bg-red-100 text-red-700"
              )}>
                {job.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const EnhancedDashboard = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { 
    theme, 
    sidebarCollapsed, 
    isEditing, 
    setEditing, 
    initializeLayout,
    currentLayout
  } = useLayoutStore()
  const { role, isAuthenticated, isLoading: authLoading, hasPermission } = useAuthRole()
  
  // SSE connection for real-time updates
  const { isConnected } = useSSE({
    enabled: isAuthenticated,
    onConnect: () => console.log('Dashboard connected to real-time updates'),
    onError: (error) => console.error('SSE connection error:', error)
  })
  
  // Handle query parameters for actions
  useEffect(() => {
    const action = searchParams.get('action')
    if (action) {
      switch (action) {
        case 'run-forecast':
          // Trigger forecast workflow
          console.log('Triggering forecast workflow')
          break
        case 'optimize-stock':
          // Trigger stock optimization workflow
          console.log('Triggering stock optimization workflow')
          break
        default:
          break
      }
    }
  }, [searchParams])
  
  // Initialize layout based on user role
  useEffect(() => {
    if (role && !currentLayout.lg) {
      initializeLayout(role)
    }
  }, [role, currentLayout.lg, initializeLayout])
  
  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])
  
  // Keyboard shortcuts
  useHotkeys('e', () => {
    if (hasPermission('dashboard.edit')) {
      setEditing(!isEditing)
    }
  }, { enableOnFormTags: false })
  
  useHotkeys('escape', () => {
    if (isEditing) {
      setEditing(false)
    }
  }, { enableOnFormTags: false })
  
  // Widget definitions
  const widgets = [
    {
      id: 'kpi-strip',
      title: 'Key Performance Indicators',
      component: <KPIStrip />
    },
    {
      id: 'demand-forecast',
      title: 'Demand Forecast',
      component: <DemandForecastWidget />
    },
    {
      id: 'working-capital',
      title: 'Working Capital Overview',
      component: <KPIDashboard />
    },
    {
      id: 'stock-status',
      title: 'Stock Status',
      component: <StockStatusWidget />
    },
    {
      id: 'capacity-util',
      title: 'Capacity Utilization',
      component: <CapacityWidget />
    },
    {
      id: 'system-health',
      title: 'System Health',
      component: <SystemHealthWidget />
    },
    {
      id: 'recent-jobs',
      title: 'Recent Jobs',
      component: <RecentJobsWidget />
    }
  ]
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please sign in to access the dashboard
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className={cn(
        "min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200",
        theme
      )}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-shrink-0"
              >
                <Sidebar />
              </motion.div>
            )}
          </AnimatePresence>
          
          {sidebarCollapsed && <Sidebar />}
          
          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            
            {/* Dashboard content */}
            <main className="flex-1 overflow-hidden p-6">
              <motion.div
                key="dashboard-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <Grid 
                  widgets={widgets}
                  onLayoutChange={(layout, allLayouts) => {
                    console.log('Layout changed:', { layout, allLayouts })
                  }}
                  className="h-full"
                />
              </motion.div>
            </main>
          </div>
        </div>
        
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg shadow-lg dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Reconnecting...</span>
            </div>
          </div>
        )}
        
        {/* Edit mode controls */}
        {isEditing && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Edit Mode Active</span>
              <button
                onClick={() => setEditing(false)}
                className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm"
              >
                Done (ESC)
              </button>
            </div>
          </div>
        )}
        
        {/* Help overlay */}
        <div className="fixed bottom-4 left-4">
          <button className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500">
            <span className="text-sm">Press ? for help</span>
          </button>
        </div>
      </div>
      
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

export default EnhancedDashboard