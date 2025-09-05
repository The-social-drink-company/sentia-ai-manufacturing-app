import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useLayoutStore } from '../../stores/layoutStore'
import { cn } from '../../lib/utils'

const DashboardLayout = ({ children }) => {
  const { sidebarCollapsed } = useLayoutStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <Header />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "transition-all duration-300 pt-16", // pt-16 for fixed header
          sidebarCollapsed ? "md:ml-16" : "md:ml-64" // Responsive margin for sidebar
        )}
      >
        <div className="container mx-auto px-4 py-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout