import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  TrendingUp,
  FileText,
  AlertCircle,
  Settings,
  BarChart3,
  DollarSign,
  ClipboardCheck,
} from 'lucide-react'

/**
 * QuickActions Component
 *
 * Provides one-click access to frequently used manufacturing operations:
 * - Create new production job
 * - Run demand forecast
 * - Generate financial report
 * - View critical alerts
 * - Configure system settings
 * - View analytics dashboard
 * - Working capital analysis
 * - Quality control checks
 *
 * @param {Object} props
 * @param {Array} props.recentAlerts - Recent alert count for badge display
 * @param {Object} props.permissions - User permissions for action visibility
 */
function QuickActions({ recentAlerts = [], permissions = {} }) {
  const navigate = useNavigate()

  // Define all available quick actions
  const actions = [
    {
      id: 'new-job',
      title: 'New Production Job',
      description: 'Schedule manufacturing run',
      icon: Package,
      color: 'blue',
      path: '/production/jobs/new',
      permission: 'production.create',
    },
    {
      id: 'forecast',
      title: 'Run Forecast',
      description: 'Generate demand prediction',
      icon: TrendingUp,
      color: 'purple',
      path: '/forecasting',
      permission: 'forecasts.view',
    },
    {
      id: 'report',
      title: 'Financial Report',
      description: 'View P&L and metrics',
      icon: FileText,
      color: 'green',
      path: '/reports/financial',
      permission: 'reports.view',
    },
    {
      id: 'alerts',
      title: 'View Alerts',
      description: 'Check critical notifications',
      icon: AlertCircle,
      color: 'red',
      path: '/alerts',
      permission: 'alerts.view',
      badge: recentAlerts.length > 0 ? recentAlerts.length : null,
    },
    {
      id: 'working-capital',
      title: 'Working Capital',
      description: 'Optimize cash flow',
      icon: DollarSign,
      color: 'yellow',
      path: '/working-capital',
      permission: 'finance.view',
    },
    {
      id: 'quality',
      title: 'Quality Control',
      description: 'Run QC checks',
      icon: ClipboardCheck,
      color: 'indigo',
      path: '/quality-control',
      permission: 'quality.view',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed insights',
      icon: BarChart3,
      color: 'cyan',
      path: '/analytics',
      permission: 'analytics.view',
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure application',
      icon: Settings,
      color: 'gray',
      path: '/settings',
      permission: 'system.configure',
    },
  ]

  // Filter actions based on permissions
  const availableActions = actions.filter(action => {
    // If no permission required or permissions not provided, show action
    if (!action.permission || !permissions) return true
    // Check if user has required permission
    return permissions[action.permission] === true
  })

  // Display only first 6 actions to keep component compact
  const displayedActions = availableActions.slice(0, 6)

  const handleActionClick = action => {
    navigate(action.path)
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
      </div>

      {/* Actions Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {displayedActions.map(action => (
            <ActionCard key={action.id} action={action} onClick={() => handleActionClick(action)} />
          ))}
        </div>

        {/* Show "More Actions" link if there are hidden actions */}
        {availableActions.length > 6 && (
          <div className="mt-4 text-center">
            <button
              className="text-sm text-blue-600 hover:text-blue-700"
              onClick={() => navigate('/actions')}
            >
              View All Actions ({availableActions.length - 6} more)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ActionCard Component
 *
 * Individual action card with icon, title, and description
 */
function ActionCard({ action, onClick }) {
  const { icon: Icon, title, description, color, badge } = action

  // Color configurations
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      hover: 'hover:bg-blue-100',
      border: 'border-blue-200',
      icon: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      hover: 'hover:bg-purple-100',
      border: 'border-purple-200',
      icon: 'text-purple-600',
    },
    green: {
      bg: 'bg-green-50',
      hover: 'hover:bg-green-100',
      border: 'border-green-200',
      icon: 'text-green-600',
    },
    red: {
      bg: 'bg-red-50',
      hover: 'hover:bg-red-100',
      border: 'border-red-200',
      icon: 'text-red-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      hover: 'hover:bg-yellow-100',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
    },
    indigo: {
      bg: 'bg-indigo-50',
      hover: 'hover:bg-indigo-100',
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
    },
    cyan: {
      bg: 'bg-cyan-50',
      hover: 'hover:bg-cyan-100',
      border: 'border-cyan-200',
      icon: 'text-cyan-600',
    },
    gray: {
      bg: 'bg-gray-50',
      hover: 'hover:bg-gray-100',
      border: 'border-gray-200',
      icon: 'text-gray-600',
    },
  }

  const colors = colorConfig[color] || colorConfig.blue

  return (
    <button
      className={`relative p-4 rounded-lg border-2 ${colors.bg} ${colors.border} ${colors.hover} transition-all hover:shadow-md text-left group`}
      onClick={onClick}
    >
      {/* Badge for notifications */}
      {badge && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Icon */}
      <div className={`${colors.icon} mb-2`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Title */}
      <div className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-gray-700">
        {title}
      </div>

      {/* Description */}
      <div className="text-xs text-gray-600">{description}</div>
    </button>
  )
}

export default QuickActions
