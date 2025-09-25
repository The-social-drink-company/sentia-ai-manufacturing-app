import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface FABAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = 'bottom-right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4'
  };

  const menuDirection = {
    'bottom-right': 'bottom-16 right-0',
    'bottom-left': 'bottom-16 left-0',
    'top-right': 'top-16 right-0',
    'top-left': 'top-16 left-0'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons */}
      {isOpen && (
        <div className={`absolute ${menuDirection[position]} flex flex-col gap-3 mb-3`}>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3"
                style={{
                  animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                {/* Label */}
                <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg">
                  {action.label}
                </span>
                
                {/* Action button */}
                <button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 ${
                    action.color || 'bg-gray-600'
                  } text-white`}
                  aria-label={action.label}
                >
                  <Icon className="w-6 h-6" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-red-500 rotate-45' : 'bg-indigo-600 rotate-0'
        } text-white active:scale-95`}
        aria-label="Toggle actions menu"
      >
        {isOpen ? (
          <XMarkIcon className="w-7 h-7" />
        ) : (
          <PlusIcon className="w-7 h-7" />
        )}
      </button>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};