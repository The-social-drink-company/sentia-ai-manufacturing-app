// Enterprise Accessibility Provider
// WCAG 2.1 AAA compliance system with advanced accessibility features

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { logInfo, logWarn } from '../services/observability/structuredLogger.js';

// Accessibility Context
const AccessibilityContext = createContext({
  // Preferences
  reducedMotion: false,
  highContrast: false,
  fontSize: 'normal',
  screenReaderMode: false,
  keyboardNavigation: false,
  
  // Focus management
  focusRing: 'default',
  skipLinks: true,
  
  // Functions
  setReducedMotion: () => {},
  setHighContrast: () => {},
  setFontSize: () => {},
  announceToScreenReader: () => {},
  focusElement: () => {},
  
  // State
  isInitialized: false
});

// Screen Reader Announcements
const ScreenReaderAnnouncer = () => {
  const announceRef = useRef(null);
  const politeRef = useRef(null);

  useEffect(() => {
    // Create ARIA live regions for announcements
    if (!announceRef.current) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.setAttribute('class', 'sr-only');
      assertiveRegion.setAttribute('id', 'accessibility-announcer-assertive');
      document.body.appendChild(assertiveRegion);
      announceRef.current = assertiveRegion;
    }

    if (!politeRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.setAttribute('class', 'sr-only');
      politeRegion.setAttribute('id', 'accessibility-announcer-polite');
      document.body.appendChild(politeRegion);
      politeRef.current = politeRegion;
    }

    return () => {
      // Cleanup on unmount
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
      }
      if (politeRef.current) {
        document.body.removeChild(politeRef.current);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

// Accessibility Provider Component
export const AccessibilityProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'normal',
    screenReaderMode: false,
    keyboardNavigation: false,
    focusRing: 'default',
    skipLinks: true
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [keyboardUser, setKeyboardUser] = useState(false);

  // Initialize accessibility preferences from system and localStorage
  useEffect(() => {
    const initializePreferences = async () => {
      try {
        // Check system preferences
        const systemPrefs = {
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          highContrast: window.matchMedia('(prefers-contrast: high)').matches || 
                       window.matchMedia('(prefers-contrast: more)').matches,
        };

        // Load saved preferences
        const savedPrefs = localStorage.getItem('accessibility-preferences');
        const parsedPrefs = savedPrefs ? JSON.parse(savedPrefs) : {};

        // Merge preferences (system overrides saved for some)
        const mergedPrefs = {
          ...preferences,
          ...parsedPrefs,
          ...systemPrefs // System preferences take priority
        };

        setPreferences(mergedPrefs);
        applyAccessibilitySettings(mergedPrefs);
        setIsInitialized(true);

        logInfo('Accessibility preferences initialized', mergedPrefs);

      } catch (error) {
        logWarn('Failed to initialize accessibility preferences', { error: error.message });
        setIsInitialized(true);
      }
    };

    initializePreferences();

    // Listen for system preference changes
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e) => {
      updatePreference('reducedMotion', e.matches);
    };

    const handleContrastChange = (e) => {
      updatePreference('highContrast', e.matches);
    };

    motionMediaQuery.addEventListener('change', handleMotionChange);
    contrastMediaQuery.addEventListener('change', handleContrastChange);

    // Keyboard usage detection
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setKeyboardUser(true);
        document.body.classList.add('keyboard-user');
      }
    };

    const handleMouseDown = () => {
      setKeyboardUser(false);
      document.body.classList.remove('keyboard-user');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      motionMediaQuery.removeEventListener('change', handleMotionChange);
      contrastMediaQuery.removeEventListener('change', handleContrastChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply accessibility settings to DOM
  const applyAccessibilitySettings = (prefs) => {
    const root = document.documentElement;
    
    // Reduced motion
    root.style.setProperty('--animation-duration', prefs.reducedMotion ? '0ms' : '300ms');
    root.style.setProperty('--transition-duration', prefs.reducedMotion ? '0ms' : '200ms');
    
    if (prefs.reducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }

    // High contrast
    if (prefs.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Font size
    const fontSizeMap = {
      small: '14px',
      normal: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[prefs.fontSize] || '16px');

    // Focus ring style
    const focusRingMap = {
      default: '2px solid #3b82f6',
      thick: '3px solid #3b82f6',
      'high-contrast': '3px solid #000000'
    };
    root.style.setProperty('--focus-ring', focusRingMap[prefs.focusRing] || focusRingMap.default);

    // Screen reader mode
    if (prefs.screenReaderMode) {
      document.body.classList.add('screen-reader-mode');
    } else {
      document.body.classList.remove('screen-reader-mode');
    }
  };

  // Update single preference
  const updatePreference = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    applyAccessibilitySettings(newPrefs);
    
    // Save to localStorage
    localStorage.setItem('accessibility-preferences', JSON.stringify(newPrefs));
    
    logInfo('Accessibility preference updated', { key, value });
  };

  // Screen reader announcement function
  const announceToScreenReader = (message, priority = 'polite') => {
    const region = priority === 'assertive' 
      ? document.getElementById('accessibility-announcer-assertive')
      : document.getElementById('accessibility-announcer-polite');
    
    if (region) {
      // Clear and then set the message to ensure it's announced
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
      
      logInfo('Screen reader announcement', { message, priority });
    }
  };

  // Focus management
  const focusElement = (selector, options = {}) => {
    const element = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
    
    if (element) {
      element.focus(options);
      
      if (options.announce) {
        announceToScreenReader(options.announce, 'assertive');
      }
      
      return true;
    }
    return false;
  };

  // Skip to content functionality
  const skipToContent = () => {
    const mainContent = document.querySelector('main') || 
                       document.querySelector('#main-content') ||
                       document.querySelector('[role="main"]');
    
    if (mainContent) {
      mainContent.focus();
      announceToScreenReader('Skipped to main content', 'assertive');
    }
  };

  // Context value
  const contextValue = {
    // Preferences
    ...preferences,
    keyboardUser,
    isInitialized,
    
    // Update functions
    setReducedMotion: (value) => updatePreference('reducedMotion', value),
    setHighContrast: (value) => updatePreference('highContrast', value),
    setFontSize: (value) => updatePreference('fontSize', value),
    setScreenReaderMode: (value) => updatePreference('screenReaderMode', value),
    setKeyboardNavigation: (value) => updatePreference('keyboardNavigation', value),
    setFocusRing: (value) => updatePreference('focusRing', value),
    setSkipLinks: (value) => updatePreference('skipLinks', value),
    
    // Utility functions
    announceToScreenReader,
    focusElement,
    skipToContent,
    
    // Batch update
    updatePreferences: (newPrefs) => {
      const mergedPrefs = { ...preferences, ...newPrefs };
      setPreferences(mergedPrefs);
      applyAccessibilitySettings(mergedPrefs);
      localStorage.setItem('accessibility-preferences', JSON.stringify(mergedPrefs));
    }
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <ScreenReaderAnnouncer />
      {/* Skip Links */}
      {preferences.skipLinks && (
        <div className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-max focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg">
          <button
            onClick={skipToContent}
            className="underline hover:no-underline"
          >
            Skip to main content
          </button>
        </div>
      )}
      
      {/* Accessibility Styles */}
      <style jsx global>{`
        /* Reduced motion styles */
        .reduce-motion * {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }

        /* High contrast styles */
        .high-contrast {
          filter: contrast(1.5);
        }
        
        .high-contrast button {
          border: 2px solid currentColor !important;
        }
        
        .high-contrast a {
          text-decoration: underline !important;
        }

        /* Screen reader only class */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .sr-only.focus\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }

        /* Keyboard navigation focus styles */
        .keyboard-user *:focus {
          outline: var(--focus-ring);
          outline-offset: 2px;
        }

        /* Screen reader mode optimizations */
        .screen-reader-mode {
          font-family: monospace;
          font-size: 18px;
          line-height: 1.8;
        }

        .screen-reader-mode * {
          text-decoration: none !important;
        }

        .screen-reader-mode button,
        .screen-reader-mode a {
          text-decoration: underline !important;
        }

        /* High contrast focus indicators */
        @media (prefers-contrast: high) {
          *:focus {
            outline: 3px solid #000000 !important;
            outline-offset: 2px !important;
          }
        }

        /* Font size adjustments */
        html {
          font-size: var(--base-font-size, 16px);
        }
      `}</style>
      
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  
  return context;
};

// HOC for making components accessible
export const withAccessibility = (Component) => {
  return React.forwardRef((props, ref) => {
    const accessibility = useAccessibility();
    
    return (
      <Component
        ref={ref}
        {...props}
        accessibility={accessibility}
      />
    );
  });
};

// Accessibility announcement hook
export const useAnnounce = () => {
  const { announceToScreenReader } = useAccessibility();
  
  return {
    announce: announceToScreenReader,
    announcePolite: (message) => announceToScreenReader(message, 'polite'),
    announceAssertive: (message) => announceToScreenReader(message, 'assertive')
  };
};

// Focus management hook
export const useFocus = () => {
  const { focusElement } = useAccessibility();
  const focusRef = useRef(null);

  const focus = (options) => {
    if (focusRef.current) {
      focusElement(focusRef.current, options);
    }
  };

  return [focusRef, focus];
};

export default AccessibilityProvider;