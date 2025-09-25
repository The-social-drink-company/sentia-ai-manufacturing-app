import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

const SatisfyingButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  loading = false,
  success = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const buttonRef = useRef(null);
  
  // Satisfying spring physics
  const scale = useSpring(1, { stiffness: 300, damping: 30 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  useEffect(() => {
    if (success && !showSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  }, [success, showSuccess]);

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      color: '#FFFFFF',
      shadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
    },
    success: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: '#FFFFFF', 
      shadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
    },
    secondary: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
      color: '#374151',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    danger: {
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      color: '#FFFFFF',
      shadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
    }
  };

  const sizes = {
    small: { padding: '8px 16px', fontSize: '14px', height: '36px' },
    medium: { padding: '12px 24px', fontSize: '16px', height: '44px' },
    large: { padding: '16px 32px', fontSize: '18px', height: '52px' }
  };

  const currentVariant = showSuccess ? variants.success : variants[variant];
  const currentSize = sizes[size];

  const handlePress = () => {
    setIsPressed(true);
    scale.set(0.95);
    
    setTimeout(() => {
      setIsPressed(false);
      scale.set(1);
    }, 150);
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    handlePress();
    
    // Create ripple effect
    const rect = buttonRef.current.getBoundingClientRect();
    const ripple = document.createElement('div');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 10;
    `;
    
    // Add ripple keyframes if not exists
    if (!document.querySelector('#ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    buttonRef.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative overflow-hidden font-semibold border-none cursor-pointer
        transition-all duration-300 ease-out transform-gpu
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        background: currentVariant.background,
        color: currentVariant.color,
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        height: currentSize.height,
        borderRadius: '12px',
        boxShadow: disabled ? 'none' : currentVariant.shadow,
        scale,
      }}
      whileHover={!disabled && !loading ? { 
        y: -2, 
        scale: 1.02,
        boxShadow: `0 12px 40px ${currentVariant.shadow.split(' ').slice(-1)[0]}`
      } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      onClick={handleClick}
      disabled={disabled || loading}
      initial={false}
      animate={{
        background: currentVariant.background,
        boxShadow: showSuccess ? '0 0 30px rgba(16, 185, 129, 0.5)' : currentVariant.shadow
      }}
      {...props}
    >
      {/* Background shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ 
          duration: 2, 
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 3
        }}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Content */}
      <div className="relative z-20 flex items-center justify-center gap-2">
        {loading ? (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Loading...</span>
          </motion.div>
        ) : showSuccess ? (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CheckIcon className="w-5 h-5" />
            </motion.div>
            <span>Success!</span>
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.6,
                repeat: 2,
                delay: 0.2
              }}
            >
              <SparklesIcon className="w-4 h-4" />
            </motion.div>
          </motion.div>
        ) : (
          <>
            {Icon && (
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
            )}
            <span>{children}</span>
          </>
        )}
      </div>
      
      {/* Success celebration particles */}
      {showSuccess && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                top: '50%',
                left: '50%',
              }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: [0, 0.5 * 100],
                y: [0, 0.5 * 100],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
                ease: 'easeOut'
              }}
            />
          ))}
        </>
      )}
    </motion.button>
  );
};

export default SatisfyingButton;
