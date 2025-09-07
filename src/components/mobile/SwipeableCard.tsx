import React, { useState, useRef, ReactNode } from 'react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  className = '',
  leftAction,
  rightAction
}) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    const distance = currentTouch - touchStart;
    
    // Apply resistance at edges
    const resistance = Math.abs(distance) > threshold ? 
      threshold + (Math.abs(distance) - threshold) * 0.2 : 
      distance;
    
    setSwipeDistance(resistance);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    const swipeThreshold = threshold;
    const distance = touchEnd - touchStart;
    
    if (Math.abs(distance) > swipeThreshold) {
      if (distance > 0 && onSwipeRight) {
        // Swipe right
        animateSwipe('right');
        setTimeout(() => onSwipeRight(), 300);
      } else if (distance < 0 && onSwipeLeft) {
        // Swipe left
        animateSwipe('left');
        setTimeout(() => onSwipeLeft(), 300);
      } else {
        resetPosition();
      }
    } else {
      resetPosition();
    }
    
    setIsSwiping(false);
  };

  const animateSwipe = (direction: 'left' | 'right') => {
    if (!cardRef.current) return;
    
    cardRef.current.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    cardRef.current.style.transform = `translateX(${direction === 'left' ? '-' : ''}100%)`;
    cardRef.current.style.opacity = '0';
  };

  const resetPosition = () => {
    setSwipeDistance(0);
    setTouchStart(0);
    setTouchEnd(0);
    
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.3s ease';
      cardRef.current.style.transform = 'translateX(0)';
      cardRef.current.style.opacity = '1';
    }
  };

  const getActionOpacity = () => {
    const opacity = Math.min(Math.abs(swipeDistance) / threshold, 1);
    return opacity;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      {leftAction && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center pl-4"
          style={{ 
            opacity: swipeDistance > 0 ? getActionOpacity() : 0,
            transition: 'opacity 0.2s ease'
          }}
        >
          {leftAction}
        </div>
      )}
      
      {rightAction && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-4"
          style={{ 
            opacity: swipeDistance < 0 ? getActionOpacity() : 0,
            transition: 'opacity 0.2s ease'
          }}
        >
          {rightAction}
        </div>
      )}

      {/* Swipeable card */}
      <div
        ref={cardRef}
        className={`swipeable-card ${isSwiping ? 'swiping' : ''} ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};