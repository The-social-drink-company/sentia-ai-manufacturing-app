import React from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react'

/**
 * WorkingCapitalSnapshot Component
 *
 * Displays a compact summary of working capital metrics:
 * - Cash Conversion Cycle (CCC) with status
 * - Cash runway visualization
 * - Breach indicators and warnings
 * - Quick mitigation action buttons
 * - Link to full Working Capital analysis suite
 *
 * @param {Object} props
 * @param {Object} props.data - Working capital data from API
 * @param {Object} props.data.ccc - Cash Conversion Cycle metrics
 * @param {number} props.data.ccc.value - CCC in days
 * @param {string} props.data.ccc.status - Status: 'excellent' | 'good' | 'warning' | 'critical'
 * @param {Object} props.data.ccc.components - DIO, DSO, DPO breakdown
 * @param {Object} props.data.runway - Cash runway metrics
 * @param {number} props.data.runway.months - Months of runway remaining
 * @param {number} props.data.runway.cashBalance - Current cash balance
 * @param {number} props.data.runway.burnRate - Monthly burn rate
 * @param {Array} props.data.runway.projection - 12-month projection data
 * @param {Array} props.data.breaches - Array of detected breach windows
 * @param {Array} props.data.mitigationActions - Recommended quick actions
 */
function WorkingCapitalSnapshot({ data }) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Working Capital</h3>
        <p className="text-gray-500">Loading working capital data...</p>
      </div>
    )
  }

  const { ccc, runway, breaches = [], mitigationActions = [] } = data

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Working Capital</h3>
          <Link
            to="/working-capital"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Full Analysis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Cash Conversion Cycle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Cash Conversion Cycle</span>
            <CCCStatusBadge status={ccc?.status} />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{ccc?.value?.toFixed(1) || '0.0'}</span>
            <span className="text-gray-500">days</span>
          </div>

          {/* Target indicator */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getCCCBarColor(ccc?.status)}`}
                style={{ width: `${Math.min((ccc?.value / 55) * 100, 100)}%` }}
              />
            </div>
            <span className="text-gray-500 text-xs">Target: &lt;55d</span>
          </div>

          {/* Components breakdown */}
          {ccc?.components && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-50 rounded p-2">
                <div className="text-gray-600">DIO</div>
                <div className="font-semibold">{ccc.components.dio?.toFixed(0)}d</div>
              </div>
              <div className="bg-green-50 rounded p-2">
                <div className="text-gray-600">DSO</div>
                <div className="font-semibold">{ccc.components.dso?.toFixed(0)}d</div>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <div className="text-gray-600">DPO</div>
                <div className="font-semibold">{ccc.components.dpo?.toFixed(0)}d</div>
              </div>
            </div>
          )}
        </div>

        {/* Cash Runway */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Cash Runway</span>
            <RunwayStatusBadge months={runway?.months} />
          </div>

          <div className="space-y-2">
            {/* Runway months */}
            <div className="flex items-baseline gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold">{runway?.months?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-500">months</span>
            </div>

            {/* Cash balance */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>Balance: £{runway?.cashBalance?.toLocaleString() || '0'}</span>
            </div>

            {/* Burn rate */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingDown className="w-4 h-4" />
              <span>Burn: £{runway?.burnRate?.toLocaleString() || '0'}/mo</span>
            </div>
          </div>

          {/* Mini runway chart */}
          {runway?.projection && runway.projection.length > 0 && (
            <div className="mt-4">
              <MiniRunwayChart
                data={runway.projection}
                breaches={breaches}
                currentBalance={runway.cashBalance}
              />
            </div>
          )}
        </div>

        {/* Breach Indicators */}
        {breaches.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 text-sm">
                  {breaches.length} Breach{breaches.length > 1 ? 'es' : ''} Detected
                </h4>
                <div className="mt-2 space-y-1">
                  {breaches.slice(0, 2).map((breach, index) => (
                    <div key={index} className="text-xs text-red-700">
                      <span className="font-medium">Month {breach.month}:</span> £
                      {Math.abs(breach.deficit).toLocaleString()} deficit
                    </div>
                  ))}
                  {breaches.length > 2 && (
                    <div className="text-xs text-red-600">
                      +{breaches.length - 2} more breach{breaches.length - 2 > 1 ? 'es' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Mitigation Actions */}
        {mitigationActions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              {mitigationActions.slice(0, 3).map((action, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-sm transition-colors"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-green-600 text-xs font-semibold">
                      +£{action.impact?.toLocaleString()}
                    </span>
                  </div>
                  {action.description && (
                    <div className="text-xs text-gray-600 mt-1">{action.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Default mitigation actions if none provided */}
        {mitigationActions.length === 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <ActionButton
                title="Accelerate Collections"
                description="Reduce DSO by 5 days"
                impact="15,000"
                onClick={() => handleDefaultAction('collections')}
              />
              <ActionButton
                title="Extend Payables"
                description="Negotiate 15-day extension"
                impact="12,000"
                onClick={() => handleDefaultAction('payables')}
              />
              <ActionButton
                title="Optimize Inventory"
                description="Reduce DIO by 3 days"
                impact="8,500"
                onClick={() => handleDefaultAction('inventory')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * CCC Status Badge Component
 */
function CCCStatusBadge({ status }) {
  const config = {
    excellent: {
      icon: CheckCircle,
      label: 'Excellent',
      className: 'bg-green-100 text-green-800',
    },
    good: {
      icon: CheckCircle,
      label: 'Good',
      className: 'bg-blue-100 text-blue-800',
    },
    warning: {
      icon: AlertTriangle,
      label: 'Warning',
      className: 'bg-yellow-100 text-yellow-800',
    },
    critical: {
      icon: AlertTriangle,
      label: 'Critical',
      className: 'bg-red-100 text-red-800',
    },
  }

  const { icon: Icon, label, className } = config[status] || config.good

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

/**
 * Runway Status Badge Component
 */
function RunwayStatusBadge({ months }) {
  // TODO: Add status-based icon (like CCCStatusBadge)
  let label = 'Healthy'
  let className = 'bg-green-100 text-green-800'

  if (months < 3) {
    label = 'Critical'
    className = 'bg-red-100 text-red-800'
  } else if (months < 6) {
    label = 'Warning'
    className = 'bg-yellow-100 text-yellow-800'
  } else if (months < 12) {
    label = 'Good'
    className = 'bg-blue-100 text-blue-800'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

/**
 * Mini Runway Chart Component
 * Displays a compact 12-month cash projection
 */
function MiniRunwayChart({ data, breaches = [], currentBalance }) {
  if (!data || data.length === 0) {
    return null
  }

  // Calculate chart dimensions
  // eslint-disable-next-line no-unused-vars
  const width = 100 // percentage (reserved for future responsive calculations)
  const height = 60 // pixels
  const maxValue = Math.max(...data.map(d => d.balance), currentBalance || 0)
  const minValue = Math.min(...data.map(d => d.balance), 0)
  const range = maxValue - minValue

  // Generate SVG path
  const points = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = height - ((point.balance - minValue) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  // Identify breach points
  const breachMonths = new Set(breaches.map(b => b.month))

  return (
    <div className="relative">
      <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height: `${height}px` }}>
        {/* Zero line */}
        <line
          x1="0"
          y1={height - ((0 - minValue) / range) * height}
          x2="100"
          y2={height - ((0 - minValue) / range) * height}
          stroke="#e5e7eb"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />

        {/* Runway projection line */}
        <polyline
          points={points}
          fill="none"
          stroke={breaches.length > 0 ? '#ef4444' : '#10b981'}
          strokeWidth="2"
        />

        {/* Breach indicators */}
        {data.map((point, index) => {
          if (breachMonths.has(index)) {
            const x = (index / (data.length - 1)) * 100
            const y = height - ((point.balance - minValue) / range) * height
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#ef4444"
                stroke="white"
                strokeWidth="1"
              />
            )
          }
          return null
        })}
      </svg>

      {/* Chart labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Now</span>
        <span>12 months</span>
      </div>
    </div>
  )
}

/**
 * Action Button Component
 */
function ActionButton({ title, description, impact, onClick }) {
  return (
    <button
      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-sm transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{title}</span>
        <span className="text-green-600 text-xs font-semibold">+£{impact}</span>
      </div>
      {description && <div className="text-xs text-gray-600 mt-1">{description}</div>}
    </button>
  )
}

/**
 * Helper Functions
 */

function getCCCBarColor(status) {
  const colors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  }
  return colors[status] || colors.good
}

function handleActionClick(action) {
  // TODO: Implement action handler
  // This will navigate to the full Working Capital suite with the action pre-selected
  console.log('Action clicked:', action)
  // For now, navigate to working capital page
  window.location.href = '/working-capital?action=' + encodeURIComponent(action.id || action.title)
}

function handleDefaultAction(actionType) {
  // TODO: Implement default action handler
  console.log('Default action:', actionType)
  window.location.href = '/working-capital?action=' + actionType
}

export default WorkingCapitalSnapshot
