import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import UserButtonEnvironmentAware from '@/components/auth/UserButtonEnvironmentAware'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MobileMenuButton from '@/components/layout/MobileMenuButton'
import EnterpriseAIChatbot from '@/components/EnterpriseAIChatbot'
import CommandPalette from '@/components/dashboard/CommandPalette'

/**
 * DashboardLayout Component
 * Main layout wrapper for authenticated dashboard pages
 *
 * Features:
 * - Dark-themed sidebar navigation (DashboardSidebar)
 * - Responsive mobile menu with overlay
 * - Sticky header with search and user menu
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
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
          {/* Left Section: Mobile Menu + Page Title */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <MobileMenuButton isOpen={mobileMenuOpen} onClick={toggleMobileMenu} />

            {/* Page Title */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
              <p className="text-lg font-semibold text-slate-900">Manufacturing Intelligence</p>
            </div>
          </div>

          {/* Right Section: Search + User Menu */}
          <div className="flex items-center gap-3">
            {/* Command Palette Trigger (Hidden on small screens) */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:flex"
              aria-label="Open command palette"
            >
              <span>Search</span>
              <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                ⌘K
              </kbd>
            </button>

            {/* User Menu */}
            <UserButtonEnvironmentAware />
          </div>
        </header>

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
