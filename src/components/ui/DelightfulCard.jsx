import React, { useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

const DelightfulCard = ({ 
  children, 
  className = '', 
  onClick,
  hover = true,
  glow = false,
  interactive = true,
  gradient = 'default',
  size = 'medium',
  ...props 
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Advanced mouse tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-3, 3]);
  
  // Satisfying spring physics
  const scale = useSpring(1, { stiffness: 300, damping: 30 });
  const brightness = useSpring(1, { stiffness: 300, damping: 30 });

  const gradients = {
    default: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    warm: 'linear-gradient(135deg, rgba(254,243,199,0.9) 0%, rgba(253,230,138,0.9) 100%)',
    cool: 'linear-gradient(135deg, rgba(219,234,254,0.9) 0%, rgba(147,197,253,0.9) 100%)',
    success: 'linear-gradient(135deg, rgba(209,250,229,0.9) 0%, rgba(167,243,208,0.9) 100%)',
    premium: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)'
  };

  const sizes = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
    xl: 'p-10'
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hover) {
      scale.set(1.02);
      brightness.set(1.05);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    brightness.set(1);
  };

  const handleClick = (e) => {
    if (!interactive) return;
    
    // Satisfying click animation
    scale.set(0.98);
    setTimeout(() => scale.set(hover ? 1.02 : 1), 100);
    
    // Create satisfaction ripple
    const rect = cardRef.current.getBoundingClientRect();
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
      background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: cardRipple 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      z-index: 10;
    `;
    
    // Add ripple keyframes if not exists
    if (!document.querySelector('#card-ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'card-ripple-keyframes';
      style.textContent = `
        @keyframes cardRipple {
          to {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    cardRef.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
    
    if (onClick) onClick(e);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative overflow-hidden backdrop-blur-xl rounded-3xl border border-white/20
        ${interactive ? 'cursor-pointer' : ''}
        ${sizes[size]}
        ${className}
      `}
      style={{
        background: gradients[gradient],
        scale,
        filter: `brightness(${brightness.get()})`,
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileHover={hover ? {
        boxShadow: glow ? 
          '0 25px 60px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255,255,255,0.5)' : 
          '0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5)'
      } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: 0.3 }
      }}
      {...props}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%', opacity: 0 }}
        animate={isHovered ? { x: '100%', opacity: 1 } : { x: '-100%', opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
      
      {/* Glowing border effect */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5))',
            padding: '1px',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="w-full h-full rounded-3xl"
            style={{ background: gradients[gradient] }}
          />
        </motion.div>
      )}
      
      {/* Content container with subtle animation */}
      <motion.div 
        className="relative z-10"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: isHovered ? 0.1 : 0 }}
      >
        {children}
      </motion.div>
      
      {/* Floating particles effect */}
      {isHovered && glow && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
              style={{
                top: `${20 + i * 30}%`,
                left: `${10 + i * 20}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1]
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
    </motion.div>
  );
};

export default DelightfulCard;