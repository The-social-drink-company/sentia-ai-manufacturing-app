import React from 'react'

// Enhanced KPI card with animations and status indicators
export function AdvancedKPI({ 
  title, 
  value, 
  trend, 
  color = "#3b82f6",
  icon,
  status = "normal", // normal, warning, critical, success
  subtitle,
  onClick,
  loading = false,
  compact = false
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return color
    }
  }

  const statusColor = getStatusColor(status)
  const isClickable = !!onClick

  const cardStyle = {
    backgroundColor: 'white',
    padding: compact ? '1rem' : '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
    border: `2px solid ${statusColor}20`,
    borderLeft: `4px solid ${statusColor}`,
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  }

  const hoverStyle = isClickable ? {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  } : {}

  return (
    <div 
      style={cardStyle}
      onClick={onClick}
      onMouseOver={(e) => {
        if (isClickable) {
          Object.assign(e.target.style, hoverStyle)
        }
      }}
      onMouseOut={(e) => {
        if (isClickable) {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)'
        }
      }}
    >
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${statusColor}30`,
            borderTopColor: statusColor,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}

      {/* Status indicator */}
      {status !== 'normal' && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          animation: status === 'critical' ? 'pulse 2s infinite' : 'none'
        }}></div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Icon */}
        {icon && (
          <div style={{
            fontSize: compact ? '1.5rem' : '2rem',
            color: statusColor,
            minWidth: 'fit-content'
          }}>
            {icon}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            fontSize: compact ? '0.75rem' : '0.875rem', 
            color: '#6b7280', 
            marginBottom: '0.5rem',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </h3>
          
          <p style={{ 
            fontSize: compact ? '1.5rem' : '2rem', 
            fontWeight: 'bold', 
            color: statusColor, 
            marginBottom: subtitle ? '0.25rem' : '0.5rem',
            lineHeight: 1.2
          }}>
            {value}
          </p>
          
          {subtitle && (
            <p style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              marginBottom: '0.5rem'
            }}>
              {subtitle}
            </p>
          )}
          
          {trend && (
            <p style={{ 
              fontSize: '0.75rem', 
              color: trend.includes('↑') ? '#10b981' : trend.includes('↓') ? '#ef4444' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '500'
            }}>
              {trend}
            </p>
          )}
        </div>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// Specialized KPI for production stages
export function ProductionStageKPI({ stage, data, onClick }) {
  const getStageConfig = (stage) => {
    switch (stage) {
      case 'mixing':
        return {
          title: 'Mixing & Infusion',
          icon: '🧪',
          color: '#10b981',
          subtitle: `${data?.batchesInProgress || 0} batches active`
        }
      case 'bottling':
        return {
          title: 'Bottling & Labeling',
          icon: '🍾',
          color: '#3b82f6',
          subtitle: `${data?.unitsBottled?.toLocaleString() || 0} units today`
        }
      case 'warehousing':
        return {
          title: 'Warehousing',
          icon: '📦',
          color: '#8b5cf6',
          subtitle: `${data?.inventory?.toLocaleString() || 0} in inventory`
        }
      default:
        return {
          title: stage,
          icon: '📊',
          color: '#6b7280'
        }
    }
  }

  const config = getStageConfig(stage)
  const efficiency = data?.efficiency || 0
  const status = efficiency >= 95 ? 'success' : efficiency >= 85 ? 'normal' : efficiency >= 70 ? 'warning' : 'critical'

  return (
    <AdvancedKPI
      title={config.title}
      value={`${efficiency.toFixed(1)}%`}
      trend={`Quality: ${data?.qualityScore?.toFixed(1) || 0}%`}
      color={config.color}
      icon={config.icon}
      subtitle={config.subtitle}
      status={status}
      onClick={onClick}
    />
  )
}

// Channel performance KPI
export function ChannelKPI({ channel, data, onClick }) {
  const getChannelConfig = (channel) => {
    switch (channel) {
      case 'amazon':
        return {
          title: 'Amazon Sales',
          icon: '🛒',
          color: '#ea580c'
        }
      case 'shopify':
        return {
          title: 'Shopify Direct',
          icon: '🛍️',
          color: '#16a34a'
        }
      default:
        return {
          title: channel.charAt(0).toUpperCase() + channel.slice(1),
          icon: '📊',
          color: '#6b7280'
        }
    }
  }

  const config = getChannelConfig(channel)
  const revenue = data?.revenue || 0
  const orders = data?.orders || 0
  const fulfillment = data?.fulfillment || 0

  const status = fulfillment >= 98 ? 'success' : fulfillment >= 95 ? 'normal' : 'warning'

  return (
    <AdvancedKPI
      title={config.title}
      value={`£${revenue.toLocaleString()}`}
      trend={`${orders} orders • ${fulfillment}% fulfilled`}
      color={config.color}
      icon={config.icon}
      status={status}
      onClick={onClick}
    />
  )
}

export default AdvancedKPI