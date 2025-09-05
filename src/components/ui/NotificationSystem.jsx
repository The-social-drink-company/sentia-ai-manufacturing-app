import React, { useState, useEffect, useCallback } from 'react'

// Toast notification component
function Toast({ notification, onClose }) {
  const { id, type, title, message, duration = 5000 } = notification

  const getTypeConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          icon: '✅',
          borderColor: '#059669'
        }
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          icon: '⚠️',
          borderColor: '#d97706'
        }
      case 'error':
        return {
          backgroundColor: '#ef4444',
          icon: '❌',
          borderColor: '#dc2626'
        }
      case 'info':
        return {
          backgroundColor: '#3b82f6',
          icon: 'ℹ️',
          borderColor: '#2563eb'
        }
      default:
        return {
          backgroundColor: '#6b7280',
          icon: '🔔',
          borderColor: '#4b5563'
        }
    }
  }

  const config = getTypeConfig(type)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div style={{
      backgroundColor: 'white',
      borderLeft: `4px solid ${config.borderColor}`,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '0.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      minWidth: '320px',
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <span style={{ fontSize: '1.2rem' }}>{config.icon}</span>
      
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          fontSize: '0.875rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: 0,
          marginBottom: '0.25rem'
        }}>
          {title}
        </h4>
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280',
          margin: 0,
          lineHeight: 1.4
        }}>
          {message}
        </p>
      </div>
      
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af',
          fontSize: '1rem',
          padding: '0',
          lineHeight: 1
        }}
        onMouseOver={(e) => e.target.style.color = '#6b7280'}
        onMouseOut={(e) => e.target.style.color = '#9ca3af'}
      >
        ✕
      </button>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Main notification system component
export function NotificationSystem() {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev, { ...notification, id }])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Global notification handler
  useEffect(() => {
    const handleCustomNotification = (event) => {
      addNotification(event.detail)
    }

    window.addEventListener('sentia-notify', handleCustomNotification)
    return () => {
      window.removeEventListener('sentia-notify', handleCustomNotification)
    }
  }, [addNotification])

  // Auto-generate notifications based on real-time events
  useEffect(() => {
    // Example: Generate notifications for system events
    const interval = setInterval(() => {
      const eventTypes = [
        {
          type: 'success',
          title: 'Production Update',
          message: 'Batch #SEN-2025-089 completed mixing successfully'
        },
        {
          type: 'info',
          title: 'New Orders',
          message: '5 new orders received from Amazon UK'
        },
        {
          type: 'warning',
          title: 'Inventory Alert',
          message: 'Low stock warning: Gin & Tonic bottles running low'
        }
      ]
      
      // Randomly show notifications (reduced frequency for demo)
      if (Math.random() < 0.1) { // 10% chance every interval
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        addNotification(randomEvent)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [addNotification])

  if (notifications.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      pointerEvents: 'auto'
    }}>
      {notifications.map(notification => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  )
}

// Global notification function
export const notify = (notification) => {
  const event = new CustomEvent('sentia-notify', { detail: notification })
  window.dispatchEvent(event)
}

// Preset notification functions
export const notifySuccess = (title, message, duration) => {
  notify({ type: 'success', title, message, duration })
}

export const notifyWarning = (title, message, duration) => {
  notify({ type: 'warning', title, message, duration })
}

export const notifyError = (title, message, duration) => {
  notify({ type: 'error', title, message, duration })
}

export const notifyInfo = (title, message, duration) => {
  notify({ type: 'info', title, message, duration })
}

export default NotificationSystem