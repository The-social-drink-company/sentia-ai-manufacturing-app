import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  divider?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  children: React.ReactNode;
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  children,
  className = '',
  onOpen,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const touchStartPos = useRef({ x: 0, y: 0 });
  const [hapticFeedback, setHapticFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [isOpen, onOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimer.current = setTimeout(() => {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
        setHapticFeedback(true);
        setTimeout(() => setHapticFeedback(false), 100);
      }
      openMenu(touch.clientX, touch.clientY);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const moveThreshold = 10;
    
    if (
      Math.abs(touch.clientX - touchStartPos.current.x) > moveThreshold ||
      Math.abs(touch.clientY - touchStartPos.current.y) > moveThreshold
    ) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const openMenu = (x: number, y: number) => {
    const menuWidth = 200;
    const menuHeight = items.length * 44;
    const padding = 10;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust position to keep menu on screen
    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - menuHeight - padding;
    }
    if (adjustedX < padding) {
      adjustedX = padding;
    }
    if (adjustedY < padding) {
      adjustedY = padding;
    }

    setPosition({ x: adjustedX, y: adjustedY });
    setIsOpen(true);
  };

  const handleItemClick = (item: MenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const menuContent = isOpen && createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={index}
              className="h-px bg-gray-200 dark:bg-gray-700 my-1"
            />
          );
        }

        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
              ${item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
              }
              ${item.destructive
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-200'
              }
            `}
          >
            {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm">{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`${className} ${hapticFeedback ? 'scale-95' : ''} transition-transform`}
      >
        {children}
      </div>
      {menuContent}
    </>
  );
};