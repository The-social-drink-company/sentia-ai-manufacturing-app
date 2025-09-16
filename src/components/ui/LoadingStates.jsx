import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuChipIcon, 
  SparklesIcon, 
  HeartIcon,
  BoltIcon,
  RocketLaunchIcon 
} from '@heroicons/react/24/outline';

// Emotionally engaging loading spinner
export const LoadingSpinner = ({ size = 'medium', message = 'Loading...', variant = 'default' }) => {
  const sizes = {
    small: { spinner: 'w-6 h-6', text: 'text-sm' },
    medium: { spinner: 'w-8 h-8', text: 'text-base' },
    large: { spinner: 'w-12 h-12', text: 'text-lg' }
  };

  const variants = {
    default: { color: 'border-blue-600', bg: 'bg-white/90' },
    glass: { color: 'border-blue-400', bg: 'bg-white/10 backdrop-blur-xl' },
    dark: { color: 'border-blue-400', bg: 'bg-gray-900/90' }
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  return (
    <motion.div
      className={`
        inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/20
        ${currentVariant.bg}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Spinner */}
      <motion.div
        className={`
          ${currentSize.spinner} border-3 border-gray-200 rounded-full
          ${currentVariant.color} border-t-transparent
        `}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Breathing text */}
      <motion.span
        className={`font-medium text-gray-700 ${currentSize.text}`}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {message}
      </motion.span>
    </motion.div>
  );
};

// Heartbeat loading for emotional connection
export const HeartbeatLoader = ({ message = 'Processing with care...' }) => {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          filter: ['hue-rotate(0deg)', 'hue-rotate(30deg)', 'hue-rotate(0deg)']
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      >
        <HeartIcon className="w-12 h-12 text-red-500" />
      </motion.div>
      
      <motion.p
        className="text-gray-600 font-medium text-center"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

// Progressive satisfaction loader
export const ProgressSatisfaction = ({ 
  progress = 0, 
  message = 'Making progress...',
  showSparkles = true 
}) => {
  const getProgressColor = (progress) => {
    if (progress < 30) return 'from-red-500 to-orange-500';
    if (progress < 70) return 'from-orange-500 to-yellow-500';
    return 'from-yellow-500 to-green-500';
  };

  const getEmoji = (progress) => {
    if (progress < 30) return '🚀';
    if (progress < 70) return '⚡';
    return '✨';
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Progress bar container */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
        {/* Animated progress bar */}
        <motion.div
          className={`h-full bg-gradient-to-r ${getProgressColor(progress)} rounded-full relative`}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        
        {/* Glowing effect */}
        <motion.div
          className={`absolute top-0 h-full bg-gradient-to-r ${getProgressColor(progress)} rounded-full blur-sm opacity-50`}
          style={{ width: `${progress}%` }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>

      {/* Progress text with emoji */}
      <div className="flex items-center justify-between">
        <motion.span
          className="text-gray-600 font-medium flex items-center gap-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-lg">{getEmoji(progress)}</span>
          {message}
        </motion.span>
        
        <motion.span
          className="font-bold text-lg"
          style={{ color: progress >= 100 ? '#10B981' : '#3B82F6' }}
          animate={progress >= 100 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>

      {/* Success sparkles */}
      {progress >= 100 && showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${0 /* REAL DATA REQUIRED */}%`,
                left: `${0 /* REAL DATA REQUIRED */}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [0, -20, -40],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                ease: 'easeOut'
              }}
            >
              <SparklesIcon className="w-4 h-4 text-yellow-400" />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// AI-themed loading with sophistication
export const AIThinkingLoader = ({ message = 'AI is thinking...' }) => {
  return (
    <motion.div
      className="flex flex-col items-center gap-6 p-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* AI Brain Animation */}
      <div className="relative">
        <motion.div
          animate={{ 
            rotate: 360,
            filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <CpuChipIcon className="w-16 h-16 text-blue-500" />
        </motion.div>
        
        {/* Neural network dots */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: '0 0'
            }}
            animate={{
              x: [0, Math.cos(i * Math.PI / 4) * 30],
              y: [0, Math.sin(i * Math.PI / 4) * 30],
              opacity: [0, 1, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Typewriter effect */}
      <motion.div
        className="font-medium text-gray-700 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {message}
        </motion.span>
        
        {/* Blinking cursor */}
        <motion.span
          className="inline-block ml-1 w-0.5 h-5 bg-blue-500"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
};

// Skeleton loader with shimmer
export const SkeletonLoader = ({ 
  lines = 3, 
  avatar = false,
  card = false,
  className = '' 
}) => {
  return (
    <motion.div
      className={`animate-pulse ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {card && (
        <div className="bg-gray-200 rounded-2xl h-48 mb-4 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        {avatar && (
          <div className="w-12 h-12 bg-gray-200 rounded-full relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}
        
        <div className="flex-1 space-y-3">
          {[...Array(lines)].map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-gray-200 rounded-lg relative overflow-hidden ${
                i === lines - 1 ? 'w-3/4' : 'w-full'
              }`}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: 'easeInOut',
                  delay: i * 0.1
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Success celebration component
export const SuccessCelebration = ({ 
  message = 'Success!', 
  onComplete,
  autoHide = true,
  duration = 3000 
}) => {
  React.useEffect(() => {
    if (autoHide && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onComplete, duration]);

  return (
    <motion.div
      className="flex flex-col items-center gap-4 p-8"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Success icon with celebration */}
      <motion.div
        className="relative"
        initial={{ rotate: -90 }}
        animate={{ rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <motion.div
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(16, 185, 129, 0.4)',
              '0 0 0 20px rgba(16, 185, 129, 0)',
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>

        {/* Floating sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-400 text-xl"
            style={{
              top: '50%',
              left: '50%',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: [0, (Math.cos(i * Math.PI / 4) * 50)],
              y: [0, (Math.sin(i * Math.PI / 4) * 50)],
              rotate: [0, 360]
            }}
            transition={{
              duration: 1.5,
              delay: 0.3 + i * 0.1,
              ease: 'easeOut'
            }}
          >
            ✨
          </motion.div>
        ))}
      </motion.div>

      {/* Success message */}
      <motion.p
        className="text-xl font-semibold text-green-600 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

export default {
  LoadingSpinner,
  HeartbeatLoader,
  ProgressSatisfaction,
  AIThinkingLoader,
  SkeletonLoader,
  SuccessCelebration
};