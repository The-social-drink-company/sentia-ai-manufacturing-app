import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  {
    icon: '🔮',
    label: 'Run Forecast',
    description: 'Open the demand forecasting workspace',
    path: '/forecasting',
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
    descriptionClassName: 'text-white/80',
  },
  {
    icon: '💰',
    label: 'Analyze Cash Flow',
    description: 'Review working capital performance in detail',
    path: '/working-capital',
    className: 'bg-pink-500 hover:bg-pink-600 text-white',
    descriptionClassName: 'text-white/80',
  },
  {
    icon: '🔧',
    label: 'What-If Analysis',
    description: 'Model production and financial scenarios',
    path: '/what-if',
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
    descriptionClassName: 'text-white/80',
  },
  {
    icon: '📋',
    label: 'Generate Report',
    description: 'Export financial and KPI summaries',
    path: '/reports',
    className: 'bg-white hover:bg-gray-50 text-slate-900 border border-gray-300',
    descriptionClassName: 'text-slate-600',
  },
]

/**
 * Quick Actions Component
 *
 * Displays a grid of action buttons for quick access to key features.
 * Responsive design: 1 column on mobile, 2 on tablet, 4 on desktop.
 */
const QuickActions = () => {
  const navigate = useNavigate()

  const handleActionClick = path => {
    navigate(path)
  }

  return (
    <div className="space-y-4" role="region" aria-label="Quick Actions">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span className="text-3xl" role="img" aria-label="Lightning bolt">
            ⚡
          </span>
          Quick Actions
        </h2>
        <p className="mt-1 text-gray-600">Access key business intelligence tools and reports</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleActionClick(action.path)}
            className={cn(
              'flex min-h-[112px] w-full items-center gap-4 rounded-lg p-4 text-left shadow-md transition-transform duration-200',
              'hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              action.className,
            )}
            aria-label={`${action.label}: ${action.description}`}
          >
            <span className="text-3xl" aria-hidden="true">{action.icon}</span>
            <span className="flex flex-col">
              <span className="text-base font-semibold">{action.label}</span>
              <span className={cn('text-sm', action.descriptionClassName)}>{action.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
