import { Link, useLocation } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

/**
 * Breadcrumb Navigation Component (BMAD-UI-006)
 *
 * Displays hierarchical navigation based on current route
 * Shows: Home › Section › Page
 *
 * Features:
 * - Automatic route parsing
 * - Clickable navigation links
 * - Mobile-responsive (hides on small screens)
 * - Semantic HTML with aria-labels
 * - Human-readable labels
 *
 * Usage:
 * ```jsx
 * <Breadcrumb />
 * ```
 *
 * Route Examples:
 * - /dashboard → Home › Dashboard
 * - /app/working-capital → Home › Working Capital
 * - /app/admin/import → Home › Admin › Import
 *
 * @component
 */
const Breadcrumb = () => {
  const location = useLocation()

  // Parse path segments
  const pathSegments = location.pathname
    .split('/')
    .filter(segment => segment && segment !== 'app') // Remove empty and 'app' prefix

  // If we're at root, don't show breadcrumbs
  if (pathSegments.length === 0) {
    return null
  }

  // Build breadcrumb items
  const breadcrumbs = pathSegments.map((segment, index) => {
    // Build path up to this segment
    const path = '/app/' + pathSegments.slice(0, index + 1).join('/')

    // Convert segment to human-readable label
    const label = formatLabel(segment)

    return {
      label,
      path,
      isLast: index === pathSegments.length - 1,
    }
  })

  // Add home breadcrumb at the beginning
  const allBreadcrumbs = [
    {
      label: 'Home',
      path: '/dashboard',
      isLast: false,
      icon: HomeIcon,
    },
    ...breadcrumbs,
  ]

  return (
    <nav
      className="hidden md:flex items-center text-sm text-slate-600 dark:text-slate-400"
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-2">
        {allBreadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {/* Separator */}
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 mx-2 text-slate-400 dark:text-slate-600" />
            )}

            {/* Breadcrumb Link */}
            {crumb.isLast ? (
              // Current page - no link, bold text
              <span
                className="font-medium text-slate-900 dark:text-slate-100"
                aria-current="page"
              >
                {crumb.icon && <crumb.icon className="inline h-4 w-4 mr-1" />}
                {crumb.label}
              </span>
            ) : (
              // Previous pages - clickable links
              <Link
                to={crumb.path}
                className={cn(
                  'hover:text-slate-900 dark:hover:text-slate-100 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1'
                )}
                aria-label={`Navigate to ${crumb.label}`}
              >
                {crumb.icon && <crumb.icon className="inline h-4 w-4 mr-1" />}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Format URL segment to human-readable label
 *
 * @param {string} segment - URL segment (e.g., "working-capital")
 * @returns {string} Formatted label (e.g., "Working Capital")
 */
function formatLabel(segment) {
  // Special case mappings for better readability
  const specialCases = {
    'working-capital': 'Working Capital',
    'what-if': 'What-If Analysis',
    'data-import': 'Data Import',
    'ai-assistant': 'AI Assistant',
  }

  if (specialCases[segment]) {
    return specialCases[segment]
  }

  // Default: capitalize each word, replace hyphens/underscores with spaces
  return segment
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default Breadcrumb
