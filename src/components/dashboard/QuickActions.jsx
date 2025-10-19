import { useNavigate } from 'react-router-dom'
import { Sparkles, DollarSign, Wrench, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Quick Actions Component
 *
 * Displays a grid of action buttons for quick access to key features.
 * Responsive design: 1 column on mobile, 2 on tablet, 4 on desktop.
 *
 * Features:
 * - Run Forecast (blue) → /forecasting
 * - Analyze Cash Flow (pink) → /working-capital
 * - What-If Analysis (blue) → /what-if
 * - Generate Report (white outline) → /reports
 *
 * @example
 * <QuickActions />
 */
const QuickActions = () => {
  const navigate = useNavigate()

  const actions = [
    {
      icon: Sparkles,
      label: 'Run Forecast',
      description: 'Generate AI-powered demand forecast',
      path: '/forecasting',
      color: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      icon: DollarSign,
      label: 'Analyze Cash Flow',
      description: 'Review working capital metrics',
      path: '/working-capital',
      color: 'bg-pink-500 hover:bg-pink-600 text-white'
    },
    {
      icon: Wrench,
      label: 'What-If Analysis',
      description: 'Run scenario planning',
      path: '/what-if',
      color: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      icon: FileText,
      label: 'Generate Report',
      description: 'Export financial reports',
      path: '/reports',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
    }
  ]

  /**
   * Handle action button click
   * @param {string} path - Route path to navigate to
   */
  const handleActionClick = (path) => {
    navigate(path)
  }

  return (
    <div className="space-y-4" role="region" aria-label="Quick Actions">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-3xl" role="img" aria-label="Lightning bolt">⚡</span>
          Quick Actions
        </h2>
        <p className="text-gray-600 mt-1">
          Access key business intelligence tools and reports
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action.path)}
            className={cn(
              'p-4 rounded-lg shadow-md transition-all duration-200',
              'hover:shadow-lg hover:-translate-y-1',
              'flex flex-col items-center text-center gap-2',
              'min-h-[110px]',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              action.color
            )}
            aria-label={`${action.label}: ${action.description}`}
          >
            <action.icon className="w-6 h-6" aria-hidden="true" />
            <span className="font-semibold">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
