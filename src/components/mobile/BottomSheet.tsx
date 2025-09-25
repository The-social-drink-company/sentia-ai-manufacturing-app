import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
  initialSnap?: number;
  closeOnOverlayClick?: boolean;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  closeOnOverlayClick = true,
  showHandle = true
}) => {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTranslateY(0);
      setCurrentSnap(initialSnap);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSnap]);

  const getSnapHeight = (snapIndex: number) => {
    const windowHeight = window.innerHeight;
    return windowHeight * (1 - snapPoints[snapIndex]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY - translateY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const newTranslateY = currentY - dragStartY;
    
    // Limit dragging to not go above the screen
    if (newTranslateY < 0) {
      setTranslateY(newTranslateY * 0.2); // Resistance when dragging up beyond limit
    } else {
      setTranslateY(newTranslateY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const windowHeight = window.innerHeight;
    const currentHeight = windowHeight - translateY;
    
    // Close if dragged down significantly
    if (translateY > windowHeight * 0.3) {
      onClose();
      return;
    }

    // Find closest snap point
    let closestSnapIndex = 0;
    let closestDistance = Infinity;

    snapPoints.forEach((snap, index) => {
      const snapHeight = windowHeight * snap;
      const distance = Math.abs(currentHeight - snapHeight);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSnapIndex = index;
      }
    });

    setCurrentSnap(closestSnapIndex);
    setTranslateY(getSnapHeight(closestSnapIndex));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY - translateY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newTranslateY = e.clientY - dragStartY;
    
    if (newTranslateY < 0) {
      setTranslateY(newTranslateY * 0.2);
    } else {
      setTranslateY(newTranslateY);
    }
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartY]);

  if (!isOpen) return null;

  const sheetHeight = `${snapPoints[currentSnap] * 100}%`;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity z-40 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'open' : ''} safe-area-inset`}
        style={{
          height: sheetHeight,
          transform: `translateY(${isDragging ? translateY : 0}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease, height 0.3s ease'
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div 
            className="bottom-sheet-handle-container py-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="bottom-sheet-handle" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain scrollable"
          style={{ maxHeight: `calc(${sheetHeight} - ${title ? '120px' : '60px'})` }}
        >
          {children}
        </div>
      </div>
    </>
  );
};