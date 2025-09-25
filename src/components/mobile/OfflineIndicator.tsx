import React, { useState, useEffect } from 'react';
import { WifiIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { usePWA } from '../../hooks/usePWA';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDuration?: number;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showDuration = 5000,
  className = ''
}) => {
  const { isOffline } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isOffline) {
      setMessage('You are offline');
      setIsVisible(true);
      setIsTransitioning(true);
      setSyncStatus('idle');
    } else if (isVisible && !isOffline) {
      // Just came back online
      setMessage('Back online');
      setSyncStatus('syncing');
      
      // Simulate sync process
      setTimeout(() => {
        setSyncStatus('synced');
        setMessage('All changes synced');
        
        // Hide after showing sync status
        timeoutId = setTimeout(() => {
          setIsTransitioning(false);
          setTimeout(() => setIsVisible(false), 300);
        }, showDuration);
      }, 1500);
    } else if (!isOffline) {
      setIsVisible(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOffline, isVisible, showDuration]);

  if (!isVisible) return null;

  const positionClasses = position === 'top' 
    ? 'top-0 animate-slide-down' 
    : 'bottom-0 animate-slide-up';

  const bgColorClass = isOffline 
    ? 'bg-red-500' 
    : syncStatus === 'syncing'
    ? 'bg-yellow-500'
    : 'bg-green-500';

  return (
    <div
      className={`
        fixed left-0 right-0 z-50 transition-all duration-300
        ${positionClasses}
        ${isTransitioning ? 'translate-y-0' : position === 'top' ? '-translate-y-full' : 'translate-y-full'}
        ${className}
      `}
    >
      <div className={`${bgColorClass} text-white px-4 py-3 shadow-lg`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            {isOffline ? (
              <div className="relative">
                <WifiIcon className="w-5 h-5" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-white rotate-45 transform origin-center" />
                </div>
              </div>
            ) : syncStatus === 'syncing' ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}

            {/* Message */}
            <span className="text-sm font-medium">{message}</span>

            {/* Additional info for offline mode */}
            {isOffline && (
              <span className="text-xs opacity-90">
                Changes will sync when reconnected
              </span>
            )}
          </div>

          {/* Dismiss button */}
          {isOffline && (
            <button
              onClick={() => {
                setIsTransitioning(false);
                setTimeout(() => setIsVisible(false), 300);
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar for syncing */}
        {syncStatus === 'syncing' && (
          <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-progress" />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes progress {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// Standalone network status hook for components that don't need full PWA functionality
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('');
  const [effectiveType, setEffectiveType] = useState<string>('');
  const [downlink, setDownlink] = useState<number>(0);
  const [rtt, setRtt] = useState<number>(0);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
      
      // Get network information if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || '');
        setEffectiveType(connection.effectiveType || '');
        setDownlink(connection.downlink || 0);
        setRtt(connection.rtt || 0);
        setSaveData(connection.saveData || false);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      updateNetworkStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Initial check
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes if supported
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g',
    isFastConnection: effectiveType === '4g'
  };
};