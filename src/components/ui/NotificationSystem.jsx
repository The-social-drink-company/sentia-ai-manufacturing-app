import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

// Enhanced Toast notification with satisfying animations
function Toast({ notification, onClose }) {
  const { id, type, title, message, duration = 5000, action } = notification

  const typeConfig = {
    success: {
      bg: 'from-green-500 to-emerald-500',
      icon: CheckCircleIcon,
      accent: 'border-green-200',
      glow: 'shadow-green-500/25'
    },
    error: {
      bg: 'from-red-500 to-rose-500',
      icon: XCircleIcon,
      accent: 'border-red-200',
      glow: 'shadow-red-500/25'
    },
    warning: {
      bg: 'from-yellow-500 to-amber-500',
      icon: ExclamationTriangleIcon,
      accent: 'border-yellow-200',
      glow: 'shadow-yellow-500/25'
    },
    info: {
      bg: 'from-blue-500 to-indigo-500',
      icon: InformationCircleIcon,
      accent: 'border-blue-200',
      glow: 'shadow-blue-500/25'
    },
    magic: {
      bg: 'from-purple-500 to-pink-500',
      icon: SparklesIcon,
      accent: 'border-purple-200',
      glow: 'shadow-purple-500/25'
    }
  }

  

  const config = typeConfig[type] || typeConfig.info
  const Icon = config.icon

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9, x: 400 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ 
        opacity: 0, 
        x: 400, 
        scale: 0.8,
        transition: { duration: 0.3, ease: 'easeIn' }
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      className={`
        relative overflow-hidden min-w-80 max-w-md mb-3
        bg-white/95 backdrop-blur-xl rounded-2xl 
        border border-white/50 ${config.accent}
        shadow-2xl ${config.glow}
        transform-gpu
      `}
      whileHover={{ 
        y: -2, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      layout
    >
      {/* Animated background gradient */}
      <motion.div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${config.bg}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <motion.div
          className={`absolute top-0 left-0 h-1 bg-gradient-to-r ${config.bg} opacity-60`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}

      {/* Content */}
      <div className="p-4 flex items-start space-x-3">
        {/* Icon with satisfying animation */}
        <motion.div
          className={`flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-r ${config.bg} flex items-center justify-center`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 15,
            delay: 0.2 
          }}
          whileHover={{ 
            scale: 1.1,
            rotate: type === 'success' ? 10 : 0
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <motion.h4
            className="text-sm font-semibold text-gray-900 truncate"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {title}
          </motion.h4>
          
          {message && (
            <motion.p
              className="mt-1 text-sm text-gray-600 leading-relaxed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.p>
          )}

          {/* Action button */}
          {action && (
            <motion.button
              className={`mt-3 text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.bg} text-white hover:opacity-90 transition-opacity`}
              onClick={action.onClick}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {action.label}
            </motion.button>
          )}
        </div>

        {/* Close button */}
        <motion.button
          className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center group transition-colors"
          onClick={() => onClose(id)}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ 
            scale: 1.1,
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}
          whileTap={{ scale: 0.9 }}
        >
          <XMarkIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </motion.button>
      </div>

      {/* Sparkle effects for magic notifications */}
      {type === 'magic' && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                top: `${20 + i * 25}%`,
                right: `${10 + i * 15}%`,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          ))}
        </>
      )}

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ 
          duration: 1.5, 
          ease: 'easeInOut',
          repeat: type === 'magic' ? Infinity : 0,
          repeatDelay: 3
        }}
      />
    </motion.div>
  )
}

// Main notification system component
export function NotificationSystem() {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + 0 /* REAL DATA REQUIRED */
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
      if (Math.random() < 0.05) {
        const evt = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        addNotification({
          ...evt,
          duration: 4000
        })
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [addNotification])

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {notifications.map((n) => (
          <Toast key={n.id} notification={n} onClose={removeNotification} />
        ))}
      </AnimatePresence>
    </div>
  )
}