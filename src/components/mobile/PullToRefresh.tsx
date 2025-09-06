import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop > 0 || isRefreshing) return;
      
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      if (container.scrollTop > 0) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      
      // Apply resistance factor
      const resistance = Math.min(distance / 3, threshold * 1.5);
      
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPullDistance(resistance);
      });

      // Prevent scrolling when pulling
      if (distance > 5) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;
      
      setIsPulling(false);

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  const getIndicatorStyle = () => {
    const opacity = Math.min(pullDistance / threshold, 1);
    const scale = Math.min(pullDistance / threshold, 1);
    const rotation = (pullDistance / threshold) * 360;

    return {
      transform: `translateY(${pullDistance}px) scale(${scale})`,
      opacity,
      transition: isPulling ? 'none' : 'all 0.3s ease'
    };
  };

  const getIconStyle = () => {
    const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 360;
    
    return {
      transform: `rotate(${rotation}deg)`,
      transition: isRefreshing ? 'transform 1s linear infinite' : 'none'
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`pull-to-refresh scrollable relative overflow-y-auto ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none"
        style={getIndicatorStyle()}
      >
        <div className="pull-to-refresh-indicator bg-white rounded-full shadow-lg p-2">
          <ArrowPathIcon 
            className={`h-6 w-6 ${
              pullDistance >= threshold ? 'text-indigo-600' : 'text-gray-400'
            } ${isRefreshing ? 'animate-spin' : ''}`}
            style={getIconStyle()}
          />
        </div>
      </div>

      {/* Refresh message */}
      {isRefreshing && (
        <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            Refreshing...
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ transform: `translateY(${isPulling ? pullDistance * 0.4 : 0}px)` }}>
        {children}
      </div>
    </div>
  );
};