import { Menu, X } from 'lucide-react'

/**
 * MobileMenuButton Component
 * Hamburger menu toggle button for mobile sidebar navigation
 *
 * Features:
 * - Toggles between Menu and X icons based on open state
 * - Hidden on desktop (lg breakpoint and above)
 * - Accessible with ARIA labels
 * - Smooth icon transitions
 *
 * @param {boolean} isOpen - Whether the mobile menu is currently open
 * @param {Function} onClick - Callback function when button is clicked
 */
const MobileMenuButton = ({ isOpen = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-sidebar"
      type="button"
    >
      {/* Icon with smooth transition */}
      <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
      {isOpen ? (
        <X className="h-6 w-6" aria-hidden="true" />
      ) : (
        <Menu className="h-6 w-6" aria-hidden="true" />
      )}
    </button>
  )
}

export default MobileMenuButton
