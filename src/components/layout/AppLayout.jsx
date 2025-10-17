import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { cn } from '../../utils/cn'

import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Enterprise Header */}
      <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Main content area with Sidebar */}
      <div className="flex">
        {/* Enterprise Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        {/* Main content */}
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)]',
            'transition-all duration-300',
            'lg:ml-0'
          )}
        >
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
