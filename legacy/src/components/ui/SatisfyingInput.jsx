import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const SatisfyingInput = ({
  label,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  onFocus,
  placeholder = '',
  error = '',
  success = false,
  disabled = false,
  required = false,
  icon: Icon,
  className = '',
  size = 'medium',
  variant = 'default',
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef(null);
  
  // Satisfying animations
  const borderGlow = useSpring(0, { stiffness: 300, damping: 30 });
  const labelY = useSpring(focused || value ? -28 : 0, { stiffness: 300, damping: 30 });
  const labelScale = useSpring(focused || value ? 0.85 : 1, { stiffness: 300, damping: 30 });
  const iconScale = useSpring(1, { stiffness: 400, damping: 20 });

  useEffect(() => {
    labelY.set(focused || value ? -28 : 0);
    labelScale.set(focused || value ? 0.85 : 1);
  }, [focused, value, labelY, labelScale]);

  const variants = {
    default: {
      background: 'rgba(255, 255, 255, 0.8)',
      borderColor: focused ? '#3B82F6' : (error ? '#EF4444' : '#E5E7EB'),
      focusGlow: 'rgba(59, 130, 246, 0.15)'
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: focused ? '#3B82F6' : (error ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'),
      focusGlow: 'rgba(59, 130, 246, 0.2)'
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.8)',
      borderColor: focused ? '#3B82F6' : (error ? '#EF4444' : '#374151'),
      focusGlow: 'rgba(59, 130, 246, 0.3)'
    }
  };

  const sizes = {
    small: { padding: '12px 16px', fontSize: '14px', height: '40px' },
    medium: { padding: '16px 20px', fontSize: '16px', height: '48px' },
    large: { padding: '20px 24px', fontSize: '18px', height: '56px' }
  };

  const currentVariant = variants[variant];
  const currentSize = sizes[size];

  const handleFocus = (e) => {
    setFocused(true);
    setHasInteracted(true);
    borderGlow.set(1);
    iconScale.set(1.1);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    borderGlow.set(0);
    iconScale.set(1);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Satisfying icon bounce
    iconScale.set(0.8);
    setTimeout(() => iconScale.set(1), 100);
  };

  const getStatusIcon = () => {
    if (success) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (error) return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
    return null;
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`relative ${className}`}>
      {/* Input Container */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Glowing border effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${currentVariant.focusGlow}, transparent, ${currentVariant.focusGlow})`,
            padding: '2px',
            opacity: borderGlow,
          }}
        >
          <div 
            className="w-full h-full rounded-2xl" 
            style={{ background: currentVariant.background }}
          />
        </motion.div>

        {/* Main Input */}
        <motion.input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={focused ? placeholder : ''}
          className={`
            relative z-10 w-full border-2 rounded-2xl transition-all duration-300
            backdrop-blur-xl outline-none font-medium
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}
            ${Icon ? 'pl-12' : ''}
            ${type === 'password' ? 'pr-12' : ''}
            ${success || error ? 'pr-12' : ''}
          `}
          style={{
            background: currentVariant.background,
            borderColor: currentVariant.borderColor,
            padding: currentSize.padding,
            fontSize: currentSize.fontSize,
            height: currentSize.height,
            color: variant === 'dark' ? '#FFFFFF' : '#374151',
          }}
          whileFocus={{
            boxShadow: `0 0 0 3px ${currentVariant.focusGlow}`
          }}
          {...props}
        />

        {/* Animated Label */}
        {label && (
          <motion.label
            className={`
              absolute left-5 pointer-events-none font-medium transition-colors duration-300
              ${focused ? 'text-blue-600' : (error ? 'text-red-500' : 'text-gray-500')}
              ${variant === 'dark' && !focused && !error ? 'text-gray-300' : ''}
            `}
            style={{
              top: '50%',
              transformOrigin: 'left center',
              y: labelY,
              scale: labelScale,
              transform: 'translateY(-50%)',
            }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </motion.label>
        )}

        {/* Left Icon */}
        {Icon && (
          <motion.div
            className="absolute left-4 top-1/2 transform -translate-y-1/2"
            style={{ scale: iconScale }}
          >
            <Icon className={`w-5 h-5 transition-colors duration-300 ${
              focused ? 'text-blue-600' : 'text-gray-400'
            }`} />
          </motion.div>
        )}

        {/* Password Toggle */}
        {type === 'password' && (
          <motion.button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={togglePasswordVisibility}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ scale: iconScale }}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </motion.button>
        )}

        {/* Status Icon */}
        {(success || error) && type !== 'password' && (
          <motion.div
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {getStatusIcon()}
          </motion.div>
        )}

        {/* Focus indicator line */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-600 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: focused ? '100%' : '0%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        {/* Success sparkles */}
        {success && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-green-400 rounded-full"
                style={{
                  top: `${20 + i * 15}%`,
                  right: `${10 + i * 8}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Error/Success Message */}
      <AnimatePresence>
        {(error || success) && hasInteracted && (
          <motion.div
            className={`mt-2 text-sm font-medium flex items-center gap-2 ${
              error ? 'text-red-600' : 'text-green-600'
            }`}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {error ? (
              <>
                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>Looks great!</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character count for textarea-like inputs */}
      {props.maxLength && value.length > 0 && (
        <motion.div
          className="absolute bottom-2 right-4 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {value.length}/{props.maxLength}
        </motion.div>
      )}
    </div>
  );
};

export default SatisfyingInput;
