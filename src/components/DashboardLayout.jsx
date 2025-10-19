import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import EnterpriseAIChatbot from '@/components/EnterpriseAIChatbot'
import CommandPalette from '@/components/dashboard/CommandPalette'

/**
 * DashboardLayout Component
 * Main layout wrapper for authenticated dashboard pages
 *
 * Features:
 * - Dark-themed sidebar navigation (DashboardSidebar)
 * - Professional header with breadcrumbs, status, notifications (DashboardHeader)
 * - Responsive mobile menu with overlay
 * - Command palette integration (⌘K)
 * - AI chatbot integration
 * - Flexible content area with Outlet for routing
 *
 * Layout Structure:
 * - Desktop (lg+): Sidebar always visible, content area with left margin
 * - Mobile (<lg): Sidebar hidden, hamburger menu, overlay when open
 */
const DashboardLayout = ({ children }) => {
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Command palette state
  const [commandOpen, setCommandOpen] = useState(false)

  /**
   * Close mobile menu
   */
  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Dark Sidebar Navigation */}
      <DashboardSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-56">
        {/* Dashboard Header with Breadcrumbs, Status, Notifications, User Profile */}
        <DashboardHeader mobileMenuOpen={mobileMenuOpen} onMenuClick={toggleMobileMenu} />

        {/* Main Content */}
        <main className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children ?? <Outlet />}
          </div>
        </main>

        {/* Footer (Optional) */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} Sentia Spirits. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* AI Chatbot */}
      <EnterpriseAIChatbot />
    </div>
  )
}

export default DashboardLayout
