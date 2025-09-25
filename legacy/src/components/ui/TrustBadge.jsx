/**
 * Trust Badge Component for PROMPT 8 Dashboard Overlay
 * Displays data quality and freshness indicators with plain English explanations
 */

import React from 'react'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'

const TRUST_LEVELS = {
  excellent: {
    icon: CheckCircleIcon,
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    label: 'Excellent Data',
    description: 'High confidence data with recent updates and validation'
  },
  good: {
    icon: CheckCircleIcon,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    label: 'Good Data',
    description: 'Reliable data with regular updates'
  },
  needs_attention: {
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    label: 'Needs Attention',
    description: 'Data quality concerns detected, review recommended'
  },
  stale: {
    icon: ClockIcon,
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    label: 'Stale Data',
    description: 'Data not updated recently, may be outdated'
  },
  info: {
    icon: InformationCircleIcon,
    color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700',
    label: 'Information',
    description: 'General information or status update'
  }
}

const FRESHNESS_LEVELS = {
  fresh: {
    color: 'text-green-500',
    indicator: 'â—',
    label: 'Data Fresh',
    description: 'Updated within the last 5 minutes'
  },
  recent: {
    color: 'text-blue-500',
    indicator: 'â—',
    label: 'Recently Updated',
    description: 'Updated within the last hour'
  },
  moderate: {
    color: 'text-yellow-500',
    indicator: 'â—',
    label: 'Moderate Age',
    description: 'Updated within the last 24 hours'
  },
  stale: {
    color: 'text-red-500',
    indicator: 'â—',
    label: 'Stale Data',
    description: 'Not updated in over 24 hours'
  }
}

const TrustBadge = ({ 
  trustLevel = 'good', 
  size = 'sm', 
  showLabel = false,
  tooltip = true,
  className = ''
}) => {
  const trust = TRUST_LEVELS[trustLevel] || TRUST_LEVELS.good
  const Icon = trust.icon
  
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  const BadgeContent = () => (
    <div className={cn(
      "inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium transition-colors duration-200",
      trust.color,
      className
    )}>
      <Icon className={cn("mr-1", sizeClasses[size])} />
      {showLabel && <span>{trust.label}</span>}
    </div>
  )
  
  if (tooltip) {
    return (
      <div className="relative group">
        <BadgeContent />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          <div className="font-medium">{trust.label}</div>
          <div className="text-xs text-gray-200 dark:text-gray-300 mt-1">{trust.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </div>
    )
  }
  
  return <BadgeContent />
}

const FreshnessBadge = ({ 
  freshness = 'fresh', 
  lastUpdated = null,
  size = 'sm',
  showLabel = false,
  tooltip = true,
  className = ''
}) => {
  const freshnessData = FRESHNESS_LEVELS[freshness] || FRESHNESS_LEVELS.fresh
  
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return null
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-GB')
  }
  
  const BadgeContent = () => (
    <div className={cn(
      "inline-flex items-center space-x-1 text-xs",
      className
    )}>
      <span className={cn("text-xs leading-none", freshnessData.color)}>
        {freshnessData.indicator}
      </span>
      {showLabel && (
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          {freshnessData.label}
        </span>
      )}
    </div>
  )
  
  if (tooltip) {
    return (
      <div className="relative group">
        <BadgeContent />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          <div className="font-medium">{freshnessData.label}</div>
          <div className="text-xs text-gray-200 dark:text-gray-300 mt-1">{freshnessData.description}</div>
          {lastUpdated && (
            <div className="text-xs text-gray-200 dark:text-gray-300 mt-1">
              Last updated: {formatLastUpdated(lastUpdated)}
            </div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </div>
    )
  }
  
  return <BadgeContent />
}

const CombinedTrustBadge = ({ 
  trustLevel = 'good', 
  freshness = 'fresh',
  lastUpdated = null,
  size = 'sm',
  layout = 'horizontal',
  tooltip = true,
  className = ''
}) => {
  const Container = layout === 'horizontal' ? 
    ({ children }) => <div className={cn("flex items-center space-x-2", className)}>{children}</div> :
    ({ children }) => <div className={cn("flex flex-col space-y-1", className)}>{children}</div>
  
  return (
    <Container>
      <TrustBadge 
        trustLevel={trustLevel} 
        size={size} 
        tooltip={tooltip}
      />
      <FreshnessBadge 
        freshness={freshness} 
        lastUpdated={lastUpdated}
        size={size} 
        tooltip={tooltip}
      />
    </Container>
  )
}

export { TrustBadge, FreshnessBadge, CombinedTrustBadge }
export default TrustBadge
